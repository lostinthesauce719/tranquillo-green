import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoAllocationReviewItem } from "@/lib/demo/accounting-operations";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function decisionTone(type: DemoAllocationReviewItem["overrideHistory"][number]["decisionType"]) {
  switch (type) {
    case "recommendation":
      return "blue" as const;
    case "override":
      return "amber" as const;
    case "approval":
      return "emerald" as const;
    case "support_request":
      return "rose" as const;
    case "policy_exception":
      return "violet" as const;
  }
}

function trailTone(status: DemoAllocationReviewItem["policyTrail"][number]["status"]) {
  switch (status) {
    case "complete":
      return "emerald" as const;
    case "watch":
      return "amber" as const;
    case "pending":
      return "slate" as const;
  }
}

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

export function AllocationOverrideHistoryWorkspace({ items }: { items: DemoAllocationReviewItem[] }) {
  return (
    <div className="space-y-6">
      {items.map((item) => {
        const total = item.deductibleAmount + item.nondeductibleAmount;

        return (
          <section key={item.id} className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">{item.periodLabel} • {item.location} • {item.id}</div>
                <h2 className="mt-2 text-xl font-semibold">{item.accountCode} · {item.accountName}</h2>
                <p className="mt-2 text-sm text-text-muted">{item.vendor} — {item.memo}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AccountingStatusBadge label={item.reviewStatus.replaceAll("_", " ")} tone="slate" />
                <AccountingStatusBadge label={`${item.overrideHistory.length} audit events`} tone="blue" />
                <AccountingStatusBadge label={basisLabel(item.basis)} tone="violet" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Current policy posture</div>
                      <div className="mt-2 font-medium">{item.policyName}</div>
                    </div>
                    {item.transactionId ? (
                      <Link href={`/dashboard/accounting/transactions/${item.transactionId}`} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary transition hover:bg-surface/70">
                        Open source transaction
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-text-muted">{item.policyMethod}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Driver</div>
                      <div className="mt-2 font-medium">{item.driverLabel}</div>
                      <div className="mt-1 text-sm text-text-muted">{item.driverValue}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Deductible</div>
                      <div className="mt-2 font-semibold text-emerald-100">{currencyFormatter.format(item.deductibleAmount)}</div>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-rose-200">280E-limited</div>
                      <div className="mt-2 font-semibold text-rose-100">{currencyFormatter.format(item.nondeductibleAmount)}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Why it entered review</div>
                      <p className="mt-2 text-sm text-text-muted">{item.flagReason}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Decision and owner</div>
                      <div className="mt-2 text-sm text-text-primary">{item.decisionRequired}</div>
                      <div className="mt-2 text-sm text-text-muted">{item.reviewer} • {item.lastReviewedAt}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-text-muted">Current reviewed total: {currencyFormatter.format(total)}</div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Override history + audit log</div>
                  <div className="mt-4 space-y-4">
                    {item.overrideHistory.map((event) => {
                      const deductibleShift = event.revisedDeductibleAmount - event.originalDeductibleAmount;
                      const nondeductibleShift = event.revisedNondeductibleAmount - event.originalNondeductibleAmount;

                      return (
                        <div key={event.id} className="rounded-2xl border border-border bg-background p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="font-medium">{event.actor} · {event.role}</div>
                              <div className="mt-1 text-sm text-text-muted">{event.timestampLabel}</div>
                            </div>
                            <AccountingStatusBadge label={event.decisionType.replaceAll("_", " ")} tone={decisionTone(event.decisionType)} />
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-surface p-3 text-sm text-text-muted">
                              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Original recommendation</div>
                              <div className="mt-2 text-text-primary">{basisLabel(event.fromBasis)} · {currencyFormatter.format(event.originalDeductibleAmount)} deductible / {currencyFormatter.format(event.originalNondeductibleAmount)} limited</div>
                            </div>
                            <div className="rounded-xl border border-border bg-surface p-3 text-sm text-text-muted">
                              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Result after action</div>
                              <div className="mt-2 text-text-primary">{basisLabel(event.toBasis)} · {currencyFormatter.format(event.revisedDeductibleAmount)} deductible / {currencyFormatter.format(event.revisedNondeductibleAmount)} limited</div>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                              Deductible shift: {currencyFormatter.format(deductibleShift)}
                            </div>
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                              280E-limited shift: {currencyFormatter.format(nondeductibleShift)}
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-text-muted">{event.reason}</div>
                          <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Evidence / support</div>
                              <ul className="mt-2 space-y-2 text-sm text-text-muted">
                                {event.evidence.map((evidence) => (
                                  <li key={evidence}>• {evidence}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Resulting policy trail</div>
                              <p className="mt-2 text-sm text-text-muted">{event.resultingPolicyTrail}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Tax impact preview</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Linked support package</div>
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
                          Open support reference
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Prior similar decisions</div>
                  <div className="mt-4 space-y-3">
                    {item.similarDecisions.map((decision) => (
                      <div key={decision.id} className="rounded-xl border border-border bg-background px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium">{decision.periodLabel}</div>
                            <div className="mt-1 text-sm text-text-muted">{decision.outcome}</div>
                          </div>
                          <AccountingStatusBadge label={`${Math.round(decision.deductiblePercent * 100)}% deductible`} tone="slate" />
                        </div>
                        <p className="mt-3 text-sm text-text-muted">{decision.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Policy trail workspace</div>
                  <div className="mt-4 space-y-3">
                    {item.policyTrail.map((entry) => (
                      <div key={`${item.id}-${entry.step}`} className="rounded-xl border border-border bg-background px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-medium">{entry.step}</div>
                            <div className="mt-1 text-sm text-text-muted">Owner: {entry.owner}</div>
                          </div>
                          <AccountingStatusBadge label={entry.status} tone={trailTone(entry.status)} className="capitalize" />
                        </div>
                        <p className="mt-3 text-sm text-text-muted">{entry.note}</p>
                      </div>
                    ))}
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
