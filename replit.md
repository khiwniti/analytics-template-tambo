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

- **Home page** (`/`): Setup checklist + link to chat. Source: `artifacts/tambo-analytics/src/pages/home.tsx`
- **Chat page** (`/chat`): Full Tambo AI chat + drag-and-drop analytics canvas. Source: `artifacts/tambo-analytics/src/pages/chat.tsx`
- **AI Components**: Graph (bar/line/pie charts), SelectForm — registered in `src/lib/tambo.ts`
- **Canvas storage**: Zustand store persisted to localStorage — `src/lib/canvas-storage.ts`
- **TipTap editor**: Rich text input in `src/components/tambo/text-editor.tsx`
- **Env var required**: `VITE_TAMBO_API_KEY` — Tambo API key from https://tambo.co/cli-auth

### api-server (Express, preview path: `/api`)

Minimal API server. No custom routes yet (only `/api/healthz`).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
