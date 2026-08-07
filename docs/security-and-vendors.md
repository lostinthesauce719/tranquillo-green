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

Enforcement is controlled by `CSP_MODE`, so turning it on is a config change
rather than a deploy of new code — and turning it back off is equally quick if
sign-in breaks.

**To enforce:**

1. Deploy with the default (report-only) and exercise the real flows: sign up,
   sign in, load the dashboard, open a report, start a checkout.
2. Watch the browser console for `Content-Security-Policy-Report-Only`
   violations. Anything reported would have been *blocked* under enforcement.
3. Add any legitimate origin the reports surface to the relevant directive in
   `next.config.mjs`. Clerk in particular may load from a domain not in the
   current list depending on your instance configuration.
4. When the console is clean across those flows, set `CSP_MODE=enforce` and
   redeploy.
5. Verify sign-in immediately. If anything breaks, unset `CSP_MODE` — that
   reverts to report-only without a code change.

> Until step 4 the policy reports but does not block. That is deliberate: a
> wrong directive locks every user out of the product, while report-only fails
> safe. Do not treat the header's presence as protection.

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

**Restore**

```bash
# Always dry-run first. Plans the restore and validates every reference
# without writing anything.
BACKUP_SECRET=<value> npm run backup:restore -- snapshot.ndjson \
  --url https://<scratch-deployment>.convex.cloud

# Apply, once the plan looks right.
BACKUP_SECRET=<value> npm run backup:restore -- snapshot.ndjson \
  --url https://<scratch-deployment>.convex.cloud --yes
```

Convex `_id` values cannot be reused across deployments, so the script rebuilds
every cross-document reference: it inserts in dependency order and rewrites
each reference to the id the target assigned. References are found by matching
values against ids present in the snapshot rather than a hard-coded list of
foreign keys, so the restore does not rot when the schema changes.

Guards, because restoring into the wrong place is the expensive mistake:

- Refuses to restore onto the deployment the snapshot came from.
- Refuses a target that already holds data unless `--allow-non-empty`.
- Refuses to write at all if any reference cannot be resolved.
- Dry run is the default; writing requires `--yes`.

**Restore drill**

The remapping logic is covered by `tests/restore-plan.test.ts`, which performs
a full restore against an in-memory deployment and then walks the restored
graph — confirming lines still point at their transaction, accounts still match
the lines that used them, debits still equal credits, and no snapshot id
survives anywhere. Cycles, dangling references, arrays of ids, and truncated
files are all covered.

That rehearses the logic. Rehearsing the **operation** against a real Convex
deployment is one command:

```bash
export CONVEX_DEPLOY_KEY='dev:<throwaway-deployment>|...'
export DRILL_URL='https://<throwaway-deployment>.convex.cloud'
npm run drill
```

It deploys the schema to the throwaway deployment, restores a synthetic
fixture (31 documents, 12 tables, no real data), exports it back, and compares
the graphs — printing PASS or FAIL and exiting accordingly. It refuses to run
against the production deployment, and prompts before accepting any `prod:`
deploy key.

The comparison is what makes this a test rather than a demonstration. Ids
legitimately change during a restore, so each document is reduced to a
canonical form with references resolved to the canonical form of their target,
recursively; the graphs must be isomorphic with identical field values. A
restore that silently repointed one transaction line at the wrong account
fails this check — verified deliberately during development.

> **Status: not yet run against a live deployment.** The logic is covered by
> tests and the tooling is verified offline, but no one has executed
> `npm run drill` against real Convex. Until someone does, treat recovery as
> designed-and-tested rather than proven. Record the date here when it passes:
>
> Last successful live drill: _never_

Afterwards: delete the throwaway project and revoke its deploy key.

**Redaction.** Integration credentials (`integrationConfigs` OAuth tokens, POS
keys) are replaced with `[redacted-in-backup]`. A leaked snapshot should not
hand over live access to a customer's QuickBooks or POS. Those connections must
be re-authorized after a restore.

## 4. Vendor procurement checklist

Tracked in **`docs/vendor-compliance-tracker.md`**, which carries the
subprocessor table, per-vendor status, and the commitments you can and cannot
yet make publicly. Summary of what it covers:

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

- CSP defaults to Report-Only; set `CSP_MODE=enforce` after validating (§2).
- Restore is scripted, its logic is covered by tests, and the drill is a
  single command — but it has never been run against a live deployment.
- No deletion path for data held in backup snapshots — see the tracker.
- Audit trail is append-only by application design, not by storage guarantee.
- Team invitations require the invitee to self-register first.
- Metrc and ad-platform data is entered manually; no API sync yet.
