# Vendor Compliance Tracker

Working document. Fill in the blanks as you complete each item — the empty
cells are the point, so nothing reads as done before it is.

Complete this before the first customer's real books are in the system. Once a
cannabis operator's ledger is in your database you are a processor of their
financial records, and their own agreements and auditors will reach you.

**Status legend:** ☐ not started · ◐ in progress · ☑ complete

---

## 1. Subprocessors

Everyone who can touch customer data. Keep this current — it is the first thing
asked for in a B2B security review, and reconstructing it under time pressure
is how vendors get missed.

| Vendor | Purpose | Data it holds | Region | DPA | SOC 2 verified | Date checked |
| --- | --- | --- | --- | --- | --- | --- |
| Convex | Database + backend functions | All tenant accounting records, users | | ☐ | ☐ | |
| Clerk | Authentication | Identities, emails, session metadata | | ☐ | ☐ | |
| Vercel | Application hosting | No durable data; request logs | | ☐ | ☐ | |
| _Backup storage_ (R2 / S3 / B2) | Off-site snapshots | Full copy of all tenant data | | ☐ | ☐ | |
| Resend | Transactional email | Recipient addresses, message content | | ☐ | ☐ | |
| Stripe _(only if enabled)_ | Payments | Billing contact, payment metadata | | ☐ | ☐ | |

> The backup bucket holds a **complete copy of every customer's books**. It
> deserves the same scrutiny as Convex, and is the one people forget because
> they set it up once and never look again.

## 2. Per-vendor checklist

For each vendor above:

- [ ] **Signed DPA on file.** Most publish a standard one you can accept
      online; save a PDF rather than relying on a click-through you cannot
      later produce.
- [ ] **SOC 2 Type II report pulled from their trust center**, with the report
      period noted. A Type I, or a report whose period ended eighteen months
      ago, is not the same thing — check the dates.
- [ ] **Their subprocessor list reviewed.** Your vendors have vendors; those
      are yours too, transitively.
- [ ] **Breach notification window recorded.** You cannot promise your
      customers 24 hours if your database vendor takes 72 to tell you.
- [ ] **Data region confirmed**, if any customer requires US-only storage.
- [ ] **Exit path understood** — can you export and can you compel deletion?

Do not accept a marketing page or a secondhand claim for the SOC 2 item. Pull
the current report yourself and write down the date you did it; that date is
what an auditor asks for.

## 3. Commitments you must be able to keep

Write these down only once they are true.

| Commitment | Current reality | Ready to state publicly |
| --- | --- | --- |
| Encryption in transit | HTTPS/TLS everywhere; HSTS in production | ☑ |
| Encryption at rest | Whatever Convex and your bucket provide — verify and cite | ☐ |
| Tenant isolation | Enforced per query/mutation via `requireCompanyAccessById` | ☑ |
| Audit trail | Append-only by application design; actor, timestamp, reason, before/after | ☑ |
| Tamper-evident audit trail | **Not implemented** — no hash chain | ☐ |
| Backups | Nightly off-site snapshot, verified by script | ☑ once the bucket is configured |
| Tested restore | Logic rehearsed in tests; live drill still owed | ◐ |
| Retention window | No enforced policy — customers export for their own retention | ☐ |
| Deletion on request | **No documented path** — backups make this non-trivial | ☐ |
| Breach notification SLA | Not defined | ☐ |

The rows marked "not implemented" are the ones to be careful about in sales
conversations. Saying the audit trail is immutable when it is merely
append-only is the kind of claim that becomes a problem precisely when it
matters most — during an examination.

## 4. Deletion path (unwritten — needs a decision)

When a customer leaves and asks you to delete their data, you must handle:

1. Live Convex records — straightforward, delete by company.
2. **Backup snapshots** — every nightly file containing them. Options:
   (a) set a bucket lifecycle rule so snapshots expire after N days, bounding
   how long deleted data survives; or (b) accept that backups retain it and
   say so plainly in your DPA. Option (a) is simpler to honor.
3. Clerk identities — delete the user records.
4. Anything in email logs.

Pick an approach and write the retention period into your customer agreement.
A 30- or 90-day backup expiry is common and defensible; unbounded retention is
hard to reconcile with a deletion promise.

## 5. Review cadence

- [ ] Re-verify SOC 2 reports annually — they expire.
- [ ] Re-check the subprocessor list whenever a vendor is added, **including
      anything added for a one-off experiment**.
- [ ] Re-run the restore drill after any schema change large enough to alter
      table relationships.
