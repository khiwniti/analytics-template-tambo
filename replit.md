# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### tambo-analytics (React + Vite, preview path: `/`)

A Tambo AI analytics template. Ported from Next.js to Vite + React.

- **Home page** (`/`): Ikkyu's personal portfolio (khiw.dev design). Dark theme with hero, stats, tech pills, scroll-reveal sections (About, Career, Projects, Domains, Skills, Side Projects, Contact). Features AI chat starter with suggestion chips + contact form that saves to the DB. Nav buttons: About / Projects / Skills / Contact. Source: `artifacts/tambo-analytics/src/pages/home.tsx`
- **Chat page** (`/chat`): Full Tambo AI chat + drag-and-drop analytics canvas. Auto-submits pending message stored in sessionStorage (from home page). TamboProvider configured with portfolio tools (ResumeCard, ProjectShowcase), contextHelpers, and systemContext resource. Source: `artifacts/tambo-analytics/src/pages/chat.tsx`
- **AI Components**: ResumeCard (PDF generation with relevance scoring), ProjectShowcase — registered in `src/lib/tambo.ts`. Portfolio data in `src/services/portfolio-data.ts`.
- **Canvas storage**: Zustand store persisted to localStorage — `src/lib/canvas-storage.ts`
- **Vite proxy**: `/api` → `localhost:8080` (api-server) for dev mode

### api-server (Express, port 8080)

- `GET /api/healthz` — health check
- `POST /api/contact` — save contact form submission to `contacts` table. Validates name/email/message (Zod). Returns `{ success, id, createdAt }`.

### Database (PostgreSQL + Drizzle)

- **contacts** table: `id, name, email, message, ip_address, created_at`
- Schema: `lib/db/src/schema/contacts.ts`
- Migrate: `pnpm --filter @workspace/db run push`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
