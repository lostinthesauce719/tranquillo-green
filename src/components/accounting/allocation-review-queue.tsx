import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoAllocationReviewItem } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function basisLabel(basis: DemoAllocationReviewItem["basis"]) {
  switch (basis) {
    case "square_footage":
      return "Square footage";
    case "labor_hours":
      return "Labor hours";
    case "revenue_mix":
      return "Revenue mix";
    case "custom_policy":
      return "Custom policy";
  }
}

function statusTone(status: DemoAllocationReviewItem["reviewStatus"]) {
  switch (status) {
    case "approved":
      return "emerald" as const;
    case "ready_for_review":
      return "blue" as const;
    case "pending_controller":
      return "violet" as const;
    case "needs_support":
      return "amber" as const;
  }
}

function priorityTone(priority: DemoAllocationReviewItem["priority"]) {
  switch (priority) {
    case "critical":
      return "rose" as const;
    case "high":
      return "amber" as const;
    case "normal":
      return "slate" as const;
  }
}

function confidenceTone(confidence: number) {
  if (confidence >= 0.9) return "emerald" as const;
  if (confidence >= 0.7) return "blue" as const;
  if (confidence >= 0.5) return "amber" as const;
  return "rose" as const;
}

function supportTone(status: DemoAllocationReviewItem["supportLinks"][number]["status"]) {
  switch (status) {
    case "linked":
      return "emerald" as const;
    case "needs_refresh":
      return "amber" as const;
    case "missing":
      return "rose" as const;
  }
}

function actionLabel(action: DemoAllocationReviewItem["recommendedAction"]) {
  switch (action) {
    case "approve_split":
      return "Approve recommended split";
    case "request_support":
      return "Request support";
    case "override_policy":
      return "Override policy";
    case "route_to_controller":
      return "Route to controller";
  }
}

export function AllocationReviewQueue({ items }: { items: DemoAllocationReviewItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const total = item.deductibleAmount + item.nondeductibleAmount;
        const deductibleShare = total === 0 ? 0 : (item.deductibleAmount / total) * 100;
        const nondeductibleShare = 100 - deductibleShare;
        const latestEvent = item.overrideHistory[item.overrideHistory.length - 1];

        return (
          <section key={item.id} className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">{item.periodLabel} • {item.location} • {item.id}</div>
                <h2 className="mt-2 text-xl font-semibold">{item.accountCode} · {item.accountName}</h2>
                <p className="mt-2 text-sm text-text-muted">{item.vendor} — {item.memo}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AccountingStatusBadge label={item.reviewStatus.replaceAll("_", " ")} tone={statusTone(item.reviewStatus)} />
                <AccountingStatusBadge label={`${item.priority} priority`} tone={priorityTone(item.priority)} />
                <AccountingStatusBadge label={`${Math.round(item.confidence * 100)}% confidence`} tone={confidenceTone(item.confidence)} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Why this item is flagged</div>
                    <div className="mt-2 font-medium">{basisLabel(item.basis)} review required</div>
                    <p className="mt-2 text-sm text-text-muted">{item.flagReason}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Assigned reviewer</div>
                    <div className="mt-2 font-medium">{item.reviewer}</div>
                    <div className="mt-1 text-sm text-text-muted">{item.dueLabel}</div>
                    <div className="mt-1 text-sm text-text-muted">Last touched {item.lastReviewedAt}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Decision needed</div>
                  <div className="mt-2 font-medium">{actionLabel(item.recommendedAction)}</div>
                  <p className="mt-2 text-sm text-text-muted">{item.decisionRequired}</p>
                  <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-3 text-sm text-text-primary">
                    If accepted: {item.acceptedOutcome}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Policy + method</div>
                  <div className="mt-2 font-medium">{item.policyName}</div>
                  <p className="mt-2 text-sm text-text-muted">{item.policyMethod}</p>
                  <div className="mt-4 text-sm text-text-muted">{item.driverLabel}: {item.driverValue}</div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Linked support and evidence</div>
                    <Link href="/dashboard/allocations/support-schedule" className="text-xs text-accent transition hover:text-accent/80">
                      Open support schedule
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.supportLinks.map((link) => (
                      <div key={link.label} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium text-text-primary">{link.label}</div>
                            <div className="mt-1 text-sm text-text-muted">{link.documentType}</div>
                          </div>
                          <AccountingStatusBadge label={link.status.replaceAll("_", " ")} tone={supportTone(link.status)} className="capitalize" />
                        </div>
                        <Link href={link.href} className="mt-3 inline-flex text-xs text-accent transition hover:text-accent/80">
                          Open linked support
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-text-muted">
                    <span>Recommended split</span>
                    <span>{currencyFormatter.format(total)}</span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-full bg-background">
                    <div className="flex h-3">
                      <div className="bg-emerald-500/70" style={{ width: `${deductibleShare}%` }} />
                      <div className="bg-rose-500/70" style={{ width: `${nondeductibleShare}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Deductible / capitalizable</div>
                      <div className="mt-2 text-xl font-semibold text-emerald-100">{currencyFormatter.format(item.deductibleAmount)}</div>
                      <div className="mt-1 text-sm text-emerald-200/80">{deductibleShare.toFixed(1)}% of reviewed amount</div>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-rose-200">Nondeductible / 280E limited</div>
                      <div className="mt-2 text-xl font-semibold text-rose-100">{currencyFormatter.format(item.nondeductibleAmount)}</div>
                      <div className="mt-1 text-sm text-rose-200/80">{nondeductibleShare.toFixed(1)}% of reviewed amount</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Tax impact preview</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      Accepted deductible delta: {currencyFormatter.format(item.taxImpactPreview.acceptedDeductibleDelta)}
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                      Accepted 280E-limited delta: {currencyFormatter.format(item.taxImpactPreview.acceptedNondeductibleDelta)}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-text-muted">{item.taxImpactPreview.returnLine}</div>
                  <p className="mt-2 text-sm text-text-muted">{item.taxImpactPreview.note}</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Prior similar decisions</div>
                    <Link href="/dashboard/allocations/history" className="text-xs text-accent transition hover:text-accent/80">
                      Open override history
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {item.similarDecisions.map((decision) => (
                      <div key={decision.id} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-medium text-text-primary">{decision.periodLabel}</div>
                          <AccountingStatusBadge label={`${Math.round(decision.deductiblePercent * 100)}% deductible`} tone="slate" />
                        </div>
                        <div className="mt-2 text-sm text-text-primary">{decision.outcome}</div>
                        <p className="mt-2 text-sm text-text-muted">{decision.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Override timeline and reviewer notes</div>
                  {latestEvent ? (
                    <div className="mt-3 rounded-xl border border-border bg-background p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium text-text-primary">{latestEvent.actor} · {latestEvent.role}</div>
                          <div className="mt-1 text-sm text-text-muted">{latestEvent.timestampLabel}</div>
                        </div>
                        <AccountingStatusBadge label={latestEvent.decisionType.replaceAll("_", " ")} tone="blue" />
                      </div>
                      <p className="mt-3 text-sm text-text-muted">{latestEvent.reason}</p>
                    </div>
                  ) : null}
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {item.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                      Approve split
                    </button>
                    <button className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted">
                      Request support
                    </button>
                    <button className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted">
                      Override basis
                    </button>
                    <button className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
                      Escalate reviewer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
