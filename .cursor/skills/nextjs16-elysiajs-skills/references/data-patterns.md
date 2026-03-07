# Data Patterns

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

## Server Components vs Server Actions vs Route Handlers

| Pattern | Use when |
|---------|----------|
| Server Component fetch | Initial page data |
| Server Action | Form mutations, UI-triggered mutations |
| Route Handler | Webhooks, public API, external consumers |

## Avoid Waterfalls

Use `Promise.all`, Suspense, or preload for parallel fetches.

## Eden Treaty with Elysia

Server Components can call Eden directly (no network). Client Components call via HTTP.
