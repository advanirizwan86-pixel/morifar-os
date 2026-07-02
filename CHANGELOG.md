# Changelog

## 1.0.0-rc - 2026-07-02

### Release Candidate

- Set Morifar OS package version to `1.0.0`.
- Added visible Version 1.0 RC identity in the authenticated application shell.
- Improved navigation accessibility with primary navigation labelling, active page state, link titles, and skip-to-content support.
- Improved global search semantics for assistive technology.
- Tightened shared focus, disabled, selection, table header, mobile input, and card interaction styling.
- Updated `/system-status` to reflect Version 1.0 Release Candidate readiness and a QA score of 95.
- Added release documentation: `VERSION`, `SYSTEM_STATUS.md`, and `RELEASE_NOTES.md`.
- Added Company Profile / Organization Settings for Version 1.0 operational rollout.

### Known Risks

- Vercel uses ephemeral SQLite storage for previews and demonstrations; durable client data still requires managed persistent storage.
- Node may emit an experimental `node:sqlite` warning until the database adapter is migrated.
- Browser console and network health should be re-checked after every production deployment.
