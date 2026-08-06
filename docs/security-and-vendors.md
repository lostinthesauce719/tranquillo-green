# Security, Vendors, and Data — Operating Runbook

Written for a cloud-hosted product handling other companies' accounting records.
Where something is not yet done, it says so rather than implying coverage.

## 1. Architecture

| Layer | Vendor | Holds |
| --- | --- | --- |
| Web app / API | Vercel | No durable data; env secrets |
| Database + backend functions | Convex | All tenant accounting data |
| Identity | Clerk | User identities, sessions, emails |
| Billing | Pluggable (see §5) | Subscription and payment metadata |
| Off-site backup | S3-compatible bucket you own | Full nightly snapshot |

The public marketing tier (`/`, `/try`, `/demo`, `/pricing`, guides) is
unauthenticated. Everything under `/dashboard` requires a Clerk session and is
scoped to one company.

## 2. Data protection posture

**Tenant isolation.** Every Convex query and mutation touching tenant data goes
through `authQuery`/`authMutation` (`convex/lib/withAuth.ts`) and calls
`requireCompanyAccessById`. Authentication alone is not treated as
authorization — membership in the specific company is checked per call.

**Audit trail.** Financial mutations write `auditTrailEvents` with actor,
timestamp, reason, and before/after state. The application exposes no path to
edit or delete these rows.

> Not implemented: hash chaining, WORM storage, or an enforced retention
> window. Do not describe the trail as cryptographically immutable. If a
> customer needs tamper-evidence, that is a build, not a claim.

**Secrets.** Only in environment variables. `src/lib/env.ts` is `server-only`.
`.env*` is gitignored.

**Transport and browser hardening.** Security headers are set in
`next.config.mjs` and apply to every response including HTML documents. CSP
currently ships as `Content-Security-Policy-Report-Only`.

> Action: watch the browser console on `/auth` and `/dashboard` under real
> Clerk traffic, then rename the header to `Content-Security-Policy` to
> enforce. It is not protecting anything until you do.

## 3. Backups

A system of record whose only copy sits in one vendor's account is one
account-closure away from total loss. Nightly snapshots run to storage you own.

**Setup**

1. Create a bucket in an account **separate from Convex and Vercel** —
   Cloudflare R2, AWS S3, or Backblaze B2 all work.
2. Generate a long random string as `BACKUP_SECRET`.
3. Set it in **both** places — they are checked independently:
   ```bash
   npx convex env set BACKUP_SECRET "<value>"     # export query gate
   # and in Vercel project env vars                # route gate
   ```
4. Set `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_REGION`,
   `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY` in Vercel.
5. `vercel.json` runs `/api/backup` daily at 07:00 UTC.

**Manual snapshot**

```bash
curl -H "Authorization: Bearer $BACKUP_SECRET" \
  https://your-app.com/api/backup -o snapshot.ndjson        # download
curl -X POST -H "Authorization: Bearer $BACKUP_SECRET" \
  https://your-app.com/api/backup                            # run + upload
```

**Verify — do this, don't assume**

```bash
npm run backup:verify -- snapshot.ndjson
```

Checks the header, that every line parses, that every document has an `_id`,
and that per-table counts match. A backup nobody has read is a guess.

**Restore.** The format is NDJSON: line 1 is a header, every later line is one
document tagged with `_table`. Restore by reading lines and inserting per
table, parents before children (`cannabisCompanies` → `chartOfAccounts` →
`transactions` → `transactionLines`). Convex `_id` values are not reusable
across deployments, so a restore into a fresh deployment must remap references.

> Not implemented: an automated restore script, and restore has never been
> rehearsed. Schedule a drill into a scratch Convex deployment before you have
> customers depending on it. Backups are only as good as the last restore you
> actually performed.

**Redaction.** Integration credentials (`integrationConfigs` OAuth tokens, POS
keys) are replaced with `[redacted-in-backup]`. A leaked snapshot should not
hand over live access to a customer's QuickBooks or POS. Those connections must
be re-authorized after a restore.

## 4. Vendor procurement checklist

Do this before the first customer's real books land in the system.

- [ ] **Signed DPA with each vendor** — Convex, Clerk, Vercel, and your backup
      storage provider. You are a processor for your customers' financial data;
      your customers' own agreements will flow down to you.
- [ ] **Pull each vendor's current SOC 2 report** from their trust center.
      Verify it yourself, with a current date — do not rely on a blog post or
      secondhand claim. CPA firms will ask for this during procurement.
- [ ] **Publish a subprocessor list** naming every vendor above. Standard ask
      in B2B security review; cheap to maintain, awkward to produce reactively.
- [ ] **Confirm data residency** if any customer requires US-only storage.
- [ ] **Document breach notification timelines** you can actually meet, taking
      into account how fast each vendor notifies you.
- [ ] **Write a deletion path.** Customers will ask what happens to their data
      when they leave, and backups mean "delete" is not one DELETE statement.

## 5. Billing and processor risk

Cannabis-adjacent businesses are routinely dropped by mainstream card
processors, often with little notice. Losing the payment rail is worse than
never automating it, so the processor is a swappable component.

**How it is structured.** Everything above `src/lib/billing/types.ts` — routes,
UI, Convex mutations — depends only on the `BillingProvider` interface.
Selection is `BILLING_PROVIDER`. Adding a processor is one new file plus a
registry entry; no route or UI changes.

| Value | Behavior |
| --- | --- |
| `invoice` (default) | No card rail. Records the request, returns a reference, and a human invoices for ACH/wire. Depends on no third party, so no vendor can switch off revenue collection. |
| `stripe` | Hosted Stripe Checkout. |

**On Stripe specifically.** Stripe's prohibited-business list covers cannabis,
and enforcement has reached ancillary businesses serving the industry — not
only dispensaries. Before routing real revenue through it, get written
confirmation from Stripe that B2B SaaS billing cannabis operators is
acceptable for your account. If you cannot get that in writing, stay on
`invoice` or integrate a processor that underwrites this sector explicitly.

When evaluating any replacement, ask in this order:

1. Will you underwrite ancillary cannabis SaaS **in writing**?
2. What is the termination notice period, and what happens to in-flight funds?
3. Can we export the customer and subscription records if we leave?

Recurring-billing coverage and pricing matter less than the first question.
A cheaper rail that disappears without notice costs more than an expensive one
that stays.

## 6. Known gaps

Tracked honestly so nobody mistakes intent for implementation:

- CSP is Report-Only; not enforcing until validated against live auth traffic.
- Restore is documented but unrehearsed and unautomated.
- Audit trail is append-only by application design, not by storage guarantee.
- Team invitations require the invitee to self-register first.
- Metrc and ad-platform data is entered manually; no API sync yet.
