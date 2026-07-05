# Services

## Repository Layer

- `server/repositories/dashboard.ts`: dashboard metrics.
- `server/repositories/crm.ts`: CRM and lead data.
- `server/repositories/tasks.ts`: task data.
- `server/repositories/business-operations.ts`: formation, documents, approvals and queues.
- `server/repositories/workflow-engine.ts`: workflows and runs.
- `server/repositories/search.ts`: search.
- `server/repositories/company-profile.ts`: organization profile settings.
- `server/repositories/data-reset.ts`: demo-data preview, export and reset.

## Service Layer

- `server/services/intelligence.ts`: deterministic intelligence panels.
- `server/services/service-automation.ts`: service automation recommendations and explanation objects.

## Server Actions

Actions live under `features/*/actions.ts` and handle authenticated mutations.

