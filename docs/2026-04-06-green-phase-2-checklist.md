# Tranquillo Green — Phase 2 Execution Checklist

Goal: Replace demo/local UI state with persisted Convex-backed truth for the accounting core.

Status key: [ ] not started  [~] in progress  [x] done

## 1) Core entities persisted (Convex)
- [x] cannabisCompanies persistence (schema + queries)
- [x] chartOfAccounts persistence (queries + upsert)
- [x] reportingPeriods persistence (queries + create/update)
- [x] transactions + transactionLines persistence
- [x] cashReconciliations persistence
- [x] seed script for CA demo org

## 2) App uses Convex for accounting pages
- [x] accounting workspace loader prefers Convex (fallback to demo)
- [x] reporting periods page loads from Convex-backed workspace
- [x] transactions page loads from Convex-backed workspace
- [x] reconciliation page loads from Convex-backed workspace
- [x] manual journal submissions persist when Convex configured
- [x] reporting period status changes persist when Convex configured
- [x] reconciliation actions persist when Convex configured

## 3) Seed + bootstrap workflow
- [x] Add server API route to run Convex seed from the app
- [x] Document local seed flow in README

## 4) Verification
- [ ] Convex seed runs and returns summary
- [ ] Accounting dashboard pulls seeded data
- [ ] Period status change persists across refresh
- [ ] Manual journal write persists to Convex
- [ ] Reconciliation action persists to Convex
