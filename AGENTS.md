# AGENTS.md — analytics-template-tambo

## Package Manager

- **pnpm only**. `preinstall` hook blocks npm/yarn. Always use `pnpm install`.
- This is a pnpm workspace with a `catalog:` for shared dependency versions.

## Workspace Layout

```
lib/                    # Shared libraries (internal)
  db/                   # @workspace/db — Drizzle ORM + PostgreSQL
  api-spec/             # OpenAPI spec + Orval codegen
  api-client-react/     # @workspace/api-client-react — generated react-query hooks (output)
  api-zod/              # @workspace/api-zod — generated Zod schemas (output)

artifacts/              # Deployable applications
  api-server/           # Express 5 API backend (port 8080)
  tambo-analytics/      # React/Vite frontend (proxies /api → localhost:8080)
  mockup-sandbox/       # Standalone Vite dev sandbox

scripts/                # Utility scripts (tsx)
```

## Key Commands

```bash
pnpm install                          # Install all workspace deps
pnpm run typecheck                    # Full typecheck (libs + artifacts + scripts)
pnpm run build                        # typecheck + build all packages

# Codegen (run after changing lib/api-spec/openapi.yaml)
pnpm --filter @workspace/api-spec run codegen
# Generates: lib/api-client-react/src/generated/* and lib/api-zod/src/generated/*

# DB schema push (requires DATABASE_URL)
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run push-force

# Dev servers (each artifact has its own dev script)
pnpm --filter @workspace/api-server run dev       # API server on PORT (default 8080)
pnpm --filter @workspace/tambo-analytics run dev  # Frontend on PORT (default 8081)
```

## Architecture Notes

- **API flow**: `artifacts/api-server` serves `/api/*` routes using Express 5. `artifacts/tambo-analytics` Vite dev server proxies `/api` requests to `http://localhost:8080`.
- **Codegen pipeline**: `lib/api-spec/openapi.yaml` → Orval → generates both `@workspace/api-client-react` (react-query hooks) and `@workspace/api-zod` (Zod validators). After running codegen, `typecheck:libs` is automatically triggered.
- **Database**: Drizzle ORM with PostgreSQL. Uses `drizzle-kit push` (not migrations). Schema lives in `lib/db/src/schema/`. `DATABASE_URL` is required.
- **Post-merge hook**: `scripts/post-merge.sh` runs `pnpm install --frozen-lockfile` then `drizzle-kit push --force` after every git merge.
- **Replit deployment**: Targets `autoscale` with PostgreSQL 16. Ports: 8080 (API), 8081 (frontend), 8082→3001, 25474→80.

## Environment Variables

| Variable | Required By | Notes |
|---|---|---|
| `DATABASE_URL` | @workspace/db | PostgreSQL connection string |
| `PORT` | api-server, tambo-analytics | Required, no default |
| `BASE_PATH` | tambo-analytics | Vite base path, required |

## Testing

- No test suite exists in this repo.

## Style / Conventions

- TypeScript with `moduleResolution: "bundler"`, `isolatedModules`, `strictNullChecks`.
- ESM only (`"type": "module"` in all packages).
- Prettier configured at root. No linter (ESLint) configured.
