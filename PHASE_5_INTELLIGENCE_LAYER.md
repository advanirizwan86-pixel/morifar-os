# Morifar OS Phase 5: Intelligence Layer

Date: 2026-07-02

## Overview

Phase 5 adds the Morifar Intelligence Layer: AI-labelled decision support for leadership, client management, operations, task planning, approvals, and knowledge access.

The layer does not make irreversible business decisions. It explains, recommends, summarizes, and prioritizes while preserving human approval.

## Architecture

The implementation keeps intelligence logic out of route components and existing business modules.

- `server/ai/provider.ts`
  - Defines `AiProvider`.
  - Provides the current rule-based mock provider.
  - Can be replaced by a real LLM provider without changing UI modules.

- `server/services/intelligence.ts`
  - Client health scoring.
  - Client intelligence and AI briefings.
  - Company briefings.
  - Task recommendations.
  - Approval observations.
  - Executive Copilot answers.
  - Operations intelligence dashboard data.
  - Knowledge article catalog.

- `features/intelligence/types.ts`
  - Shared strict TypeScript models for scores, insights, briefings, recommendations, operations intelligence, and knowledge articles.

- `components/intelligence-panels.tsx`
  - Reusable UI components for AI disclosures, health badges, task recommendations, approval assistant, briefing cards, operations charts, and knowledge cards.

## New Routes

- `/executive-copilot`
  - Conversational executive question interface.
  - Answers common operational questions from current Morifar OS data.

- `/client-intelligence`
  - Client health scores.
  - Missing documents.
  - Outstanding approvals.
  - Open tasks.
  - Blockers.
  - AI recommendations.
  - AI briefing panels for clients and companies.

- `/operations-intelligence`
  - Department workload.
  - Workflow bottlenecks.
  - Delayed cases.
  - Average completion time.
  - Pending approvals.
  - AI productivity.
  - Human workload.
  - Client health distribution.

- `/knowledge-base`
  - SOPs, guides, procedures, checklists, policies, and templates.
  - Structured to prepare for semantic search and retrieval later.

## Existing Module Integrations

- `/tasks/new`
  - Adds Smart Task Recommendations.
  - Recommends department, consultant, AI professional, priority, and estimated completion time.
  - Does not auto-assign; users still choose the assignee.

- `/approvals`
  - Adds AI Approval Assistant observations before human decision.
  - Human approval remains mandatory.

- Navigation
  - Adds Executive Copilot and Operations Intelligence under Automation.
  - Adds Client Intelligence and Knowledge Base under Intelligence.

## AI Services

Current provider:

- Rule-based mock provider.
- Produces AI-labelled guidance from live operating records.
- No external API calls.
- No secrets required.

Future provider strategy:

- Add an OpenAI or enterprise LLM implementation behind `AiProvider`.
- Add request tracing, evaluation logs, and safety filters.
- Add retrieval over the Knowledge Base after a durable database migration.
- Add per-role prompt policy and audit events for generated recommendations.

## Client Health Score

Health score considers:

- Missing or rejected documents.
- Overdue tasks.
- Pending approvals.
- Active formation workflow progress.

Displays:

- Green.
- Amber.
- Red.
- Numeric score.
- Breakdown explaining the calculation.

## Knowledge Base Strategy

The current Knowledge Base is structured application data. It is intentionally ready for:

- PostgreSQL persistence.
- Document upload metadata.
- Embedding generation.
- Semantic retrieval.
- Source citations inside future AI responses.

## Known Limitations

- AI provider is deterministic and rule-based until a real LLM is connected.
- Knowledge Base is static structured content in this phase.
- CRM client cards were left structurally unchanged to avoid destabilizing the one-line encoded route file; client/company intelligence is provided in the dedicated `/client-intelligence` module.
- Non-executive RBAC still needs role-specific seeded QA accounts for full browser validation.
- Vercel SQLite persistence remains ephemeral until the database migration plan is executed.

## Test Summary

- TypeScript: pass.
- Production build: pass.
- Protected route redirect checks: pass for `/executive-copilot`, `/client-intelligence`, `/operations-intelligence`, `/knowledge-base`, `/tasks/new`, and `/approvals`.
- Secret scan: no real API keys, GitHub tokens, or reviewer password were found in source.
- ESLint: no standalone ESLint config exists; the repo's TypeScript-backed validation passed. The local `pnpm run lint` wrapper is still blocked by pnpm's ignored-builds guard before script execution unless dependency build approvals are configured.
