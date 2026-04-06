# T-Green — History + Memory

Last updated: 2026-04-06

## Snapshot
- Repo: Tranquillo Green (cannabis accounting/compliance)
- Current state: Phase 1 demo MVP shell mostly complete
- Demo-grade MVP estimate: ~60%
- Real deployable product estimate: ~30–35%

## Phase Status (from roadmap)
- Phase 1 (Demo MVP shell): 90%
- Phase 2 (Persistent accounting core): 15%
- Phase 3 (Import + review pipeline): 10%
- Phase 4 (Close engine + auditability): 20%
- Phase 5 (Auth + multi-tenant): 10%
- Phase 6 (Production hardening + automation): 5%

## Phase 1 — Remaining
- Broader browser QA pass across all routes
- Tighten weak placeholder modules or hide them
- Refresh README/docs to match actual shipped flows

## Phase 2 — Persistent accounting core (remaining)
- Cannabis companies persistence in Convex
- Chart of accounts persistence
- Reporting periods persistence
- Transactions + transactionLines persistence
- Cash reconciliations persistence
- Seed backend demo org matching current UI story
- Ensure all accounting pages load from Convex (no demo constants)
- Persist period status changes
- Persist reconciliation state

## Phase 3 — Real import + review pipeline (remaining)
- ImportJob model + source file metadata
- Mapping profile persistence
- Row-level validation results
- Promote imported rows into transactions
- Posting state transitions: imported → needs review → ready → posted
- Reopenable import jobs
- Review queue derived from stored records
- Transaction detail pages reflect live posting state

## Phase 4 — Live close engine + auditability (remaining)
- Computed close dashboard readiness from live data
- Persistent reviewer decisions + override history
- Support evidence metadata / attachments registry
- Packet generation history persistence
- Export bundle records
- Close signoff actions + history
- Support schedule ties to persisted source records

## Phase 5 — Multi-user, tenant-aware, deploy credible (remaining)
- Clerk auth flows
- Company/org boundary in app shell
- Role-aware views (owner, accountant, controller)
- Protected routes
- Seeded multi-tenant demo story
- Authenticated app shell
- User role affects visible actions
- Company data isolated by tenant

## Phase 6 — Production hardening + live automation (remaining)
- Deployment-ready env setup
- CI for lint/typecheck/build
- Broader browser QA + bugfix sweep
- Real scheduled/triggered automation jobs or service stubs
- Finish or hide shallow modules: Inventory, Compliance, Settings
- Demo/deploy package + operator walkthrough

## Recommended build order
1. Persistent accounting core
2. Real import jobs and posting pipeline
3. Computed close engine
4. Auth + tenant boundaries
5. Persistent audit trail + packet generation history
6. Production hardening + automation jobs

## Notes
- Phase 1 doc: docs/2026-04-04-green-phase-1-implementation-plan.md
- Roadmap: docs/2026-04-04-green-phased-execution-roadmap.md
- Backlog: docs/2026-04-04-github-backlog.md
