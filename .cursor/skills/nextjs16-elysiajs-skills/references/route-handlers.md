# Route Handlers

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

## Basic Usage

```tsx
// app/api/users/route.ts
export async function GET() {
  return Response.json(await getUsers())
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json(await createUser(body), { status: 201 })
}
```

## Elysia as Route Handler

Elysia exports `app.fetch` - compatible with Next.js route handler:

```typescript
// app/api/[[...slugs]]/route.ts
export const GET = app.fetch
export const POST = app.fetch
```

## Route vs page Conflict

`route.ts` and `page.tsx` cannot coexist in the same folder. Use separate paths:

- `/users` page → `app/users/page.tsx`
- `/api/users` API → `app/api/users/route.ts`

## Environment

Route handlers: no React hooks, no React DOM, no browser APIs. Can use async, cookies(), headers(), Node.js.

## When to Use

| Use Case | Route Handlers | Server Actions |
|----------|----------------|----------------|
| Webhooks | Yes | No |
| Public REST API | Yes | No |
| Form mutations | No | Yes |
