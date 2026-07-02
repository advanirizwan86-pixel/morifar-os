# Morifar OS Database Migration Plan

Date: 2026-06-29
Status: Planning only. No production migration was performed in Phase 4.1.

## Current State

Morifar OS currently uses SQLite through Node.js `node:sqlite`.

- Local development database: `data/morifar.db`.
- Vercel demo database: `/tmp/morifar.db`.
- Startup schema management: additive, idempotent table and column creation in `server/db`.

This is acceptable for demos and preview testing, but it is not durable production storage on Vercel.

## Migration Target

Recommended managed SQL targets:

- Vercel Postgres
- Neon Postgres
- Supabase Postgres
- Managed PostgreSQL from the production cloud provider

PostgreSQL is recommended because the current schema is relational and can map cleanly to SQL tables, indexes, foreign keys, and JSON text fields.

## Migration Principles

- Do not migrate during an active product phase without a freeze window.
- Keep the repository pattern intact so UI and feature code do not depend on a database vendor.
- Introduce migrations as explicit versioned files rather than relying only on startup schema creation.
- Preserve audit logs and operational history.
- Enforce server-side validation before writes.
- Keep secrets in Vercel Environment Variables or a managed secret store.

## Proposed Steps

1. Choose the managed PostgreSQL provider and create separate development, preview, and production databases.
2. Add a database adapter layer behind existing repository modules.
3. Create versioned migrations for the current SQLite schema.
4. Build a one-time export/import script for local SQLite data.
5. Validate row counts, foreign keys, indexes, and JSON fields after import.
6. Run the app against the managed development database.
7. Run Phase 4 route and workflow regression tests.
8. Promote to preview.
9. Freeze writes, migrate production/demo data, and promote production.
10. Remove `/tmp` database reliance from Vercel deployments.

## Tables To Migrate

- `users`, `roles`, `departments`
- `clients`, `companies`, `contacts`, `leads`
- `tasks`, `task_comments`
- `documents`, `document_requests`
- `company_applications`, `formation_status_logs`
- `ai_professionals`, `ai_memory`
- `workflows`, `workflow_runs`, `workflow_audit_logs`
- `activities`, `notifications`, `invoices`, `settings`

## Risks

- SQLite date strings need consistent PostgreSQL timestamp handling.
- JSON string columns should be reviewed for `jsonb` migration.
- Current seed logic should not overwrite production data.
- Vercel serverless concurrency requires a pooled PostgreSQL connection strategy.
- Auth bootstrap must remain idempotent and safe.

## Phase 3 Priority Recommendation

Before expanding more departments or external automation, migrate persistence to managed PostgreSQL and add versioned migrations. The Workflow Engine will eventually become a high-write audit and execution system, so durable storage should come before deeper automation.
