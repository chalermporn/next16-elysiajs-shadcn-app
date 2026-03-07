# ElysiaJS Integration with Next.js

Based on [elysiajs.com/integrations/nextjs](https://elysiajs.com/integrations/nextjs)

Run Elysia inside Next.js App Router as a type-safe backend. Works via WinterTC compliance. No separate server process.

## Quick Setup

Create `app/api/[[...slugs]]/route.ts`:

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
  .get('/', 'Hello Nextjs')
  .post('/', ({ body }) => body, {
    body: t.Object({ name: t.String() })
  })

export const GET = app.fetch
export const POST = app.fetch
```

## bun — Peer Dependencies

If needed (e.g. TypeBox validation):

```bash
bun add @sinclair/typebox openapi-types
```

## Prefix Rule

`prefix` must match the directory path:

| Route path | prefix |
|------------|--------|
| `app/api/[[...slugs]]/route.ts` | `prefix: '/api'` |
| `app/user/[[...slugs]]/route.ts` | `prefix: '/user'` |

## Eden Treaty

Isomorphic client: Server = direct call, Client = HTTP.

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

## React Query

```tsx
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.user.get().then(r => r.data)
})
```
