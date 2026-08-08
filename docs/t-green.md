# T-Green — History + Memory

Last updated: 2026-04-08

## Snapshot
- Repo: Tranquillo Green (cannabis accounting/compliance)
- Current state: strong demo-backed workflow shell with partial persisted accounting core
- Workflow shell / demo UX: ~85%
- Real deployable product readiness: ~15-20%
- Strategic build order now centers on trusted accounting execution, not generic phase progression

## Strategic roadmap order
1. Defensible Decisions
2. Guided Certainty
3. Mess In -> Order Out imports
4. Visible Trust
5. Transparent Automation
6. CPA Leverage
7. Broader decision intelligence

## Current emphasis by pillar
### Defensible Decisions
- Core Convex persistence for companies, chart of accounts, periods, transactions, and reconciliations is in place
- Accounting workspace prefers Convex-backed data when configured
- Manual journals, period status changes, and reconciliation actions can persist
- Remaining work: remove lingering demo-state dependencies, add stronger decision metadata, verify end-to-end seeded story

### Guided Certainty
- UI shell exists for dashboard, queues, review, and close flows
- Remaining work: compute readiness from live state, formalize review-state transitions, persist overrides and signoff history

### Mess In -> Order Out imports
- Import and review UX story exists
- Remaining work: persist import jobs, mappings, validation results, review workflow, posting transitions, and lineage

### Visible Trust
- Trust surfaces are implied in exports / close workflows but not yet systematized
- Remaining work: evidence registry, packet history, export provenance, audit timelines, support traceability

### Transparent Automation
- Automation control surface exists but is largely descriptive
- Remaining work: real scheduled / triggered jobs, run history, visible outputs, review boundaries

### CPA Leverage
- Export center and packet builder demo story exist
- Remaining work: auth, tenancy, role-aware views, persisted packet outputs, CPA-facing handoff credibility

### Broader decision intelligence
- Explicitly deferred until trust foundation is materially complete

## Immediate priorities
1. Finish Defensible Decisions foundation
2. Turn Guided Certainty into live review logic
3. Make Mess In -> Order Out a real import pipeline
4. Add Visible Trust artifacts and history
5. Only then deepen automation and CPA leverage

## Key docs
- Roadmap: docs/2026-04-04-green-phased-execution-roadmap.md
- Execution checklist: docs/2026-04-06-green-phase-2-checklist.md
- Backlog: docs/2026-04-04-github-backlog.md
- Schema / routes: docs/2026-04-04-green-schema-and-route-map.md
