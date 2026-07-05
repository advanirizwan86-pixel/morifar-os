# Security

## Authentication

Morifar OS uses a signed session cookie. Routes are protected through middleware and server-side session checks.

## Role Access

- Super Admin: all operational and admin access, including Data Reset.
- CEO: CTO walkthrough/system map and executive settings access.
- COO: executive operational pages.
- CTO Reviewer: CTO start, CTO walkthrough, system map and executive review pages.
- Authenticated users: standard operational pages and training.

## Secrets

Do not commit environment files, API keys, tokens, passwords or database files.

## Known Risk

Durable managed storage is required before live production-of-record data.
