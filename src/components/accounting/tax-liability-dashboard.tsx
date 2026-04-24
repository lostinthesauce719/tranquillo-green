"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/auth/tenant-context";

type TaxLiabilityDashboardProps = any;
  className?: string;
}

export function TaxLiabilityDashboard({ className }: TaxLiabilityDashboardProps) {
  const tenant = useTenant();
  const companyId = tenant.companyId;

  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d.getTime();
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23,59,59,999);
    return d.getTime();
  });
  const [liability, setLiability] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tax/liability?companyId=${companyId}&periodStart=${periodStart}&periodEnd=${periodEnd}`);
      const data = await res.json();
      if (data.ok) setLiability(data);
    } catch (e) {
      console.error("Failed to load tax liability", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [companyId, periodStart, periodEnd]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  return (
    <section className={`rounded-2xl border border-border bg-surface-mid p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text-primary">Tax Liability</h3>
          <p className="text-sm text-text-muted">Outstanding tax owed by jurisdiction for selected period.</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              const d = new Date();
              d.setMonth(d.getMonth() - 1, 1);
              setPeriodStart(new Date(d.getFullYear(), d.getMonth(), 1).getTime());
              setPeriodEnd(new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime());
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-brand hover:text-text-primary"
          >
            Previous Month
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(1);
              setPeriodStart(d.getTime());
              d.setMonth(d.getMonth() + 1, 0);
              setPeriodEnd(d.getTime());
            }}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs text-brand hover:bg-brand/10"
          >
            Current Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-text-muted">Loading liability…</div>
      ) : liability?.byJurisdiction?.length ? (
        <div className="space-y-4">
          {liability.byJurisdiction.map((j: any) => (
            <div key={j.jurisdictionId} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">{j.name}</h4>
                  <p className="text-xs text-text-muted">By tax type:</p>
                </div>
                <div className="text-lg font-mono font-semibold text-accent">{formatCurrency(j.total)}</div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {j.byTaxType.map((t: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-border/50 bg-surface-mid px-3 py-2">
                    <div className="text-xs text-text-muted">{t.code.toUpperCase()}</div>
                    <div className="text-sm font-medium text-text-primary">{formatCurrency(t.amount)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button className="rounded-lg border border-brand bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/20">
                  View Details
                </button>
              </div>
            </div>
          ))}
          <div className="rounded-xl border-2 border-brand/30 bg-brand/5 p-4 text-center">
            <span className="text-sm text-text-muted">Total liability across all jurisdictions:</span>
            <div className="mt-1 text-2xl font-mono font-bold text-accent">{formatCurrency(liability.grandTotal)}</div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-text-muted">
          No tax liability recorded for this period. Configure tax types and run calculations after processing sales.
        </div>
      )}
    </section>
  );
}
