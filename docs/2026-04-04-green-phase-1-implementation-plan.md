# Tranquillo Green Phase 1 Implementation Plan

> For Hermes: execute this plan task-by-task. Keep the initial build narrow and get a real accounting MVP live before ops or delivery expansion.

Goal: ship the first usable Tranquillo Green accounting/compliance MVP shell with the exact data model required for CA-first onboarding and month-end close workflows.

Architecture: separate Next.js 14 repo with static shell first, Convex schema second, auth/integrations third. Avoid hard dependency on Metrc approval or live external APIs for MVP v0.1.

Tech Stack: Next.js 14, React 18, Tailwind CSS, Convex, Clerk-ready auth path.

---

## Task order
1. scaffold repo and app shell
2. define cannabis schema
3. add accounting module IA
4. add 280E allocation module IA
5. add inventory/compliance/reconciliation/export shells
6. wire dummy dashboard metrics
7. add env example and docs
8. verify build passes

## Immediate implementation backlog
- Create Convex mutations/queries for cannabisCompanies, chartOfAccounts, reportingPeriods
- Seed CA dispensary demo data
- Build chart of accounts table view
- Build transaction import wizard with CSV mapping
- Build allocation policy CRUD
- Build cash reconciliation workflow
- Build filing calendar UI
- Add QBO export job model

## Acceptance criteria for Phase 1 scaffold
- repo exists and is pushed
- docs define exact schema and routes
- app shell contains all MVP top-level routes
- local build passes without requiring live Convex credentials
- schema file exists and matches documented MVP entities
