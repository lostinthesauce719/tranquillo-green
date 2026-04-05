# Tranquillo Green GitHub Backlog

This backlog translates the current remaining work into execution-ready issue themes.

## P0 — Turn demo shell into persistent accounting core
1. Persist accounting core in Convex
2. Build real import jobs and transaction promotion pipeline
3. Compute month-end close dashboard from live workflow state
4. Persist audit trail, override decisions, and packet generation history
5. Add Clerk auth and tenant-aware app shell

## P1 — Make the app externally demo/pilot credible
6. Harden deployment config and CI quality gates
7. Finish or hide shallow modules: Inventory, Compliance, Settings
8. Run full browser QA sweep and fix interaction gaps
9. Prepare README, demo seed story, and operator walkthrough

## P2 — Make automation real
10. Turn automation definitions into actual scheduled/triggered jobs or service stubs

## Suggested labels
- priority:p0
- priority:p1
- priority:p2
- area:accounting
- area:imports
- area:close
- area:auth
- area:qa
- area:automation
- type:feature
- type:hardening
- type:docs

## Suggested implementation order
- Issue 1 -> Issue 2 -> Issue 3 -> Issue 4 -> Issue 5 -> Issue 6 -> Issue 7 -> Issue 8 -> Issue 9 -> Issue 10
