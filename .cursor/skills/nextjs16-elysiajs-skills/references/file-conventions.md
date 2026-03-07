# File Conventions

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

## Project Structure

```
app/
├── layout.tsx          # Root layout (required)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI
├── error.tsx           # Error UI
├── not-found.tsx       # 404 UI
├── route.ts            # API endpoint
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/page.tsx # /blog/:slug
└── (group)/            # Route group (no URL impact)
```

## Special Files

| File | Purpose |
|------|---------|
| page.tsx | UI for route segment |
| layout.tsx | Shared UI for segment and children |
| loading.tsx | Loading UI (Suspense) |
| error.tsx | Error boundary |
| route.ts | API endpoint |
| template.tsx | Re-renders on navigation |
| default.tsx | Parallel route fallback |

## Route Segments

| Pattern | Example |
|---------|---------|
| `[slug]` | Dynamic: /blog/:slug |
| `[...slug]` | Catch-all: /a/b/c |
| `[[...slug]]` | Optional catch-all (Elysia uses this) |
| `(group)` | Route group, no URL impact |

## Elysia Route Placement

For Elysia in Next.js, use catch-all:

```
app/api/[[...slugs]]/route.ts   → prefix: '/api'
```

## Middleware / Proxy (Next.js 16+)

| Version | File | Export |
|---------|------|--------|
| v14-15 | middleware.ts | middleware() |
| v16+ | proxy.ts | proxy() |

Migration: `bunx @next/codemod@latest upgrade`
