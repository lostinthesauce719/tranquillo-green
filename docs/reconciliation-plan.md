# Codebase Reconciliation Plan — Local ↔ GitHub

**Date:** August 9, 2026
**Status:** Proposed — nothing executes until approved.

## The situation

Two lines of development diverged and both "completed" the app down different paths:

- **Local** (`C:\Users\justa\Desktop\tranquillo-green`, HEAD `605fa4f`) — 40 commits GitHub doesn't have.
- **GitHub / `origin/main`** (`lostinthesauce719/tranquillo-green`, HEAD `2ffdc16`) — 30 commits local doesn't have. **This is what Vercel builds and deploys.**

They share an old common ancestor; since then **424 files differ**, ~230 of them edited on *both* sides (real conflicts, not clean ports).

**Production is currently mismatched:** Vercel serves GitHub's frontend, but `intent-condor-492` (the Convex backend) runs *local's* code, because that's what was deployed during consolidation. Unifying the two is what fixes this for good.

## What each side owns

### Local — keep as the correctness base
- The **227-test suite** (`convex/__tests__/*`) — GitHub has none.
- Deep 280E/security hardening in the shared core: `convex/lib/withAuth.ts` (~300 lines more), `allocationEngine.ts` (~400 lines more), and `convex/lib/` modules GitHub lacks entirely: `money.ts`, `acknowledgement.ts`, `reclassificationBasis.ts`, `taxConstants.ts`.
- Cross-tenant isolation sweeps, by-ID scoping, 471(c) measured-basis work, unwired-button fixes.
- Today's infra: single-instance consolidation, pricing sync, CO lighthouse shortlist, email setup docs.

### GitHub — port its net-new capabilities in
**Brand-new files (~31, add cleanly — low conflict risk):**
- Convex modules: `backup.ts`, `restore.ts`, `financialStatements.ts`, `cpaPortal.ts`, `metrcReconciliation.ts`, `notifications.ts`, `campaigns.ts`, `contentItems.ts`, `employees.ts`, `operations.ts`, `rateLimits.ts`
- API routes: `billing/checkout`, `billing/webhook`, `backup`, `accounting/reports`, `metrc/packages`, `notifications`, `campaigns`, `compliance`, `content`, `cpa-portal`, `payroll/employees`, `settings/operations`, `settings/team`
- Dashboard pages: `campaigns`, `content`, `cpa-portal`; components: `allocation-review-queue`, `cogs-review`
- Ops scripts: `backup-export`, `backup-preflight`, `compare-snapshots`, `drill-fixture`, `restore-backup`, `run-drill.sh`, `verify-backup`
- `.github/workflows/ci.yml`; docs: `security-and-vendors.md`, `vendor-compliance-tracker.md`

**Capabilities from GitHub commits worth keeping:** P&L / trial balance / balance sheet from posted transactions; billing made swappable (invoice/ACH default); CSP headers + CORS restriction + durable rate limiting; scheduled off-site backup with verification + restore drills; live notifications, campaigns, content engine; compliance/payroll/team wired to Convex; CI workflow.

**Overlap to watch:** GitHub also did Clerk/Convex deploy hardening (`require CLERK_JWT_ISSUER_DOMAIN with no stale fallback`, key rotation, removing a leaked key from README). Some of this duplicates local's intent — reconcile, don't double-apply.

## Conflict zones (need per-file judgment)
- `src/app` (98 both-edited), `src/components` (80), `src/lib` (52): shared shells, nav, dashboard layout, UI. GitHub edited many to wire in its new modules; local edited many for 280E wiring. **Default to local; layer in GitHub's edits only where they register its new routes/nav.**
- Shared Convex core edited on both: `convex/lib/*`, `convex/seed/*`, `allocationPolicies.ts`. **Local wins** (it's the tested version); re-apply any GitHub logic that its new modules depend on.
- Config: `package.json`, `next.config.mjs`, `middleware.ts`, `tsconfig.json`, `tailwind.config.ts`. Merge dependency lists; take GitHub's CSP/rate-limit middleware additions on top of local's auth middleware.

## Strategy — local base, feature-port GitHub, verify by tests
1. **Back up GitHub first.** Tag `origin/main` as `pre-reconcile-github` and push the tag, so all 30 GitHub commits stay recoverable. Nothing is ever lost.
2. **Branch from local** (`reconcile/unify`). All work happens here; `main` untouched until verified.
3. **Port additive files** (the ~31 new files above) onto the branch. These carry most of GitHub's breadth with minimal conflict.
4. **Resolve the shared-core conflicts** deliberately, local-wins on the tested security modules, layering GitHub's new-module wiring into the frontend shells/nav.
5. **Add the missing `sso-callback` route** to fix the Google-signup 404 (create `src/app/(auth)/auth/sso-callback/page.tsx` rendering Clerk's `AuthenticateWithRedirectCallback`, or convert `/auth` to a path-routed catch-all).
6. **Gate on green:** `npm run typecheck`, the 227-test suite, and `npm run build` must all pass before anything ships.
7. **Deploy backend + frontend together** from the unified branch: `npx convex deploy` to `intent-condor-492`, then fast-forward `main` and let Vercel rebuild. Verify with a real signup (incl. Google) and the walkthroughs.

## Rollback
- GitHub history preserved at tag `pre-reconcile-github`.
- Local history preserved at tag `pre-reconcile-local`.
- Vercel keeps prior deployments — one-click rollback if the unified build misbehaves.
- Convex snapshot export taken before redeploy.

## What needs your judgment during execution
The ~230 shared-file conflicts can't all be resolved mechanically. Where GitHub and local both rewrote the same dashboard page or shell with different intent, I'll surface the specific choice rather than guess. Expect a handful of "which version of this screen do you want" decisions.

## Effort & risk
This is a multi-step engineering merge, not a quick port. Additive parts are low-risk; the shared frontend/core conflicts are the real work and the main risk. The test suite is the safety net that makes it tractable — if the 227 tests stay green through the merge, the tested backend contract is preserved.
