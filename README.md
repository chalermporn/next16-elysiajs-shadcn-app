# TodoFlow

Todo List App พร้อม RBAC, JWT Auth, Dashboard และ User Management

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind v4, shadcn/ui
- **Backend**: ElysiaJS (in `app/api/[[...slugs]]/route.ts`)
- **Client API**: Eden Treaty (type-safe)
- **DB**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jose) + bcrypt

## Getting Started

### 0. ติดตั้ง Dependencies

```bash
bun install
```

### 1. Start PostgreSQL (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Environment

คัดลอก `.env.local.example` เป็น `.env.local` แล้วแก้ไข `JWT_SECRET` ถ้าจะ deploy จริง:

```bash
cp .env.local.example .env.local
```

### 3. สร้างตารางในฐานข้อมูล

```bash
bun run db:push
```

> สำหรับ production ใช้ `bun run db:generate` แล้ว `bun run db:migrate` แทน

### 4. Seed Workspaces (optional)

```bash
bun run db:seed
```

### 5. Run Dev Server

```bash
bun run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

### 6. สมัครสมาชิก

- ไปที่ `/register` เพื่อสมัคร — User คนแรกจะเป็น **admin** อัตโนมัติ
- Login ที่ `/login`

## Scripts

| Script | คำอธิบาย |
|--------|----------|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run test` | Run Vitest |
| `bun run test:run` | Run tests once |
| `bun run test:coverage` | Run tests with coverage |
| `bun run db:push` | Push schema to DB |
| `bun run db:generate` | Generate migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:seed` | Seed workspaces |
