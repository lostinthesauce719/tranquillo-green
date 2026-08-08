"use client";

import { AppShell } from "@/components/shell/app-shell";
import { SupportScheduleClient } from "./support-schedule-client";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, getCogsCategories, getNondeductibleCategories, getReclassifiable471cCosts, getFullyNondeductibleCosts } from "@/lib/operator-profiles";

export default function SupportSchedulePage() {
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType ?? "vertical");
  const cogsCategories = getCogsCategories(tenant.operatorType ?? "vertical");
  const nondeductibleCategories = getNondeductibleCategories(tenant.operatorType ?? "vertical");
  const reclassifiable471c = getReclassifiable471cCosts(tenant.operatorType ?? "vertical");
  const fullyNondeductible = getFullyNondeductibleCosts(tenant.operatorType ?? "vertical");

  return (
    <AppShell
      title="280E support schedule"
      description="Deductible versus nondeductible allocations for the selected period, with the measured basis behind each one. Built from your posted transactions."
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
            These costs are nondeductible under 280E alone, but may be capitalized into COGS under an IRC 471(c) election. Which of them qualify, and in what proportion, depends on your own measurements — square footage, hours, or another basis you can evidence.
          </p>
          {/*
            This block previously printed a percentage against each category —
            "45% → COGS under 471(c)" and so on. Those figures were invented.
            They are the same hardcoded 45/55 constants that were removed from
            the allocation engine, and they survived here, on the one page whose
            job is to be defensible.

            A number on a support schedule implies a measurement behind it. These
            had none. The categories themselves are useful orientation, so they
            stay; the fabricated proportions do not.
          */}
          <p className="mt-2 text-xs text-violet-200/80">
            No percentage is shown here on purpose. A reclassification rate has to
            come from your facility and payroll figures, not from a category
            default. The schedule below states the measured basis actually used
            for each cost.
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
                    <div className="text-xs text-violet-200">Eligible for 471(c) treatment — rate must be measured</div>
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

      <SupportScheduleClient />
    </AppShell>
  );
}
