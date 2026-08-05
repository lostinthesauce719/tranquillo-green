"use client";

import { useState } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { CogsCategory, IRSRiskLevel, PeriodSummary } from "@/lib/demo/cogs-categories";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function riskTone(level: IRSRiskLevel) {
  switch (level) {
    case "safe":
      return "emerald" as const;
    case "moderate":
      return "amber" as const;
    case "aggressive":
      return "rose" as const;
  }
}

function riskIcon(level: IRSRiskLevel) {
  switch (level) {
    case "safe":
      return "OK";
    case "moderate":
      return "WT";
    case "aggressive":
      return "!!";
  }
}

function absorptionLabel(method: string) {
  switch (method) {
    case "standard_cogs":
      return "Standard COGS";
    case "irc_263a":
      return "IRC 263A";
    case "direct_capitalize":
      return "Direct capitalize";
    case "not_eligible":
      return "Not eligible";
    default:
      return method;
  }
}

function classificationBadge(status: string) {
  switch (status) {
    case "deductible":
      return { label: "Deductible", tone: "emerald" as const };
    case "nondeductible":
      return { label: "280E Limited", tone: "rose" as const };
    case "partial":
      return { label: "Partial", tone: "amber" as const };
    default:
      return { label: status, tone: "slate" as const };
  }
}

export function CogsReview({
  categories,
  priorPeriods,
}: {
  categories: CogsCategory[];
  priorPeriods: PeriodSummary[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<IRSRiskLevel | "all">("all");

  const filtered =
    filterRisk === "all" ? categories : categories.filter((c) => c.irsRiskLevel === filterRisk);

  const totalCost = categories.reduce((s, c) => s + c.totalCost, 0);
  const currentDeductible = categories.reduce((s, c) => s + c.currentDeductibleAmount, 0);
  const recommendedDeductible = categories.reduce((s, c) => s + c.recommendedDeductibleAmount, 0);
  const totalImpact = categories.reduce((s, c) => s + c.dollarImpact, 0);
  const safeShifts = categories.filter((c) => c.irsRiskLevel === "safe").reduce((s, c) => s + c.dollarImpact, 0);
  const moderateShifts = categories.filter((c) => c.irsRiskLevel === "moderate").reduce((s, c) => s + c.dollarImpact, 0);

  const currentPct = totalCost === 0 ? 0 : (currentDeductible / totalCost) * 100;
  const recommendedPct = totalCost === 0 ? 0 : (recommendedDeductible / totalCost) * 100;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">Total controllable spend</div>
          <div className="mt-2 text-2xl font-semibold">{currencyFormatter.format(totalCost)}</div>
          <div className="mt-1.5 text-sm text-text-muted/70">{categories.length} COGS categories reviewed</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">Current deductible ratio</div>
          <div className="mt-2 text-2xl font-semibold">{currentPct.toFixed(1)}%</div>
          <div className="mt-1.5 text-sm text-text-muted/70">
            {currencyFormatter.format(currentDeductible)} currently deductible
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-surface-mid p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-400/70">Recommended deductible ratio</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-300">{recommendedPct.toFixed(1)}%</div>
          <div className="mt-1.5 text-sm text-text-muted/70">
            {currencyFormatter.format(recommendedDeductible)} with recommended shifts
          </div>
        </div>
        <div className="rounded-2xl border border-accent/15 bg-surface-mid p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent">Dollar impact of all shifts</div>
          <div className="mt-2 text-2xl font-semibold text-accent">{currencyFormatter.format(totalImpact)}</div>
          <div className="mt-1.5 text-sm text-text-muted/70">
            {currencyFormatter.format(safeShifts)} safe + {currencyFormatter.format(moderateShifts)} moderate
          </div>
        </div>
      </div>

      {/* Shift bar */}
      <div className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">COGS shift impact — current vs recommended</div>
          <div className="text-sm text-text-muted">{currencyFormatter.format(totalImpact)} additional deductible</div>
        </div>
        <div className="mt-4 overflow-hidden rounded-full bg-background">
          <div className="flex h-4">
            <div
              className="bg-emerald-500/60 transition-all"
              style={{ width: `${currentPct}%` }}
            />
            <div
              className="bg-emerald-500/30 transition-all"
              style={{ width: `${recommendedPct - currentPct}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
            Current deductible ({currentPct.toFixed(1)}%)
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500/30" />
            Shiftable into COGS ({(recommendedPct - currentPct).toFixed(1)}%)
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500/40" />
            Remaining 280E limited ({(100 - recommendedPct).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Prior period comparison */}
      <div className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Prior period comparison</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {priorPeriods.map((period) => {
            const delta = totalImpact - period.totalShifted;
            const isMore = delta > 0;
            return (
              <div key={period.periodLabel} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{period.periodLabel}</div>
                  <AccountingStatusBadge
                    label={period.avgRiskLevel}
                    tone={riskTone(period.avgRiskLevel)}
                  />
                </div>
                <div className="mt-2 text-xl font-semibold">{currencyFormatter.format(period.totalShifted)}</div>
                <div className="mt-1 text-sm text-text-muted">{period.categoriesShifted} categories shifted</div>
                <div className={`mt-2 text-sm ${isMore ? "text-amber-300/80" : "text-emerald-300/80"}`}>
                  {isMore ? "+" : ""}
                  {currencyFormatter.format(delta)} vs this period
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.15em] text-text-muted/60">Filter by risk</span>
        {(["all", "safe", "moderate", "aggressive"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilterRisk(level)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filterRisk === level
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface text-text-muted hover:text-text-primary"
            }`}
          >
            {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {filtered.map((cat) => {
          const expanded = expandedId === cat.id;
          const currentBadge = classificationBadge(cat.currentClassification);
          const recommendedBadge = classificationBadge(cat.recommendedClassification);

          return (
            <section key={cat.id} className="rounded-2xl border border-border bg-surface-mid">
              <button
                onClick={() => setExpandedId(expanded ? null : cat.id)}
                className="w-full text-left p-5"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-accent">{cat.id.replace("cogs_", "")}</div>
                      <AccountingStatusBadge label={cat.irsRiskLevel} tone={riskTone(cat.irsRiskLevel)} />
                      <AccountingStatusBadge label={absorptionLabel(cat.absorptionMethod)} tone="slate" />
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{cat.category}</h3>
                    <p className="mt-1 text-sm text-text-muted">{cat.subcategory}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">Total cost</div>
                      <div className="mt-1 text-lg font-semibold">{currencyFormatter.format(cat.totalCost)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">Dollar impact</div>
                      <div className={`mt-1 text-lg font-semibold ${cat.dollarImpact > 0 ? "text-emerald-300" : "text-text-muted"}`}>
                        +{currencyFormatter.format(cat.dollarImpact)}
                      </div>
                    </div>
                    <div className="text-text-muted/40">{expanded ? "[-]" : "[+]"}</div>
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-border p-5">
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      {/* Description */}
                      <div className="rounded-2xl border border-border bg-surface p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Category description</div>
                        <p className="mt-2 text-sm text-text-muted">{cat.description}</p>
                      </div>

                      {/* Classification shift */}
                      <div className="rounded-2xl border border-border bg-surface p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Classification shift</div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-border bg-background p-3">
                            <div className="text-xs uppercase tracking-[0.15em] text-text-muted/60">Current</div>
                            <div className="mt-2 flex items-center gap-2">
                              <AccountingStatusBadge label={currentBadge.label} tone={currentBadge.tone} />
                            </div>
                            <div className="mt-2 text-xl font-semibold">
                              {currencyFormatter.format(cat.currentDeductibleAmount)}
                            </div>
                          </div>
                          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                            <div className="text-xs uppercase tracking-[0.15em] text-emerald-400/60">Recommended</div>
                            <div className="mt-2 flex items-center gap-2">
                              <AccountingStatusBadge label={recommendedBadge.label} tone={recommendedBadge.tone} />
                            </div>
                            <div className="mt-2 text-xl font-semibold text-emerald-200">
                              {currencyFormatter.format(cat.recommendedDeductibleAmount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Defensibility */}
                      <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-accent">280E defensibility</div>
                        <p className="mt-2 text-sm text-text-primary">{cat.defensibility}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Absorption method */}
                      <div className="rounded-2xl border border-border bg-surface p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Absorption method</div>
                        <div className="mt-2 font-medium">{cat.absorptionMethodLabel}</div>
                        <div className="mt-3 rounded-xl border border-border bg-background p-3">
                          <div className="text-xs uppercase tracking-[0.15em] text-text-muted/60">IRC code reference</div>
                          <div className="mt-1 text-sm text-text-primary">
                            {cat.absorptionMethod === "irc_263a"
                              ? "IRC 263A — Uniform capitalization of costs to property produced"
                              : cat.absorptionMethod === "standard_cogs"
                                ? "IRC 471 — General rule for inventories + COGS"
                                : "IRC 471/263A — Direct manufacturing cost capitalization"}
                          </div>
                        </div>
                      </div>

                      {/* Prior period decisions */}
                      <div className="rounded-2xl border border-border bg-surface p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Prior period decisions</div>
                        <div className="mt-4 space-y-3">
                          {cat.priorPeriodDecisions.map((decision) => (
                            <div key={decision.periodLabel} className="rounded-xl border border-border bg-background p-3">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-text-primary">{decision.periodLabel}</div>
                                <div className="text-sm text-emerald-300/80">
                                  {currencyFormatter.format(decision.shiftAmount)} shifted
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-text-primary">{decision.outcome}</div>
                              <div className="mt-1 text-xs text-text-muted">Reviewer: {decision.reviewer}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk assessment */}
                      <div className="rounded-2xl border border-border bg-surface p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-text-muted">IRS risk assessment</div>
                        <div className="mt-3 flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              cat.irsRiskLevel === "safe"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : cat.irsRiskLevel === "moderate"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {riskIcon(cat.irsRiskLevel)}
                          </div>
                          <div>
                            <div className="font-medium capitalize">{cat.irsRiskLevel} position</div>
                            <div className="text-sm text-text-muted">
                              {cat.irsRiskLevel === "safe"
                                ? "Well-established IRS precedent. Low audit risk."
                                : cat.irsRiskLevel === "moderate"
                                  ? "Defensible with documentation. Requires consistent method."
                                  : "Higher scrutiny. Best supported with controller memo and CPA backing."}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
