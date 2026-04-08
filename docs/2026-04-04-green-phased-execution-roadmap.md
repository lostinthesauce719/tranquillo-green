# Tranquillo Green Strategic Execution Roadmap

Goal: move Tranquillo Green from a strong demo-backed shell into a deployable cannabis accounting product that earns trust by helping operators and CPAs make defensible decisions.

This roadmap replaces shallow phase language with product-strategic workstreams that still map cleanly into implementation sprints.

Current completion estimate:
- Workflow shell and demo UX: 85%
- Domain framing for cannabis accounting / 280E: 75-80%
- Persisted system of record: 25%
- Real operational trust and auditability: 20%
- Deployable multi-user product readiness: 15-20%

## Product strategy in build order
1. Defensible Decisions
2. Guided Certainty
3. Mess In -> Order Out imports
4. Visible Trust
5. Transparent Automation
6. CPA Leverage
7. Broader decision intelligence

The ordering is intentional: Green should first prove it can structure accounting truth, guide review, tame messy inputs, and make trust visible before expanding into broader analytics or intelligence surfaces.

## 1) Defensible Decisions
Status: active foundation
Target outcome: every important accounting conclusion in Green is traceable to persisted records, period context, reviewer action, and supporting evidence.

Why this comes first:
- This is the core wedge against spreadsheets and generic accounting tooling.
- Cannabis operators and CPAs need supportable close decisions, not just dashboards.
- The rest of the product becomes more credible once the accounting truth layer is real.

Execution scope:
- persist cannabisCompanies
- persist chartOfAccounts
- persist reportingPeriods
- persist transactions and transactionLines
- persist cashReconciliations
- seed backend demo org matching current UI story
- remove dependence on demo constants for primary accounting workflows
- preserve period status, journal entries, reconciliation notes, and reviewer state across sessions
- establish actor / timestamp / reason structure for material accounting decisions

Acceptance criteria:
- accounting pages load from Convex-backed data by default
- journal entries persist across sessions
- period status changes persist with history-ready metadata
- reconciliation state persists and can be revisited
- seeded demo org reproduces the current product story without manual patching

Sprint-ready slices:
- finish persistence gaps in accounting workspace loaders
- normalize write paths for journals, periods, and reconciliations
- add event metadata fields needed for later audit trail work
- verify seeded data coverage against accounting, close, and export screens

## 2) Guided Certainty
Status: partial UX shell exists, logic mostly shallow
Target outcome: Green does not merely display accounting data; it guides users toward the next correct review action with explicit confidence, blockers, and escalation paths.

Why this comes second:
- Once truth exists, users need guided review instead of raw tables.
- This is where the product starts feeling like an operator system rather than a UI shell.

Execution scope:
- compute close dashboard readiness from persisted workflow state
- define review states for imported transactions, reconciliations, close tasks, and 280E support items
- show blockers, missing evidence, and next recommended action on core workspaces
- persist reviewer decisions, override reasons, and signoff history
- connect transaction detail, queue views, and period close surfaces into one review narrative

Acceptance criteria:
- close dashboard is fully data-derived
- review queues are generated from live state rather than mock counts
- every override captures actor, reason, and timestamp
- users can tell what is ready, blocked, and awaiting review without cross-referencing multiple pages

Sprint-ready slices:
- build readiness calculators for period close and 280E workflows
- formalize review-state enums and transitions
- add blocker cards / exception summaries to dashboard surfaces
- persist close signoff actions and reviewer history

## 3) Mess In -> Order Out imports
Status: UI story exists, backend operational path is incomplete
Target outcome: messy source files become structured, reviewable accounting records through a persistent import pipeline.

Why this comes third:
- Import quality is the operational bottleneck in real bookkeeping.
- Green wins when it turns operator mess into orderly books and review work.

Execution scope:
- importJob model and source file metadata
- mapping profile persistence
- row-level validation results
- review queue for exceptions and unmapped rows
- promotion of imported rows into transactions
- posting state transitions: imported -> needs review -> ready -> posted
- reopenable import jobs with deterministic state history

Acceptance criteria:
- import jobs persist and can be reopened
- review queue derives from stored records
- imported rows can be promoted into transactions without losing lineage
- transaction detail pages reflect live posting state and source provenance
- mapping decisions reduce repeated cleanup effort on subsequent imports

Sprint-ready slices:
- persist import job headers and source file metadata
- persist mapping profiles and validation output
- connect review decisions to transaction creation / posting transitions
- add lineage links from posted transactions back to import sources

## 4) Visible Trust
Status: partially implied in UX, not yet systemically implemented
Target outcome: Green visibly proves why numbers can be trusted by exposing support, history, signoff, and export provenance.

Why this comes fourth:
- Trust must be visible to operators, controllers, and external CPAs.
- This is a differentiator only after live data and review decisions exist.

Execution scope:
- support evidence metadata / attachments registry
- packet generation history persistence
- export bundle records
- close signoff actions and history
- source-to-schedule traceability for 280E support schedules and close outputs
- clear audit timeline for material overrides and reviewer actions

Acceptance criteria:
- every exported packet has generation history
- support schedules tie to persisted source records
- users can inspect who changed what and why on key decisions
- packet / export surfaces clearly show source period, generation time, and included artifacts

Sprint-ready slices:
- persist packet generation records and export bundle metadata
- attach evidence references to close items and allocations
- add history timeline components to detail views
- expose trust artifacts directly on close and export screens

## 5) Transparent Automation
Status: descriptive surfaces exist, real execution is thin
Target outcome: automation reduces clerical work while staying inspectable, reversible, and human-supervised.

Why this comes fifth:
- Automation only helps after truth, review, and trust surfaces are established.
- In this domain, hidden automation is a liability; visible automation is leverage.

Execution scope:
- convert automation definitions into scheduled / triggered jobs or service stubs
- show what each automation does, why it ran, what records it touched, and what still needs review
- define approval boundaries for automated suggestions vs automated actions
- connect automation outputs into review queues instead of bypassing them
- document deployment and operational controls for background jobs

Acceptance criteria:
- automation is no longer purely descriptive
- each run has status, timestamp, scope, and result visibility
- automated outputs feed auditable review workflows
- operators can distinguish system suggestion from committed accounting action

Sprint-ready slices:
- stand up one or two real automation jobs around import prep, close reminders, or reconciliation checks
- create automation run history model
- wire automation outputs into exception queues and dashboard summaries
- document failure handling and operator override paths

## 6) CPA Leverage
Status: good demo story, limited operational depth
Target outcome: Green materially reduces the effort for controllers and external CPAs to review books, request support, and complete handoff.

Why this comes sixth:
- CPA leverage is where the accounting moat becomes commercially obvious.
- It depends on trustworthy data, guided review, visible support, and structured exports.

Execution scope:
- strengthen CPA export center and packet builder on persisted data
- package period-close records, support schedules, exceptions, and reviewer notes into reusable handoff artifacts
- support role-aware views for owner, accountant, controller, and CPA reviewer
- add company/org boundary and tenant isolation in app shell
- prepare seeded multi-tenant demo story for external walkthroughs and pilots

Acceptance criteria:
- authenticated app shell exists
- user role affects visible actions and review permissions
- company data is isolated by tenant
- CPA packet builder uses persisted records rather than static placeholders
- external reviewer can understand close status and support package without operator narration

Sprint-ready slices:
- add Clerk auth flows and protected routes
- enforce company / org boundary on core queries and mutations
- add role-aware action gating on review and export surfaces
- tighten packet builder outputs around real close and support data

## 7) Broader decision intelligence
Status: intentionally deferred
Target outcome: once Green is trusted as the accounting decision system, expand into forecasting, recommendations, and higher-level operational insight.

What belongs here later:
- trend and anomaly detection across close periods
- cross-period 280E insight and margin explanations
- operational recommendations tied to trusted accounting facts
- management and investor reporting layers
- benchmarking once tenant-safe data strategy exists

Guardrail:
- do not prioritize broad intelligence surfaces ahead of persistent truth, review guidance, imports, trust, automation visibility, and CPA handoff leverage.

## Current implementation priorities
Priority 1:
- complete Defensible Decisions persistence and remove remaining demo-state dependencies

Priority 2:
- turn Guided Certainty into live readiness / review state logic

Priority 3:
- make Mess In -> Order Out a real persistent import pipeline

Priority 4:
- add Visible Trust history, packet lineage, and support traceability

Priority 5:
- implement Transparent Automation with run visibility and human review boundaries

Priority 6:
- unlock CPA Leverage with auth, tenancy, role-aware review, and stronger packet outputs

## Cross-cutting hardening required throughout
- broader browser QA pass across all routes
- tighten weak placeholder modules or hide them
- CI for lint, typecheck, and production build
- deployment-ready env setup
- README/docs refresh to match actual shipped flows
- controlled external demo / pilot walkthrough package

## Definition of a credible next milestone
Green is ready for the next serious implementation sprint when it can:
- persist core accounting truth end-to-end
- ingest messy source data into a reviewable pipeline
- compute close readiness from live records
- show visible history and support for key accounting decisions
- expose at least one real automation with inspectable results
- produce a CPA-facing handoff packet from persisted data
