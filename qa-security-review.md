# Security Review — Tranquillo Green

**Date:** 2026-04-14
**Reviewer:** Automated Security Review (Hermes Agent)
**Scope:** Live demo deployment readiness — API route auth, Convex function validation, env var leaks, input validation, CORS config, hardcoded secrets, XSS, privilege escalation

---

## Executive Summary

The codebase has a solid security foundation with Clerk authentication, security headers, and Convex value validators. However, **several critical vulnerabilities must be fixed before live deployment**, particularly around Convex function authorization and company-level access control.

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH     | 4 |
| MEDIUM   | 3 |
| LOW      | 2 |
| INFO     | 2 |

---

## CRITICAL Findings

### C1: Convex `cannabisCompanies.list` exposes ALL companies to any caller
**File:** `convex/cannabisCompanies.ts:4-9`
**Impact:** Data leakage — any authenticated (or unauthenticated) user can enumerate every company in the system.

```typescript
export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cannabisCompanies").collect(); // NO AUTH CHECK
  },
});
```

**Fix:** Either wrap with `authQuery` or remove the function entirely. If listing is needed, scope it to the authenticated user's company.

---

### C2: Convex `integrationConfigs.getQBOTokens` exposes OAuth tokens without authorization
**File:** `convex/integrationConfigs.ts:79-98`
**Impact:** Credential theft — anyone who knows a `companyId` can retrieve the full QuickBooks OAuth access token and refresh token.

```typescript
export const getQBOTokens = queryGeneric({
  args: { companyId: v.id("cannabisCompanies") },
  handler: async (ctx, args) => {
    // NO AUTH CHECK — returns tokens to any caller
    return {
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      ...
    };
  },
});
```

**Fix:** This query must require authentication AND verify the caller belongs to the specified company. Better: make it server-only (internal mutation/action) and never expose tokens via a public query.

---

### C3: QBO Callback route has NO authentication
**File:** `src/app/api/integrations/quickbooks/callback/route.ts:11`
**Impact:** The OAuth callback endpoint is unprotected. While OAuth callbacks typically receive redirects from the provider, this route:
- Is NOT in the middleware's `isProtectedRoute` list
- Decodes a `state` parameter and directly calls Convex mutations to store tokens
- Does not verify the authenticated user owns the company in the state parameter

An attacker could craft a callback URL with a malicious `state` to link their QBO account to a victim's company, or overwrite tokens.

**Fix:** Add session validation and verify the user owns `companyId` from the state before storing tokens. Add CSRF protection to the state parameter.

---

## HIGH Findings

### H1: `settings/company` API route lacks company ownership verification
**File:** `src/app/api/settings/company/route.ts:6-42`
**Impact:** Privilege escalation — any authenticated user can update ANY company by passing a different `companyId` in the request body.

The route uses `withAuth` (verifies user is logged in) but never checks that `auth.userId` owns the company being modified.

**Fix:** Before calling `client.mutation`, verify the authenticated user belongs to the requested `companyId`.

---

### H2: `settings/locations` API routes lack company ownership verification
**File:** `src/app/api/settings/locations/route.ts:6-80`
**Impact:** Same as H1 — GET, POST, and DELETE operations accept `companyId` or `locationId` without verifying the user has access to that company.

**Fix:** Verify user-company ownership before delegating to Convex mutations.

---

### H3: Convex `cannabisCompanies.updateStatus` has no authorization
**File:** `convex/cannabisCompanies.ts:53-65`
**Impact:** Any caller can change any company's status (onboarding/active/inactive), potentially deactivating competitors or reactivating suspended accounts.

**Fix:** Wrap with `authMutation` and verify the caller is an owner/controller of the target company.

---

### H4: Convex `companies.updateCompany` has no authorization
**File:** `convex/companies.ts:4-77`
**Impact:** Any caller can modify any company's operator type, accounting method, or state.

**Fix:** Wrap with `authMutation` and verify company ownership.

---

## MEDIUM Findings

### M1: CORS allows any origin via wildcard fallback
**File:** `src/lib/api-helpers.ts:64-81`
**Impact:** The `corsHeaders` function sets `Access-Control-Allow-Origin` to the request's Origin if provided, otherwise `*`. In production, this allows any website to make cross-origin requests to your API.

```typescript
response.headers.set("Access-Control-Allow-Origin", origin ?? "*");
```

**Fix:** For demo deployment, restrict CORS to your actual domain(s). Consider an allowlist.

---

### M2: Convex `cannabisCompanies.create` has no authorization
**File:** `convex/cannabisCompanies.ts:23-51`
**Impact:** Any caller can create companies. While the onboarding route checks auth, the Convex mutation itself is unprotected — a direct Convex client call could bypass it.

**Fix:** Wrap with `authMutation`.

---

### M3: Convex location mutations lack authorization
**File:** `convex/locations.ts:16-125`
**Impact:** `addLocation`, `updateLocation`, and `deleteLocation` accept a `companyId` or `locationId` but don't verify the caller belongs to that company.

**Fix:** Wrap with `authMutation` and verify company access.

---

## LOW Findings

### L1: `auth.config.ts` has a hardcoded Clerk issuer domain as fallback
**File:** `convex/auth.config.ts:1-12`
**Impact:** The fallback `https://grand-wallaby-27.clerk.accounts.dev` is a specific Clerk instance. If `CLERK_JWT_ISSUER_DOMAIN` is not set in production, Convex will validate tokens against this potentially stale domain.

**Fix:** Make the env var required or use a clearly invalid placeholder that forces configuration.

---

### L2: CSP allows `unsafe-inline` and `unsafe-eval`
**File:** `src/lib/api-helpers.ts:47-56`
**Impact:** The Content-Security-Policy header includes `'unsafe-inline' 'unsafe-eval'` for scripts, which weakens XSS protection. Required for Clerk's embedded components and Next.js dev mode, but should be tightened for production.

**Fix:** For production, consider nonce-based CSP if Clerk supports it, or at minimum document this as an accepted tradeoff.

---

## INFO Findings

### I1: Rate limiter is in-memory (not shared across instances)
**File:** `src/lib/api-helpers.ts:86-128`
**Impact:** The in-memory rate limiter won't work across multiple server instances. Acceptable for a single-instance demo.

**Fix:** For production, use Redis-backed rate limiting.

---

### I2: `.env.local.example` shows safe placeholder values
**File:** `.env.local.example`
**Status:** Good — the example file uses placeholder values (`pk_test_your_publishable_key_here`, `***`) and `.gitignore` excludes `.env*` files.

---

## Positive Security Observations

1. **Server-only env module:** `src/lib/env.ts` imports `server-only`, preventing accidental client exposure of server secrets.

2. **Security headers are applied:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and CSP are all set.

3. **Convex value validators:** Schema and mutations use `v.string()`, `v.id()`, `v.number()`, etc., providing type-safe input validation at the database layer.

4. **Date validation:** `ensureIsoDate()` in `convex/transactions.ts` validates date format with regex.

5. **Amount validation:** Manual journal entries validate balancing (debits == credits), positive amounts, and that accounts belong to the same company.

6. **No XSS vectors found:** No use of `dangerouslySetInnerHTML` or `innerHTML` in the React components.

7. **No hardcoded secrets:** No API keys, passwords, or tokens found committed to the codebase.

8. **Audit trail:** Financial mutations create audit trail records with before/after state.

9. **QBO token status query is safe:** `getQBOStatus` returns connection status without exposing tokens.

10. **Demo seed is auth-gated:** `seedCaliforniaOperator` is a mutation (not a query), so it's harder to trigger accidentally.

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| P0 | C2: QBO token exposure | Add auth wrapper, verify company ownership |
| P0 | C1: Company enumeration | Remove or auth-gate `cannabisCompanies.list` |
| P0 | C3: QBO callback auth | Add session + state verification |
| P1 | H1: Settings/company auth | Add company ownership check in route |
| P1 | H2: Settings/locations auth | Add company ownership check in route |
| P1 | H3: updateStatus auth | Wrap with authMutation |
| P1 | H4: updateCompany auth | Wrap with authMutation |
| P2 | M1: CORS wildcard | Restrict to demo domain |
| P2 | M2: create company auth | Wrap with authMutation |
| P2 | M3: Location mutation auth | Wrap with authMutation |
| P3 | L1: Hardcoded Clerk domain fallback | Remove or document |
| P3 | L2: CSP unsafe-inline | Document as tradeoff |

---

## Recommendation

**Do NOT deploy to live demo without fixing C1, C2, and C3.** These three issues allow:
- Enumeration of all companies and their data
- Theft of QuickBooks OAuth credentials
- Potential account takeover via OAuth callback manipulation

The H-level issues (H1-H4) should be fixed before exposing to any real users, as they enable privilege escalation within the multi-tenant system.

The M-level and lower issues are acceptable for a controlled demo environment but should be addressed before production.
