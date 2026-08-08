"use client";

/**
 * COGS review.
 *
 * This rendered demoCogsCategories: a list of expense categories with invented
 * dollar impacts — $142,800 of flower, $67,500 of extraction — presented as this
 * operator's own reclassification opportunity, alongside fabricated prior-period
 * decisions.
 *
 * The IRC 471 / 263A guidance on the page is real and worth keeping. The dollar
 * figures were not, and a number labelled as your opportunity is a number you
 * will act on. They are replaced with the company's actual allocations.
 */

import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { LiveAllocationQueue } from "@/components/accounting/live-allocation-queue";

export default function CogsReviewPage() {
  return (
    <AppShell
      title="COGS review"
      description="Every cost the engine split under 280E, the measurement behind each split, and whether a human has agreed to it. Approving here is what the support schedule and the CPA handoff read from."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/allocations"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Allocations overview
        </Link>
        <Link
          href="/dashboard/allocations/policies"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Policies
        </Link>
        <Link
          href="/dashboard/allocations/support-schedule"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Support schedule
        </Link>
      </div>

      {/* Reference guidance. Not company-specific, and not invented — this is
          the statutory position the engine implements. */}
      <section className="mb-6 rounded-2xl border border-accent/15 bg-accent/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">
          Why COGS survives 280E
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">IRC 471 — Inventories</div>
            <div className="mt-1">
              Direct costs of producing or acquiring inventory are capitalized
              into it. Cannabis is not exempt from this.
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">
              Reg. 1.471-3(b) and 1.471-11
            </div>
            <div className="mt-1">
              How much indirect cost may be capitalized turns on whether you are
              a reseller or a producer. A reseller is generally limited to
              invoice price plus the cost of acquiring possession.
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">280E interaction</div>
            <div className="mt-1">
              280E disallows deductions. COGS is not a deduction — it reduces
              gross receipts. That distinction is the whole basis of the
              position, and it is why the measurement behind each split matters.
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Note on 263A: the IRS position in CCA 201504011 is that a 280E taxpayer
          may not use 263A to capitalize costs it could not otherwise deduct.
          This product does not rely on 263A to move costs into COGS.
        </p>
      </section>

      <LiveAllocationQueue />
    </AppShell>
  );
}
