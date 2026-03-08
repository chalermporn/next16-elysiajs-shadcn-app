# Project Scaffold — New Project Setup

Step-by-step guide to create a new Next.js 16 + ElysiaJS + shadcn + Drizzle project from scratch. ใช้เมื่อเริ่มโปรเจคใหม่และต้องการโครงสร้างที่ครบถ้วน

---

## 1. Create Next.js Project

```bash
bunx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --no-turbopack
```

หรือใช้ `create-next-app` แล้วเลือก:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes

---

## 2. Install Dependencies

```bash
cd my-app

# Core (Elysia, Eden, Drizzle)
bun add elysia @elysiajs/eden drizzle-orm postgres drizzle-typebox
bun add @sinclair/typebox openapi-types

# Auth
bun add bcrypt jose

# UI & State
bun add @tanstack/react-query next-themes sonner lucide-react

# Dev
bun add -D drizzle-kit @types/bcrypt dotenv
```

---

## 3. File Structure (Create These)

### app/api/[[...slugs]]/route.ts

```typescript
import { Elysia } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => ({ message: 'API' }));

export type App = typeof app;
export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
```

### lib/eden.ts

```typescript
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

### lib/db.ts

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client, schema });
```

### lib/schema.ts

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### drizzle.config.ts

```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'drizzle-kit';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### lib/auth.ts (if using JWT)

```typescript
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

export async function createJWT(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload.sub as string;
}
```

### lib/api-auth-plugin.ts (optional)

```typescript
import { Elysia } from 'elysia';
import { verifyJWT } from './auth';

const AUTH_COOKIE = 'auth_token';

export const authPlugin = new Elysia({ name: 'auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
    const token = match ? match[1] : null;
    if (!token) return { user: null };
    const sub = await verifyJWT(token);
    return { user: sub ? { sub } : null };
  });

export { AUTH_COOKIE };
```

### app/providers.tsx

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
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

### app/layout.tsx (wrap with Providers)

```tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### docker-compose.dev.yml

```yaml
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

### .env.local.example

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
JWT_SECRET=change-this-to-a-long-random-string-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 4. shadcn/ui Init

```bash
bunx shadcn@latest init
```

Choose: New York, Neutral, CSS Variables, base color: neutral

```bash
bunx shadcn@latest add button card input form table dialog
```

---

## 5. Add package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 6. Run

```bash
cp .env.local.example .env.local
docker compose -f docker-compose.dev.yml up -d
bun run db:push
bun run dev
```

---

## 7. Optional: Vitest

```bash
bun add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
```

---

## Checklist

- [ ] `app/api/[[...slugs]]/route.ts` with Elysia
- [ ] `lib/eden.ts` with treaty
- [ ] `lib/db.ts` + `lib/schema.ts`
- [ ] `drizzle.config.ts`
- [ ] `app/providers.tsx` (Query + Theme + Toaster)
- [ ] shadcn init + components
- [ ] `docker-compose.dev.yml`
- [ ] `.env.local.example`
- [ ] (Optional) `lib/auth.ts`, `lib/api-auth-plugin.ts`
- [ ] (Optional) `proxy.ts` for route protection
- [ ] (Optional) Vitest

---

## Next Steps

1. เพิ่ม auth routes (register/login) ใน Elysia
2. สร้าง `proxy.ts` สำหรับ protect dashboard
3. เพิ่ม `useUser` hook
4. เพิ่ม layout สำหรับ dashboard
5. ต่อยอด CRUD และ UI ตามต้องการ
