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

- **Home page** (`/`): Ikkyu's personal portfolio. **GenAI startup theme**: pure white background (#FFFFFF), violet/purple primary (#7C3AED), pink gradient accent, Inter bold headlines, decorative gradient orb blobs (purple/pink/blue), violet gradient text on "Ikkyu" name. Dark theme replaced by GenAI light theme (violet + white). Nav buttons: About / Projects / Skills / Contact. Source: `artifacts/tambo-analytics/src/pages/home.tsx`
- **Chat page** (`/chat`): Full Tambo AI chat + drag-and-drop analytics canvas. Auto-submits pending message stored in sessionStorage (from home page). TamboProvider configured with portfolio tools, contextHelpers, and systemContext resource. Source: `artifacts/tambo-analytics/src/pages/chat.tsx`
  - **AI Status Strip**: slim frosted pill above input showing real-time tool call / component generation status (e.g. "Reading profile", "Building resume…") with pulsing emerald dot
  - **Follow-up Chips**: context-aware suggestion pills after each AI response, derived from the last canvas component type (ResumeCard → role/project chips, ProjectShowcase → outcome/contact chips, etc.)
  - **"Book Ikkyu" CTA**: floating pill left of FAB that appears after 2+ user turns or hiring keywords detected; adds ContactForm to canvas on click; prefilled with conversation summary; auto-hides when ContactForm already on canvas
  - **Smart thread titles**: localStorage-based title derived from first user message; displayed in thread sidebar instead of raw ID; searchable
  - **Keyboard polish**: Escape closes panel + returns focus to FAB; auto-focus on open; `visualViewport` resize listener keeps panel above mobile keyboard
  - **Thread title storage**: `src/lib/thread-titles.ts` — shared by chat.tsx and thread-history.tsx
- **Canvas**: Dot-grid background. Components pop in with spring entrance animation.
- **AI Components** (registered in `src/lib/tambo.ts`):
  - `ResumeCard` — tailored resume with PDF export. Canvas-safe.
  - `ProjectShowcase` — project deep-dive card with hover glow. Canvas-safe.
  - `Graph` — Recharts bar/line/pie chart. Canvas-safe.
  - `SkillRadar` — Recharts RadarChart for skill proficiency by category. Canvas-safe.
  - `TimelineCard` — vertical timeline for career/education milestones. Canvas-safe.
  - `StatCard` — compact stat grid for key numbers at a glance. Canvas-safe.
  - `SelectForm` — choice input (single/multi). Inline-only (uses Tambo hooks).
  - `ContactForm` — contact form with DB persist + email notification. Inline-only.
  - `INLINE_ONLY_COMPONENTS` set in `message.tsx` guards canvas routing.
- Portfolio data in `src/services/portfolio-data.ts` (60s TTL + BroadcastChannel cross-tab cache bust).
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
