import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { CogsReview } from "@/components/accounting/cogs-review";
import { demoCogsCategories, demoPriorPeriodSummaries } from "@/lib/demo/cogs-categories";

export default function CogsReviewPage() {
  return (
    <AppShell
      title="COGS Intelligence"
      description="The most important 280E survival tool. Review every expense category that can shift into COGS, understand the dollar impact, IRS risk, and absorption method for each shift. Every recommendation is backed by IRC 471/263A defensibility guidance and prior-period decisions."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/allocations"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Back to allocations queue
        </Link>
        <Link
          href="/dashboard/allocations/support-schedule"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Support schedule
        </Link>
        <Link
          href="/dashboard/allocations/history"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Override history
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-accent/15 bg-accent/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">280E survival doctrine</div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">IRC 471 — Inventories</div>
            <div className="mt-1">Direct costs of producing or purchasing inventory must be capitalized. Cannabis is not exempt.</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">IRC 263A — Uniform capitalization</div>
            <div className="mt-1">Indirect costs that directly benefit production must be added to inventory basis. Applies to both resellers and producers.</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="font-medium text-text-primary">280E interaction</div>
            <div className="mt-1">280E disallows deductions for trafficking. But COGS is not a deduction — it is a cost basis reduction. Proper COGS classification survives 280E.</div>
          </div>
        </div>
      </section>

      <CogsReview categories={demoCogsCategories} priorPeriods={demoPriorPeriodSummaries} />
    </AppShell>
  );
}
