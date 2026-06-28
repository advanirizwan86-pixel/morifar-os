# Morifar OS - Phase 4 Workflow Engine

## Architecture

Phase 4 introduces the Workflow Engine as a feature-based module without rebuilding existing Phase 1, Phase 2, or Phase 3 functionality.

The engine is built around:

- A protected Next.js route at `/workflow-engine`
- A server repository that reads workflow templates, run instances, audit logs, and filter options from SQLite
- Server actions for saving workflows, starting runs, pausing/resuming workflows, and recording approval decisions
- A client visual builder for node editing, drag/drop positioning, template selection, run controls, live monitor, and audit review
- Additive database migrations so existing Morifar databases upgrade in place

## Components

- `app/workflow-engine/page.tsx` - server page, executive access check, query parsing, data loading
- `app/workflow-engine/loading.tsx` - loading skeleton for the module
- `components/workflow-engine.tsx` - visual builder, template library, node configuration, filters, live monitor, approvals, and audit log
- `features/workflow-engine/types.ts` - strict workflow node, definition, run, audit, and dashboard types
- `features/workflow-engine/actions.ts` - server actions for workflow persistence and execution controls
- `server/repositories/workflow-engine.ts` - database mapping, metrics, filtering, and run/audit shaping
- `app/workflow-engine.css` - responsive enterprise UI styling aligned with Morifar's dark navy and gold interface

## Routes

- `/workflow-engine` - main Workflow Engine module

Access is restricted to `Super Admin`, `CEO`, and `COO` in middleware and server actions.

## Data Models

### `workflows`

Stores editable templates and custom workflows.

Key fields:

- `name`
- `description`
- `department_id`
- `country`
- `priority`
- `trigger_type`
- `definition`
- `status`
- `active`
- `created_by`
- `updated_at`

The `definition` field stores a typed JSON graph with `nodes` and `edges`.

### `workflow_runs`

Stores each execution instance.

Key fields:

- `workflow_id`
- `client_id`
- `company_id`
- `status`
- `current_step_id`
- `completed_steps`
- `remaining_steps`
- `elapsed_minutes`
- `errors`
- `ai_actions`
- `human_actions`
- `started_by`
- `started_at`
- `completed_at`

### `workflow_audit_logs`

Stores the action trail for workflow edits, execution, and approvals.

Key fields:

- `workflow_id`
- `run_id`
- `user_id`
- `ai_professional_id`
- `action`
- `old_value`
- `new_value`
- `notes`
- `created_at`

## Completed

- Added the `Workflow Engine` navigation item.
- Added protected `/workflow-engine` route.
- Added dashboard metrics for total, running, paused, completed today, failed, average completion time, AI tasks running, and human tasks pending.
- Added editable template library seeded with all requested Phase 4 workflow templates.
- Added visual workflow builder with draggable nodes and graph edges.
- Added node configuration for name, description, department, assigned AI, assigned human, estimated duration, inputs, outputs, conditions, escalation rules, retry rules, approval required, priority, and status.
- Added workflow execution run creation.
- Added live workflow monitor with workflow name, client, current step, AI, human, progress, elapsed time, risk, and status.
- Added human approval actions: approve, reject, request more information, reassign, and escalate.
- Added audit logging for workflow save, start, pause, resume, and approval actions.
- Added search and filters for workflow status, department, country, priority, date, AI, and human.
- Added loading and empty states.
- Added responsive layouts for desktop, tablet, and mobile.

## Fixed During Stabilization

- Moved workflow indexes into the migration path so upgraded SQLite databases no longer fail when an older `workflows` table lacks new Phase 4 columns.
- Restricted approval actions to active runs whose current node is an Approval step, with matching server-side validation.
- Wired date, assigned AI, and assigned human filters through the UI and repository.
- Synchronized template selection state, department ownership, run pause/resume state, and completed-run progress.
- Added empty states for filtered template results and audit activity.
- Converted visible workflow separators and empty values to ASCII-safe UI text.
- Kept Phase 4 data migrations additive to avoid destructive schema changes.

## Known Limitations

- Webhook and API Call nodes are configurable placeholders only; they do not call external systems in Phase 4.
- AI task execution is tracked and auditable, but AI Professionals do not yet run autonomous tool calls through a background worker.
- Workflow runs advance through server actions and approval decisions; there is no scheduler or queue worker yet.
- The visual builder supports drag/drop node placement and sequential edge creation, but advanced branching validation is reserved for a later phase.
- Audit logs are stored in SQLite and surfaced in the UI; export and retention policy controls are future work.

## Future Expansion

- Add a durable workflow runner with queueing, retries, delays, and timed escalations.
- Add branch-aware execution for decision, condition, split, and merge nodes.
- Integrate AI Professional tool execution with confidence scoring and mandatory human review gates.
- Add real webhook/API connectors with signed request handling and secret storage.
- Add workflow versioning, publishing, rollback, and draft approvals.
- Add per-department automation packs after the Workflow Engine foundation is stable.
- Add analytics for bottlenecks, SLA risk, AI accuracy, human approval latency, and completion trends.
