import Link from "next/link";
import { DashboardWelcomePanel } from "@/components/onboarding/demo-onboarding-workspace";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { demoAllocationReviewQueue, demoCashReconciliations, getFeaturedCashReconciliationHref, summarizeAllocationQueue, summarizeCashReconciliations } from "@/lib/demo/accounting-operations";
import { firstWinChecklist, onboardingMilestones, workflowJourney } from "@/lib/demo/onboarding";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const allocationSummary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const reconciliationSummary = summarizeCashReconciliations(demoCashReconciliations);
  const featuredReconciliationHref = getFeaturedCashReconciliationHref(demoCashReconciliations);
  const firstWinReadyCount = firstWinChecklist.filter((item) => item.status !== "complete").length;

  return (
    <AppShell
      title="Overview"
      description="Founder-demo-ready command center for the first Tranquillo Green win: orient the user, show the workflow, and move from intake to trusted CPA handoff without backend risk."
    >
      <DashboardWelcomePanel />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Allocation queue" value={String(allocationSummary.ready + allocationSummary.needsSupport + allocationSummary.pendingController)} detail={`${allocationSummary.approved} items already approved`} />
        <MetricCard label="Unreconciled cash" value={currencyFormatter.format(reconciliationSummary.absoluteVariance)} detail={`${reconciliationSummary.investigating + reconciliationSummary.exception} cash workspaces need follow-up`} />
        <MetricCard label="Onboarding milestones" value={String(onboardingMilestones.length)} detail={`${firstWinReadyCount} first-win tasks still available for the demo path`} />
        <MetricCard label="Workflow hops" value={String(workflowJourney.length)} detail="Import through export is linked directly from overview" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">First-run checklist</div>
              <div className="mt-2 text-xl font-semibold">The shortest path to making the product click</div>
            </div>
            <Link href="/dashboard/onboarding" className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary transition hover:bg-surface/70">
              View full workspace
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {firstWinChecklist.map((item, index) => (
              <Link key={item.title} href={item.href} className="rounded-2xl border border-border bg-surface px-4 py-4 transition hover:border-amber-500/30 hover:bg-surface/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-emerald-100">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs uppercase tracking-[0.2em] text-accent">{item.status === "active" ? "Now" : item.status === "complete" ? "Done" : "Next"}</div>
                </div>
                <div className="mt-3 text-sm text-text-muted">{item.outcome}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Guided workflow links</div>
          <div className="mt-2 text-xl font-semibold">Jump into the product story from any step</div>
          <div className="mt-5 space-y-3">
            {workflowJourney.map((step) => (
              <Link key={step.title} href={step.href} className="block rounded-2xl border border-border bg-surface px-4 py-4 transition hover:border-violet-500/20 hover:bg-surface/80">
                <div className="text-xs uppercase tracking-[0.2em] text-violet-200">{step.eyebrow}</div>
                <div className="mt-2 text-base font-semibold text-text-primary">{step.title}</div>
                <div className="mt-2 text-sm text-text-muted">{step.detail}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Link href="/dashboard/onboarding" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 transition hover:bg-emerald-500/20">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">New workspace</div>
          <div className="mt-2 font-medium text-emerald-100">Certainty-first onboarding</div>
          <div className="mt-2 text-sm text-emerald-100/80">Milestones, role quickstarts, checklist, and workflow links packaged for a fast founder demo.</div>
        </Link>
        <Link href={featuredReconciliationHref} className="rounded-2xl border border-border bg-surface-mid px-5 py-4 transition hover:bg-surface/70">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Reconcile</div>
          <div className="mt-2 font-medium">Reconciliation drill-down</div>
          <div className="mt-2 text-sm text-text-muted">Controller-style detail page with source breakdown, variance drivers, and next steps.</div>
        </Link>
        <Link href="/dashboard/exports" className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-4 transition hover:bg-violet-500/20">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-200">Finish strong</div>
          <div className="mt-2 font-medium text-violet-100">CPA export center</div>
          <div className="mt-2 text-sm text-violet-100/80">Build demo-backed close packets, included schedules, and handoff checklist history.</div>
        </Link>
      </div>
    </AppShell>
  );
}
