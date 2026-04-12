"use client";

import { useState } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, OPERATOR_PROFILES } from "@/lib/operator-profiles";
import type { OperatorType } from "@/lib/navigation";

const ALL_OPERATOR_TYPES: { value: OperatorType; label: string; icon: string }[] = [
  { value: "dispensary", label: "Dispensary", icon: "🏪" },
  { value: "cultivator", label: "Cultivator", icon: "🌱" },
  { value: "manufacturer", label: "Manufacturer", icon: "⚗️" },
  { value: "distributor", label: "Distributor", icon: "🚛" },
  { value: "vertical", label: "Vertical", icon: "🌿" },
];

export function OperatorBanner() {
  const tenant = useTenant();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [additionalTypes, setAdditionalTypes] = useState<string[]>(
    (tenant as any).additionalOperatorTypes ?? []
  );

  const currentType = tenant.operatorType;
  const profile = getOperatorProfile(currentType);
  const currentInfo = ALL_OPERATOR_TYPES.find((t) => t.value === currentType);

  async function handleSwitchType(newType: OperatorType) {
    if (newType === currentType) return;
    setSaving(true);

    try {
      await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: tenant.companyId,
          operatorType: newType,
        }),
      });
      window.location.reload();
    } catch {
      setSaving(false);
    }
  }

  async function handleToggleAdditional(type: string) {
    const newTypes = additionalTypes.includes(type)
      ? additionalTypes.filter((t) => t !== type)
      : [...additionalTypes, type];

    setAdditionalTypes(newTypes);
    setSaving(true);

    try {
      await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: tenant.companyId,
          additionalOperatorTypes: newTypes,
        }),
      });
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface-raised overflow-hidden">
      {/* Main bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-overlay/50"
      >
        <span className="text-xl">{currentInfo?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{profile.label}</span>
            {additionalTypes.length > 0 && (
              <span className="text-xs text-text-muted">
                + {additionalTypes.length} more
              </span>
            )}
          </div>
          <div className="text-xs text-text-muted truncate">{profile.tagline}</div>
        </div>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Primary operation */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-text-faint mb-2">Primary Operation</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {ALL_OPERATOR_TYPES.map((type) => {
                const active = type.value === currentType;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleSwitchType(type.value)}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-brand bg-brand-soft text-text-primary"
                        : "border-border bg-surface hover:border-brand/50 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional operations */}
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-text-faint mb-2">
              Additional Operations
              <span className="ml-2 text-text-muted">(affects cost categories and compliance)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_OPERATOR_TYPES.filter((t) => t.value !== "vertical" && t.value !== currentType).map((type) => {
                const active = additionalTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => handleToggleAdditional(type.value)}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-accent bg-accent-soft text-text-primary"
                        : "border-border bg-surface hover:border-accent/50 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                    {active && <span className="ml-auto text-accent text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 pt-1">
            <div className="text-xs text-text-faint">
              {profile.costCategories.filter((c) => c.taxTreatment === "cogs").length} COGS categories
            </div>
            <div className="text-xs text-text-faint">
              {profile.allocationMethods.length} allocation methods
            </div>
            <div className="text-xs text-text-faint">
              {profile.complianceItems.length} compliance items
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
