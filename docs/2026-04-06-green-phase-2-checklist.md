# Tranquillo Green Strategic Execution Checklist

Goal: translate the strategic roadmap into the next implementation sprints, in the right product order.

Status key: [ ] not started  [~] in progress  [x] done

## 1) Defensible Decisions
System of record must become real before deeper intelligence or automation work.

### Core persistence
- [x] cannabisCompanies persistence (schema + queries)
- [x] chartOfAccounts persistence (queries + upsert)
- [x] reportingPeriods persistence (queries + create/update)
- [x] transactions + transactionLines persistence
- [x] cashReconciliations persistence
- [x] seed script for CA demo org

### App adoption of persisted truth
- [x] accounting workspace loader prefers Convex (fallback to demo)
- [x] reporting periods page loads from Convex-backed workspace
- [x] transactions page loads from Convex-backed workspace
- [x] reconciliation page loads from Convex-backed workspace
- [x] manual journal submissions persist when Convex configured
- [x] reporting period status changes persist when Convex configured
- [x] reconciliation actions persist when Convex configured
- [ ] remove remaining primary accounting dependencies on demo constants
- [ ] add actor / timestamp / reason metadata to material review and override actions
- [ ] verify seeded demo org covers accounting, close, and export flows end-to-end

## 2) Guided Certainty
Turn screens into guided accounting review instead of passive views.

- [ ] compute close dashboard readiness from persisted workflow state
- [ ] define canonical review states for imports, reconciliations, close tasks, and 280E items
- [ ] generate blocker / exception summaries from live data
- [ ] persist reviewer decisions, override reasons, and signoff history
- [ ] connect dashboard, queue, detail, and close views into one review path

## 3) Mess In -> Order Out imports
Make imports operational rather than illustrative.

- [ ] add importJob persistence model
- [ ] persist source file metadata
- [ ] persist mapping profiles
- [ ] persist row-level validation results
- [ ] build exception review queue from stored records
- [ ] promote imported rows into transactions with lineage preserved
- [ ] implement posting state transitions: imported -> needs review -> ready -> posted
- [ ] support reopening import jobs without losing state history

## 4) Visible Trust
Make support, history, and provenance explicit.

- [ ] persist support evidence metadata / attachments registry
- [ ] persist packet generation history
- [ ] persist export bundle records
- [ ] persist close signoff actions and history
- [ ] tie support schedules to persisted source records
- [ ] expose audit timeline for overrides and reviewer actions in key detail views

## 5) Transparent Automation
Only automate where the run history and human boundary are visible.

- [ ] turn automation definitions into real scheduled / triggered jobs or service stubs
- [ ] create automation run history model
- [ ] show what each automation touched, suggested, or changed
- [ ] route automation outputs into review queues instead of hidden writes
- [ ] document operator override and failure-handling workflow

## 6) CPA Leverage
Strengthen handoff, reviewer experience, and external trust.

- [ ] strengthen CPA export center on persisted records
- [ ] make packet builder output period-close support from live data
- [ ] add Clerk auth flows
- [ ] add company / org boundary in app shell
- [ ] add role-aware views (owner, accountant, controller, CPA reviewer)
- [ ] add protected routes
- [ ] seed multi-tenant demo story
- [ ] verify tenant isolation on core accounting and export flows

## 7) Broader decision intelligence
Explicitly later, after the accounting trust foundation is real.

- [ ] define post-foundation intelligence roadmap (forecasting, anomaly detection, recommendations)
- [ ] avoid committing sprint capacity here until sections 1-6 are materially complete

## Verification steps for the current foundation
Local steps (run on your machine where Convex CLI can authenticate):
1) `npx convex dev`
2) `npm run dev`
3) `curl -X POST http://localhost:3000/api/accounting/seed -H "Content-Type: application/json" -d "{}"`
4) Visit `/dashboard/accounting` and confirm it shows persisted Convex-backed data
5) Toggle a reporting period status, submit a manual journal, and log a reconciliation note; refresh to confirm persistence
6) Inspect close, import, and export surfaces to identify any remaining demo-state dependencies

Verification checklist:
- [ ] Convex seed runs and returns summary
- [ ] Accounting dashboard pulls seeded data
- [ ] Period status change persists across refresh
- [ ] Manual journal write persists to Convex
- [ ] Reconciliation action persists to Convex
- [ ] Remaining demo-state gaps are identified and tracked
