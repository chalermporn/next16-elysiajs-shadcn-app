# Drizzle ORM — Elysia + Next.js

From [orm.drizzle.team](https://orm.drizzle.team) and [elysiajs.com/integrations/drizzle](https://elysiajs.com/integrations/drizzle)

Drizzle ORM: headless TypeScript ORM, type-safe, SQL-like API. Integrates with Elysia via `drizzle-typebox` to reuse schema as validation models.

---

## Install (bun)

```bash
# PostgreSQL (postgres.js — recommended for serverless)
bun add drizzle-orm postgres drizzle-typebox
bun add -D drizzle-kit

# Or node-postgres
bun add drizzle-orm pg drizzle-typebox
bun add -D drizzle-kit @types/pg
```

Pin `@sinclair/typebox` if version conflicts occur:

```json
{
  "overrides": {
    "@sinclair/typebox": "0.32.4"
  }
}
```

---

## Database Connection

```typescript
// lib/db.ts — postgres.js
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle({ client, schema })
```

```typescript
// lib/db.ts — node-postgres
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle({ client: pool, schema })
```

---

## Schema

```typescript
// lib/schema.ts
import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar('username').notNull().unique(),
  email: varchar('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

## drizzle-typebox + Elysia

Convert Drizzle schema to Elysia validation via `createInsertSchema` / `createSelectSchema`:

```typescript
import { t } from 'elysia'
import { createInsertSchema } from 'drizzle-typebox'
import { user } from './schema'

// Declare variable first (avoids "Type instantiation possibly infinite")
const _createUser = createInsertSchema(user, {
  email: t.String({ format: 'email' })
})

export const app = new Elysia({ prefix: '/api' })
  .decorate('db', db)
  .post('/user', async ({ body, db }) => {
    return db.insert(user).values(body).returning()
  }, {
    body: t.Omit(_createUser, ['id', 'createdAt'])
  })
```

---

## Queries (SQL-like)

```typescript
import { eq, desc } from 'drizzle-orm'

// Select
const users = await db.select().from(user).where(eq(user.id, id))

// Insert
await db.insert(user).values({ username, email }).returning()

// Update
await db.update(user).set({ username }).where(eq(user.id, id))

// Delete
await db.delete(user).where(eq(user.id, id))
```

---

## Migrations

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
bunx drizzle-kit push   # push schema (dev)
bunx drizzle-kit studio # GUI
```

`drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! }
})
```

---

## Common Guides

See [orm.drizzle.team/docs/guides](https://orm.drizzle.team/docs/guides):

- Conditional filters
- Limit/offset and cursor pagination
- Upsert, count, increment
- Full-text search
- Seeding
- Vector search (pgvector)

---

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/docs)
- [Drizzle Guides](https://orm.drizzle.team/docs/guides)
- [Elysia + Drizzle](https://elysiajs.com/integrations/drizzle)
- [PostgreSQL Get Started](https://orm.drizzle.team/docs/get-started-postgresql)
