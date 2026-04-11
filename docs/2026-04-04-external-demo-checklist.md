# Tranquillo Green Demo Checklist — Updated

## Critical before external demo
- [x] Remove or hide weak placeholder modules if they are not ready
  - Inventory: hardened with metric cards, batch table, movements
  - Compliance: hardened with license cards, filing calendar, alerts
  - Settings: hardened with company profile, locations, user info, integrations
- [x] Ensure all visible action buttons either work in demo state or are clearly labeled as demo-only
- [x] Run browser QA across every top-level route and every detail route
- [x] Validate no broken deep links remain
- [x] Update README to reflect actual routes and product scope
- [x] Prepare a clean demo seed story / demo tenant narrative
- [x] Prepare a scripted walkthrough for operator, controller, and CPA audiences

## Critical before pilot / real users
- [x] Persist accounting core in Convex
- [x] Persist import jobs and transaction pipeline state
- [x] Persist reporting periods and close state
- [x] Persist reconciliations and detail actions
- [x] Persist 280E overrides, reviewer actions, and export history
- [x] Add Clerk auth and tenant boundaries
- [x] Add protected routes and role-aware actions
- [x] Add CI quality gates for lint/typecheck/build
- [x] Document production env configuration

## Demo route checklist
- [x] /
- [x] /dashboard
- [x] /dashboard/accounting
- [x] /dashboard/accounting/close
- [x] /dashboard/accounting/periods
- [x] /dashboard/accounting/pipeline
- [x] /dashboard/accounting/transactions
- [x] /dashboard/accounting/imports
- [x] /dashboard/allocations
- [x] /dashboard/allocations/history
- [x] /dashboard/allocations/support-schedule
- [x] /dashboard/reconciliations
- [x] /dashboard/reconciliations/[id]
- [x] /dashboard/exports
- [x] /dashboard/automation
- [x] /dashboard/inventory
- [x] /dashboard/compliance
- [x] /dashboard/settings

## Demo narrative checkpoints
- [x] Show data entering the system via imports
- [x] Show review/post workflow via transaction pipeline
- [x] Show detail review and approval on a transaction
- [x] Show month-end close command center
- [x] Show 280E allocation queue and override history
- [x] Show support schedule / CPA-ready defensibility
- [x] Show reconciliation workspace and detail drilldown
- [x] Show packet builder and export/handoff story
- [x] Show agent/automation concepts as future/live-ready workflow layer

## Known framing guidance
- State clearly that current workflows are demo-backed/static in parts
- Emphasize moat areas already shaped:
  - 280E review workflow with allocation basis and override history
  - Audit trail with actor/reason/evidence on every decision
  - Close orchestration computed from live workflow state
  - CPA packet assembly with generation history
- Avoid overselling automation as already live — it's a static definition surface
