# Async Patterns

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

Next.js 15+: `params`, `searchParams`, `cookies()`, `headers()` are async.

## Params and SearchParams

Always `Promise<...>` and await:

```tsx
type Props = { params: Promise<{ slug: string }> }

export default async function Page({ params }: Props) {
  const { slug } = await params
}
```

## Route Handlers

```tsx
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

## Cookies and Headers

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const headersList = await headers()
}
```

## React.use() for Sync Components

```tsx
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
}
```

## Migration Codemod

```bash
bunx @next/codemod@latest next-async-request-api .
```
