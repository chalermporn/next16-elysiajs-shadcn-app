# Domain Adaptation Guide

วิธีปรับโครงสร้างโปรเจคให้เหมาะกับโดเมนของคุณ — ใช้เมื่อต้องการสร้าง web app เรื่องอื่น (e-commerce, blog, CRM, SaaS) จากเทมเพลตนี้

---

## Checklist: เพิ่ม Feature ใหม่

เมื่อเพิ่มโดเมน/feature ใหม่ ให้ทำตามลำดับ:

1. **[lib/schema.ts]** เพิ่ม Drizzle table สำหรับ entity
2. **[app/api/[[...slugs]]/route.ts]** เพิ่ม Elysia routes (GET/POST/PATCH/DELETE) + validation body
3. **[lib/hooks/use-*.ts]** สร้าง hook ใช้ Eden Treaty เรียก API (ใช้ useQuery/useMutation)
4. **[app/(dashboard)/dashboard/[feature]/page.tsx]** สร้างหน้า UI
5. **[components/layout/sidebar.tsx]** เพิ่มเมนูใน Sidebar
6. **[scripts/seed.ts]** (Optional) เพิ่ม seed data

---

## ตัวอย่างตามประเภท App

### 1. E-commerce

**Schema (lib/schema.ts):**
```typescript
export const products = pgTable('products', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // ในหน่วยสตางค์
  stock: integer('stock').default(0),
  imageUrl: varchar('image_url', { length: 500 }),
  categoryId: uuid('category_id').references(() => categories.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').references(() => users.id),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Routes:** `/api/products`, `/api/orders`, `/api/categories`  
**Pages:** `/dashboard/products`, `/dashboard/orders`, `/dashboard/customers`

---

### 2. Blog / CMS

**Schema:**
```typescript
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  excerpt: varchar('excerpt', { length: 500 }),
  authorId: uuid('author_id').references(() => users.id),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
});
```

**Routes:** `/api/posts`, `/api/tags`, `/api/authors`  
**Pages:** `/dashboard/posts`, `/dashboard/drafts`, `/dashboard/pages`

---

### 3. CRM

**Schema:**
```typescript
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  notes: text('notes'),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  amount: integer('amount').notNull(),
  stage: varchar('stage', { length: 50 }).notNull().default('lead'),
  contactId: uuid('contact_id').references(() => contacts.id),
  userId: uuid('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Routes:** `/api/contacts`, `/api/deals`  
**Pages:** `/dashboard/contacts`, `/dashboard/deals`, `/dashboard/pipeline`

---

### 4. Task / Project Management

**Schema:**
```typescript
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  dueDate: timestamp('due_date'),
  priority: integer('priority').default(0),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Routes:** `/api/workspaces`, `/api/tasks`  
**Pages:** `/dashboard/overview`, `/dashboard/tasks`, `/dashboard/workspaces`

---

## Elysia Route Pattern (ทุกโดเมน)

```typescript
// เพิ่ม routes ใน app/api/[[...slugs]]/route.ts

const createBody = t.Object({ name: t.String(), /* ... */ });
const updateBody = t.Partial(createBody);

app
  .get('/entities', async ({ db }) => {
    const rows = await db.select().from(entities);
    return rows;
  })
  .get('/entities/:id', async ({ db, params }) => {
    const [row] = await db.select().from(entities).where(eq(entities.id, params.id));
    if (!row) return jsonError('Not found', 'NOT_FOUND', 404);
    return row;
  })
  .post('/entities', async ({ db, body }) => {
    const [inserted] = await db.insert(entities).values(body).returning();
    return inserted;
  }, { body: createBody, beforeHandle: checkAuth })
  .patch('/entities/:id', async ({ db, params, body }) => {
    const [updated] = await db.update(entities).set(body).where(eq(entities.id, params.id)).returning();
    return updated;
  }, { body: updateBody, beforeHandle: checkAuth })
  .delete('/entities/:id', async ({ db, params }) => {
    await db.delete(entities).where(eq(entities.id, params.id));
    return { ok: true };
  }, { beforeHandle: checkAuth });
```

---

## Eden + React Query Hook Pattern

```typescript
// lib/hooks/use-entities.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/eden';

export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const res = await api.entities.get();
      if (res.error) throw new Error(res.error.error || 'Failed');
      return res.data;
    },
  });
}

export function useCreateEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) => api.entities.post(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  });
}
```

---

## Sidebar Navigation (ปรับตาม features)

```tsx
// components/layout/sidebar.tsx
const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  // เพิ่มตามโดเมน
];
```

---

## Summary

| ขั้นตอน | ไฟล์ที่แก้ไข |
|--------|---------------|
| 1. Schema | `lib/schema.ts` |
| 2. API | `app/api/[[...slugs]]/route.ts` |
| 3. Hooks | `lib/hooks/use-*.ts` |
| 4. Pages | `app/(dashboard)/dashboard/[feature]/page.tsx` |
| 5. Nav | `components/layout/sidebar.tsx` |
| 6. Seed | `scripts/seed.ts` |

ใช้ pattern เดียวกันทุกโดเมน — แค่เปลี่ยน table, routes, และ UI components ตามความต้องการ
