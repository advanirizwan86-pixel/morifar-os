# Architecture

Morifar OS uses Next.js App Router, React 19, strict TypeScript and Node.js 22.

## Application Layers

- `app/`: routes, pages and route handlers.
- `components/`: reusable UI and form components.
- `features/`: domain actions, types and shared product constants.
- `server/db`: SQLite setup, schema, seed data and migrations.
- `server/repositories`: data access helpers.
- `server/services`: deterministic service logic for intelligence and service automation.
- `docs/`: CTO documentation pack.

## Persistence

The current persistence layer uses SQLite through Node's built-in `node:sqlite` module. On Vercel this uses `/tmp`, which is ephemeral.

## Deployment

The app targets Vercel with Node.js 22.

