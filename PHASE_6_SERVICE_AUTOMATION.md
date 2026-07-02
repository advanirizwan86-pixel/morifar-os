# Morifar OS Phase 6 - Service Automation Platform

Date: July 2, 2026  
Scope: AI-assisted operational execution for real Morifar service work.  
Principle: AI prepares, recommends, drafts, validates and tracks. Humans approve.

## Architecture

Phase 6 adds a modular service layer at `server/services/service-automation.ts` and a new workspace at `/service-automation`.

Core services:

- `CompanyFormationService`
- `DocumentValidationService`
- `DocumentGenerationService`
- `CommunicationService`
- `ComplianceService`
- `RecommendationEngine`
- `CaseManagementService`

The implementation builds on the existing repositories and data model instead of replacing Phase 1-5 modules.

## Modules

- Company Formation Automation: shows current status, next step, missing documents, government/client actions, owners, ETA, timeline, risk level and AI recommendations.
- Document Validation: flags missing, rejected, expired, expiring and unsupported documents without rejecting automatically.
- Document Generator: prepares MOA, resolutions, POA, agreements, NDA and corporate drafts from company data.
- Client Communication Assistant: prepares email, WhatsApp, missing document and status-update drafts.
- Smart Case Manager: calculates health, risk, missing items, next action, approvals, owner, timeline and AI summary.
- AI Compliance Checklist: tracks pending, completed, blocked and requires-review controls.
- Executive Operations Dashboard: shows pipeline, delayed cases, risk, approvals and AI productivity.
- Activity Timeline Enhancement: classifies activity as AI recommendation, human decision, document, approval, workflow transition, communication or system event.
- AI Explanations: every recommendation includes a `why` field.
- Configuration: rules are isolated in `serviceAutomationRules` for future country/service/regulation packs.

## Canonical Department Structure

Morifar OS uses this department model for queues, workflows, AI assignment and future service packs:

- Sales Department
- Operations Department
- Company Formation Department
- Visa Department
- Banking Department
- Accounting Department
- Tax Department
- Compliance Department
- Legal Department
- Private Client Department
- Executive Office

## Data Flow

1. Existing repositories load applications, documents, approvals and timeline events.
2. Service classes derive advisory outputs from the data.
3. Recommendation rules evaluate case context and return explainable suggestions.
4. `/service-automation` renders advisory workspaces, drafts and checklists.
5. Humans remain responsible for approvals, sending, finalization and sensitive submissions.

## AI Decision Rules

Rules are represented as configuration-style objects with:

- `id`
- `label`
- `appliesTo`
- `evaluate(context)`

Current rules cover formation next step, missing documents and approval blockers. They are intentionally isolated so future country packs, service packs and regulation packs can replace or extend them.

## Human Approval Rules

- AI recommendations are labelled and include why.
- Document findings never reject automatically.
- Generated documents are drafts only.
- Communication drafts require approval before sending.
- Payment, KYC, shareholder verification and compliance approval remain human-reviewed.
- No government submission or external integration is executed in Phase 6.

## Security Considerations

- Phase 6 does not introduce external government integrations.
- No autonomous legal or financial execution is performed.
- Existing authenticated app shell and role controls remain in place.
- Persistent production data still requires durable managed storage beyond Vercel `/tmp` SQLite.

## Future Integrations

- Banking automation packs.
- Visa automation packs.
- Tax, legal and accounting packs.
- Country-specific formation rules.
- Semantic knowledge retrieval.
- Durable database-backed rule configuration.
- Human approval queues connected to real document generation and communications.

## Known Limitations

- Document validation is rule-based and metadata-driven because real file OCR/image inspection is not integrated yet.
- Generated documents are structured drafts, not final legal documents.
- Communication drafts are not sent automatically.
- Recommendation rules are code-configured in Phase 6 and should later move to database-backed admin configuration.
- SQLite remains a demo/preview storage mode on Vercel.

## QA Summary

- TypeScript: passed.
- Production build: passed.
- Route smoke: passed with `/service-automation` in the required route list.
- Service automation tests: passed with recommendation explanations, document generation, communication drafts, compliance checklist and approval safeguards.
- Browser responsive QA: passed at desktop, tablet and mobile widths with no horizontal overflow.
- Browser console: no `error` or `warn` entries observed on the local built Phase 6 workspace.

## Production Readiness Assessment

Phase 6 is designed as an advisory execution layer. It is suitable for internal production review once build, route smoke and service automation tests pass. It is not yet suitable for autonomous external submissions, financial execution or final legal document generation.

Final local readiness score: **94 / 100**.
