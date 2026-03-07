import { Elysia, t } from 'elysia';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, todos, workspaces } from '@/lib/schema';
import {
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
} from '@/lib/auth';
import { authPlugin, AUTH_COOKIE } from '@/lib/api-auth-plugin';

// Schemas for validation
const registerBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
  name: t.Optional(t.String()),
});

const loginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

const todoCreateBody = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  completed: t.Optional(t.Boolean()),
  dueDate: t.Optional(t.Union([t.String(), t.Null()])),
  category: t.Optional(t.Union([t.String(), t.Null()])),
  priority: t.Optional(t.Union([t.Number(), t.Null()])),
  storyPoints: t.Optional(t.Union([t.Number(), t.Null()])),
  workspaceId: t.Optional(t.Union([t.String(), t.Null()])),
  userId: t.Optional(t.String()),
});
const todoUpdateBody = t.Partial(
  t.Object({
    title: t.String(),
    description: t.String(),
    completed: t.Boolean(),
    dueDate: t.Union([t.String(), t.Null()]),
    category: t.Union([t.String(), t.Null()]),
    priority: t.Number(),
    storyPoints: t.Number(),
    workspaceId: t.Union([t.String(), t.Null()]),
  })
);

const userUpdateBody = t.Partial(
  t.Object({
    name: t.String(),
    role: t.Union([t.Literal('admin'), t.Literal('user')]),
  })
);

function jsonError(message: string, code: string, status: number) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setAuthCookie(response: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${7 * 24 * 60 * 60}`
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clearAuthCookie(response: Response) {
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const app = new Elysia({ prefix: '/api' })
  .use(authPlugin)
  .decorate('db', db)

  // --- Auth (public) ---
  .post(
    '/auth/register',
    async ({ body, db }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      if (existing.length > 0) {
        return jsonError('Email already registered', 'EMAIL_EXISTS', 422);
      }
      const count = await db.select().from(users);
      const role = count.length === 0 ? ('admin' as const) : ('user' as const);
      const passwordHash = await hashPassword(body.password);
      const [user] = await db
        .insert(users)
        .values({
          email: body.email,
          passwordHash,
          name: body.name ?? null,
          role,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      if (!user) return jsonError('Registration failed', 'REGISTER_FAILED', 500);
      const token = await createJWT(user.id, user.role);
      const res = Response.json({
        token,
        user: { ...user, passwordHash: undefined },
      });
      return setAuthCookie(res, token);
    },
    { body: registerBody }
  )
  .post(
    '/auth/login',
    async ({ body, db }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      if (!user) {
        return jsonError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      const ok = await verifyPassword(body.password, user.passwordHash);
      if (!ok) {
        return jsonError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));
      const token = await createJWT(user.id, user.role);
      const { passwordHash: _, ...safeUser } = user;
      const res = Response.json({ token, user: safeUser });
      return setAuthCookie(res, token);
    },
    { body: loginBody }
  )
  .post('/auth/logout', () => {
    const res = Response.json({ ok: true });
    return clearAuthCookie(res);
  })

  // --- Users ---
  .get(
    '/users',
    async ({ db, user, query }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin') {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      const page = Math.max(1, parseInt(String(query?.page || 1), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(query?.limit || 20), 10)));
      const all = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      const items = all.slice((page - 1) * limit, page * limit);
      return { items, total: all.length, page, limit };
    },
    {
      query: t.Optional(
        t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        })
      ),
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      },
    }
  )
  .get(
    '/users/me',
    async ({ db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const [u] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, user.sub))
        .limit(1);
      if (!u) return jsonError('User not found', 'NOT_FOUND', 404);
      return u;
    },
    {
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      },
    }
  )
  .get(
    '/users/:id',
    async ({ params, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin' && user.sub !== params.id) {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      const [u] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, params.id))
        .limit(1);
      if (!u) return jsonError('User not found', 'NOT_FOUND', 404);
      return u;
    },
    {
      params: t.Object({ id: t.String() }),
      beforeHandle({ user, params }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin' && user.sub !== params.id) {
          return jsonError('Forbidden', 'FORBIDDEN', 403);
        }
      },
    }
  )
  .patch(
    '/users/:id',
    async ({ params, body, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin' && user.sub !== params.id) {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (body.name !== undefined) update.name = body.name;
      if (body.role !== undefined && user.role === 'admin') update.role = body.role;
      const [u] = await db
        .update(users)
        .set(update as typeof users.$inferInsert)
        .where(eq(users.id, params.id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });
      if (!u) return jsonError('User not found', 'NOT_FOUND', 404);
      return u;
    },
    {
      params: t.Object({ id: t.String() }),
      body: userUpdateBody,
      beforeHandle({ user, params }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin' && user.sub !== params.id) {
          return jsonError('Forbidden', 'FORBIDDEN', 403);
        }
      },
    }
  )
  .delete(
    '/users/:id',
    async ({ params, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin') {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      if (user.sub === params.id) {
        return jsonError('Cannot delete yourself', 'SELF_DELETE', 403);
      }
      const [deleted] = await db
        .delete(users)
        .where(eq(users.id, params.id))
        .returning({ id: users.id });
      if (!deleted) return jsonError('User not found', 'NOT_FOUND', 404);
      return { ok: true };
    },
    {
      params: t.Object({ id: t.String() }),
      beforeHandle({ user, params }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
        if (user.sub === params.id) {
          return jsonError('Cannot delete yourself', 'SELF_DELETE', 403);
        }
      },
    }
  )

  // --- Todos ---
  .get(
    '/todos',
    async ({ db, user, query }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const conditions = [];
      if (user.role === 'user') {
        conditions.push(eq(todos.userId, user.sub));
      } else if (query?.userId) {
        conditions.push(eq(todos.userId, query.userId));
      }
      if (query?.completed !== undefined) {
        conditions.push(eq(todos.completed, query.completed === 'true'));
      }
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;
      const items = await db
        .select()
        .from(todos)
        .where(whereClause)
        .orderBy(desc(todos.createdAt));
      return { items };
    },
    {
      query: t.Optional(
        t.Object({
          userId: t.Optional(t.String()),
          completed: t.Optional(t.String()),
        })
      ),
      beforeHandle: ({ user }) =>
        !user && jsonError('Unauthorized', 'UNAUTHORIZED', 401),
    }
  )
  .get(
    '/todos/:id',
    async ({ params, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const [todo] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .limit(1);
      if (!todo) return jsonError('Todo not found', 'NOT_FOUND', 404);
      if (user.role !== 'admin' && todo.userId !== user.sub) {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      return todo;
    },
    {
      params: t.Object({ id: t.String() }),
      beforeHandle: ({ user }) =>
        !user && jsonError('Unauthorized', 'UNAUTHORIZED', 401),
    }
  )
  .post(
    '/todos',
    async ({ body, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const userId =
        user.role === 'admin' && body.userId ? body.userId : user.sub;
      const [todo] = await db
        .insert(todos)
        .values({
          userId,
          title: body.title,
          description: body.description ?? null,
          completed: body.completed ?? false,
          dueDate: body.dueDate ?? null,
          category: body.category ?? null,
          priority: body.priority ?? null,
          storyPoints: body.storyPoints ?? null,
          workspaceId: body.workspaceId ?? null,
        })
        .returning();
      if (!todo) return jsonError('Failed to create todo', 'CREATE_FAILED', 500);
      return todo;
    },
    {
      body: todoCreateBody,
      beforeHandle: ({ user }) =>
        !user && jsonError('Unauthorized', 'UNAUTHORIZED', 401),
    }
  )
  .patch(
    '/todos/:id',
    async ({ params, body, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const [existing] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .limit(1);
      if (!existing) return jsonError('Todo not found', 'NOT_FOUND', 404);
      if (user.role !== 'admin' && existing.userId !== user.sub) {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (body.title !== undefined) update.title = body.title;
      if (body.description !== undefined) update.description = body.description;
      if (body.completed !== undefined) update.completed = body.completed;
      if (body.dueDate !== undefined) update.dueDate = body.dueDate;
      if (body.category !== undefined) update.category = body.category;
      if (body.priority !== undefined) update.priority = body.priority;
      if (body.storyPoints !== undefined) update.storyPoints = body.storyPoints;
      if (body.workspaceId !== undefined) update.workspaceId = body.workspaceId;
      const [todo] = await db
        .update(todos)
        .set(update as typeof todos.$inferInsert)
        .where(eq(todos.id, params.id))
        .returning();
      return todo!;
    },
    {
      params: t.Object({ id: t.String() }),
      body: todoUpdateBody,
      beforeHandle: ({ user }) =>
        !user && jsonError('Unauthorized', 'UNAUTHORIZED', 401),
    }
  )
  .delete(
    '/todos/:id',
    async ({ params, db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      const [existing] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .limit(1);
      if (!existing) return jsonError('Todo not found', 'NOT_FOUND', 404);
      if (user.role !== 'admin' && existing.userId !== user.sub) {
        return jsonError('Forbidden', 'FORBIDDEN', 403);
      }
      await db.delete(todos).where(eq(todos.id, params.id));
      return { ok: true };
    },
    {
      params: t.Object({ id: t.String() }),
      beforeHandle: ({ user }) =>
        !user && jsonError('Unauthorized', 'UNAUTHORIZED', 401),
    }
  )

  // --- Dashboard (admin only) ---
  .get(
    '/dashboard/overview',
    async ({ db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      const all = await db.select().from(todos);
      const total = all.length;
      const totalCompleted = all.filter((t) => t.completed).length;
      const backlog = total - totalCompleted;
      const completionRate = total === 0 ? 0 : Math.round((totalCompleted / total) * 100);
      const byCategory = all.reduce(
        (acc, t) => {
          const c = t.category || 'Other';
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const byDay = all
        .filter((t) => t.completed && t.updatedAt)
        .reduce(
          (acc, t) => {
            const d = new Date(t.updatedAt!).toISOString().slice(0, 10);
            acc[d] = (acc[d] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      return {
        totalCompleted,
        completionRate,
        backlog,
        total,
        byCategory,
        trendByDay: byDay,
      };
    },
    {
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      },
    }
  )
  .get(
    '/dashboard/customers',
    async ({ db, user }) => {
      if (!user || user.role !== 'admin') {
        return user
          ? jsonError('Forbidden', 'FORBIDDEN', 403)
          : jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      }
      const us = await db.select().from(users);
      const ts = await db.select().from(todos);
      const segments = us.map((u) => {
        const userTodos = ts.filter((t) => t.userId === u.id);
        const completed = userTodos.filter((t) => t.completed).length;
        const impact =
          userTodos.reduce((s, t) => s + (t.priority || 0) + (t.storyPoints || 0), 0);
        let segment = 'Newbie';
        if (completed > 2) segment = 'Power User';
        else if (completed > 0) segment = 'Active';
        else if (userTodos.length > 2) segment = 'At Risk';
        return {
          userId: u.id,
          email: u.email,
          name: u.name,
          lastLoginAt: u.lastLoginAt,
          recency: u.lastLoginAt,
          frequency: completed,
          impact,
          segment,
        };
      });
      return { segments };
    },
    {
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      },
    }
  )
  .get(
    '/dashboard/branches',
    async ({ db, user }) => {
      if (!user || user.role !== 'admin') {
        return user
          ? jsonError('Forbidden', 'FORBIDDEN', 403)
          : jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      }
      const ws = await db.select().from(workspaces);
      const ts = await db.select().from(todos);
      const performance = ws.map((w) => {
        const wsTodos = ts.filter((t) => t.workspaceId === w.id);
        const completed = wsTodos.filter((t) => t.completed).length;
        return {
          workspaceId: w.id,
          name: w.name,
          total: wsTodos.length,
          completed,
        };
      });
      const heatmap: Record<string, number> = {};
      ts.forEach((t) => {
        if (t.updatedAt) {
          const d = new Date(t.updatedAt);
          const key = `${d.getDay()}-${d.getHours()}`;
          heatmap[key] = (heatmap[key] || 0) + 1;
        }
      });
      return { performance, heatmap };
    },
    {
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      },
    }
  )

  // --- Workspaces ---
  .get(
    '/workspaces',
    async ({ db, user }) => {
      if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
      if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      const items = await db.select().from(workspaces);
      return { items };
    },
    {
      beforeHandle({ user }) {
        if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
        if (user.role !== 'admin') return jsonError('Forbidden', 'FORBIDDEN', 403);
      },
    }
  )
  .get('/', () => ({ message: 'TodoFlow API' }));

export type App = typeof app;

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
