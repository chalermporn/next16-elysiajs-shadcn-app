# แผนพัฒนา Todo List App (Full-Stack)

เอกสารนี้เป็น **แผน (Planning)** สำหรับแอป Todo List แบบครบวงจร — มี RBAC, JWT Login/Register, จัดการ User ทั้งหมด + แต่ละ User, หน้า Todo สมัยใหม่ รองรับ Mobile First และ Responsive เก็บข้อมูลใน PostgreSQL

**กรุณาตรวจและอนุมัติแผนก่อนเริ่ม implement**

---

## 1. สรุปความต้องการ

| หัวข้อ | รายละเอียด |
|--------|-------------|
| **Todo** | CRUD ของ Todo ต่อ User, UI สมัยใหม่, Mobile First + Responsive |
| **Auth** | Register + Login ด้วย JWT (ไม่บังคับ Refresh Token ในเฟส 1) |
| **RBAC** | มีบทบาท (Role) อย่างน้อย Admin / User และตรวจสิทธิ์ตาม Role |
| **User Management** | หน้ารวม User ทั้งหมด (Admin เท่านั้น) + หน้าโปรไฟล์/รายละเอียดแต่ละ User |
| **Database** | PostgreSQL (รันด้วย Docker Compose สำหรับ dev) |
| **Testing** | Unit + Integration ด้วย Vitest, เป้าหมาย Coverage 100% |

---

## 2. Tech Stack (ตาม Next.js 16 + ElysiaJS Skills)

| Layer | เทคโนโลยี |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui |
| **Backend** | ElysiaJS ใน `app/api/[[...slugs]]/route.ts` |
| **Client API** | Eden Treaty (type-safe, isomorphic) |
| **DB** | PostgreSQL + Drizzle ORM |
| **Auth** | JWT (สร้าง/ตรวจด้วย `jose`), รหัสผ่าน hash ด้วย `Bun.password` หรือ `bcrypt` |
| **Dev DB** | Docker Compose (PostgreSQL เท่านั้น; Next รัน local) |
| **Testing** | Vitest (unit + integration), React Testing Library สำหรับ component, เป้าหมาย coverage 100% |

---

## 3. RBAC Model

- **Roles**
  - `admin` — จัดการ User ทั้งหมด, ดู/แก้/ลบ Todo ของทุก User ได้
  - `user` — จัดการเฉพาะ Todo ของตัวเอง, ดู/แก้โปรไฟล์ตัวเองได้
- **การตรวจสิทธิ์**
  - API ทุก route ที่ต้อง login: อ่าน JWT จาก Header หรือ Cookie แล้วตรวจ `role` และ `userId`
  - หน้า `/admin/*`: เฉพาะ `role === 'admin'` ถึงเข้าได้ (รวมถึง Server Component / Middleware หรือ Proxy)
- **ตาราง User** มีคอลัมน์ `role` (enum: `admin` | `user`). User คนแรกที่สมัครจะตั้งเป็น `admin` ได้ (หรือ seed แรกเป็น admin)

---

## 4. Database Schema (PostgreSQL + Drizzle)

### 4.1 ตาราง `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid (PK) | default `crypto.randomUUID()` |
| `email` | varchar, unique | ไม่ null |
| `passwordHash` | varchar | ไม่ null |
| `name` | varchar | ชื่อแสดง (nullable ได้) |
| `role` | enum `user_role` | `'admin'` \| `'user'` |
| `createdAt` | timestamp | default now() |
| `updatedAt` | timestamp | default now(), อัปเดตเมื่อแก้ |

### 4.2 ตาราง `todos`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid (PK) | default `crypto.randomUUID()` |
| `userId` | uuid (FK → users.id) | เจ้าของ Todo |
| `title` | varchar | ไม่ null |
| `description` | text | nullable |
| `completed` | boolean | default false |
| `dueDate` | date | nullable |
| `createdAt` | timestamp | default now() |
| `updatedAt` | timestamp | default now() |

- Index: `todos_userId`, `todos_completed` (ถ้าต้องการ filter บ่อย)

### 4.3 สรุปไฟล์ Schema

- `lib/schema.ts` — กำหนด `users`, `todos`, relations และถ้าต้องการ enum `user_role` ใน Drizzle

---

## 5. API Design (Elysia)

Prefix: `/api` (ให้ตรงกับ `app/api/[[...slugs]]/route.ts`)

### 5.1 Auth (public routes — ไม่ต้องส่ง JWT)

| Method | Path | Body | คำอธิบาย |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ email, password, name? }` | สมัครสมาชิก, return JWT + user (ไม่มี passwordHash) |
| POST | `/api/auth/login` | `{ email, password }` | ล็อกอิน, return JWT + user |
| POST | `/api/auth/logout` | — | ล็อกเอาท์ — clear auth cookie (ต้องมี JWT ถ้าใช้ cookie) |

- JWT เก็บใน cookie (httpOnly, secure ใน prod) หรือส่งกลับใน response แล้วให้ frontend เก็บ (localStorage / memory) แล้วส่งใน Header `Authorization: Bearer <token>` — แนะนำ cookie เพื่อความปลอดภัย
- JWT payload อย่างน้อย: `{ sub: userId, role, iat, exp }`

### 5.2 Users (ต้องมี JWT; ตรวจ role)

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/api/users` | admin | รายชื่อ User ทั้งหมด — paginate: `?page=1&limit=20` (default limit 20) |
| GET | `/api/users/me` | user/admin | โปรไฟล์ตัวเอง |
| GET | `/api/users/:id` | admin หรือ self | รายละเอียด User ตาม id |
| PATCH | `/api/users/:id` | admin หรือ self | แก้ name; admin แก้ role ได้ |
| DELETE | `/api/users/:id` | admin เท่านั้น (ไม่ลบตัวเอง) | ลบ User |

### 5.3 Todos (ต้องมี JWT; ตรวจเจ้าของหรือ admin)

| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/api/todos` | user/admin | user: เฉพาะของตัวเอง, admin: ทั้งหมด (รองรับ query `?userId=`, `?completed=`) |
| GET | `/api/todos/:id` | เจ้าของหรือ admin | รายละเอียด Todo |
| POST | `/api/todos` | user/admin | สร้าง Todo (userId จาก JWT สำหรับ user, admin ส่ง userId ได้) |
| PATCH | `/api/todos/:id` | เจ้าของหรือ admin | แก้ title, description, completed, dueDate |
| DELETE | `/api/todos/:id` | เจ้าของหรือ admin | ลบ Todo |

- Validation ใช้ Elysia `t` หรือ drizzle-typebox ตาม skill (เช่น `t.Omit(createInsertSchema(todo), ['id','createdAt','updatedAt'])`)

### 5.4 Error Response (มาตรฐาน)

- รูปแบบ: `{ error: string, code?: string }` (JSON)
- HTTP status: `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Validation Error

---

## 6. โครงสร้าง Route ฝั่ง Frontend (Next.js App Router)

| Path | ใครเข้าได้ | คำอธิบาย |
|------|------------|----------|
| `/` | ล็อกอินแล้ว | Dashboard / หน้า Todo หลัก (รายการ + เพิ่ม/แก้/ลบ) |
| `/login` | Guest | ฟอร์มล็อกอิน |
| `/register` | Guest | ฟอร์มสมัคร |
| `/admin/users` | Admin | ตาราง/การ์ดรายชื่อ User ทั้งหมด |
| `/admin/users/[id]` | Admin | หน้ารายละเอียด User + Todo ของ User นั้น (optional) |

- กลุ่ม route: `(auth)` สำหรับ login/register, `(dashboard)` สำหรับ `/`, `(admin)` สำหรับ `/admin`
- ป้องกัน route: ใช้ Middleware หรือ Proxy (Next 16: `proxy.ts`) อ่าน JWT จาก cookie และ redirect guest ไป `/login`, ผู้ใช้ธรรมดาเข้า `/admin/*` ไป `/`

---

## 7. โครงสร้างโฟลเดอร์และไฟล์หลัก

```
app/
├── api/[[...slugs]]/route.ts    # Elysia app (export GET, POST, PATCH, DELETE)
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   └── page.tsx                 # Todo list + form (หรือแยก /todos)
├── admin/
│   └── users/
│       ├── page.tsx             # List all users
│       └── [id]/page.tsx        # User detail (+ todos ถ้าต้องการ)
├── layout.tsx                   # Root layout (ThemeProvider, QueryClient)
├── providers.tsx                # React Query + Theme
└── globals.css

lib/
├── db.ts                        # Drizzle client (postgres)
├── schema.ts                    # users, todos
├── eden.ts                      # Eden Treaty client
├── auth.ts                      # JWT create/verify, password hash/compare
└── constants.ts                # role enum, JWT expiry

drizzle/
├── migrations/
└── (drizzle-kit generate)

components/
├── ui/                          # shadcn
├── auth/                        # LoginForm, RegisterForm
├── todos/                       # TodoList, TodoItem, TodoForm
└── users/                       # UserTable, UserCard (admin)
```

---

## 8. UI/UX (Mobile First + Responsive)

- **Design**: ใช้ shadcn/ui (Tailwind v4, OKLCH) — ตาม reference tailwind-v4 + shadcn
- **หลักการ**
  - Mobile First: เลย์เอาต์และขนาดเริ่มจากมือถือ แล้วค่อยใช้ `sm:`, `md:` สำหรับ tablet/desktop
  - หน้า Todo: รายการเป็นการ์ดหรือ list ที่อ่านง่าย, มีปุ่มทำเครื่องหมายเสร็จ, แก้, ลบ; ฟอร์มเพิ่ม/แก้ใช้ Dialog หรือ Sheet บนมือถือ
  - หน้า Admin Users: ตารางที่ responsive (บนมือถืออาจเป็นการ์ดหรือ list แทน table)
- **Component ที่ใช้**: Button, Card, Input, Form (react-hook-form + zod), Table, Dialog, Sheet, Toast (sonner), Avatar, Badge (สำหรับ role/status)

---

## 9. Dependencies ที่จะเพิ่ม

```bash
# Backend + DB
bun add elysia @elysiajs/eden drizzle-orm postgres drizzle-typebox jose
bun add -D drizzle-kit @types/pg   # หรือใช้ postgres.js ไม่ต้อง @types/pg

# Testing (Vitest + coverage 100%)
bun add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Auth (ถ้าไม่ใช้ Bun.password)
# bun add bcrypt && bun add -D @types/bcrypt

# Frontend
bun add @tanstack/react-query next-themes
bunx shadcn@latest init
bunx shadcn@latest add button card input form table dialog sheet toast avatar badge
# ตามความต้องการ: dropdown-menu, skeleton, separator
```

- Peer / override: ถ้า Drizzle-typebox ต้องการ TypeBox เวอร์ชันเฉพาะ ใส่ใน package.json ตาม reference

---

## 10. Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (ใช้กับ Docker: `postgres://postgres:postgres@localhost:5432/app`)
- `JWT_SECRET` — ค่า secret สำหรับ sign/verify JWT (ยาวพอ, random)
- `NEXT_PUBLIC_API_URL` — (optional) base URL ของ API สำหรับ Eden บน client (ถ้าไม่ใช้ relative path)

---

## 11. Docker Compose (Dev)

- ใช้ `docker-compose.dev.yml` ตาม reference ใน skill — รันเฉพาะ PostgreSQL
- `.env.local`: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/app`
- คำสั่ง: `docker compose -f docker-compose.dev.yml up -d` แล้ว `bun run dev`

---

## 12. Testing (Vitest + Coverage 100%)

ใช้ **Vitest** เป็น test runner หลัก ควบคู่กับ **React Testing Library** สำหรับ component และตั้งค่า coverage เป้าหมาย **100%** (statements, branches, functions, lines).

### 12.1 ขอบเขตการทดสอบ

| ชั้น | สิ่งที่ทดสอบ | วิธี |
|------|----------------|------|
| **Unit** | `lib/auth.ts` (hash, createJWT, verifyJWT) | Vitest, mock ไม่ต้องมี DB |
| **Unit** | `lib/schema` / helpers ที่เกี่ยวกับ schema | Vitest |
| **Integration** | Elysia API (auth, users, todos) | Vitest + fetch ไปที่ `app.fetch()` / `app.handle()` |
| **Integration** | RBAC (admin vs user, self vs other) | ทดสอบผ่าน API ด้วย JWT ต่างๆ |
| **Component** | LoginForm, TodoForm, TodoItem, UserTable | Vitest + RTL, mock Eden/API |

Coverage 100%: ตั้งใน `vitest.config.ts` ให้ `lines/functions/branches/statements` เป็น 100; CI ต้องผ่านจึง merge ได้

### 12.2 โครงสร้าง Test

- `lib/auth.test.ts` — unit สำหรับ auth
- `app/api/[[...slugs]]/route.test.ts` — integration สำหรับ Elysia + RBAC
- `components/**/*.test.tsx` — component tests

### 12.3 Config และ Scripts

- **vitest.config.ts**: `@vitejs/plugin-react`, `environment: 'jsdom'`, `coverage.provider: 'v8'`, threshold 100; exclude `**/*.test.*`, `components/ui/**`
- **package.json**: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"`

### 12.4 ลำดับการเขียน Test

- หลัง auth → เขียน `lib/auth.test.ts` ให้ coverage 100%
- หลัง Elysia routes → เขียน integration test API + RBAC
- หลัง component → เขียน component test
- ก่อนปิด feature → รัน `vitest run --coverage` ให้ผ่าน 100%

---

## 13. ลำดับการ Implement (แนะนำ)

1. **Setup พื้นฐาน**  
   - Drizzle + schema (users, todos) + migration  
   - Docker Compose dev  
   - Elysia ใน `app/api/[[...slugs]]/route.ts`  
   - Eden client ใน `lib/eden.ts`
   - Vitest + config coverage 100% (vitest.config.ts, test/setup.ts, scripts ใน package.json)

2. **Auth**  
   - `lib/auth.ts`: hash password, create/verify JWT  
   - `lib/auth.test.ts`: unit test ให้ coverage 100%
   - POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`  
   - ตั้งค่า cookie หรือ return token ให้ frontend

3. **Middleware / Guard**  
   - Elysia derive หรือ plugin อ่าน JWT จาก cookie/header แล้วใส่ user ลง context  
   - ป้องกัน route ฝั่ง Next (proxy/middleware) redirect ตาม role

4. **API Users + Todos**  
   - ตามตารางในหัวข้อ 5.2 และ 5.3  
   - ตรวจสิทธิ์ใน handler (admin vs user, self vs other)
   - Integration test: route.test.ts ครอบทุก route และ RBAC ให้ coverage 100% ในส่วน API

5. **Frontend**  
   - shadcn init + components  
   - หน้า login, register  
   - หน้า Dashboard (Todo list + form)  
   - หน้า Admin: users list, user detail  
   - เชื่อม Eden + React Query, โหลด/สร้าง/อัปเดต/ลบ
   - Component test สำหรับฟอร์มและหน้าหลักตามหัวข้อ 12.2

6. **ปรับปรุง + ปิด Coverage**  
   - Loading / Error state, Toast, responsive, accessibility
   - รัน `vitest run --coverage` ให้ผ่าน 100% ในขอบเขตที่กำหนด

---

## 14. สิ่งที่ต้องตัดสินใจก่อน Implement

- [ ] **JWT เก็บที่ไหน**: Cookie (httpOnly) vs ส่งใน response แล้วให้ frontend เก็บ (localStorage / memory) และส่งใน Header — แนะนำ cookie สำหรับ production
- [ ] **User คนแรก**: สมัครคนแรกเป็น `admin` อัตโนมัติ หรือมี seed script สร้าง admin หนึ่งคน
- [ ] **Refresh Token**: จะทำในเฟส 1 หรือไม่ (ถ้าไม่ทำ เฟส 1 ใช้แค่ access token หมดอายุแล้วให้ login ใหม่)
- [ ] **Path หน้า Todo**: ใช้ `/` เป็นหน้า Todo เลย หรือแยกเป็น `/todos` แล้ว redirect `/` ไป `/todos` หรือ dashboard

---

เมื่อคุณตรวจแผนแล้วและพอใจ กรุณาตอบกลับว่า **อนุมัติ** หรือระบุจุดที่ต้องการแก้ (เช่น เปลี่ยน role, เพิ่ม permission, เปลี่ยน path หรือโครงสร้าง) จากนั้นจะเริ่ม implement ตามแผนนี้และตาม Next.js 16 + ElysiaJS skills ใน repo นี้
