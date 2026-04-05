# Tranquillo Green Must-Have Before External Demo Checklist

Current recommendation:
- Safe for an informed demo with clear framing as a demo-backed MVP
- Not yet ready for unrestricted external user deployment

## Critical before external demo
- [ ] Remove or hide weak placeholder modules if they are not ready:
  - Inventory
  - Compliance
  - Settings
- [ ] Ensure all visible action buttons either work in demo state or are clearly labeled as demo-only
- [ ] Run browser QA across every top-level route and every detail route
- [ ] Validate no broken deep links remain
- [ ] Update README to reflect actual routes and product scope
- [ ] Prepare a clean demo seed story / demo tenant narrative
- [ ] Prepare a scripted walkthrough for operator, controller, and CPA audiences

## Critical before pilot / real users
- [ ] Persist accounting core in Convex
- [ ] Persist import jobs and transaction pipeline state
- [ ] Persist reporting periods and close state
- [ ] Persist reconciliations and detail actions
- [ ] Persist 280E overrides, reviewer actions, and export history
- [ ] Add Clerk auth and tenant boundaries
- [ ] Add protected routes and role-aware actions
- [ ] Add CI quality gates for lint/typecheck/build
- [ ] Document production env configuration

## Demo route checklist
- [ ] /
- [ ] /dashboard
- [ ] /dashboard/accounting
- [ ] /dashboard/accounting/close
- [ ] /dashboard/accounting/periods
- [ ] /dashboard/accounting/pipeline
- [ ] /dashboard/accounting/transactions
- [ ] /dashboard/accounting/imports
- [ ] /dashboard/allocations
- [ ] /dashboard/allocations/history
- [ ] /dashboard/allocations/support-schedule
- [ ] /dashboard/reconciliations
- [ ] /dashboard/reconciliations/[id]
- [ ] /dashboard/exports
- [ ] /dashboard/automation

## Demo narrative checkpoints
- [ ] Show data entering the system via imports
- [ ] Show review/post workflow via transaction pipeline
- [ ] Show detail review and approval on a transaction
- [ ] Show month-end close command center
- [ ] Show 280E allocation queue and override history
- [ ] Show support schedule / CPA-ready defensibility
- [ ] Show reconciliation workspace and detail drilldown
- [ ] Show packet builder and export/handoff story
- [ ] Show agent/automation concepts as future/live-ready workflow layer

## Known framing guidance
- State clearly that current workflows are demo-backed/static in parts
- Emphasize moat areas already shaped:
  - 280E review workflow
  - audit trail and override history
  - close orchestration
  - CPA packet assembly
- Avoid overselling automation as already live if it is still a static definition surface
