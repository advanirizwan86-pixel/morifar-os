# Developer Guide

This guide explains how to maintain Morifar OS without changing business behavior unintentionally.

## Local Verification

Run these checks before release work is considered ready:

```bash
pnpm exec tsc --noEmit
pnpm run build
node scripts/route-smoke.mjs
```

Use reviewer credentials for authenticated route smoke when testing locally or on Vercel.

## Architecture Rules

- Keep pages in `app/` thin and use server repositories for data access.
- Keep reusable UI in `components/`.
- Keep domain-specific types, actions and deterministic intelligence in `features/`.
- Keep database access in `server/db` and `server/repositories`.
- Keep service logic in `server/services`.

## Security Rules

- Do not commit secrets, API keys, database files, build output or local environment files.
- Protect internal routes in both middleware and server-side session helpers.
- Keep `/cto` limited to CEO and Super Admin.
- Keep `/admin/data-reset` limited to Super Admin.
- Require human approval for sensitive AI-assisted decisions.

## Release Rules

- Do not start a new phase inside stabilization work.
- Update `README.md`, `CHANGELOG.md`, `SYSTEM_STATUS.md`, `RELEASE_NOTES.md` and CTO documentation when platform behavior changes.
- Document known risks instead of hiding them.
- Confirm production build and smoke tests before deployment.
