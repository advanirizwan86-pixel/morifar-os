# Security readiness validation — 4 November 2026

Draft branch only. Tests use synthetic records and generated ephemeral secrets. No production data, external messages or paid infrastructure were used.

| Check | Result | Scope / limits |
| --- | --- | --- |
| TypeScript / optimized production build | PASS | Local Node 24.22.1; supported Node 22 CI configured but not claimed passed |
| Existing authenticated routes | 29/29 PASS | Authenticated using actual password → mandatory MFA enrollment flow |
| Existing unauthenticated route checks | 6/6 PASS | Login redirects |
| Existing service automation safeguards | PASS | Existing rule-based/mock implementation, not a live external AI test |
| Private-client workflow smoke | PASS | Persistent case creation, reviewer mutation denial, stale DB role and inactive-account checks |
| TOTP cryptography | PASS | All six RFC 6238 SHA-1 eight-digit vectors; six-digit validation; replay rejection |
| MFA enrollment/recovery | PASS | Encrypted seed, single-use hashed recovery, account limits and version revocation; password alone issues no session |
| Staff isolation | PASS | Unassigned task rejection, restricted staff routes/contact/invoice data, reviewer write denial |
| Photo storage | PASS with scanner stub | Encryption round-trip, malformed type/path rejection, missing/rejecting scanner fails closed, authorized download and cross-user denial; NOT real malware-detection evidence |
| Job security/deduplication | PASS | Unauthorized calls rejected; duplicate runs generate no repeated notifications/drafts; production timer not enabled |
| Basic encrypted restore drill | PASS | Two tables and one opaque photo object; modified ciphertext and existing restore destination rejected |
| Full isolated-app backup and restore | PASS | 36 tables and one encrypted photo; DB integrity/FKs/counts, photo hash, recovered MFA seed and decrypted photo content checked |
| Client export | PASS | Executive export allowed; PRO denied; document binaries/full CDD completeness not established |
| Deployment configuration | JSON syntax PASS only | Terraform executable/provider/plan, systemd target host, TLS and real scanner not available for deployed validation |
| Independent test / legal review | NOT PERFORMED | Vendor scope prepared; no vendor quote, test report, signed ownership confirmation or consultant acceptance obtained |

Commands: `node scripts/private-client-tests.cjs`, `node scripts/security/security-tests.cjs`, `node scripts/security/backup-tests.cjs`, `node scripts/security/runtime-tests.cjs`, strict TypeScript, optimized Next.js build and `git diff --check`.

The full application drill is a local tool-verification result, not an off-site production recovery test. It does not establish backup durability, region, account ownership, monitored daily operation, production RPO/RTO or legal compliance. The live-data lock remains in place.
