# shadcn/ui — Full Integration

From [ui.shadcn.com/docs/skills](https://ui.shadcn.com/docs/skills) and [tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)

Works with Tailwind CSS v4. See [tailwind-v4.md](./tailwind-v4.md) for Tailwind setup and `@theme inline`. When `components.json` exists, the assistant can find, install, and customize components correctly.

---

## Project Context

Run `shadcn info --json` to get: framework, Tailwind version, aliases, base library (`radix` or `base`), icon library, installed components, resolved file paths.

```bash
bunx shadcn@latest info --json
```

---

## Install & Init

```bash
# Install skill (if using skills system)
bunx skills add shadcn/ui

# Init project
bunx shadcn@latest init
```

Init options: style, base color, CSS variables. Use `-d` for defaults. For Tailwind v4: `bunx shadcn@canary init`.

---

## CLI Commands

| Command | Usage |
|---------|-------|
| init | `shadcn init [components]` — init + optional components |
| add | `shadcn add button card form` — add components |
| search | `shadcn search @shadcn -q "button"` — search registry |
| view | `shadcn view button @v0/dashboard` — view before install |
| docs | `shadcn docs button` — fetch component docs |
| info | `shadcn info --json` — project config |
| diff | preview file changes |
| build | build registry JSON |

---

## Add Components

```bash
# Common components
bunx shadcn@latest add button card input label textarea
bunx shadcn@latest add form
bunx shadcn@latest add table
bunx shadcn@latest add dialog sheet
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add toast
bunx shadcn@latest add avatar badge skeleton separator

# Dashboard stack
bunx shadcn@latest add button card input form table dialog
```

---

## Pattern Enforcement

### Forms: FieldGroup + react-hook-form + zod

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const schema = z.object({ name: z.string().min(1), email: z.string().email() })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

### Compound Components

- Card: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Dialog: DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription
- Table: TableHeader, TableBody, TableRow, TableHead, TableCell

### Variants

```tsx
<Button variant="default" size="sm">
<Button variant="destructive" size="lg">
```

### Semantic Colors

Use CSS variables: `primary`, `primary-foreground`, `secondary`, `destructive`, etc.

---

## Theming (Tailwind v4: @theme inline)

Tailwind v4 uses `@theme inline`. See [tailwind-v4.md](./tailwind-v4.md). CSS variables in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --radius: 0.5rem;
}
.dark {
  --background: 240 10% 3.9%;
}
```

OKLCH colors, dark mode, border radius. Works with Tailwind v3 and v4.

---

## Dark Mode

```bash
bun add next-themes
```

```tsx
// app/providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'
export function Providers({ children }) {
  return <ThemeProvider attribute="class" defaultTheme="system">{children}</ThemeProvider>
}
```

---

## MCP Server

Setup shadcn MCP for AI assistants to search, browse, and install from registries. See [ui.shadcn.com/docs/mcp](https://ui.shadcn.com/docs/mcp).

---

## How It Works

1. **Project detection** — Skill activates when `components.json` exists
2. **Context injection** — `shadcn info --json` injects config
3. **Pattern enforcement** — FieldGroup for forms, ToggleGroup for options, semantic colors
4. **Component discovery** — Use `shadcn docs`, `shadcn search`, or MCP before generating code

---

## References

- [shadcn/ui Skills](https://ui.shadcn.com/docs/skills)
- [CLI Reference](https://ui.shadcn.com/docs/cli)
- [Theming](https://ui.shadcn.com/docs/theming)
- [Registry](https://ui.shadcn.com/docs/registry)
- [MCP Server](https://ui.shadcn.com/docs/mcp)
