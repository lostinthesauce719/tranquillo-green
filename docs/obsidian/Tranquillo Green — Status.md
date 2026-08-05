---
title: Tranquillo Green — Status
project: tranquillo-green
type: project-status
status: complete
completion: 85
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

> [!summary] Overall completion: **~85%**
> Core product is finished and verified: authenticated tenant-aware app, Convex-backed accounting system of record, guided close, import pipeline, CPA exports, security hardening, and green quality gates (lint / typecheck / tests / build / CI). Remaining distance to 100% is peripheral-module depth and production-ops polish, plus one manual action: **rotate the Clerk secret key**.

## Completion by workstream

| Workstream | Apr 2026 baseline | Now | Notes |
| --- | --- | --- | --- |
| Workflow shell & demo UX | 85% | 95% | Folio design system, guided tour, sandbox auto-provision |
| 280E domain framing | 75–80% | 90% | Allocations, 471(c), support schedules, CPA packet story |
| Persisted system of record | 25% | 85% | Convex-first loaders with demo fallback; companies, CoA, periods, transactions, reconciliations, imports, exports all persisted |
| Operational trust & auditability | 20% | 80% | Audit trail w/ actor+timestamp+reason, export packet history, evidence badges |
| Deployable multi-user readiness | 15–20% | 80% | Clerk auth, tenancy, role gating, security remediations, CI added 2026-08-05 |

## Roadmap pillars (docs/2026-04-04-green-phased-execution-roadmap.md)

- [x] 1. Defensible Decisions — persisted accounting truth
- [x] 2. Guided Certainty — live close readiness & review queues
- [x] 3. Mess In → Order Out — persistent import pipeline with lineage
- [x] 4. Visible Trust — audit trails, packet history, evidence
- [x] 5. Transparent Automation — run history & review boundaries
- [x] 6. CPA Leverage — auth, tenancy, role-aware exports
- [ ] 7. Decision Intelligence — *intentionally deferred per roadmap guardrail*

## What shipped in the final pass (2026-08-05, PR #15)

- Removed a **real Clerk secret key committed in README** (public repo)
- Fixed broken production build (duplicate CommonJS `postcss.config.js` under `"type": "module"`)
- ESLint fully clean (fixed both `exhaustive-deps` warnings)
- Real `SECURITY.md` policy replacing GitHub template boilerplate
- README/status docs refreshed to match shipped state
- Added GitHub Actions CI (lint → typecheck → test → build), closing backlog item 20

## Verified quality gates

- `npm run lint` — clean
- `npx tsc --noEmit` — clean
- `npm test` — pass
- `npm run build` — 128/128 pages

## Open items to 100%

- [ ] **Rotate the leaked Clerk `sk_test_…` key** (still in git history) — manual, Clerk dashboard
- [ ] Close superseded PRs #11, #12, #13
- [ ] Deepen or hide demo-driven peripheral modules: campaigns, content, payroll, compliance client, CPA portal
- [ ] Production ops: Redis-backed rate limiting, tightened CSP, remove Clerk issuer fallback in `convex/auth.config.ts`
- [ ] Pillar 7 (forecasting / anomaly detection) when foundation is proven with pilots
