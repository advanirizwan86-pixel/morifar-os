# Phase 4 Business Operations Engine

## Architecture

Phase 4 adds a modular Business Operations Engine on top of the existing Morifar OS CRM, task, notification, workflow and AI-professional layers.

The implementation is additive and follows the existing app structure:

- `app/*` contains route surfaces.
- `components/business-operation-forms.tsx` contains reusable validated forms.
- `features/business-operations/actions.ts` contains server actions for operational state changes.
- `server/repositories/business-operations.ts` contains typed read models.
- `server/db/schema.sql` and `server/db/index.ts` define schema, migrations and seed data.
- `app/business-operations.css` contains scoped module styling.

## Modules Completed

### Company Formation

Implemented route:

- `/company-formation`
- `/company-formation/[id]`

Capabilities:

- Create company application.
- Select jurisdiction and Mainland / Free Zone / Offshore structure.
- Capture business activity, shareholders, managers, visa allocation and office requirement.
- Track current status, assigned consultant, assigned AI professional, progress, notes and internal comments.
- Maintain required documents checklist.
- Log every status transition in `formation_status_logs`.
- Create workflow run, queue item, activity, notification and immutable audit event when applications are created or updated.

Supported workflow states:

- Lead
- Application Started
- Documents Pending
- Documents Verified
- Trade Name
- Initial Approval
- License Processing
- Visa Processing
- Completed

### Client Onboarding

Implemented route:

- `/client-onboarding`

Capabilities:

- Capture client, company, passport, Emirates ID, phone, email, address, nationality, service required, source, priority, referral and risk level.
- Automatically create client and company records.
- Generate department queue item, timeline activity and audit log.

### Document Collection

Implemented route:

- `/documents`

Capabilities:

- Track Passport, Visa, Emirates ID, Trade License, MOA, POA, Utility Bill, Bank Statement and Photographs.
- Track statuses: pending, uploaded, rejected and approved.
- Track expiry date, reviewer and notes.
- Document reviews create audit history.
- Approved or rejected document decisions create approval records.

### Workflow Execution

Integrated behavior:

- Creating a company formation application creates a workflow run for `wf_company_formation`.
- Formation status changes generate activity and audit events.
- Queue items link workflow execution to department work.
- Existing Workflow Engine remains intact and can continue expanding from these run records.

### Approval System

Implemented route:

- `/approvals`

Capabilities:

- Supports document, company application, workflow step, task and comment approval entities.
- Decisions supported: approve, reject, request changes and escalate.
- Approval decisions update audit logs and can add follow-up queue work.

### Activity Timeline

Implemented route:

- `/timeline`

Capabilities:

- Combines operational `activities` and immutable `audit_logs`.
- Shows chronological status changes, document events, approvals, AI actions and human actions.

### Audit Logs

Implemented route:

- `/audit-logs`

Capabilities:

- Immutable operational audit history.
- Tracks actor, action, entity, before, after, IP placeholder and reason.

### Department Queues

Implemented route:

- `/department-queues`

Initial queues:

- Company Formation
- Operations / Executive Office
- Sales
- Compliance / Legal
- AI Professionals through assigned AI fields

Capabilities:

- Filtering by department, status and search term.
- Priority board by urgent, high, medium and low.
- Assignment update and status update.
- Queue actions write audit history.

## Routes

- `/business-operations`
- `/company-formation`
- `/company-formation/[id]`
- `/client-onboarding`
- `/documents`
- `/approvals`
- `/timeline`
- `/audit-logs`
- `/department-queues`

## Components

- `CompanyApplicationForm`
- `ClientOnboardingForm`
- Existing shared components reused:
  - `PageHeader`
  - `AppShell`
  - Existing cards, panels, tabs, tables, badges and form styling

## Database Changes

New tables:

- `company_applications`
- `formation_status_logs`
- `document_requests`
- `approvals`
- `audit_logs`
- `department_queue_items`

New indexes:

- `idx_company_applications_status`
- `idx_document_requests_status`
- `idx_approvals_status`
- `idx_audit_logs_entity`
- `idx_department_queue_status`

Seed data:

- Formation applications for Qanara and Azm.
- Formation status history.
- Document checklist records.
- Pending and completed approvals.
- Queue items across formation, sales, compliance and executive operations.
- Immutable audit examples.

## Known Limitations

- File upload storage is represented by document request status and metadata. Actual secure binary upload/storage is not implemented in this phase.
- Audit IP address is intentionally a placeholder.
- SQLite remains suitable for local/demo use. Vercel production persistence still needs a durable database.
- Workflow execution is connected through run/event records but not yet a real background execution engine.
- Bulk queue actions are represented by queue update capability; multi-select batch UI can be expanded later.

## Recommended Phase 5

- Durable production database.
- Secure document upload and virus scanning.
- Real workflow runner with retries, step workers and scheduled jobs.
- AI execution queue connected to model/tool calls.
- Fine-grained RBAC for approvals, audit logs and department queues.
- Notification delivery over email/WhatsApp/in-app channels.

## Verification

Completed:

- TypeScript: passed.
- Production build: passed.
- Route table includes all Phase 4 Business Operations routes.

Build note:

- Node emits experimental SQLite warnings during build. The build still completes successfully.
