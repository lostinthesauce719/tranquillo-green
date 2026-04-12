"use client";

import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile } from "@/lib/operator-profiles";

const importSourceLabels: Record<string, { label: string; description: string }> = {
  pos_system: { label: "POS System", description: "Point-of-sale transaction exports (Treez, Dutchie, Blaze, etc.)" },
  bank_csv: { label: "Bank CSV", description: "Bank and credit card statement exports in CSV format" },
  metrc_export: { label: "METRC Export", description: "METRC track-and-trace inventory and transfer data" },
  utility_bills: { label: "Utility Bills", description: "Electric, water, gas bills for cultivation cost allocation" },
  lab_reports: { label: "Lab Reports", description: "Certificate of analysis and lab test result imports" },
  fleet_tracking: { label: "Fleet Tracking", description: "GPS and vehicle tracking data for mileage-based allocation" },
  payroll: { label: "Payroll", description: "Payroll exports for labor-hour-based cost allocation" },
};

export function OperatorImportSources() {
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType);

  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{profile.icon}</span>
        <div>
          <div className="text-sm font-semibold text-text-primary">{profile.label} — Import Sources</div>
          <div className="text-xs text-text-muted">Recommended data imports for {profile.label.toLowerCase()} operations</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profile.importSources.map((sourceId) => {
          const source = importSourceLabels[sourceId] ?? { label: sourceId, description: "" };
          return (
            <div key={sourceId} className="rounded-xl border border-border bg-surface p-3">
              <div className="text-sm font-medium text-text-primary">{source.label}</div>
              <div className="mt-1 text-xs text-text-muted">{source.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
