# DareX CRM

[![CI](https://github.com/Parakh20/darexsaas/actions/workflows/ci.yml/badge.svg)](https://github.com/Parakh20/darexsaas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A multi-tenant SaaS CRM built with Next.js 14 (App Router), Prisma and PostgreSQL. It covers
contacts, a sales pipeline, a unified inbox, tasks and an AI agent (Google Gemini with function
calling) that can search contacts, update deals, create tasks and send WhatsApp messages on the
user's behalf.

## Features

- **Multi-tenant by design.** Every business record carries a `tenantId`. API routes resolve the
  signed-in user's tenant from the session, and `tenantPrisma()` (`src/lib/prisma.ts`) is a
  Prisma client extension that injects the tenant filter into reads and writes. Isolation is
  covered by unit tests.
- **Google sign-in** via Auth.js (next-auth v5) with JWT sessions. On first sign-in a user gets
  their own tenant and the `OWNER` role (roles: `OWNER`, `ADMIN`, `MEMBER`).
- **Dashboard** with KPIs: active opportunities, pipeline value, pending tasks, recent contacts
  and recent AI-initiated actions from the audit log.
- **Contacts** (`/crm`): paginated search and create in the UI; the API also supports update
  and delete. Contacts have status, tags, source, lead score and notes.
- **Pipeline** (`/opportunities`): deals across `LEAD → QUALIFIED → PROPOSAL → NEGOTIATION →
  CLOSED_WON / CLOSED_LOST`, with value, probability and expected close date.
- **Unified inbox** (`/inbox`): conversations per contact across WhatsApp, email and call logs,
  with AI summary and sentiment fields.
- **Tasks** (`/tasks`): priorities, due dates and status, including tasks created by the AI agent.
- **AI agent chat** (`/chat`): persistent conversations backed by Gemini function calling. Tools
  live in `src/lib/ai/tools/`:
  `searchContacts`, `updateOpportunity`, `createTask`, `fetchBusinessMetrics`, `sendWhatsApp`.
  Tool calls are stored with each message and AI-initiated actions are written to the audit log.
- **Lead qualification workflow** (`POST /api/workflows/new-lead`): Gemini scores a contact
  0-100; for scores of 80 or more it sends a WhatsApp greeting (if the contact has a phone
  number) and creates a high-priority follow-up task. Each run is recorded as a `WorkflowRun`.
- **WhatsApp Business webhook** (`/api/webhooks/whatsapp`): verification handshake (`GET`) and
  inbound message ingestion into the inbox (`POST`).
- **Audit log** of user and AI actions per tenant.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 14 (App Router, route handlers, middleware), React 18, TypeScript |
| Data | PostgreSQL, Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Auth | Auth.js / next-auth v5 (Google provider, JWT sessions) |
| AI | Google Gemini via `@google/generative-ai` (function calling) |
| UI | Tailwind CSS, lucide-react, TanStack Query |
| Validation | Zod |
| Testing | Vitest, Testing Library, jsdom |

## Quick start

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
git clone https://github.com/Parakh20/darexsaas.git
cd darexsaas
npm ci                 # also runs `prisma generate`
cp .env.example .env   # then fill in the values
npm run db:push        # create the schema in your database
npm run db:seed        # optional: demo tenant with sample contact, deal, conversation and task
npm run dev            # http://localhost:3000
```

For a throwaway local database:

```bash
docker run -d --name darex-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=darexsaas -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/darexsaas"
```

Sign-in is Google-only, so you need a Google OAuth client with the redirect URI
`http://localhost:3000/api/auth/callback/google`. Each new Google account gets its own empty
tenant; the seed data lives in a separate demo tenant.

## Environment variables

See [`.env.example`](.env.example). Placeholders only; never commit real values.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Auth.js secret for signing session tokens (`NEXTAUTH_SECRET` also accepted) |
| `NEXTAUTH_URL` | dev/prod | Public base URL of the app (`AUTH_URL` also accepted) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | yes | Google OAuth credentials |
| `GEMINI_API_KEY` | for AI | AI agent chat and lead qualification |
| `GEMINI_MODEL` | no | Gemini model name, defaults to `gemini-2.5-flash` |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | for WhatsApp | Outbound messages via the WhatsApp Cloud API |
| `WHATSAPP_VERIFY_TOKEN` | for WhatsApp | Token checked during webhook verification |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (`next/core-web-vitals`, `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Tests with V8 coverage |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Seed demo data (`prisma/seed.ts`) |

## Project structure

```
prisma/
  schema.prisma          # Tenant, User, Contact, Opportunity, Conversation, Message,
                         # ChatConversation, ChatMessage, Task, AuditLog, WorkflowRun
  seed.ts
src/
  app/
    (auth)/auth/         # sign-in and error pages
    (dashboard)/         # dashboard, chat, crm, opportunities, inbox, tasks (+ shared layout)
    api/                 # REST route handlers: contacts, opportunities, tasks, inbox,
                         # chat, dashboard, workflows/new-lead, webhooks/whatsapp, health, auth
  components/            # Providers (TanStack Query), layout/Sidebar
  lib/
    ai/                  # Gemini chat loop, model config, function-calling tools
    auth/                # Auth.js config (edge-safe part for middleware + full config)
    prisma.ts            # Prisma client, tenant-scoped extension, audit log helper
    types.ts, utils.ts
  middleware.ts          # route protection
  test/                  # Vitest suites
```

API routes return a consistent envelope: `{ success: true, data }` or
`{ success: false, error, code? }`.

## Testing

```bash
npm test
```

43 unit tests across 6 suites: tenant isolation, opportunity routes, AI tool execution, auth
helpers, utilities and the `KpiCard` component. Prisma and external APIs are mocked, so tests
need no database, Google credentials or Gemini key. CI runs lint, typecheck, tests and a
production build on every push and pull request.

## Known limitations

- The WhatsApp webhook does not verify Meta's `X-Hub-Signature-256` header, and inbound messages
  are matched to contacts by the last 10 digits of the phone number across all tenants. Add
  signature verification before using it in production.
- `/api/health` sits behind the auth middleware, so it is not usable as an unauthenticated
  uptime probe as-is.
- There are no Prisma migrations yet; the schema is applied with `prisma db push`.

## License

[MIT](LICENSE) © 2026 Parakh Sharma
