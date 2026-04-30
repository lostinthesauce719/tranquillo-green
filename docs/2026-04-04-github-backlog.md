# Tranquillo Green GitHub Backlog

This backlog translates the strategic roadmap into execution-ready issue themes and epics.

## P0 — Defensible Decisions
1. Finish Convex-backed system of record for accounting truth
2. Remove remaining demo-state dependencies from accounting-critical workflows
3. Add actor / timestamp / reason metadata for material accounting decisions
4. Verify seeded demo org supports accounting, close, and export flows end-to-end

## P0 — Guided Certainty
5. Compute close readiness and review queues from live workflow state
6. Persist reviewer decisions, overrides, and signoff history
7. Surface blockers, exceptions, and next-best actions across dashboards and detail views

## P0 — Mess In -> Order Out imports
8. Persist import jobs, source file metadata, and mapping profiles
9. Persist validation results and exception review workflow
10. Promote imported rows into transactions with posting-state transitions and lineage

## P1 — Visible Trust
11. Persist support evidence registry and source-to-schedule traceability
12. Persist packet generation history and export bundle records
13. Add audit timelines to close, transaction, and export detail views

## P1 — Transparent Automation
14. Turn automation definitions into real scheduled / triggered jobs or service stubs
15. Add automation run history, operator visibility, and review boundaries

## P1 — CPA Leverage
16. Strengthen CPA export center and packet builder on persisted data
17. Add Clerk auth, protected routes, and tenant-aware app shell
18. Add role-aware review / export permissions and multi-tenant demo story

## P2 — Broader decision intelligence
19. Define post-foundation intelligence roadmap: forecasting, anomaly detection, recommendations

## P2 — Product hardening that supports every strategic pillar
20. Harden deployment config and CI quality gates
21. Finish or hide shallow modules: Inventory, Compliance, Settings
22. Run full browser QA sweep and fix interaction gaps
23. Refresh README, roadmap docs, and operator walkthrough

## Suggested labels
Priority:
- priority:p0
- priority:p1
- priority:p2

Strategic pillar:
- pillar:defensible-decisions
- pillar:guided-certainty
- pillar:mess-in-order-out
- pillar:visible-trust
- pillar:transparent-automation
- pillar:cpa-leverage
- pillar:decision-intelligence

Functional area:
- area:accounting
- area:imports
- area:close
- area:exports
- area:auth
- area:automation
- area:qa
- area:docs

Work type:
- type:feature
- type:hardening
- type:docs
- type:infra

## Suggested implementation order
- 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17 -> 18 -> 20 -> 21 -> 22 -> 23 -> 19

Note: item 19 stays intentionally late unless earlier pillars are already materially complete.
