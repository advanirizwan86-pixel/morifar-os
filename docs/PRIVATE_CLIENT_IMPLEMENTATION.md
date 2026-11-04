# Morifar OS private-client readiness — implementation 1

Baseline: 4 November 2026. Branch: `feat/private-client-readiness`.

## Release decision

**Dummy testing only. No approval for live records has been recorded.**

The 10-client pilot is also live use. Requirements 1–5 need evidence and Mohammed Rizwan Farook Advani's written approval before any pilot. Migration additionally requires accepted pilot results, a tested rollback plan and written approval. An environment flag or an entry in this register is not approval.

## Implemented in this branch

- Browser tab title: Morifar OS.
- Global dummy-data banner; unsupported `MORIFAR_DATA_MODE` values fail closed before database access. This is a configuration lock, not a detector of real personal data typed into existing forms. Staff must use synthetic data only. No live-mode implementation or bypass is provided.
- Seven client stages: Enquiry, Consultation, Proposal & Payment, Onboarding, Execution, Handover, Retainer.
- `/private-client`: persistent synthetic cases and checklists for all eight services in the Managing Director's brief. Only generated DEMO references are accepted for new cases; no client-name field is introduced.
- Server-validated case stages, checklist updates and expiry dates. Executive-only workspace. Super Admin, CEO and COO may mutate its records; CTO Reviewer may view but not mutate.
- Expiry calendar with 90/60/30-day on-screen bands and overdue status for passports, visas, Emirates ID, trade licences, Ejari and VAT/Corporate Tax deadlines. UAE calendar dates are used. These are on-screen alerts, not scheduled outbound notifications.
- Management overdue-task list and a local weekly client-update draft per case. Drafts are not sent and no client/government dispatch integration exists.
- Audit entries for new workspace views, case creation/stage/check changes, expiry creation and existing demo snapshot downloads. This does not constitute complete per-record read/download/delete auditing across the legacy application.
- Explicit server-page authentication/appropriate existing executive guards, in addition to middleware. Sessions re-read current user status/role from the database. Operational CRM/tasks/formation mutations reject CTO Reviewer users. Complete per-record role isolation is still outstanding.
- `/launch-readiness`: current evidence, proposed/unassigned owner, cost state, target date and next action for each requirement. It cannot approve go-live.

## Infrastructure inventory: facts versus unknowns

| Component | Code evidence | Provider/country/region/account status |
| --- | --- | --- |
| Application | Next.js; previously reported Vercel deployment | Current account, deployment region and ownership not independently verified |
| Database | Node SQLite; VERCEL uses OS temporary directory unless path overridden | Actual deployment path/region not verified; not acceptable for live records |
| Documents | Metadata/storage keys exist | Durable binary storage, scanning, provider, location and backup not verified |
| Backups | No verified daily encrypted off-site backup/restore evidence | Not provisioned/verified |
| AI provider | Local RuleBasedMockProvider, model `morifar-rule-mock-v1` | No external call in this provider; no provider API key used by this code |
| Messaging/payments/government | No live integration established by this review | No credentials, account owners or locations verified |

Do not put credentials, customer documents or production account inventories into this public repository. Supply the non-secret service register privately and credentials through a company-controlled password manager.

## Outstanding work and external dependencies

The full evidence register is maintained in `server/private-client/readiness.ts` and rendered at `/launch-readiness`. Unknown costs remain unknown; no paid services have been ordered and no supplier quote is fabricated.

1. **Hosting:** Obtain Morifar-owned UAE hosting/database/private object storage/key-management/backup accounts. Verify actual regions for every data copy, logs and disaster recovery. Quote app compute, managed database, storage, egress, backup, monitoring and support separately. Agree target architecture, migrate away from SQLite, rehearse schema/data migration with synthetic records and test persistence across redeploys. Hosting migration is not implemented in this branch.
2. **Ownership:** Verify repository/domain/hosting/database/admin ownership and Managing Director owner access. Collect written IP assignments and review third-party licences; a source comment cannot establish legal IP ownership. No account transfers have been performed.
3. **Security:** Implement mandatory MFA with enrollment/recovery/revocation and rate limiting; full role and record permissions for PRO/reception/accounts and other staff; complete view/change/download/delete auditing; encrypted storage and TLS verification; managed secrets; daily separate encrypted backup storage; documented full restore; independently quoted penetration test from two vendors, with findings fixed/retested. No MFA or encryption/backup completion is claimed.
4. **AI:** Inventory every AI-labelled surface. Keep external AI adapters disabled until reviewed. Names, passport/Emirates ID/bank identifiers and raw documents must not leave for external AI processing. Pattern masking alone is insufficient for arbitrary names or uploaded documents; use explicit allowlisted non-identifying inputs or an approved self-hosted deployment. Require human approval and audit at the actual dispatch boundary before any outbound client/government integration is enabled.
5. **Compliance:** UAE consultant must determine applicable protection/AML obligations, retention schedules, holds, lawful export/deletion procedures and hosting/transfer conditions. Build and verify full due-diligence export under those approved rules. No legal-compliance certification is claimed here.
6. **Workflow completion:** Staff acceptance of all eight starter checklists; durable scheduled 90/60/30-day notifications with deduplication/retries; approved weekly-update send workflow; mobile field-PRO assignment controls and photo uploads with file type/size validation, private storage, scanning and authorization on download. Photo uploads are intentionally not offered without secure storage.

## Dates and reporting

Written status target: **11 November 2026** (7 days after instruction). Weeks 1–2 are dummy testing and remediation targets only. Weeks 3–4 pilot and week 5 migration are provisional, conditional on all release gates. This document records targets, not a scheduled automation or a commitment by an external team.

## Acceptance evidence needed before live use

- Verified provider, country, region, owner account and recovery location for every component.
- Managing Director owner access and written IP/account confirmations.
- Tested MFA and permission matrix, unauthorized page/action/file tests, security audit and independent penetration-test report with retest closure.
- Encryption evidence, daily backup history and dated full-restore report with recovery timing and data-integrity checks.
- Reviewed AI data-flow inventory and human-approval enforcement at dispatch.
- Consultant review, approved retention/hold/export rules and tested due-diligence export.
- Written Managing Director approval of points 1–5 attached privately to the release record.

## Rollback rehearsal plan (not yet tested)

Before a pilot, take a consistent database-and-document snapshot, record schema/application versions, verify decryptability in an isolated UAE recovery environment, restore and compare record counts, object hashes and application functionality. Stop writes during rollback; reconcile post-snapshot changes and audit history before resuming. Define the approved recovery point/time objectives and an accountable decision maker. Do not rely on the existing demo-data reset/export as a production backup.

## Validation completed for this branch

- Strict TypeScript check and optimized Next.js production build passed.
- Existing authenticated route smoke: 29/29 HTTP 200; six unauthenticated redirect checks passed.
- Existing service-automation safeguard test passed.
- Private-client policy/database tests passed: UAE date boundary and expiry thresholds, live-mode rejection, all eight service checklists, persistent case creation, audit events, foreign-key rejection and transactional rollback.
- New workspace runtime checks passed: both routes require authentication, executive dummy case creation persists, database role overrides stale elevated token claims, reviewer mutation is rejected without writing, and an inactive user's token no longer reveals case data. Next.js may deliver a streamed login redirect with HTTP 200; the test checks redirect content and absence of case records in that case.
- `git diff --check` passed.

Tests used an isolated local synthetic SQLite database, not client records. Runtime used Node 24.22.1; the repository declares Node 22.x, so CI on the supported Node 22 runtime is still required before release. These tests are not a penetration test, restore drill or compliance review.
