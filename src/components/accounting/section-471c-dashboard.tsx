"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  testGrossReceiptsEligibility,
  calculateDualPathAllocation,
  summarizeAllocationComparison,
  formatCurrency,
  formatPercent,
  type GrossReceiptsYear,
  type DualPathAllocation,
  type Section471cElection,
  CORPORATE_TAX_RATE,
  GROSS_RECEIPTS_THRESHOLD,
} from "@/lib/section-471c";
import {
  getReclassifiable471cCosts,
  getFullyNondeductibleCosts,
  type CostCategory,
} from "@/lib/operator-profiles";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Section471cDashboardProps = {
  operatorType: string;
  grossRevenue: number;
  costCategories: { code: string; name: string; amount: number; taxTreatment: string }[];
  priorYearsGrossReceipts: GrossReceiptsYear[];
  corporateTaxRate?: number;
};

export function Section471cDashboard({
  operatorType,
  grossRevenue,
  costCategories,
  priorYearsGrossReceipts,
  corporateTaxRate = CORPORATE_TAX_RATE,
}: Section471cDashboardProps) {
  const [selectedMethod, setSelectedMethod] = useState<"280e_standard" | "280e_471c">("280e_471c");

  // Calculate eligibility
  const eligibility = useMemo(
    () => testGrossReceiptsEligibility(priorYearsGrossReceipts),
    [priorYearsGrossReceipts]
  );

  // Normalize cost categories for the engine
  const normalizedCosts = useMemo(
    () =>
      costCategories.map((c) => ({
        ...c,
        taxTreatment: c.taxTreatment === "cogs" ? "cogs" as const : "nondeductible" as const,
      })),
    [costCategories]
  );

  // Calculate dual-path allocation
  const allocations = useMemo(
    () => calculateDualPathAllocation(operatorType, normalizedCosts, grossRevenue, corporateTaxRate),
    [operatorType, normalizedCosts, grossRevenue, corporateTaxRate]
  );

  // Summarize comparison
  const comparison = useMemo(
    () => summarizeAllocationComparison(allocations, grossRevenue, corporateTaxRate),
    [allocations, grossRevenue, corporateTaxRate]
  );

  // Get reclassifiable costs for this operator type
  const reclassifiableCosts = useMemo(
    () => getReclassifiable471cCosts(operatorType as any),
    [operatorType]
  );

  const fullyNondeductible = useMemo(
    () => getFullyNondeductibleCosts(operatorType as any),
    [operatorType]
  );

  return (
    <div className="space-y-6">
      {/* 471(c) Eligibility Card */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-accent">IRC 471(c) Eligibility</span>
              {eligibility.eligible ? (
                <Badge variant="success" size="sm">Eligible</Badge>
              ) : (
                <Badge variant="danger" size="sm">Not Eligible</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-text-muted">
              Small business inventory method election — allows reclassification of inventory-related costs into COGS,
              making them deductible even under 280E.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-text-muted">Gross Receipts Test (3-Year Avg)</div>
            <div className="mt-1 text-lg font-semibold text-text-primary">
              {formatCurrency(eligibility.averageGrossReceipts)}
            </div>
            <div className="text-xs text-text-muted">
              Threshold: {formatCurrency(GROSS_RECEIPTS_THRESHOLD)}
            </div>
          </div>
        </div>

        {/* Prior years breakdown */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {eligibility.priorYears.map((year) => (
            <div key={year.taxYear} className="rounded-xl border border-border bg-surface p-3">
              <div className="text-xs text-text-muted">Tax Year {year.taxYear}</div>
              <div className="mt-1 font-medium text-text-primary">{formatCurrency(year.grossReceipts)}</div>
              <div className="text-xs text-text-muted">
                {year.grossReceipts <= GROSS_RECEIPTS_THRESHOLD ? "Under threshold" : "Over threshold"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual-Path Comparison */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">
          280E vs. 280E + 471(c) Comparison
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Side-by-side view showing how 471(c) expands your deductible COGS and reduces effective tax rate.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* 280E Only */}
          <div className={`rounded-2xl border p-5 transition-all ${
            selectedMethod === "280e_standard"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border bg-surface"
          }`}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-text-primary">280E Only (Standard)</div>
              <Badge variant="neutral" size="sm">Current</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Revenue</span>
                <span className="text-text-primary">{formatCurrency(comparison.standard.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Costs</span>
                <span className="text-text-primary">{formatCurrency(comparison.standard.totalCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300">Deductible (COGS)</span>
                <span className="text-emerald-200">{formatCurrency(comparison.standard.deductibleAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-rose-300">Nondeductible</span>
                <span className="text-rose-200">{formatCurrency(comparison.standard.nondeductibleAmount)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-primary">Effective Tax Rate</span>
                  <span className="text-amber-200">{formatPercent(comparison.standard.effectiveTaxRate)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm font-medium">
                  <span className="text-text-primary">Estimated Tax</span>
                  <span className="text-amber-200">{formatCurrency(comparison.standard.estimatedTaxLiability)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 280E + 471(c) */}
          <div className={`rounded-2xl border p-5 transition-all ${
            selectedMethod === "280e_471c"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-border bg-surface"
          }`}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-text-primary">280E + 471(c)</div>
              <Badge variant="success" size="sm">Recommended</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Revenue</span>
                <span className="text-text-primary">{formatCurrency(comparison.with471c.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Costs</span>
                <span className="text-text-primary">{formatCurrency(comparison.with471c.totalCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300">Deductible (COGS + 471c)</span>
                <span className="text-emerald-200">{formatCurrency(comparison.with471c.deductibleAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-rose-300">Nondeductible</span>
                <span className="text-rose-200">{formatCurrency(comparison.with471c.nondeductibleAmount)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-primary">Effective Tax Rate</span>
                  <span className="text-emerald-200">{formatPercent(comparison.with471c.effectiveTaxRate)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm font-medium">
                  <span className="text-text-primary">Estimated Tax</span>
                  <span className="text-emerald-200">{formatCurrency(comparison.with471c.estimatedTaxLiability)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Banner */}
        {comparison.uplift > 0 && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-emerald-100">
                  471(c) Election saves {formatCurrency(comparison.uplift)}
                </div>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Additional COGS captured through 471(c) reclassification of inventory-related costs.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-100">
                  {formatPercent(comparison.uplift / grossRevenue)} of revenue
                </div>
                <div className="text-xs text-emerald-100/60">
                  Tax rate drops from {formatPercent(comparison.standard.effectiveTaxRate)} to {formatPercent(comparison.with471c.effectiveTaxRate)}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Line-Item Allocation Detail */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">
          Line-Item 471(c) Allocation Detail
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Each cost category showing traditional 280E treatment vs. 471(c) reclassification impact.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-surface/80 text-xs uppercase tracking-[0.2em] text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Cost Category</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">COGS (280E)</th>
                <th className="px-4 py-3 font-medium">+471(c) Reclass</th>
                <th className="px-4 py-3 font-medium">Nondeductible</th>
                <th className="px-4 py-3 font-medium">Tax Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allocations.map((alloc) => (
                <tr key={alloc.costCode} className="align-top transition hover:bg-surface/60">
                  <td className="px-4 py-4">
                    <div className="font-medium text-text-primary">{alloc.costCode}</div>
                    <div className="mt-1 text-xs text-text-muted">{alloc.costName}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-text-primary">
                    {formatCurrency(alloc.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-emerald-200">
                    {formatCurrency(alloc.deductible280eOnly)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {alloc.additionalDeductible471c > 0 ? (
                      <span className="text-violet-200">+{formatCurrency(alloc.additionalDeductible471c)}</span>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-rose-200">
                    {formatCurrency(alloc.nondeductible)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {alloc.taxSavings471c > 0 ? (
                      <span className="text-emerald-200 font-medium">{formatCurrency(alloc.taxSavings471c)}</span>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-surface/50">
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">Total</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-text-primary">
                  {formatCurrency(comparison.with471c.totalCosts)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-200">
                  {formatCurrency(comparison.standard.deductibleAmount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-violet-200">
                  +{formatCurrency(comparison.with471c.deductibleAmount - comparison.standard.deductibleAmount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-rose-200">
                  {formatCurrency(comparison.with471c.nondeductibleAmount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-200">
                  {formatCurrency(comparison.uplift)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Reclassifiable Costs Breakdown */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-300">
            Reclassifiable Under 471(c) ({reclassifiableCosts.length})
          </div>
          <p className="mt-2 text-xs text-text-muted">
            These costs move partially from nondeductible to COGS under 471(c).
          </p>
          <div className="mt-4 space-y-2">
            {reclassifiableCosts.map((cost) => (
              <div key={cost.code} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
                <span className="font-mono text-xs text-violet-300 shrink-0">{cost.code}</span>
                <div className="flex-1">
                  <div className="text-sm text-text-primary">{cost.name}</div>
                  <div className="text-xs text-text-muted">{cost.description}</div>
                  <div className="mt-1 text-xs text-violet-200">
                    {((cost.reclassifiablePercentage471c ?? 0) * 100).toFixed(0)}% reclassifiable
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-rose-300">
            Permanently Nondeductible ({fullyNondeductible.length})
          </div>
          <p className="mt-2 text-xs text-text-muted">
            These costs stay nondeductible even with 471(c) — no inventory nexus.
          </p>
          <div className="mt-4 space-y-2">
            {fullyNondeductible.map((cost) => (
              <div key={cost.code} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
                <span className="font-mono text-xs text-rose-300 shrink-0">{cost.code}</span>
                <div className="flex-1">
                  <div className="text-sm text-text-primary">{cost.name}</div>
                  <div className="text-xs text-text-muted">{cost.description}</div>
                  <div className="mt-1 text-xs text-rose-200">No 471(c) relief available</div>
                </div>
              </div>
            ))}
            {fullyNondeductible.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-3 text-sm text-text-muted">
                All nondeductible costs have some 471(c) reclassifiable portion.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Method Election Notes */}
      <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-violet-300">
          471(c) Method Election Requirements
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-violet-500/10 bg-surface p-3 text-sm text-text-muted">
            <div className="font-medium text-violet-200">Timely Filing</div>
            <p className="mt-1">Method must be elected on a timely filed <strong>original</strong> return — not an amended return.</p>
          </div>
          <div className="rounded-xl border border-violet-500/10 bg-surface p-3 text-sm text-text-muted">
            <div className="font-medium text-violet-200">Consistency</div>
            <p className="mt-1">Once elected, the method must be applied consistently. Changing requires IRS consent (Form 3115).</p>
          </div>
          <div className="rounded-xl border border-violet-500/10 bg-surface p-3 text-sm text-text-muted">
            <div className="font-medium text-violet-200">Audit Trail</div>
            <p className="mt-1">All 471(c) reclassifications are logged with reviewer attribution for defensible audit support.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
