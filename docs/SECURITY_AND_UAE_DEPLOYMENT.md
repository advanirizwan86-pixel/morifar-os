# Morifar OS — security implementation and UAE deployment handoff

Updated 4 November 2026. This supersedes the open-code-work descriptions in the first implementation report. It does not supersede the Managing Director's live-data approval restriction.

## Current release boundary

**Only dummy data. Not deployed. No production client approval recorded.** Mandatory MFA is a breaking authentication change: old password-only sessions stop working. Set the new encryption key securely before starting this version, then complete authenticator enrollment. There is no MFA bypass flag.

## Implemented

| Requirement | Implementation | Remaining verification |
| --- | --- | --- |
| Mandatory two-factor login | Password-verified, five-minute challenge; authenticator enrollment; six-digit TOTP; step replay rejection; eight single-use recovery codes; failure limits; encrypted seed; DB-backed session version and active-status checks | Staff enrollment/recovery rehearsal, operational monitoring, independent security review |
| Staff permissions | Default-deny legacy pages/actions for non-executive staff; dedicated `/staff`; PRO assigned tasks/photos, reception assigned contact fields, accounts/finance assigned invoices; explicit client assignments; owner staff-role management; reviewer mutations denied | Business acceptance of role matrix; review any future routes/actions before granting access |
| Secure field photos | Mobile camera/file input, 8 MB limit, JPEG/PNG signature check, mandatory local ClamAV pass, AES-256-GCM private object files, authorized download and auditing | Real scanner definitions/health validation, encrypted UAE storage provisioning, storage quotas/monitoring, mobile device testing |
| Scheduled alerts | Authenticated job, hourly systemd timer, 90/60/30-day expiry bands, overdue-task alerts, weekly draft creation; transactionally deduplicated in-app notifications | Install/enable timer on target host, monitor failures and verify timezone; no email/SMS or client/government dispatch connected |
| Human approval | Persistent weekly drafts, approval action with human actor audit, no outbound send action | Approved dispatch adapter and boundary tests before adding any external delivery |
| Backups | Consistent SQLite snapshot; photo objects referenced by snapshot; archive encrypted with separate AES-GCM key; hashes and table-count manifest; full synthetic restore test, foreign-key/integrity checks, tamper rejection, destination overwrite protection | Provision separate UAE backup account/store; enable daily timer; perform full target-environment restore and record RPO/RTO; runbook key recovery |
| Ownership | Repository remains under the existing GitHub owner; corporate account/IP evidence checklist prepared | Verified Morifar owner access and signed IP/account confirmations; these cannot be established by source code |
| Compliance | Restricted client JSON export of known legacy records, metadata and relevant client/company audit entries; owner/assigned-Legal permission | Consultant review, approved retention/hold/delete rules, verification of complete CDD including document binaries; no compliance certification claimed |
| Hosting | Proposed AWS UAE foundation Terraform, service/timer files and TLS reverse-proxy configuration | No cloud account connected or resources provisioned; Terraform executable/provider validation and costed plan not run; approved image/domain/certificates and operator access required |

## Permission boundaries

- Super Admin / CEO: owner access controls; executive operations. COO: executive operations, no owner role-management UI.
- CTO Reviewer: read-only executive review; no task, AI/workflow, photo, invoice or private-client mutations.
- PRO: only tasks currently assigned to that user and photos on those tasks. No unassigned clients, invoices or broad CRM pages.
- Reception / Sales / Consultant / Manager: assigned tasks; explicitly assigned contact name/email/phone/country. No passport, Emirates ID, bank information or broad client audit data.
- Accounts / Finance: assigned tasks and invoices attached to explicitly assigned clients. No reception contact fields or broad CRM/audit pages.
- Legal: assigned tasks and explicitly assigned client compliance export. This is a deliberate document-access permission; assign only when needed.
- HR and other roles: assigned tasks only until additional permission designs are reviewed.
- New roles/routes default to denied. Broad legacy records remain executive-only; this is an intentional restriction rather than an assertion that every legacy department has a full feature set.

Every server action/route must repeat authorization; hiding navigation is not authorization. Existing role claims in cookies are never authoritative for DB permissions. Owner role changes revoke sessions; client and task assignment changes are checked on the next request.

## Secrets and first startup

Use a company-controlled secret manager/password manager. Never put secrets in GitHub issues, source, PRs, chat or this document. Environment templates contain empty placeholders only.

Separate keys: `AUTH_SECRET` for sessions; `MORIFAR_ENCRYPTION_KEY` for authenticator seeds and photos; `MORIFAR_BACKUP_KEY` for encrypted archives; `MORIFAR_JOB_TOKEN` for internal job authentication. Generate each independently. Keep old data encryption keys recoverable; no key-rotation migration is implemented yet. Loss of the data key makes MFA seeds/photos unrecoverable, even if backup archives can be decrypted.

Provide first-start bootstrap credentials privately. Bootstrap now creates the owner only when the user table is empty; it does not reset/re-enable an existing owner on restart. Remove bootstrap secrets after initialization. Enroll MFA and save the eight recovery codes in the company password manager; test recovery with a synthetic staff account. A used recovery code revokes older sessions. Lost authenticator plus lost recovery codes requires a separately reviewed, audited operator recovery procedure; no web MFA-disable button is supplied.

## UAE target deployment proposal — not provisioned

`infra/uae/main.tf.json` is a proposed AWS `me-central-1` (UAE) foundation: explicit primary/backup account IDs; region-locked providers; encrypted persistent EBS volume and root disk; IMDSv2; no SSH ingress; HTTPS restricted to approved office/VPN CIDRs; private, versioned KMS-encrypted backup bucket in a separate account; TLS-only bucket policy. No credentials are part of the template. Resource deletion is guarded. This is single-host staging architecture, not a high-availability production design.

Before choosing/provisioning AWS, verify current regional capacity/service health and pricing. The official region list identifies UAE as `me-central-1`; service availability and recent recovery advisories require checking at deployment time. This proposal is not a claim that the existing Vercel deployment resides in UAE. An alternative approved UAE data-centre host may use the service/TLS/backup scripts without applying AWS Terraform.

Required inputs before any paid provisioning: verified Morifar account ownership and secure operator access; distinct primary/backup account IDs/profiles; security-approved UAE AMI; approved office/VPN CIDRs; domain and TLS certificate/private-key secret references; backup bucket/key setup; approved monthly cost estimate. Run `terraform fmt`, `init`, `validate` and a reviewed costed `plan` in the operator environment before apply. No Terraform executable or cloud credentials were available in this implementation environment; JSON syntax was validated; provider/schema/plan validation has not been performed, and templates have not been applied or certified.

Provision Node 22.16+ (latest patched 22.x), TLS reverse proxy, ClamAV plus automatic signed definition updates, AWS CLI if using S3, and dedicated application account. Mount the encrypted data volume at `/var/lib/morifar` before starting the app; set owner-only permissions. Keep application writable data out of the repository/public directory. Configure the approved domain/TLS paths in `infra/uae/Caddyfile`. The app listens only on loopback. Confirm TLS externally and verify that no client data appears in proxy logs, build logs or monitoring exports.

Systemd examples:
- `morifar.service`: dummy-only app, restricted user and filesystem.
- `morifar-notifications.service/.timer`: hourly authenticated local job.
- `morifar-backup.service/.timer`: daily at 02:00 Asia/Dubai; separate root-controlled backup environment, same-region separate-account destination verification, encrypted archive upload. The backup service reads owner-only application files under sandboxing; app process receives no backup credentials/key. Review this privilege separation on target host.

Configure alerts for failed timer runs and verify timer status/history; copying unit files does not activate scheduling. Keep `MORIFAR_DATA_MODE=dummy`. This release intentionally rejects live mode.

## Backup/restore operations and limits

The backup tool backs up this application's SQLite tables and new encrypted task-photo objects. Legacy document metadata without actual object storage is not a backup of missing document binaries. Photograph objects are immutable; a consistent SQLite snapshot determines the exact object set copied. Any future physical delete or object replacement needs coordination with snapshot jobs and approved retention/hold rules.

`backup.mjs create DATABASE PRIVATE_PHOTOS NEW_ENCRYPTED_OUTPUT` refuses an existing output path. `backup.mjs restore ENCRYPTED_INPUT NEW_DIRECTORY` refuses an existing restore destination, authenticates the entire encrypted archive before extracting, checks database hash/integrity/foreign keys/counts and photo hashes, then writes a restore report. Never restore over an active database. Keep encryption keys in a separate recoverable secret store; archives do not contain their keys.

The small synthetic drill restored two tables and one photo object and rejected tampering. An additional full isolated-app drill restored 36 tables and one encrypted photo, including MFA and audit records; it is not a production or remote-storage recovery drill. Before pilot: restore a complete target-environment dummy snapshot including MFA, assignments, jobs, audits and photos; prove decrypted photo access and login with the recovered key; record data/object hashes, completion time, RPO/RTO, failure handling and Managing Director acceptance. Separately verify remote upload/download, region, backup account identity, access controls and key recovery. No automatic backup deletion/retention is enabled until the consultant approves the schedule.

## External reviews and cost evidence

See `docs/OWNERSHIP_AND_EXTERNAL_REVIEW.md` for the account evidence register, proposed two-vendor test scope and consultant review checklist. Quote requests have not been sent. No vendor price, reserved testing date, legal opinion or signed ownership document is fabricated.

## Official references consulted

- TOTP: https://datatracker.ietf.org/doc/html/rfc6238
- AWS region names: https://docs.aws.amazon.com/general/latest/gr/rande.html
- AWS Backup encryption (for an alternative managed-backup design): https://docs.aws.amazon.com/aws-backup/latest/devguide/encryption.html
- Cobalt official pricing/scoping: https://www.cobalt.io/platform/pricing
- Cure53 official services: https://cure53.de/
