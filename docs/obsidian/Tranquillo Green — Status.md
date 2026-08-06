---
title: Tranquillo Green — Status
project: tranquillo-green
type: project-status
status: complete
completion: 95
updated: 2026-08-05
repo: https://github.com/lostinthesauce719/tranquillo-green
pr: https://github.com/lostinthesauce719/tranquillo-green/pull/15
tags:
  - tranquillo-green
  - cannabis-accounting
  - 280e
  - project/status
---

# Tranquillo Green — Status

> [!summary] Overall completion: **~95%**
> Every dashboard module now runs on persisted Convex data — no surface ships hardcoded demo data. Core accounting, compliance, payroll, imports, close, exports, notifications, campaigns, content, CPA portal, Metrc reconciliation, and multi-operation management are all live. The leaked Clerk key has been rotated. Remaining work is external API integrations (Metrc/ad-platform auto-sync), email invitations, and production ops hardening; the only deploy step left is pushing the new Convex schema.

## Completion by workstream

| Workstream | Apr 2026 baseline | Now | Notes |
| --- | --- | --- | --- |
| Workflow shell & demo UX | 85% | 98% | Folio design system, guided tour, sandbox auto-provision |
| 280E domain framing | 75–80% | 92% | Allocations, 471(c), support schedules, labor allocation, CPA packets |
| Persisted system of record | 25% | 95% | All modules Convex-backed; 7 new tables in the final pass |
| Operational trust & auditability | 20% | 92% | Audit trail w/ actor+timestamp+reason, variance resolution notes, packet history |
| Deployable multi-user readiness | 15–20% | 90% | Clerk auth, tenancy, role gating, multi-operation switching, CI, cross-tenant hardening |

## Roadmap pillars (docs/2026-04-04-green-phased-execution-roadmap.md)

- [x] 1. Defensible Decisions — persisted accounting truth
- [x] 2. Guided Certainty — live close readiness & review queues
- [x] 3. Mess In → Order Out — persistent import pipeline with lineage
- [x] 4. Visible Trust — audit trails, packet history, evidence
- [x] 5. Transparent Automation — run history & review boundaries
- [x] 6. CPA Leverage — auth, tenancy, role-aware exports, **CPA client portal**
- [ ] 7. Decision Intelligence — *intentionally deferred per roadmap guardrail*

## Convex tables added in the completion pass

`employees` · `notificationStates` · `campaigns` · `contentItems` · `cpaClientLinks` · `metrcPackages` · `userCompanyLinks`

Plus `convex/financialStatements.ts`, which computes the three financial statements from the ledger (no new table — it aggregates existing `transactions`, `transactionLines`, and `chartOfAccounts`).

## Modules moved from demo → live

| Module | What's real now |
| --- | --- |
| Compliance | Alerts, licenses, filings; alert generation; persisted resolve |
| Payroll | Employee roster + 280E plant-touching allocation persistence |
| Team settings | Real member roster, owner-gated role changes and removal |
| Audit log | Live event stream with filters |
| Notifications | Feed composed from alerts + audit events, per-user read/dismiss |
| Campaigns | Full CRUD, status transitions, metrics, computed CTR / cost-per-lead |
| Content engine | Full CRUD, draft → scheduled → published planner |
| CPA portal | Email-keyed client links, live alert/period stats per client |
| Metrc reconciliation | Package variance computation, book correction, resolve-with-audit-note |
| Multi-operation | Create company (seeds CoA), switch active tenant |
| **P&L / Trial Balance / Balance Sheet** | **Computed from posted transaction lines against the chart of accounts, with 280E add-back view and CSV export** |

## Critical bugs found and fixed

1. **18 Convex functions broken at runtime** — two-arg call form unsupported by `authQuery`/`authMutation`, including `getOrCreateUser` / `getCurrentTenant` used by the dashboard layout on every load.
2. **Cross-tenant access gaps** — auth wrappers checked authentication but not company membership; now enforced everywhere via `requireCompanyAccessById`.
3. **Production build broken** — duplicate CommonJS `postcss.config.js` under `"type": "module"`.
4. **Leaked Clerk secret key** in README on a public repo — removed from the README and **rotated in the Clerk dashboard on 2026-08-05**, so the string remaining in git history is inert.
5. **Financial statements were hardcoded** — the P&L, trial balance, and balance sheet displayed fabricated figures rather than the company's own ledger.

## Verified quality gates

- `npm run lint` — clean
- `npx tsc --noEmit` — clean
- `npm test` — pass
- `npm run build` — 138/138 pages
- GitHub Actions CI added (lint → typecheck → test → build)

## Open items to 100%

- [x] ~~Rotate the leaked Clerk `sk_test_…` key~~ — done 2026-08-05; old key revoked, `.env.local` updated
- [ ] Run `npx convex deploy` to push the new schema + functions
- [ ] Close superseded PRs #11, #12, #13
- [ ] External API sync: Metrc package pull, ad-platform metric pull (manual entry works today)
- [ ] Email invitations for team members (Clerk invitation API)
- [ ] Production ops: Redis-backed rate limiting, tightened CSP, remove Clerk issuer fallback in `convex/auth.config.ts`
- [ ] Pillar 7 (forecasting / anomaly detection) when foundation is proven with pilots
