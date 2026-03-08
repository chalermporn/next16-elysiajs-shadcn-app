# TodoFlow

แอป Todo List แบบเต็มรูปแบบ พร้อม **Role-Based Access Control (RBAC)** การยืนยันตัวตนด้วย **JWT** Dashboard สำหรับวิเคราะห์ข้อมูล และหน้าจัดการผู้ใช้สำหรับ Admin

---

## สารบัญ

- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้งและการรัน](#การติดตั้งและการรัน)
- [ตัวแปร Environment](#ตัวแปร-environment)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [API Endpoints](#api-endpoints)
- [สคริปต์ที่ใช้บ่อย](#สคริปต์ที่ใช้บ่อย)
- [การ Deploy](#การ-deploy)
- [การทดสอบ](#การทดสอบ)

---

## ฟีเจอร์หลัก

### สำหรับผู้ใช้ทั่วไป (User)

- **Todo Management** – สร้าง แก้ไข ลบ และเปลี่ยนสถานะงาน
- **Workspaces** – จัดกลุ่มงานตามทีม/โปรเจกต์ (เช่น Frontend, Backend, Marketing)
- **หมวดหมู่และความสำคัญ** – หมวดหมู่ Production/Marketing/Admin และระดับความสำคัญ P1–P5
- **ค้นหา** – ค้นหางานจากชื่อและรายละเอียด
- **โหมด Light/Dark** – สลับธีมได้

### สำหรับผู้ดูแลระบบ (Admin)

- **ภาพรวมระบบ** – สถิติงานทั้งหมด แผนภูมิสรุป
- **RFM Analysis** – วิเคราะห์พฤติกรรมผู้ใช้จากความถี่และความล่าสุดในการใช้งาน
- **ประสิทธิภาพทีม** – แสดงผลงานแยกตาม Workspace
- **จัดการผู้ใช้** – สร้าง แก้ไข ลบผู้ใช้ กำหนด role (admin/user)
- **ดูงานของทุกคน** – เห็นงานทั้งหมดในระบบ

### การยืนยันตัวตนและสิทธิ์

- สมัครสมาชิก / เข้าสู่ระบบด้วยอีเมล–รหัสผ่าน
- JWT เก็บใน HttpOnly Cookie (ปลอดภัยจาก XSS)
- User คนแรกที่สมัครจะเป็น **admin** อัตโนมัติ
- ผู้ใช้ทั่วไปเข้าถึงได้เฉพาะหน้าจัดการงานของตนเอง

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (Base UI), next-themes |
| **Backend** | ElysiaJS (รันใน Next.js Route Handler) |
| **Client API** | Eden Treaty – type-safe API client E2E |
| **State & Data** | TanStack React Query |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | JWT (jose), bcrypt |
| **Charts** | Recharts |
| **ภาษาอื่นๆ** | TypeScript, Bun |

---

## โครงสร้างโปรเจกต์

```
├── app/
│   ├── (auth)/                 # หน้าก่อน login
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # หลัง login
│   │   ├── layout.tsx          # Sidebar, Header
│   │   ├── admin/users/        # จัดการผู้ใช้ (admin only)
│   │   └── dashboard/
│   │       ├── todos/          # จัดการงาน
│   │       ├── overview/       # ภาพรวม (admin only)
│   │       ├── customers/      # RFM (admin only)
│   │       └── branches/       # ประสิทธิภาพทีม (admin only)
│   ├── api/[[...slugs]]/       # Elysia API ภายใน Next.js
│   │   └── route.ts
│   └── providers.tsx
├── components/
│   ├── ui/                     # shadcn components
│   ├── layout/                 # Sidebar
│   ├── search-bar.tsx
│   ├── profile-modal.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── db.ts                   # Drizzle client
│   ├── schema.ts               # ตาราง DB
│   ├── auth.ts                 # JWT, bcrypt
│   ├── api-auth-plugin.ts      # Elysia auth middleware
│   ├── eden.ts                 # Eden Treaty client
│   └── hooks/use-user.ts
├── drizzle/
│   └── *.sql                   # Migrations
├── scripts/
│   └── seed-workspaces.ts
└── docker-compose.dev.yml      # PostgreSQL สำหรับ dev
```

---

## ความต้องการของระบบ

- **Bun** (แนะนำ) หรือ Node.js 18+
- **Docker** & Docker Compose (สำหรับ PostgreSQL)
- **PostgreSQL 16** (ใช้ผ่าน Docker ได้)

---

## การติดตั้งและการรัน

### 1. ติดตั้ง Dependencies

```bash
bun install
```

### 2. รัน PostgreSQL (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

จะรัน PostgreSQL ที่ `localhost:5432` พร้อม database `app` และ `app_test` (สำหรับทดสอบ)

### 3. ตั้งค่า Environment

```bash
cp .env.local.example .env.local
```

แก้ไข `.env.local` ถ้าต้องการ (ค่าเริ่มต้นเหมาะกับ dev):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
JWT_SECRET=change-this-to-a-long-random-string-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. สร้างตารางในฐานข้อมูล

```bash
bun run db:push
```

> **Production:** ใช้ `bun run db:generate` แล้วรัน `bun run db:migrate` แทน

### 5. Seed Workspaces (แนะนำ)

สร้าง Workspace เริ่มต้น เช่น Frontend Unit, Backend Unit, Marketing Team:

```bash
bun run db:seed
```

### 6. รัน Dev Server

```bash
bun run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### 7. สมัครสมาชิกและเข้าสู่ระบบ

- ไปที่ `/register` สมัครสมาชิก (User คนแรกจะเป็น **admin** อัตโนมัติ)
- Login ที่ `/login`
- Admin เข้า `/admin/users` เพื่อจัดการผู้ใช้ได้

---

## ตัวแปร Environment

| ตัวแปร | คำอธิบาย | ค่าเริ่มต้น (dev) |
|--------|----------|-------------------|
| `DATABASE_URL` | Connection string ของ PostgreSQL | `postgres://postgres:postgres@localhost:5432/app` |
| `JWT_SECRET` | คีย์สำหรับเซ็น JWT (ใช้ค่าที่ยาวและสุ่มใน production) | `change-this-to-a-long-random-string-in-production` |
| `NEXT_PUBLIC_API_URL` | URL ของ API สำหรับ client-side | `http://localhost:3000` |

---

## ฐานข้อมูล

### Schema หลัก

| ตาราง | คำอธิบาย |
|-------|----------|
| `users` | ผู้ใช้ – อีเมล รหัสผ่าน (hash) ชื่อ รูปโปรไฟล์ role (admin/user) |
| `workspaces` | ทีม/โปรเจกต์ เช่น Frontend, Backend |
| `todos` | งาน – ชื่อ รายละเอียด สถานะ หมวดหมู่ ความสำคัญ workspace |

### Migrations

```bash
# สร้าง migration จาก schema ปัจจุบัน
bun run db:generate

# รัน migrations
bun run db:migrate
```

### Drizzle Studio (ตรวจดูข้อมูล)

```bash
bun run db:studio
```

---

## API Endpoints

| Method | Endpoint | คำอธิบาย | Auth |
|--------|----------|----------|------|
| `GET` | `/api` | ข้อความต้อนรับ | - |
| `POST` | `/api/auth/register` | สมัครสมาชิก | Public |
| `POST` | `/api/auth/login` | เข้าสู่ระบบ | Public |
| `POST` | `/api/auth/logout` | ออกจากระบบ | Optional |
| `GET` | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน | Required |
| `GET` | `/api/workspaces` | รายการ workspaces | Required |
| `POST` | `/api/workspaces` | สร้าง workspace | Admin |
| `GET` | `/api/todos` | รายการ todos (รองรับ `?q=` ค้นหา) | Required |
| `POST` | `/api/todos` | สร้าง todo | Required |
| `PATCH` | `/api/todos/:id` | แก้ไข todo | Required |
| `DELETE` | `/api/todos/:id` | ลบ todo | Required |
| `GET` | `/api/users` | รายการผู้ใช้ (paginated) | Admin |
| `POST` | `/api/users` | สร้างผู้ใช้ | Admin |
| `PATCH` | `/api/users/:id` | แก้ไขผู้ใช้ | Admin |
| `DELETE` | `/api/users/:id` | ลบผู้ใช้ | Admin |
| `GET` | `/api/users/:id/avatar` | ดึงรูปโปรไฟล์ | Required |
| `POST` | `/api/users/:id/avatar` | อัปโหลดรูปโปรไฟล์ | Required |
| `GET` | `/api/stats/overview` | สถิติภาพรวม | Admin |
| `GET` | `/api/stats/rfm` | ข้อมูล RFM | Admin |
| `GET` | `/api/stats/branches` | สถิติตาม workspace | Admin |

---

## สคริปต์ที่ใช้บ่อย

| สคริปต์ | คำอธิบาย |
|---------|----------|
| `bun run dev` | รัน dev server (Next.js + Elysia) |
| `bun run build` | Build สำหรับ production |
| `bun run start` | รัน production server |
| `bun run test` | รัน Vitest (watch mode) |
| `bun run test:run` | รัน test แบบ one-shot |
| `bun run test:coverage` | รัน test พร้อม coverage |
| `bun run db:push` | Push schema เข้า DB (dev) |
| `bun run db:generate` | สร้าง migration |
| `bun run db:migrate` | รัน migrations |
| `bun run db:seed` | Seed workspaces เริ่มต้น |
| `bun run db:studio` | เปิด Drizzle Studio |
| `bun run lint` | รัน ESLint |

---

## การ Deploy

### ขั้นตอนหลัก

1. ตั้งค่า PostgreSQL (เช่น Neon, Supabase, Railway, หรือ managed DB)
2. ตั้งค่า `DATABASE_URL` และ `JWT_SECRET` ที่ปลอดภัย
3. Build และ deploy:

   ```bash
   bun run db:generate
   bun run db:migrate   # รัน migrations บน production DB
   bun run build
   bun run start
   ```

4. ตั้งค่า `NEXT_PUBLIC_API_URL` ให้ชี้ไปที่โดเมนจริงของ API

### หมายเหตุ

- ใช้ HTTPS ใน production
- ค่า `JWT_SECRET` ต้องยาวและสุ่ม (เช่น 32+ characters)
- Cookie `auth_token` จะถูกตั้งเป็น `Secure` อัตโนมัติเมื่อ `NODE_ENV=production`

---

## การทดสอบ

ใช้ **Vitest** และ **Testing Library**:

```bash
bun run test        # watch mode
bun run test:run    # รันครั้งเดียว
bun run test:coverage
```

สำหรับรันเทสกับ DB จริง ใช้ `DATABASE_URL` ที่ชี้ไปที่ `app_test`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app_test
```

---

## License

Private / MIT (ตามที่กำหนดในโปรเจกต์)
