# Morifar OS

Morifar OS is a Next.js operating platform for CRM, tasks, company operations, AI workforce management, and human/AI workflow orchestration.

## Current Scope

- Phase 1 and Phase 2 operational modules
- Phase 3 AI Command Center
- Phase 4 Workflow Engine

External API execution, production background workers, durable cloud persistence, department automation packs, and the Client Portal remain future work.

## Technology

- Next.js 15 App Router
- React 19
- Strict TypeScript
- Node.js 22
- SQLite through the built-in `node:sqlite` module
- Tabler Icons

## Local Setup

Requirements:

- Node.js 22
- pnpm

Create a local environment file:

```bash
cp .env.example .env.local
```

Set these values:

```bash
AUTH_SECRET="generate-a-random-value-with-at-least-32-characters"
MORIFAR_BOOTSTRAP_EMAIL="admin@example.com"
MORIFAR_BOOTSTRAP_PASSWORD="use-a-strong-password-with-at-least-12-characters"
MORIFAR_BOOTSTRAP_NAME="Morifar Administrator"
```

Install and start:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The current `lint` script runs the strict TypeScript compiler. An ESLint configuration has not yet been added.

## Key Routes

- `/dashboard` - executive operational dashboard
- `/crm` - client, company, and pipeline views
- `/leads` - lead management
- `/tasks` - operational task board
- `/ai-professionals` - AI workforce directory
- `/ai-professionals/[id]` - AI professional workspace
- `/ai-command-center` - AI workforce control room
- `/workflow-engine` - workflow builder, execution monitor, approvals, and audit log
- `/notifications` - operational notifications
- `/settings` - company, department, role, and market settings

## Authentication

- A bootstrap Super Admin is created only when `MORIFAR_BOOTSTRAP_PASSWORD` is present and contains at least 12 characters.
- `AUTH_SECRET` must contain at least 32 characters.
- `/settings`, `/ai-command-center`, and `/workflow-engine` are restricted to `Super Admin`, `CEO`, and `COO`.
- Real environment files, local databases, logs, and runtime output are excluded from Git.

## Data Model

The SQLite schema and seed logic live under `server/db`.

Primary operational tables include:

- `users`, `roles`, and `departments`
- `clients`, `companies`, `contacts`, and `leads`
- `tasks`, `task_comments`, and `documents`
- `ai_professionals` and `ai_memory`
- `workflows`, `workflow_runs`, and `workflow_audit_logs`
- `activities`, `notifications`, `invoices`, and `settings`

Existing databases are upgraded through additive, idempotent startup migrations.

## Vercel Deployment

The project declares Node.js 22 and includes `server/db/schema.sql` in the Next.js output trace.

Configure these Vercel environment variables for Production, Preview, and Development:

- `AUTH_SECRET`
- `MORIFAR_BOOTSTRAP_EMAIL`
- `MORIFAR_BOOTSTRAP_PASSWORD`
- `MORIFAR_BOOTSTRAP_NAME`

Do not set `MORIFAR_DATABASE_PATH` on Vercel unless the target is a writable local path. When `VERCEL` is detected, Morifar OS automatically uses `/tmp/morifar.db`.

### Persistence Limitation

Vercel function storage is ephemeral. The `/tmp` SQLite database allows the application to boot for previews and demonstrations, but data can reset between function instances or deployments.

Before using Morifar OS for durable production data, replace the local SQLite repository with a managed database such as Vercel Postgres, Neon, Supabase, or another persistent SQL service.

## Documentation

- `PHASE_3_SPRINT_3_1.md`
- `PHASE_4_WORKFLOW_ENGINE.md`

## Security

- Never commit `.env`, `.env.local`, database files, credentials, tokens, or API keys.
- Rotate `AUTH_SECRET` and bootstrap credentials if they are ever exposed.
- Use Vercel Environment Variables or another secret manager for deployment values.
