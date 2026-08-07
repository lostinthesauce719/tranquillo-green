---
title: Tranquillo Green — Status
project: tranquillo-green
type: project-status
status: shipped
completion: 98
updated: 2026-08-07
repo: https://github.com/lostinthesauce719/tranquillo-green
merged_prs:
  - https://github.com/lostinthesauce719/tranquillo-green/pull/15
  - https://github.com/lostinthesauce719/tranquillo-green/pull/16
tags:
  - tranquillo-green
  - cannabis-accounting
  - 280e
  - project/status
---

# Tranquillo Green — Status

> [!summary] Overall completion: **~98%** — shipped and merged to `main`
> Every dashboard module runs on persisted Convex data; no surface ships hardcoded demo figures, including the three financial statements. Both completion PRs are merged (#15 as `77bfaf6`, #16 as `9d5f7d3`). The leaked Clerk key is rotated and the schema is deployed to prod (`intent-condor-492`). What remains is operator action — configure the backup bucket, run the restore drill, promote CSP — plus optional enhancement work.

> [!warning] Three things need a human, not more code
> 1. **Backup bucket is not configured.** The nightly job is code that never runs until `BACKUP_SECRET` and `BACKUP_S3_*` are set.
> 2. **The restore drill has never run against live Convex.** Recovery is designed-and-tested, not proven.
> 3. **CSP is Report-Only.** It reports violations but blocks nothing until `CSP_MODE=enforce`.

## Completion by workstream

| Workstream | Apr 2026 baseline | Now | Notes |
| --- | --- | --- | --- |
| Workflow shell & demo UX | 85% | 98% | Folio design system, guided tour, sandbox auto-provision |
| 280E domain framing | 75–80% | 92% | Allocations, 471(c), support schedules, labor allocation, CPA packets |
| Persisted system of record | 25% | 95% | All modules Convex-backed; 8 new tables across the completion pass |
| Operational trust & auditability | 20% | 92% | Audit trail w/ actor+timestamp+reason, variance resolution notes, packet history |
| Deployable multi-user readiness | 15–20% | 92% | Clerk auth, tenancy, role gating, multi-operation switching, CI, cross-tenant hardening, backups, restore path |

## Roadmap pillars

- [x] 1. Defensible Decisions — persisted accounting truth
- [x] 2. Guided Certainty — live close readiness & review queues
- [x] 3. Mess In → Order Out — persistent import pipeline with lineage
- [x] 4. Visible Trust — audit trails, packet history, evidence
- [x] 5. Transparent Automation — run history & review boundaries
- [x] 6. CPA Leverage — auth, tenancy, role-aware exports, **CPA client portal**
- [ ] 7. Decision Intelligence — *intentionally deferred per roadmap guardrail*

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

Convex tables added: `employees` · `notificationStates` · `campaigns` · `contentItems` · `cpaClientLinks` · `metrcPackages` · `userCompanyLinks` · `rateLimits`

Plus `convex/financialStatements.ts`, which computes the statements from the ledger without a new table.

## Critical bugs found and fixed

1. **18 Convex functions broken at runtime** — two-arg call form unsupported by `authQuery`/`authMutation`, including `getOrCreateUser` / `getCurrentTenant`, called by the dashboard layout on every load and by the signup→sandbox funnel.
2. **Cross-tenant access gaps** — wrappers checked authentication but not company membership; now enforced via `requireCompanyAccessById`.
3. **Security headers never reached browser pages** — `securityHeaders()` was only called from API routes, so every HTML document shipped with no CSP, no clickjacking protection, no nosniff.
4. **CORS reflected any origin** the caller sent, falling back to `*`.
5. **Production build broken** — duplicate CommonJS `postcss.config.js` under `"type": "module"`.
6. **Leaked Clerk secret key** in README on a public repo — removed and **rotated 2026-08-05**, so the copy in git history is inert.
7. **Financial statements were hardcoded** — P&L, trial balance, and balance sheet displayed fabricated figures rather than the company's ledger.
8. **Fabricated testimonials** on the landing page, attributed to named people at named companies (one a real operator) with invented dollar figures.
9. **Unimplemented compliance claims** — the audit log promised 7-year retention and cryptographic chaining; neither existed.
10. **Rate limiting was per-instance** and reset on cold start, so on serverless an attacker spreading requests got a multiple of the intended quota.
11. **The free sandbox was orphaned** — unlinked from the landing page, while the primary CTA led to a demo flow that required a credit card to book a sales call.

## Infrastructure added

- **Off-site backups** — nightly NDJSON snapshot of all 45 tables to storage you own, integration credentials redacted, with a verifier (`npm run backup:verify`).
- **Restore path** — `npm run backup:restore` (dry-run by default, refuses source-as-target, populated targets, and unresolvable references) and `npm run backup:export` (CLI export, no web app needed).
- **One-command drill** — `npm run drill` deploys to a throwaway deployment, restores a synthetic fixture, exports it back, and compares graphs. `npm run backup:compare` proves isomorphism since ids legitimately change.
- **Swappable billing** — `BillingProvider` interface; `invoice` (default, no card rail) and `stripe`. Changing processors is one file.
- **Durable rate limiting** — Convex-backed, transactional, shared across serverless instances.
- **CI** — lint → typecheck → test → build, with `concurrency` so superseded runs cancel instead of starving the queue.
- **Docs** — `docs/security-and-vendors.md` (runbook) and `docs/vendor-compliance-tracker.md` (subprocessors, DPAs, SOC 2, commitments).

## Verified quality gates

- `npm run lint` — clean
- `npx tsc --noEmit` — clean (exit 0)
- `npm test` — 16/16
- `npm run build` — 138/138 pages

> [!note] On CI
> The repo's GitHub Actions queue has been unreliable — runs sit ~15 minutes without a runner and get cancelled, which surfaces as "failure". Both merges were made on full local verification of the exact merge tree. Worth checking whether the account is out of Actions minutes.

## Open items

**Operator action (blocking real use):**
- [ ] Configure the backup bucket — `BACKUP_SECRET` on both Convex and Vercel, plus `BACKUP_S3_*`. Until then no snapshot is ever taken.
- [ ] Run `npm run drill` against a throwaway deployment. Record the date in `docs/security-and-vendors.md` — it currently reads `Last successful live drill: never`.
- [ ] Promote CSP to enforcing (`CSP_MODE=enforce`) after watching real Clerk traffic in report-only.
- [ ] Revoke the two drill deploy keys pasted in chat on 2026-08-07 and delete the `different-salamander-133` project.

**Before real customer data:**
- [ ] Vendor DPAs and SOC 2 verification — `docs/vendor-compliance-tracker.md`
- [ ] Decide a backup retention window (bucket lifecycle expiry) so deletion requests can be honored
- [ ] Confirm in writing whether Stripe will underwrite cannabis-adjacent SaaS; billing defaults to invoice/ACH until then

**Enhancement:**
- [ ] External API sync: Metrc package pull, ad-platform metrics (manual entry works today)
- [ ] Email invitations for team members (Clerk invitation API)
- [ ] Tamper-evident audit trail (hash chaining) if a customer requires it
- [ ] Pillar 7 (forecasting / anomaly detection) once the foundation is proven with pilots

**Done:**
- [x] ~~Rotate the leaked Clerk key~~ — 2026-08-05
- [x] ~~Deploy schema + functions to prod~~ — 2026-08-05
- [x] ~~Close superseded PRs #11, #12, #13~~ — 2026-08-06
- [x] ~~Production ops: durable rate limiting, security headers on HTML, CORS allowlist~~
- [x] ~~Remove Clerk issuer fallback in `convex/auth.config.ts`~~
