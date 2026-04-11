"use client";

import { useUser } from "@clerk/nextjs";
import { useTenant } from "@/lib/auth/tenant-context";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { AppShell } from "@/components/shell/app-shell";
import { californiaOperatorDemo } from "@/lib/demo/accounting";

const roleBadgeColor: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300",
  controller: "bg-blue-500/20 text-blue-300",
  accountant: "bg-emerald-500/20 text-emerald-300",
  viewer: "bg-neutral-500/20 text-neutral-300",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}>
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const tenant = useTenant();
  const { user } = useUser();

  const demo = californiaOperatorDemo;
  const company = demo.company;
  const locations = demo.locations;
  const role = tenant.role;

  const operatorTypeLabels: Record<string, string> = {
    dispensary: "Dispensary",
    cultivator: "Cultivator",
    manufacturer: "Manufacturer",
    distributor: "Distributor",
    vertical: "Vertical Integration",
  };

  const accountingMethodLabels: Record<string, string> = {
    cash: "Cash Basis",
    accrual: "Accrual Basis",
  };

  return (
    <AppShell
      title="Settings"
      description="Company profile, locations, licenses, integrations, roles, and accounting preferences."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Profile */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Company Profile</div>
          <h2 className="mt-2 text-xl font-semibold">{company.name}</h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            Read-only display of company configuration sourced from the demo tenant. Editing will be unlocked when Convex-backed settings are wired.
          </p>
          <div className="mt-5 space-y-4">
            <InfoRow label="State" value={company.state === "CA" ? "California" : company.state} />
            <InfoRow label="Operator Type" value={operatorTypeLabels[company.operatorType] ?? company.operatorType} />
            <InfoRow label="Accounting Method" value={accountingMethodLabels[company.defaultAccountingMethod] ?? company.defaultAccountingMethod} />
            <InfoRow label="Status" value={company.status.charAt(0).toUpperCase() + company.status.slice(1)} />
            <InfoRow label="Timezone" value={company.timezone} />
          </div>
        </section>

        {/* Current User Info */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Current User</div>
          <h2 className="mt-2 text-xl font-semibold">{user?.fullName ?? user?.firstName ?? "Loading..."}</h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            Your account details and role within this tenant.
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Email</span>
              <span className="text-sm font-medium text-text-primary">
                {user?.primaryEmailAddress?.emailAddress ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Role</span>
              <Badge className={roleBadgeColor[role]}>
                {ROLE_LABELS[role]}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Tenant</span>
              <span className="text-sm font-medium text-text-primary">{tenant.companyName}</span>
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Locations</div>
          <h2 className="mt-2 text-xl font-semibold">Licensed Facilities</h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            Company locations and their associated license numbers. Primary location is used for default reporting.
          </p>
          <ul className="mt-5 space-y-3">
            {locations.map((location) => (
              <li key={location.licenseNumber} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{location.name}</span>
                      {location.isPrimary && (
                        <Badge className="bg-accent/20 text-accent">Primary</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-text-muted">{location.city}, {location.state}</div>
                    <div className="mt-2 text-xs font-mono text-text-muted">{location.licenseNumber}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Integration Status */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Integrations</div>
          <h2 className="mt-2 text-xl font-semibold">Connection Status</h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            Current integration connections and their status. Additional integrations will be available as the platform matures.
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Clerk</div>
                  <div className="mt-1 text-xs text-text-muted">Authentication and user management</div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">Connected</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Convex</div>
                  <div className="mt-1 text-xs text-text-muted">Real-time database and backend</div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">Connected</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Metrc</div>
                  <div className="mt-1 text-xs text-text-muted">Cannabis compliance tracking system</div>
                </div>
                <Badge className="bg-neutral-500/20 text-neutral-300">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
