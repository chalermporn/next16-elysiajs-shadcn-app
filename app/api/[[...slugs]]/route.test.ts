/**
 * @vitest-environment node
 *
 * CRUD API Integration Tests for Auth, Users, and Todos.
 * Requires: DATABASE_URL pointing to a test DB (e.g. app_test).
 * Run: docker compose -f docker-compose.dev.yml up -d (then create app_test DB if needed)
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { GET, POST, PATCH, DELETE } from './route';
import { db } from '@/lib/db';
import { users, workspaces } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const BASE = 'http://localhost:3000/api';

function req(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    cookie?: string;
    token?: string;
  } = {}
) {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  else if (opts.cookie) headers['Cookie'] = opts.cookie;
  const init: RequestInit = {
    method: opts.method || 'GET',
    headers,
  };
  if (opts.body !== undefined && opts.method !== 'GET') {
    init.body = JSON.stringify(opts.body);
  }
  return new Request(url, init);
}

async function json<T = unknown>(res: Response): Promise<T> {
  const data = await res.json();
  return data as T;
}

// Shared admin/user: first registration = admin. Created once before Users/Todos.
let adminToken = '';
let adminId = '';
let userToken = '';
let userId = '';

beforeAll(async () => {
  const adminEmail = `admin-${Date.now()}@example.com`;
  const userEmail = `user-${Date.now()}@example.com`;
  const pass = 'password123';
  const regAdmin = await POST(
    req('/auth/register', {
      method: 'POST',
      body: { email: adminEmail, password: pass, name: 'Admin' },
    })
  );
  const adminData = await json<{ token?: string; user?: { id: string } }>(regAdmin);
  adminId = adminData.user!.id;
  adminToken = adminData.token!;
  const regUser = await POST(
    req('/auth/register', {
      method: 'POST',
      body: { email: userEmail, password: pass, name: 'User' },
    })
  );
  const userData = await json<{ token?: string; user?: { id: string } }>(regUser);
  userId = userData.user!.id;
  userToken = userData.token!;
  // Ensure first user is admin and get fresh JWT (DB may have existing users from dev)
  await db.update(users).set({ role: 'admin' }).where(eq(users.id, adminId));
  const loginRes = await POST(
    req('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: pass },
    })
  );
  const loginData = await json<{ token?: string }>(loginRes);
  adminToken = loginData.token!;
});

describe('API CRUD - Users', () => {
  it('GET /users - admin เห็นรายชื่อผู้ใช้', async () => {
    const res = await GET(req('/users', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: unknown[]; total?: number }>(res);
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(2);
  });

  it('GET /users - user ธรรมดาได้ 403', async () => {
    const res = await GET(req('/users', { token: userToken }));
    expect(res.status).toBe(403);
  });

  it('GET /users/me - ดึงโปรไฟล์ตัวเองได้', async () => {
    const res = await GET(req('/users/me', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ id?: string }>(res);
    expect(data.id).toBe(adminId);
  });

  it('GET /users/:id - admin ดู user อื่นได้', async () => {
    const res = await GET(req(`/users/${userId}`, { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ id?: string }>(res);
    expect(data.id).toBe(userId);
  });

  it('GET /users/:id - user ดูตัวเองได้', async () => {
    const res = await GET(req(`/users/${userId}`, { token: userToken }));
    expect(res.status).toBe(200);
    const data = await json<{ id?: string }>(res);
    expect(data.id).toBe(userId);
  });

  it('GET /users/:id - user ดู user อื่นได้ 403', async () => {
    const res = await GET(req(`/users/${adminId}`, { token: userToken }));
    expect(res.status).toBe(403);
  });

  it('PATCH /users/:id - admin แก้ role ได้', async () => {
    const res = await PATCH(
      req(`/users/${userId}`, {
        method: 'PATCH',
        body: { role: 'admin' },
        token: adminToken,
      })
    );
    expect(res.status).toBe(200);
    const data = await json<{ role?: string }>(res);
    expect(data.role).toBe('admin');
  });

  it('PATCH /users/:id - แก้ name ได้ (self)', async () => {
    const res = await PATCH(
      req(`/users/${userId}`, {
        method: 'PATCH',
        body: { name: 'Updated Name' },
        token: userToken,
      })
    );
    expect(res.status).toBe(200);
    const data = await json<{ name?: string }>(res);
    expect(data.name).toBe('Updated Name');
  });

  it('DELETE /users/:id - admin ลบ user อื่นได้', async () => {
    const delEmail = `to-delete-${Date.now()}@example.com`;
    const reg = await POST(
      req('/auth/register', {
        method: 'POST',
        body: { email: delEmail, password: 'pass123', name: 'ToDelete' },
      })
    );
    const d = await json<{ user?: { id: string } }>(reg);
    const targetId = d.user!.id;

    const res = await DELETE(req(`/users/${targetId}`, { method: 'DELETE', token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ ok?: boolean }>(res);
    expect(data.ok).toBe(true);
  });

  it('DELETE /users/:id - ลบตัวเองไม่ได้ 403', async () => {
    const res = await DELETE(req(`/users/${adminId}`, { method: 'DELETE', token: adminToken }));
    expect(res.status).toBe(403);
  });
});

describe('API CRUD - Todos', () => {
  let todoId = '';

  it('POST /todos - สร้าง Todo ได้', async () => {
    const res = await POST(
      req('/todos', {
        method: 'POST',
        body: { title: 'Test Todo', category: 'Admin' },
        token: userToken,
      })
    );
    expect(res.status).toBe(200);
    const data = await json<{ id?: string; title?: string }>(res);
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Test Todo');
    todoId = data.id!;
  });

  it('GET /todos - ดึง Todo ของตัวเองได้', async () => {
    const res = await GET(req('/todos', { token: userToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: { id: string }[] }>(res);
    expect(data.items).toBeDefined();
    expect(data.items!.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /todos/:id - ดึง Todo ตาม id ได้', async () => {
    const res = await GET(req(`/todos/${todoId}`, { token: userToken }));
    expect(res.status).toBe(200);
    const data = await json<{ id?: string }>(res);
    expect(data.id).toBe(todoId);
  });

  it('PATCH /todos/:id - แก้ completed ได้', async () => {
    const res = await PATCH(
      req(`/todos/${todoId}`, {
        method: 'PATCH',
        body: { completed: true },
        token: userToken,
      })
    );
    expect(res.status).toBe(200);
    const data = await json<{ completed?: boolean }>(res);
    expect(data.completed).toBe(true);
  });

  it('PATCH /todos/:id - แก้ description เป็น null ได้ (clear field)', async () => {
    const res = await PATCH(
      req(`/todos/${todoId}`, {
        method: 'PATCH',
        body: { description: null },
        token: userToken,
      })
    );
    expect(res.status).toBe(200);
  });

  it('GET /todos - ไม่มี JWT ได้ 401', async () => {
    const res = await GET(req('/todos'));
    expect(res.status).toBe(401);
  });

  it('GET /todos/:id - user ดู Todo ของคนอื่นได้ 403', async () => {
    const adminTodoRes = await POST(
      req('/todos', {
        method: 'POST',
        body: { title: 'Admin Only Todo', userId: adminId },
        token: adminToken,
      })
    );
    const adminTodo = await json<{ id?: string }>(adminTodoRes);
    const otherTodoId = adminTodo.id!;

    const res = await GET(req(`/todos/${otherTodoId}`, { token: userToken }));
    expect(res.status).toBe(403);
  });

  it('DELETE /todos/:id - ลบ Todo ได้', async () => {
    const createRes = await POST(
      req('/todos', {
        method: 'POST',
        body: { title: 'To Delete' },
        token: userToken,
      })
    );
    const createData = await json<{ id?: string }>(createRes);
    const idToDelete = createData.id!;

    const res = await DELETE(
      req(`/todos/${idToDelete}`, { method: 'DELETE', token: userToken })
    );
    expect(res.status).toBe(200);

    const getRes = await GET(req(`/todos/${idToDelete}`, { token: userToken }));
    expect(getRes.status).toBe(404);
  });

  it('DELETE /todos/:id - user ลบ Todo ของคนอื่นได้ 403', async () => {
    const adminTodoRes = await POST(
      req('/todos', {
        method: 'POST',
        body: { title: 'Admin Todo', userId: adminId },
        token: adminToken,
      })
    );
    const adminTodo = await json<{ id?: string }>(adminTodoRes);
    const otherTodoId = adminTodo.id!;

    const res = await DELETE(
      req(`/todos/${otherTodoId}`, { method: 'DELETE', token: userToken })
    );
    expect(res.status).toBe(403);
  });
});

describe('API - Root', () => {
  it('GET / - root returns message', async () => {
    const res = await GET(req('/'));
    expect(res.status).toBe(200);
    const data = await json<{ message?: string }>(res);
    expect(data.message).toBe('TodoFlow API');
  });
});

describe('API CRUD - Auth', () => {
  const email = `test-auth-${Date.now()}@example.com`;
  const password = 'password123';

  it('POST /auth/register - สมัครสมาชิกได้', async () => {
    const res = await POST(req('/auth/register', {
      method: 'POST',
      body: { email, password, name: 'Auth Test' },
    }));
    expect(res.status).toBe(200);
    const data = await json<{ token?: string; user?: { email: string } }>(res);
    expect(data.token).toBeDefined();
    expect(data.user?.email).toBe(email);
  });

  it('POST /auth/register - อีเมลซ้ำได้ 422', async () => {
    const res = await POST(req('/auth/register', {
      method: 'POST',
      body: { email, password, name: 'Dup' },
    }));
    expect(res.status).toBe(422);
    const data = await json<{ error?: string }>(res);
    expect(data.error).toContain('already registered');
  });

  it('POST /auth/login - ล็อกอินได้และได้ cookie', async () => {
    const res = await POST(req('/auth/login', {
      method: 'POST',
      body: { email, password },
    }));
    expect(res.status).toBe(200);
    const data = await json<{ token?: string; user?: { email: string } }>(res);
    expect(data.token).toBeDefined();
    expect(data.user?.email).toBe(email);
    expect(res.headers.get('Set-Cookie')).toBeDefined();
  });

  it('POST /auth/login - รหัสผ่านผิดได้ 401', async () => {
    const res = await POST(req('/auth/login', {
      method: 'POST',
      body: { email, password: 'wrong' },
    }));
    expect(res.status).toBe(401);
  });

  it('POST /auth/logout - ล็อกเอาท์ได้', async () => {
    const res = await POST(req('/auth/logout', { method: 'POST' }));
    expect(res.status).toBe(200);
  });
});

describe('API - Dashboard (admin only)', () => {
  it('GET /dashboard/overview - admin ได้ภาพรวม', async () => {
    const res = await GET(req('/dashboard/overview', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ total?: number; totalCompleted?: number; completionRate?: number }>(res);
    expect(data.total).toBeDefined();
    expect(typeof data.completionRate).toBe('number');
    expect(data.byCategory).toBeDefined();
    expect(data.trendByDay).toBeDefined();
  });

  it('GET /dashboard/overview - user ธรรมดาได้ 403', async () => {
    const res = await GET(req('/dashboard/overview', { token: userToken }));
    expect(res.status).toBe(403);
  });

  it('GET /dashboard/customers - admin ได้ RFM segments', async () => {
    const res = await GET(req('/dashboard/customers', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ segments?: unknown[] }>(res);
    expect(data.segments).toBeDefined();
    expect(Array.isArray(data.segments)).toBe(true);
  });

  it('GET /dashboard/branches - admin ได้ performance และ heatmap', async () => {
    const res = await GET(req('/dashboard/branches', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ performance?: unknown[]; heatmap?: Record<string, number> }>(res);
    expect(data.performance).toBeDefined();
    expect(Array.isArray(data.performance)).toBe(true);
    expect(data.heatmap).toBeDefined();
  });

  it('GET /dashboard/branches - seeds default workspaces when empty', async () => {
    await db.delete(workspaces);
    const res = await GET(req('/dashboard/branches', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ performance?: { name: string }[] }>(res);
    expect(data.performance).toBeDefined();
    const names = (data.performance || []).map((p) => p.name);
    expect(names).toContain('Frontend Unit');
    expect(names).toContain('Backend Unit');
    expect(names).toContain('Personal');
  });

  it('GET /dashboard/customers - ไม่มี token ได้ 401', async () => {
    const res = await GET(req('/dashboard/customers'));
    expect(res.status).toBe(401);
  });
});

describe('API - Workspaces', () => {
  it('GET /workspaces - ดึงรายการ workspaces ได้', async () => {
    const res = await GET(req('/workspaces', { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: unknown[] }>(res);
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('GET /workspaces - ไม่มี token ได้ 401', async () => {
    const res = await GET(req('/workspaces'));
    expect(res.status).toBe(401);
  });
});

describe('API - Todos query params', () => {
  let todoId = '';

  beforeAll(async () => {
    const createRes = await POST(
      req('/todos', {
        method: 'POST',
        body: { title: 'Searchable Todo', description: 'For q param test', completed: false },
        token: userToken,
      })
    );
    const d = await json<{ id?: string }>(createRes);
    todoId = d.id!;
  });

  it('GET /todos?completed=true - filter ได้', async () => {
    const res = await GET(req('/todos?completed=true', { token: userToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: { completed: boolean }[] }>(res);
    expect(data.items).toBeDefined();
    (data.items || []).forEach((t) => expect(t.completed).toBe(true));
  });

  it('GET /todos?q=Searchable - search ได้', async () => {
    const res = await GET(req('/todos?q=Searchable', { token: userToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: { title: string }[] }>(res);
    expect(data.items).toBeDefined();
    expect(data.items!.some((t) => t.title.includes('Searchable'))).toBe(true);
  });

  it('GET /todos?userId= - admin filter by user', async () => {
    const res = await GET(req(`/todos?userId=${userId}`, { token: adminToken }));
    expect(res.status).toBe(200);
    const data = await json<{ items?: { userId: string }[] }>(res);
    expect(data.items).toBeDefined();
    (data.items || []).forEach((t) => expect(t.userId).toBe(userId));
  });

  it('GET /todos/:id - 404 when not found', async () => {
    const res = await GET(req('/todos/00000000-0000-0000-0000-000000000000', { token: adminToken }));
    expect(res.status).toBe(404);
  });

  it('POST /users - อีเมลซ้ำได้ 422', async () => {
    const dupEmail = `dup-${Date.now()}@example.com`;
    await POST(
      req('/users', {
        method: 'POST',
        body: { name: 'First', email: dupEmail, password: 'pass', role: 'user' },
        token: adminToken,
      })
    );
    const res = await POST(
      req('/users', {
        method: 'POST',
        body: { name: 'Dup', email: dupEmail, password: 'pass', role: 'user' },
        token: adminToken,
      })
    );
    expect(res.status).toBe(422);
  });
});
