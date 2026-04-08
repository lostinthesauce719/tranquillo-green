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
      description="Everything you need to move from intake to trusted CPA handoff."
    >
      <DashboardWelcomePanel />

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <MetricCard label="Allocation queue" value={String(allocationSummary.ready + allocationSummary.needsSupport + allocationSummary.pendingController)} detail={`${allocationSummary.approved} items already approved`} />
        <MetricCard label="Unreconciled cash" value={currencyFormatter.format(reconciliationSummary.absoluteVariance)} detail={`${reconciliationSummary.investigating + reconciliationSummary.exception} workspaces need follow-up`} />
        <MetricCard label="Onboarding" value={String(onboardingMilestones.length)} detail={`${firstWinReadyCount} tasks remaining`} />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Checklist</div>
              <div className="mt-1.5 text-lg font-semibold">The shortest path to making the product click</div>
            </div>
            <Link href="/dashboard/onboarding" className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary hover:bg-surface/70">
              Full workspace
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {firstWinChecklist.map((item, index) => (
              <Link key={item.title} href={item.href} className="block rounded-2xl border border-border bg-surface px-5 py-4 transition hover:border-border/60 hover:bg-surface/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-emerald-300/70">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      <div className="mt-1 text-sm text-text-muted/60">{item.detail}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Workflow</div>
          <div className="mt-1.5 text-lg font-semibold">Jump into the product story from any step</div>
          <div className="mt-5 space-y-3">
            {workflowJourney.map((step) => (
              <Link key={step.title} href={step.href} className="block rounded-2xl border border-border bg-surface px-5 py-4 transition hover:border-border/60 hover:bg-surface/80">
                <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted/50">{step.eyebrow}</div>
                <div className="mt-1 text-sm font-semibold text-text-primary">{step.title}</div>
                <div className="mt-1 text-sm text-text-muted/60">{step.detail}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Link href="/dashboard/onboarding" className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-6 py-5 transition hover:bg-emerald-500/10">
          <div className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/60">Onboarding</div>
          <div className="mt-1.5 font-medium text-emerald-200/90">Certainty-first setup</div>
          <div className="mt-1 text-sm text-emerald-200/50">Milestones, checklists, and workflow links.</div>
        </Link>
        <Link href={featuredReconciliationHref} className="rounded-2xl border border-border bg-surface-mid px-6 py-5 transition hover:bg-surface/70">
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-muted/50">Reconcile</div>
          <div className="mt-1.5 font-medium">Cash reconciliation</div>
          <div className="mt-1 text-sm text-text-muted/50">Source breakdown, variance drivers, next steps.</div>
        </Link>
        <Link href="/dashboard/exports" className="rounded-2xl border border-violet-500/15 bg-violet-500/5 px-6 py-5 transition hover:bg-violet-500/10">
          <div className="text-[10px] uppercase tracking-[0.15em] text-violet-300/60">Export</div>
          <div className="mt-1.5 font-medium text-violet-200/90">CPA export center</div>
          <div className="mt-1 text-sm text-violet-200/50">Close packets, schedules, and handoff history.</div>
        </Link>
      </div>
    </AppShell>
  );
}
