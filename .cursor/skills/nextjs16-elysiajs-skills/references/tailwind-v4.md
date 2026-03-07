# Tailwind CSS v4 — shadcn/ui Compatible

From [tailwindcss.com](https://tailwindcss.com) and [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)

Tailwind v4 works with shadcn/ui. New projects: init shadcn with Tailwind v4. Existing v3 projects continue to work until you upgrade.

---

## New Project (Next.js + shadcn + Tailwind v4)

```bash
bunx create-next-app@latest my-app
cd my-app
bunx shadcn@latest init
```

shadcn CLI detects Tailwind and configures correctly. For Tailwind v4 explicitly, use canary:

```bash
bunx shadcn@canary init
```

---

## Install Tailwind v4

```bash
bun add tailwindcss @tailwindcss/postcss
```

PostCSS (Next.js):

```js
// postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

Or Vite plugin:

```bash
bun add @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [tailwindcss()] })
```

---

## CSS Entry (globals.css)

```css
@import "tailwindcss";
```

shadcn uses CSS variables. Set `tailwind.cssVariables: true` in `components.json`.

---

## Theming with @theme inline (v4)

shadcn v4 uses OKLCH and `@theme inline`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --radius-lg: var(--radius);
}
```

Add new colors:

```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

```tsx
<div className="bg-warning text-warning-foreground" />
```

---

## shadcn + Tailwind v4 Notes

- **OKLCH** — shadcn v4 uses OKLCH instead of HSL
- **new-york** — default style; `default` deprecated
- **data-slot** — primitives have `data-slot` for styling
- **size-*** — use `size-4` instead of `w-4 h-4`
- **tw-animate-css** — replaces `tailwindcss-animate`
- **sonner** — preferred over `toast` component

---

## Upgrade from Tailwind v3

1. Run [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
2. Use `@tailwindcss/upgrade@next` codemod
3. Migrate CSS vars to `@theme inline` (see shadcn Tailwind v4 docs)
4. Remove `tailwindcss-animate`, add `tw-animate-css`:

```diff
- @plugin 'tailwindcss-animate';
+ @import "tw-animate-css";
```

---

## References

- [Tailwind v4 Docs](https://tailwindcss.com/docs)
- [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn Theming](https://ui.shadcn.com/docs/theming)
