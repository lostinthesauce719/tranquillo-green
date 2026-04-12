"use client";

import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, getDefaultAllocationMethod } from "@/lib/operator-profiles";

export function OperatorCloseInfo() {
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType);
  const defaultMethod = getDefaultAllocationMethod(tenant.operatorType);

  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{profile.icon}</span>
        <div>
          <div className="text-sm font-semibold text-text-primary">{profile.label} — Close Profile</div>
          <div className="text-xs text-text-muted">{profile.tagline}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-xs text-text-muted uppercase tracking-wider">Key Metrics</div>
          <ul className="mt-1 space-y-0.5">
            {profile.dashboardMetrics.map((metric) => (
              <li key={metric} className="text-xs text-text-primary">
                {metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-xs text-text-muted uppercase tracking-wider">Default Allocation</div>
          <div className="mt-1 font-medium text-text-primary text-sm">{defaultMethod.name}</div>
          <div className="text-xs text-text-muted">{defaultMethod.description}</div>
          <div className="mt-2 text-xs text-text-muted uppercase tracking-wider">Cost Categories</div>
          <div className="mt-1 space-y-0.5">
            {profile.costCategories.map((cat) => (
              <div key={cat.code} className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-accent">{cat.code}</span>
                <span className="text-text-muted">{cat.name}</span>
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] ${
                  cat.taxTreatment === "cogs" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                }`}>
                  {cat.taxTreatment}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
