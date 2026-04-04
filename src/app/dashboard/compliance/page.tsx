import { AppShell } from "@/components/shell/app-shell";

export default function CompliancePage() {
  return (
    <AppShell title="Compliance" description="California license tracking, filing calendar, alerts, and audit bundle generation.">
      <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        Core entities: cannabisLicenses, taxProfiles, taxFilings, complianceAlerts, complianceDocuments.
      </div>
    </AppShell>
  );
}
