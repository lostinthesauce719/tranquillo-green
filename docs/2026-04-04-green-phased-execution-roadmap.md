# Tranquillo Green Phased Execution Roadmap

Goal: move Tranquillo Green from a strong demo-backed MVP shell into a real deployable cannabis accounting and compliance product.

Current completion estimate:
- Demo-grade MVP: 60%
- Real deployable product: 30-35%

## Phase 1 — Demo MVP shell (mostly complete)
Status: 90%

Completed:
- accounting shell and route structure
- chart of accounts workspace
- reporting periods workspace
- transaction list, detail, and approval flows
- imports, pipeline, and month-end close views
- 280E allocation queue, history, and support schedule
- cash reconciliation list and detail flows
- CPA export center and packet builder
- automation/agent control surface
- lint, typecheck, and production build passing
- review/QA pass on key routes

Remaining in this phase:
- broader browser QA pass across all routes
- tighten weak placeholder modules or hide them
- refresh README/docs to match actual shipped flows

## Phase 2 — Persistent accounting core
Status: 15%
Target completion: 55%

Objective:
Replace demo/local UI state with persisted Convex-backed truth for the accounting core.

Scope:
- cannabisCompanies persistence
- chartOfAccounts persistence
- reportingPeriods persistence
- transactions and transactionLines persistence
- cashReconciliations persistence
- seed backend demo org matching current UI story

Acceptance criteria:
- accounting pages load from Convex, not demo constants
- journal entries persist across sessions
- period status changes persist
- reconciliation state persists

## Phase 3 — Real import and review pipeline
Status: 10%
Target completion: 70%

Objective:
Turn the import/review/post workflow into a real operational path.

Scope:
- importJob model
- source file metadata
- mapping profile persistence
- row-level validation results
- promote imported rows into transactions
- posting state transitions: imported -> needs review -> ready -> posted

Acceptance criteria:
- import jobs persist and can be reopened
- review queue derives from stored records
- transaction detail pages reflect live posting state

## Phase 4 — Live close engine + auditability
Status: 65%
Target completion: 82%

Objective:
Make close readiness, 280E review, and handoff packages computed from live data and preserved in audit trails.

Scope:
- computed close dashboard readiness
- persistent reviewer decisions and override history
- support evidence metadata / attachments registry
- packet generation history persistence
- export bundle records
- close signoff actions and history

Acceptance criteria:
- close dashboard is fully data-derived
- every override has actor/reason/history
- every exported packet has generation history
- support schedule ties to persisted source records

## Phase 5 — Multi-user, tenant-aware, deploy credible
Status: 70%
Target completion: 92%

Objective:
Make the app usable by real operators, controllers, and CPAs.

Scope:
- Clerk auth flows
- company/org boundary in app shell
- role-aware views (owner, accountant, controller)
- protected routes
- seeded multi-tenant demo story

Acceptance criteria:
- authenticated app shell exists [DONE]
- user role affects visible actions [DONE]
- company data is isolated by tenant [DONE — Convex queries use auth context]

## Phase 6 — Production hardening and live automation
Status: 40%
Target completion: 100%

Objective:
Ship a credible production candidate with real quality gates and automation stubs/jobs.

Scope:
- deployment-ready env setup [DONE]
- CI for lint/typecheck/build [DONE]
- broader browser QA and bugfix sweep
- real scheduled/triggered automation jobs or service stubs
- finish or hide shallow modules: Inventory, Compliance, Settings [DONE]
- demo/deploy package and operator walkthrough

Acceptance criteria:
- CI blocks broken changes
- production config documented
- major routes QA’d
- automation is no longer purely descriptive
- app is ready for a controlled external demo or pilot

## Recommended build order from here
1. Persistent accounting core
2. Real import jobs and posting pipeline
3. Computed close engine
4. Auth + tenant boundaries
5. Persistent audit trail and packet generation history
6. Production hardening + automation jobs

## Rough completion by area
- Product UX/workflow shell: 85%
- Cannabis accounting domain modeling: 75%
- 280E moat features: 80%
- Backend persistence: 40%
- Auth/multi-tenant readiness: 75%
- Deployment readiness: 55%
- QA/production hardening: 55%
