# Database

Morifar OS currently uses SQLite through Node's `node:sqlite` module.

## Core Tables

- `users`, `roles`, `departments`
- `clients`, `companies`, `contacts`, `leads`
- `tasks`, `task_comments`
- `documents`, `document_requests`
- `company_applications`, `formation_status_logs`
- `approvals`, `audit_logs`, `department_queue_items`
- `ai_professionals`, `ai_memory`
- `workflows`, `workflow_runs`, `workflow_audit_logs`
- `activities`, `notifications`, `invoices`
- `countries`, `settings`

## Protected During Demo Reset

Users, roles, departments, Company Profile, AI Professionals, system settings and workflow templates are preserved.

## Limitation

Vercel `/tmp` storage is ephemeral. Move to managed Postgres/Supabase/Neon before durable live client data.

