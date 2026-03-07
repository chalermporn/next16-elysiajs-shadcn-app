# Docker Compose — Dev & AI Agent

From [Docker MCP](https://docs.docker.com/ai/mcp-catalog-and-toolkit/) and Docker Compose best practices.

Use Docker Compose for local dev (PostgreSQL, app) and with Docker MCP Toolkit for AI agent workflows.

---

## Stack: Next.js + Elysia + Drizzle + PostgreSQL

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## Dev: DB Only (Next.js runs locally)

```yaml
# docker-compose.dev.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

volumes:
  postgres_data:
```

`.env.local`:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
```

```bash
docker compose -f docker-compose.dev.yml up -d
bun run dev
```

---

## Commands

```bash
# Start
docker compose up -d

# Logs
docker compose logs -f app

# Stop
docker compose down

# Rebuild
docker compose up -d --build
```

---

## Docker MCP (AI Agent)

Docker provides [MCP Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/) and [MCP Gateway](https://docs.docker.com/ai/mcp-gateway/) for AI agents:

- **Catalog** — 300+ MCP servers as container images
- **Profiles** — named server collections per project
- **Gateway** — single config shared across Cursor, Claude, etc.

Use `docker mcp` CLI or Docker Desktop MCP Toolkit to manage servers. Compose helps run DB and services that the agent or app needs.

---

## References

- [Docker MCP Catalog & Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/)
- [Docker Compose](https://docs.docker.com/compose/)
