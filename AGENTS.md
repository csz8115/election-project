# AGENTS.md — Repo Instructions for Agents

## High-level goal
Refactor and organize rushed/sloppy parts of the codebase and expand automated tests across the stack.
Focus on maintainability, consistency, and reliability.
Do NOT add Playwright or browser-based E2E tests.

## Non-negotiables / Guardrails
- Prefer small, reviewable changes (PR-sized). Avoid massive rewrites.
- Do not change product behavior unless explicitly asked OR tests prove equivalence.
- Preserve public APIs (routes, component props, exported functions) unless you also update all call sites and tests.
- Keep TypeScript types strict. Do not introduce `any` to “fix” typing unless justified.
- Avoid adding new dependencies unless necessary. If you think a dep is needed, propose it first with reasons and alternatives.
- No secret refactors: explain the intent of each change in the final summary.
- Do not introduce flaky tests. Prefer deterministic tests with isolated state.

## Definition of Done (must be true before finishing any task)
- All quality gates pass: lint (if present), typecheck (if present), and tests.
- Added/updated tests cover the refactor or the new behavior.
- No unused exports, dead code, or broken imports.
- Any new scripts/docs are added to README or this file.

---

## Project layout
- src/client: React frontend
- src/server: Node/Express backend
- prisma/: Prisma schema + migrations
- src/: (legacy / misc — clean up over time)

## Tooling assumptions
- Package manager: npm
- Runtime: Node 23.7.0 (prefer Node LTS if tooling compatibility issues arise)
- Test runner: Jest
- Backend framework: Express
- DB access: Prisma
- DB: Postgres

---

## Commands

### Install
- npm install

### Run
- npm run dev

### Quality gates (must run before finishing)
- npm test
- npm run lint (if present)
- npm run typecheck (if present)

> If a command fails, fix it before concluding.

---

## Refactor priorities (order matters)
1) Component/Module organization
   - Create a consistent folder structure (layer-based)
   - Rename files to be predictable and follow a standard naming convention
   - Remove dead code and unused exports
   - Reduce circular deps
   - Avoid “barrel export” changes unless necessary (they can cause circular imports)

2) Improve code quality without behavior change
   - Extract reusable components/utilities
   - Simplify props and types
   - Replace copy/paste logic with shared helpers
   - Keep changes incremental and localized

3) Testing expansion (no Playwright)
   - Add/expand unit tests for services/utils/state logic
   - Add integration tests for API endpoints and DB interactions (Express + Prisma + Postgres)
   - Add fixtures/factories for test data
   - Prefer deterministic tests: no real network calls

---

## Testing standards

### Folder structure
- src/**: production code
- test/unit/**: unit tests (no DB, no HTTP)
- test/integration/**: integration tests
  - API route tests (supertest)
  - DB tests (Prisma + Postgres)

### Unit tests
- Test pure functions, validators, mappers, reducers, and services with mocked IO
- Fast and deterministic
- Minimal setup

### Integration tests (backend)
- Use supertest for API testing (do not start an actual network server/port).
- Ensure Express app is exported (e.g., export `app`) and the listening server is separated (e.g., `server.ts`).
- Prefer a real Postgres test DB:
  - Option A: docker-compose test DB + env var DATABASE_URL_TEST
  - Option B: Testcontainers (only if needed; propose first)
- Apply Prisma migrations before integration tests.
- Use a clear DB reset strategy between tests:
  - "npx prisma migrate reset"
- Close Prisma client connections after tests.

### Coverage
- Add coverage reporting and a reasonable threshold (start modest, raise over time)
- Prioritize critical paths over vanity coverage

---

## Change process / Output format
When you work on a task:
1) Briefly list the plan (bullets)
2) Make changes in small commits/steps
3) Run the quality gate commands (tests, plus lint/typecheck if present)
4) Summarize what changed and why
5) Call out any risks, follow-ups, or TODOs

---

## What to avoid
- Large rewrites across many files at once
- Introducing new architectural patterns everywhere
- Reformatting the entire codebase without need
- Adding Playwright / browser automation tests
- Adding dependencies without explaining tradeoffs
- Mocking everything in integration tests (integration tests should be real API+DB where possible)

---

## If you need clarification
If repo commands, scripts, or structure are unclear:
- Inspect package.json scripts
- Inspect existing test setup
- Make the smallest safe assumption
- Document the assumption in your summary