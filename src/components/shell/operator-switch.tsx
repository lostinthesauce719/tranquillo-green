"use client";

import { useState } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, OPERATOR_PROFILES } from "@/lib/operator-profiles";
import type { OperatorType } from "@/lib/navigation";

const ALL_TYPES: { value: OperatorType; label: string; short: string; icon: string }[] = [
  { value: "dispensary", label: "Dispensary", short: "Retail", icon: "🏪" },
  { value: "cultivator", label: "Cultivator", short: "Grow", icon: "🌱" },
  { value: "manufacturer", label: "Manufacturer", short: "Mfg", icon: "⚗️" },
  { value: "distributor", label: "Distributor", short: "Dist", icon: "🚛" },
  { value: "vertical", label: "Vertical", short: "All", icon: "🌿" },
];

/**
 * Compact inline operator type switcher for the sidebar.
 * Shows current type, click to expand dropdown, switch or toggle additional ops.
 */
export function OperatorTypeSwitch({ inline = false }: { inline?: boolean }) {
  const tenant = useTenant();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentType = tenant.operatorType;
  const currentInfo = ALL_TYPES.find((t) => t.value === currentType);
  const profile = getOperatorProfile(currentType);

  async function handleSwitch(newType: OperatorType) {
    if (newType === currentType) {
      setExpanded(false);
      return;
    }
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

  if (!inline) return null;

  return (
    <div className="mx-4 my-2">
      {/* Current type button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-overlay/40 px-3 py-2.5 text-left transition hover:bg-surface-overlay/70"
      >
        <span className="text-base">{currentInfo?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-text-primary">{currentInfo?.label}</div>
          <div className="text-[10px] text-text-faint truncate">{profile.tagline}</div>
        </div>
        <svg
          className={`h-3.5 w-3.5 text-text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {expanded && (
        <div className="mt-1.5 rounded-xl border border-border-subtle bg-surface-raised p-1.5 space-y-0.5">
          {ALL_TYPES.map((type) => {
            const active = type.value === currentType;
            return (
              <button
                key={type.value}
                onClick={() => handleSwitch(type.value)}
                disabled={saving}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  active
                    ? "bg-brand-soft text-text-primary"
                    : "text-text-muted hover:bg-surface-overlay hover:text-text-primary"
                }`}
              >
                <span className="text-sm">{type.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-medium">{type.label}</div>
                </div>
                {active && (
                  <svg className="h-3.5 w-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Stats footer */}
          <div className="border-t border-border-subtle mt-1.5 pt-1.5 px-2.5 pb-1">
            <div className="flex gap-3 text-[10px] text-text-faint">
              <span>{profile.costCategories.length} categories</span>
              <span>•</span>
              <span>{profile.allocationMethods.length} methods</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
