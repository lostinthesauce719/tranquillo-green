"use client";

import { AppShell } from "@/components/shell/app-shell";
import { SupportScheduleReport } from "@/components/accounting/support-schedule-report";
import { demoSupportScheduleReport } from "@/lib/demo/accounting-reports";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, getCogsCategories, getNondeductibleCategories, getReclassifiable471cCosts, getFullyNondeductibleCosts } from "@/lib/operator-profiles";

export default function SupportSchedulePage() {
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType);
  const cogsCategories = getCogsCategories(tenant.operatorType);
  const nondeductibleCategories = getNondeductibleCategories(tenant.operatorType);
  const reclassifiable471c = getReclassifiable471cCosts(tenant.operatorType);
  const fullyNondeductible = getFullyNondeductibleCosts(tenant.operatorType);

  return (
    <AppShell
      title="280E support schedule"
      description="First-pass support schedule for deductible versus nondeductible allocations. The page is demo-backed and static-safe, but organized like an audit-ready monthly tax workpaper."
    >
      {/* Operator-specific COGS vs nondeductible breakdown */}
      <div className="mb-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{profile.icon}</span>
          <div>
            <div className="text-sm font-semibold text-text-primary">{profile.label} — Cost Category Breakdown</div>
            <div className="text-xs text-text-muted">{profile.tagline}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="text-xs uppercase tracking-wider text-emerald-400">COGS (Deductible)</div>
            <div className="mt-2 space-y-2">
              {cogsCategories.map((cat) => (
                <div key={cat.code} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-xs text-emerald-300 shrink-0">{cat.code}</span>
                  <div>
                    <div className="text-text-primary">{cat.name}</div>
                    <div className="text-xs text-text-muted">{cat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="text-xs uppercase tracking-wider text-rose-400">Nondeductible (280E Limited)</div>
            <div className="mt-2 space-y-2">
              {nondeductibleCategories.map((cat) => (
                <div key={cat.code} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-xs text-rose-300 shrink-0">{cat.code}</span>
                  <div>
                    <div className="text-text-primary">{cat.name}</div>
                    <div className="text-xs text-text-muted">{cat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 471(c) Reclassification Breakdown */}
        <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-violet-400">IRC 471(c) Reclassifiable Costs</span>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-300">Key Advantage</span>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            These costs are nondeductible under 280E alone, but can be capitalized into COGS under IRC 471(c) small business inventory method election.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-violet-300 font-medium">Reclassifiable ({reclassifiable471c.length})</div>
              {reclassifiable471c.map((cat) => (
                <div key={cat.code} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-xs text-violet-300 shrink-0">{cat.code}</span>
                  <div>
                    <div className="text-text-primary">{cat.name}</div>
                    <div className="text-xs text-text-muted">{cat.description}</div>
                    <div className="text-xs text-violet-200">{((cat.reclassifiablePercentage471c ?? 0) * 100).toFixed(0)}% → COGS under 471(c)</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-rose-300 font-medium">Permanently Nondeductible ({fullyNondeductible.length})</div>
              {fullyNondeductible.map((cat) => (
                <div key={cat.code} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-xs text-rose-300 shrink-0">{cat.code}</span>
                  <div>
                    <div className="text-text-primary">{cat.name}</div>
                    <div className="text-xs text-text-muted">{cat.description}</div>
                    <div className="text-xs text-rose-200">No 471(c) relief available</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SupportScheduleReport report={demoSupportScheduleReport} />
    </AppShell>
  );
}
