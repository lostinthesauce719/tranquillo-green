import { AppShell } from "@/components/shell/app-shell";

/* ── Demo data ────────────────────────────────────────────────── */

const companyProfile = {
  name: "Green Harvest CA",
  slug: "green-harvest-ca",
  timezone: "America/Los_Angeles",
  state: "California",
  operatorType: "Vertical (Cultivation · Manufacturing · Retail)",
  accountingMethod: "Accrual",
  status: "Active",
};

const locations = [
  {
    name: "Richmond Manufacturing Hub",
    primary: true,
    license: "CDPH-T00012345",
    city: "Richmond",
    sqft: "14,200",
  },
  {
    name: "Oakland Dispensary",
    primary: false,
    license: "C10-0000987",
    city: "Oakland",
    sqft: "3,800",
  },
];

const integrations = [
  {
    name: "Metrc API",
    description: "State track-and-trace system",
    status: "Connected",
    statusColor: "bg-emerald-500/20 text-emerald-300",
    detail: "Last sync: Apr 6 2026, 7:42 PM PST",
  },
  {
    name: "POS System (Dutchie)",
    description: "Point-of-sale integration",
    status: "Not Configured",
    statusColor: "bg-neutral-500/20 text-neutral-400",
    detail: null,
  },
  {
    name: "Banking (SVB)",
    description: "Bank feed / transaction import",
    status: "CSV Import",
    statusColor: "bg-amber-500/20 text-amber-300",
    detail: "Last import: Apr 4 2026 — 218 transactions",
  },
  {
    name: "Payroll (Gusto)",
    description: "Payroll journal entries",
    status: "Not Configured",
    statusColor: "bg-neutral-500/20 text-neutral-400",
    detail: null,
  },
];

const teamMembers = [
  { name: "Maria Chen", email: "maria@greenharvestca.com", role: "Owner", status: "Active", statusColor: "bg-emerald-500/20 text-emerald-300" },
  { name: "James Wilson", email: "james@greenharvestca.com", role: "Controller", status: "Active", statusColor: "bg-emerald-500/20 text-emerald-300" },
  { name: "Sarah Park", email: "sarah@greenharvestca.com", role: "Accountant", status: "Active", statusColor: "bg-emerald-500/20 text-emerald-300" },
  { name: "David Kim", email: "david@greenharvestca.com", role: "Viewer", status: "Invited", statusColor: "bg-blue-500/20 text-blue-300" },
];

const accountingPrefs = [
  { label: "Fiscal Year Start", value: "January 1" },
  { label: "Default Currency", value: "USD" },
  { label: "Close Window", value: "5 business days after period end" },
  { label: "Auto-Post Threshold", value: "$500.00" },
];

/* ── Shared UI pieces ─────────────────────────────────────────── */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          {title}
        </h2>
        <button
          disabled
          className="rounded-lg border border-border px-3 py-1 text-xs text-text-muted/40 cursor-not-allowed"
        >
          Edit
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-text-muted/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-text-primary">{value}</dd>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Organization configuration, integrations, team management, and accounting preferences for Green Harvest CA."
    >
      <div className="space-y-6">
        {/* Company Profile */}
        <Card title="Company Profile">
          <div className="flex items-start justify-between">
            <dl className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-3">
              <Field label="Company Name" value={companyProfile.name} />
              <Field label="Slug" value={companyProfile.slug} />
              <Field label="Timezone" value={companyProfile.timezone} />
              <Field label="State" value={companyProfile.state} />
              <Field label="Operator Type" value={companyProfile.operatorType} />
              <Field label="Accounting Method" value={companyProfile.accountingMethod} />
            </dl>
            <Badge
              label={companyProfile.status}
              className="bg-emerald-500/20 text-emerald-300 shrink-0"
            />
          </div>
        </Card>

        {/* Locations */}
        <Card title="Locations">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-muted/60">
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">License #</th>
                  <th className="pb-2 pr-4 font-medium">City</th>
                  <th className="pb-2 pr-4 font-medium text-right">Sq Ft</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr
                    key={loc.name}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      {loc.name}
                      {loc.primary && (
                        <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-text-muted">
                      {loc.license}
                    </td>
                    <td className="py-3 pr-4">{loc.city}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {loc.sqft}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Integrations */}
        <Card title="Integrations">
          <div className="space-y-4">
            {integrations.map((integ) => (
              <div
                key={integ.name}
                className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium">{integ.name}</div>
                  <div className="text-xs text-text-muted">
                    {integ.description}
                  </div>
                  {integ.detail && (
                    <div className="mt-1 text-[11px] text-text-muted/60">
                      {integ.detail}
                    </div>
                  )}
                </div>
                <Badge label={integ.status} className={integ.statusColor} />
              </div>
            ))}
          </div>
        </Card>

        {/* Team & Roles */}
        <Card title="Team & Roles">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-text-muted/60">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr
                    key={m.email}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium">{m.name}</td>
                    <td className="py-3 pr-4 text-text-muted">{m.email}</td>
                    <td className="py-3 pr-4">{m.role}</td>
                    <td className="py-3 text-right">
                      <Badge label={m.status} className={m.statusColor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Accounting Preferences */}
        <Card title="Accounting Preferences">
          <dl className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-4">
            {accountingPrefs.map((pref) => (
              <Field key={pref.label} label={pref.label} value={pref.value} />
            ))}
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
