# Cache Components (Next.js 16+)

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

PPR: mix static, cached, and dynamic in one route.

## Enable

```ts
// next.config.ts
const nextConfig = { cacheComponents: true }
```

## use cache Directive

```tsx
async function getData() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return db.products.findMany()
}
```

## Profiles

- `'use cache'` - default
- `'use cache: remote'` - platform cache
- `'use cache: private'` - allows cookies/headers

## cacheLife()

```tsx
cacheLife('hours')
cacheLife({ stale: 3600, revalidate: 7200 })
```

## cacheTag() / updateTag() / revalidateTag()

```tsx
cacheTag('products')
updateTag('product-1')   // immediate invalidation
revalidateTag('products') // background revalidation
```

## Constraint

No `cookies()`, `headers()`, `searchParams` inside `use cache`. Pass as arguments.
