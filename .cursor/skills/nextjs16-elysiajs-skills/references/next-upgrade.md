# Upgrade Next.js

From [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills)

## Steps

1. Read `package.json` for current Next.js version
2. Check official guides:
   - [version-16](https://nextjs.org/docs/app/guides/upgrading/version-16)
   - [version-15](https://nextjs.org/docs/app/guides/upgrading/version-15)
3. Run codemods:
   ```bash
   bunx @next/codemod@latest next-async-request-api .
   bunx @next/codemod@latest upgrade .
   ```
4. Update deps:
   ```bash
   bun add next@latest react@latest react-dom@latest
   ```
5. Run build and test
