import { AppShell } from "@/components/shell/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" description="Company profile, locations, licenses, integrations, roles, and accounting preferences.">
      <div className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        Future wiring: Clerk org membership, Convex-backed company settings, Metrc credentials, and export preferences.
      </div>
    </AppShell>
  );
}
