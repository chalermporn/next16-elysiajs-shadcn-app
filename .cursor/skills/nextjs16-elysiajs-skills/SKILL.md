---
name: nextjs16-elysiajs-skills
description: Full-stack template for building ANY web app — Next.js 16 + ElysiaJS + shadcn/ui + Tailwind v4 + Drizzle ORM + JWT Auth + Docker. Use when: starting new web app, building SaaS, dashboard, e-commerce, blog, CRM, or full-stack app with Elysia, Eden, shadcn, Drizzle.
triggers:
  keywords:
    - next.js 16
    - elysia
    - elysiajs
    - shadcn
    - full-stack template
    - web app template
    - create web app
    - new project scaffold
  file_patterns:
    - "app/api/**/route.ts"
    - "lib/eden.ts"
    - "lib/schema.ts"
    - "proxy.ts"
---

# Next.js 16 + ElysiaJS — Full-Stack Web App Template

Universal full-stack template สำหรับสร้าง web app ทุกประเภท (SaaS, Dashboard, E-commerce, Blog, CRM, ฯลฯ) — Next.js 16, ElysiaJS, Eden Treaty, Drizzle ORM, JWT auth, shadcn/ui, Docker.

**Use when:** สร้างโปรเจคใหม่ / สร้าง web app เรื่องอื่น / ขยายจากโครงสร้างนี้

---

## Quick Start (โปรเจคใหม่)

```bash
# 1. Create Next.js 16 project
bunx create-next-app@latest my-app --typescript --tailwind --app --src-dir=false

# 2. Add core deps
bun add elysia @elysiajs/eden drizzle-orm postgres drizzle-typebox bcrypt jose
bun add @sinclair/typebox openapi-types
bun add -D drizzle-kit @types/bcrypt

# 3. Add UI & state
bunx shadcn@latest init
bun add @tanstack/react-query next-themes sonner
```

See [references/project-scaffold.md](./references/project-scaffold.md) for full scaffold.

---

## Project Structure (โครงสร้างที่แนะนำ)

```
app/
├── (auth)/                    # Route group: login, register
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/               # Protected: หลัง login
│   ├── layout.tsx             # Sidebar, Header, useUser
│   ├── admin/users/page.tsx   # Admin only (ถ้าต้องการ)
│   └── dashboard/
│       ├── overview/page.tsx  # หน้าแรกหลัง login
│       ├── [feature-1]/       # แทนด้วยโดเมนของคุณ เช่น products, posts, orders
│       ├── [feature-2]/
│       └── ...
├── api/[[...slugs]]/
│   └── route.ts               # Elysia server (export GET/POST/PATCH/DELETE)
├── layout.tsx
├── page.tsx
└── providers.tsx              # QueryClientProvider, ThemeProvider, Toaster

lib/
├── db.ts                      # Drizzle client
├── schema.ts                  # Drizzle tables — ปรับตามโดเมน
├── auth.ts                    # JWT (jose), bcrypt
├── api-auth-plugin.ts         # Elysia auth plugin (derive user from cookie/token)
├── eden.ts                    # Eden Treaty client
├── constants.ts               # JWT_EXPIRY, USER_ROLE, etc.
└── hooks/
    └── use-user.ts            # useQuery + api.users.me.get

components/
├── ui/                        # shadcn components
├── layout/sidebar.tsx
├── search-bar.tsx
├── profile-modal.tsx
└── theme-toggle.tsx

proxy.ts                       # Next 16: route protection (redirect guest → /login)
drizzle/
scripts/seed.ts                # Seed data ตามโดเมน
docker-compose.dev.yml         # PostgreSQL for dev
```

See [references/domain-adaptation.md](./references/domain-adaptation.md) for adapting this structure to your domain (e-commerce, blog, CRM, etc.).

---

## Elysia Integration

### Route Setup

```typescript
// app/api/[[...slugs]]/route.ts
import { Elysia, t } from 'elysia';
import { db } from '@/lib/db';
import { authPlugin } from '@/lib/api-auth-plugin';

const app = new Elysia({ prefix: '/api' })
  .use(authPlugin)
  .decorate('db', db)
  .get('/', () => ({ message: 'API' }))
  .post('/auth/login', handler, { body: loginBody })
  .get('/users/me', handler, { beforeHandle: checkAuth });

export type App = typeof app;
export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
```

**Rule:** `prefix: '/api'` ต้องตรงกับ path `app/api/` — ใช้ `[[...slugs]]` เพื่อ catch-all

### Auth Plugin

```typescript
// lib/api-auth-plugin.ts
import { Elysia } from 'elysia';
import { verifyJWT, type JwtPayload } from './auth';

const AUTH_COOKIE = 'auth_token';

function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const match = (request.headers.get('Cookie') || '').match(
    new RegExp(`${AUTH_COOKIE}=([^;]+)`)
  );
  return match ? match[1] : null;
}

export const authPlugin = new Elysia({ name: 'auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    const token = getTokenFromRequest(request);
    if (!token) return { user: null as JwtPayload | null };
    const payload = await verifyJWT(token);
    return { user: payload };
  });

export { AUTH_COOKIE };
```

ใช้ `beforeHandle` สำหรับ protected routes:

```typescript
.get('/users/me', handler, {
  beforeHandle({ user }) {
    if (!user) return jsonError('Unauthorized', 'UNAUTHORIZED', 401);
  },
})
```

### Validation (t)

```typescript
const loginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

// Example: สร้าง schema ตามโดเมนของคุณ
const entityCreateBody = t.Object({
  name: t.String(),
  description: t.Optional(t.String()),
  status: t.Optional(t.String()),
  // เพิ่ม fields ตามความต้องการ
});
const entityUpdateBody = t.Partial(entityCreateBody);
```

### Error Response Helper

```typescript
function jsonError(message: string, code: string, status: number) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Eden Treaty

```typescript
// lib/eden.ts
import { treaty } from '@elysiajs/eden';
import type { App } from '@/app/api/[[...slugs]]/route';

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    return location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export const api = treaty<App>(getBaseUrl()).api;
```

**Usage (Client):**

```tsx
// lib/hooks/use-user.ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/eden';

export function useUser() {
  const { data, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await api.users.me.get();
      if (res.error) throw new Error(res.error.error || 'Failed');
      return res.data;
    },
    retry: false,
  });
  return { user: data, isLoading };
}
```

---

## Auth (JWT + bcrypt)

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcrypt';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createJWT(userId: string, role: string) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return { sub: payload.sub, role: payload.role };
}
```

**Login Response + Cookie:**

```typescript
function setAuthCookie(response: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${7 * 24 * 60 * 60}`
  );
  return new Response(response.body, { status: response.status, headers });
}
```

---

## Proxy (Next 16 Route Protection)

Next 16 ใช้ `proxy.ts` แทน `middleware.ts` — export `proxy()` และ `config`:

```typescript
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE = 'auth_token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {}
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {}
    }
    return NextResponse.next();
  }

  // Protected
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

---

## Drizzle ORM

```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client, schema });
```

```typescript
// lib/schema.ts
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**drizzle-typebox (optional):** ใช้ `createInsertSchema` เพื่อ reuse schema เป็น Elysia body validation — ดู [references/drizzle.md](./references/drizzle.md)

---

## shadcn/ui + Tailwind v4

```bash
bunx shadcn@latest init
bunx shadcn@latest add button card input form table dialog avatar badge dropdown-menu sheet sonner
```

`components.json` ใช้ style `base-nova`, `rsc: true`, `tailwind.css: app/globals.css`

---

## Providers

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

## Docker (Dev DB)

```yaml
# docker-compose.dev.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
docker compose -f docker-compose.dev.yml up -d
```

---

## Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts"
  }
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT (use long random in prod) |
| `NEXT_PUBLIC_API_URL` | API base URL for client (default: http://localhost:3000) |

---

## Essential Dependencies

| Package | Purpose |
|---------|---------|
| `elysia` | Backend framework |
| `@elysiajs/eden` | Type-safe API client |
| `drizzle-orm` | ORM |
| `postgres` | PostgreSQL driver (serverless-friendly) |
| `drizzle-typebox` | Drizzle → Elysia schema |
| `bcrypt` | Password hashing |
| `jose` | JWT sign/verify |
| `@tanstack/react-query` | Data fetching |
| `next-themes` | Dark mode |
| `sonner` | Toast notifications |

---

## File Conventions (Next 16)

| Pattern | Use |
|---------|-----|
| `[[...slugs]]` | Elysia catch-all route |
| `(auth)` | Route group — no URL segment |
| `proxy.ts` | Next 16 route guard (replaces middleware) |

See [references/file-conventions.md](./references/file-conventions.md).

---

## Adapting to Your Domain

| App Type | Suggested Routes | Example Entities |
|----------|------------------|------------------|
| **SaaS / Dashboard** | `/dashboard/overview`, `/dashboard/[feature]` | `users`, `subscriptions`, `usage` |
| **E-commerce** | `/dashboard/products`, `/dashboard/orders`, `/dashboard/customers` | `products`, `orders`, `customers`, `categories` |
| **Blog / CMS** | `/dashboard/posts`, `/dashboard/drafts`, `/dashboard/pages` | `posts`, `authors`, `tags`, `comments` |
| **CRM** | `/dashboard/contacts`, `/dashboard/deals`, `/dashboard/activities` | `contacts`, `deals`, `activities`, `pipelines` |
| **Task / Project** | `/dashboard/tasks`, `/dashboard/projects`, `/dashboard/workspaces` | `tasks`, `projects`, `workspaces` |

Full guide: [domain-adaptation.md](./references/domain-adaptation.md)

---

## References

| Topic | File |
|-------|------|
| Domain adaptation | [domain-adaptation.md](./references/domain-adaptation.md) |
| Project scaffold | [project-scaffold.md](./references/project-scaffold.md) |
| Elysia integration | [elysia-integration.md](./references/elysia-integration.md) |
| Drizzle | [drizzle.md](./references/drizzle.md) |
| Docker | [docker-compose.md](./references/docker-compose.md) |
| File conventions | [file-conventions.md](./references/file-conventions.md) |
| Async patterns | [async-patterns.md](./references/async-patterns.md) |
| Tailwind v4 | [tailwind-v4.md](./references/tailwind-v4.md) |
| shadcn | [shadcn.md](./references/shadcn.md) |
| Error handling | [error-handling.md](./references/error-handling.md) |
| Metadata | [metadata.md](./references/metadata.md) |
| Route handlers | [route-handlers.md](./references/route-handlers.md) |
| RSC boundaries | [rsc-boundaries.md](./references/rsc-boundaries.md) |
| Data patterns | [data-patterns.md](./references/data-patterns.md) |
| Directives | [directives.md](./references/directives.md) |
| next-upgrade | [next-upgrade.md](./references/next-upgrade.md) |
| next-cache-components | [next-cache-components.md](./references/next-cache-components.md) |

---

## External Links

- [ElysiaJS Next.js Integration](https://elysiajs.com/integrations/nextjs)
- [Eden Treaty](https://elysiajs.com/eden/overview)
- [Drizzle ORM](https://orm.drizzle.team/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)
- [Tailwind v4](https://tailwindcss.com/docs)
