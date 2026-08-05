# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Tranquillo Green, please report it privately rather than opening a public issue. Email the maintainer with a description of the issue, steps to reproduce, and the potential impact. You can expect an acknowledgment within a few business days.

Please do not test vulnerabilities against production deployments or real tenant data.

## Scope

Reports are welcome for anything in this repository, in particular:

- Authentication and authorization bypasses (Clerk, Convex function auth wrappers, API route ownership checks)
- Cross-tenant data access (company-scoped queries and mutations)
- Exposure of integration credentials (QuickBooks Online tokens, POS credentials)
- Injection or XSS vectors in user-supplied data

## Security posture

- All Convex queries/mutations that touch tenant data are wrapped with `authQuery` / `authMutation` (`convex/lib/withAuth.ts`) and verify company membership.
- API routes verify the authenticated user's access to the requested company before delegating to Convex.
- Security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are applied via `src/lib/api-helpers.ts`.
- Secrets live only in environment variables; `.env*` files are gitignored and `src/lib/env.ts` is server-only.
- Financial mutations write audit-trail records with actor, timestamp, and before/after state.

Known accepted tradeoffs for the demo deployment (documented in `qa-security-review.md`): in-memory rate limiting and `unsafe-inline`/`unsafe-eval` in the CSP required by embedded auth components.
