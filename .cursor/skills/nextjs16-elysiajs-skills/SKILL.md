---
name: nextjs16-elysiajs-skills
description: Next.js 16 + ElysiaJS + shadcn/ui + Tailwind v4 + Drizzle ORM + Docker. Use when building with Elysia, Eden, shadcn, Tailwind, Drizzle, or Docker.
---

# Next.js 16 + ElysiaJS Skills

Full-stack skill combining ElysiaJS integration with Next.js 16 best practices. Structure follows [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills).

---

## Elysia Integration (Primary)

Run Elysia inside Next.js App Router. See [references/elysia-integration.md](./references/elysia-integration.md) for full details.

### Quick Setup

```typescript
// app/api/[[...slugs]]/route.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia({ prefix: '/api' })
  .get('/', 'Hello Nextjs')
  .post('/user', ({ body }) => body, {
    body: t.Object({ name: t.String() })
  })

export const GET = app.fetch
export const POST = app.fetch
```

### Eden Treaty (Isomorphic)

```typescript
// lib/eden.ts
import { treaty } from '@elysiajs/eden'
import type { app } from '@/app/api/[[...slugs]]/route'

export const api =
  typeof process !== 'undefined'
    ? treaty(app).api
    : treaty<typeof app>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').api
```

Use `typeof process` not `typeof window` (hydration errors).

### Key Rules

| Rule | Detail |
|------|--------|
| prefix matches path | `app/api/` → `prefix: '/api'` |
| Export each method | `export const GET = app.fetch` |
| bun | `bun add @sinclair/typebox openapi-types` |

---

## Essential Next.js Topics

### File Conventions

See [references/file-conventions.md](./references/file-conventions.md):
- Project structure and special files
- Route segments (dynamic, catch-all, `[[...slugs]]` for Elysia)
- Middleware vs proxy (v16: `proxy.ts`)

### Async Patterns

See [references/async-patterns.md](./references/async-patterns.md):
- `params` and `searchParams` as `Promise<...>`
- `await cookies()`, `await headers()`
- Migration codemod

### Route Handlers

See [references/route-handlers.md](./references/route-handlers.md):
- `route.ts` basics
- Elysia compatibility with `app.fetch`
- Conflict with `page.tsx`
- When to use vs Server Actions

### RSC Boundaries

See [references/rsc-boundaries.md](./references/rsc-boundaries.md):
- Async client components invalid
- Serializable props
- Server Action exceptions

### Data Patterns

See [references/data-patterns.md](./references/data-patterns.md):
- Server Components vs Server Actions vs Route Handlers
- Eden with Server/Client Components
- Avoiding waterfalls

### Directives

See [references/directives.md](./references/directives.md):
- `'use client'`, `'use server'`, `'use cache'`

### Error Handling

See [references/error-handling.md](./references/error-handling.md):
- `error.tsx`, `not-found.tsx`, `redirect()`, `notFound()`

### Metadata

See [references/metadata.md](./references/metadata.md):
- Static and dynamic metadata
- OG images

---

## Tailwind CSS v4 + shadcn/ui

See [references/tailwind-v4.md](./references/tailwind-v4.md):
- Tailwind v4 install (PostCSS / Vite)
- `@theme inline` for shadcn variables
- OKLCH colors, new-york style
- Upgrade from v3

See [references/shadcn.md](./references/shadcn.md):
- Project context via `shadcn info --json`
- CLI: init, add, search, view, docs, info
- Pattern enforcement: FieldGroup, compound components, semantic colors
- Theming: CSS variables, OKLCH, dark mode
- MCP Server for component discovery

### Quick Setup

```bash
bunx shadcn@latest init
bunx shadcn@latest add button card input form table dialog
```

### With Eden (Forms)

```tsx
// Form submits to Elysia via Eden
const onSubmit = async (data) => {
  const { error } = await api.user.post(data)
  if (error) toast.error('Failed')
}
```

---

## Docker Compose

See [references/docker-compose.md](./references/docker-compose.md):
- dev: PostgreSQL only (`docker compose up -d`)
- full: app + DB
- Docker MCP Toolkit for AI agent workflow

---

## Drizzle ORM

See [references/drizzle.md](./references/drizzle.md):
- Install: `bun add drizzle-orm postgres drizzle-typebox`
- drizzle-typebox: reuse schema as Elysia validation
- Queries: select, insert, update, delete
- Migrations: `bunx drizzle-kit generate/migrate`

### Quick with Elysia

```typescript
const _createUser = createInsertSchema(user)
// Use t.Omit to exclude auto-generated fields
.post('/user', handler, { body: t.Omit(_createUser, ['id', 'createdAt']) })
```

---

## Advanced Use Cases

### next-upgrade

See [references/next-upgrade.md](./references/next-upgrade.md):
- Version detection
- Codemods
- Migration guides

### next-cache-components

See [references/next-cache-components.md](./references/next-cache-components.md):
- `cacheComponents: true`
- `'use cache'`, `cacheLife()`, `cacheTag()`
- PPR patterns

---

## Project Structure

```
app/
├── api/[[...slugs]]/route.ts   # Elysia server
├── layout.tsx
├── page.tsx
├── components/
│   └── ui/                     # shadcn components (from components.json)
└── providers.tsx               # ThemeProvider etc.

lib/
├── eden.ts                     # Eden Treaty client
├── db.ts                       # Drizzle client
└── schema.ts                   # Drizzle schema

drizzle/                        # Migrations
docker-compose.yml              # DB (or full stack)
components.json                 # shadcn config (triggers skill)
references/                     # Skill reference docs
├── elysia-integration.md
├── file-conventions.md
├── async-patterns.md
├── route-handlers.md
├── next-upgrade.md
├── next-cache-components.md
└── ...
```

---

## References

- [ElysiaJS Next.js Integration](https://elysiajs.com/integrations/nextjs)
- [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)
- [Tailwind v4](https://tailwindcss.com/docs)
- [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Skills](https://ui.shadcn.com/docs/skills)
- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli)
- [Drizzle ORM Guides](https://orm.drizzle.team/docs/guides)
- [Elysia + Drizzle](https://elysiajs.com/integrations/drizzle)
- [Docker MCP Catalog & Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Eden Treaty](https://elysiajs.com/eden/overview)
