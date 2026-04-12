"use client";

import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { californiaOperatorDemo } from "@/lib/demo/accounting";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile } from "@/lib/operator-profiles";

/* ---------- inline demo compliance data ---------- */

type LicenseStatus = "active" | "pending" | "expired";
type FilingStatus = "pending" | "ready" | "filed" | "late";
type AlertCategory = "license" | "tax" | "reconciliation" | "allocation";
type AlertSeverity = "info" | "warning" | "critical";

interface DemoCannabisLicense {
  licenseType: string;
  licenseNumber: string;
  state: string;
  status: LicenseStatus;
  issuedAt: number;
  expiresAt: number;
  locationName?: string;
}

interface DemoTaxFiling {
  filingType: string;
  periodLabel: string;
  dueDate: string;
  status: FilingStatus;
  state: string;
}

interface DemoComplianceAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  body: string;
  createdAt: string;
}

const demoLicenses: DemoCannabisLicense[] = californiaOperatorDemo.licenses.map((lic) => ({
  ...lic,
  status: lic.status as LicenseStatus,
}));

const demoTaxFilings: DemoTaxFiling[] = [
  {
    filingType: "CA Cannabis Excise Tax",
    periodLabel: "Q1 2026",
    dueDate: "2026-04-30",
    status: "ready",
    state: "CA",
  },
  {
    filingType: "CA Sales & Use Tax",
    periodLabel: "March 2026",
    dueDate: "2026-04-30",
    status: "pending",
    state: "CA",
  },
  {
    filingType: "CA Cannabis Cultivation Tax Report",
    periodLabel: "Q1 2026",
    dueDate: "2026-04-30",
    status: "filed",
    state: "CA",
  },
];

const demoAlerts: DemoComplianceAlert[] = [
  {
    id: "alert_001",
    category: "license",
    severity: "warning",
    title: "Distribution license expiring in 10 months",
    body: "C11-0009822-LIC (Distribution) expires on 2026-02-28. Begin renewal preparation 90 days before expiry.",
    createdAt: "2026-04-01",
  },
  {
    id: "alert_002",
    category: "tax",
    severity: "critical",
    title: "Excise tax return due in 19 days",
    body: "Q1 2026 California cannabis excise tax return is due April 30. Ensure METRC sales data reconciles to filed amount.",
    createdAt: "2026-04-11",
  },
  {
    id: "alert_003",
    category: "reconciliation",
    severity: "info",
    title: "METRC manifest variance detected",
    body: "Three incoming transfer manifests show weight discrepancies between METRC recorded quantities and received quantities. Investigate before next reconciliation cycle.",
    createdAt: "2026-04-10",
  },
];

/* ---------- helpers ---------- */

const statusTone: Record<LicenseStatus, "emerald" | "amber" | "rose"> = {
  active: "emerald",
  pending: "amber",
  expired: "rose",
};

const filingTone: Record<FilingStatus, "emerald" | "amber" | "blue" | "rose"> = {
  filed: "emerald",
  ready: "blue",
  pending: "amber",
  late: "rose",
};

const severityTone: Record<AlertSeverity, "blue" | "amber" | "rose"> = {
  info: "blue",
  warning: "amber",
  critical: "rose",
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- page component ---------- */

const complianceItemLabels: Record<string, { label: string; description: string; category: string }> = {
  retail_license: { label: "Retail License", description: "State and local retail cannabis license compliance", category: "License" },
  local_permits: { label: "Local Permits", description: "City and county operating permits and conditional use permits", category: "Permits" },
  sales_tax: { label: "Sales Tax", description: "State and local sales tax collection and remittance", category: "Tax" },
  metrc_reconciliation: { label: "METRC Reconciliation", description: "Inventory and sales reconciliation with METRC track-and-trace", category: "Reconciliation" },
  cultivation_license: { label: "Cultivation License", description: "State cultivation license and tier compliance", category: "License" },
  metrc_plant_tracking: { label: "METRC Plant Tracking", description: "Plant lifecycle tracking from seed/clone to harvest", category: "Tracking" },
  harvest_manifests: { label: "Harvest Manifests", description: "Harvest batch documentation and transfer manifests", category: "Manifests" },
  lab_testing: { label: "Lab Testing", description: "Required potency, contaminant, and compliance testing", category: "Testing" },
  manufacturing_license: { label: "Manufacturing License", description: "State manufacturing and processing license", category: "License" },
  metrc_batch_tracking: { label: "METRC Batch Tracking", description: "Batch-level tracking from input materials to finished goods", category: "Tracking" },
  gmp_audit: { label: "GMP Audit", description: "Good Manufacturing Practice compliance and audit readiness", category: "Audit" },
  lab_certificates: { label: "Lab Certificates", description: "Certificate of analysis for all finished products", category: "Testing" },
  distributor_license: { label: "Distributor License", description: "State distribution and transport license", category: "License" },
  metrc_manifests: { label: "METRC Manifests", description: "Manifest accuracy and timely submission", category: "Manifests" },
  transport_permits: { label: "Transport Permits", description: "Vehicle and driver transport permits and compliance", category: "Permits" },
  chain_of_custody: { label: "Chain of Custody", description: "Documentation of product custody throughout distribution", category: "Documentation" },
  all_licenses: { label: "All Licenses", description: "Comprehensive license tracking across all operation types", category: "License" },
  metrc_full: { label: "METRC Full Sync", description: "Complete METRC integration across cultivation, manufacturing, and retail", category: "Tracking" },
  intercompany_transfers: { label: "Intercompany Transfers", description: "Transfer pricing and documentation between operating entities", category: "Transfers" },
  consolidated_reporting: { label: "Consolidated Reporting", description: "Consolidated financial and compliance reporting across entities", category: "Reporting" },
};

export default function CompliancePage() {
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType);
  const activeLicenseCount = demoLicenses.filter((l) => l.status === "active").length;
  const pendingFilings = demoTaxFilings.filter((f) => f.status !== "filed").length;
  const unresolvedAlerts = demoAlerts.length;
  const criticalAlerts = demoAlerts.filter((a) => a.severity === "critical").length;

  return (
    <AppShell
      title="Compliance"
      description="California cannabis license tracking, tax filing calendar, and regulatory alerts. Rendering from demo fallback data so static builds stay safe while the Convex compliance backend matures."
    >
      {/* metric cards row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active licenses"
          value={String(activeLicenseCount)}
          detail={`${demoLicenses.length} total across CA operations`}
        />
        <MetricCard
          label="Pending filings"
          value={String(pendingFilings)}
          detail={`${demoTaxFilings.length} filings tracked this quarter`}
        />
        <MetricCard
          label="Open alerts"
          value={String(unresolvedAlerts)}
          detail={`${criticalAlerts} critical, requires immediate action`}
        />
        <MetricCard
          label="METRC sync"
          value="Coming Soon"
          detail="Automatic manifest, inventory, and sales reconciliation"
        />
      </div>

      {/* METRC coming-soon banner */}
      <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">METRC Integration</h2>
              <AccountingStatusBadge label="Coming Soon" tone="violet" />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Automatic bi-directional sync with California METRC track-and-trace. Manifest reconciliation,
              inventory snapshot alignment, and sales reporting will be available in a future release. License
              and filing data shown here use manual entry or demo fallback.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm">
            <div className="text-xs uppercase tracking-[0.15em] text-text-muted">Target</div>
            <div className="mt-1 font-medium text-text-primary">Q3 2026</div>
          </div>
        </div>
      </div>

      {/* two-column layout: licenses + filings */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* license cards */}
        <section>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Cannabis Licenses</div>
          <h2 className="mt-2 text-xl font-semibold">License Status</h2>
          <p className="mt-2 text-sm text-text-muted">
            California DCC and CDPH licenses for all active locations. Track renewal windows and status changes.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demoLicenses.map((license) => {
              const daysLeft = daysUntil(new Date(license.expiresAt).toISOString().slice(0, 10));
              const isExpiringSoon = daysLeft <= 90 && daysLeft > 0;
              return (
                <div
                  key={license.licenseNumber}
                  className="rounded-2xl border border-border bg-surface-mid p-5 transition hover:border-border/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-text-primary">{license.licenseType}</div>
                    <AccountingStatusBadge
                      label={license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                      tone={statusTone[license.status]}
                    />
                  </div>
                  <div className="mt-3 font-mono text-xs text-text-muted">{license.licenseNumber}</div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">State</dt>
                      <dd>{license.state}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Issued</dt>
                      <dd>{formatDate(license.issuedAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Expires</dt>
                      <dd>{formatDate(license.expiresAt)}</dd>
                    </div>
                  </dl>
                  {isExpiringSoon && (
                    <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      Expires in {daysLeft} days - begin renewal
                    </div>
                  )}
                  {license.locationName && (
                    <div className="mt-3 text-xs text-text-muted">{license.locationName}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* filing calendar */}
        <section>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Tax Filing Calendar</div>
          <h2 className="mt-2 text-xl font-semibold">Upcoming Filings</h2>
          <p className="mt-2 text-sm text-text-muted">
            California excise tax, sales tax, and cultivation reporting deadlines for the current quarter.
          </p>
          <div className="mt-4 space-y-3">
            {demoTaxFilings.map((filing, idx) => {
              const daysLeft = daysUntil(filing.dueDate);
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-surface-mid p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{filing.filingType}</div>
                      <div className="mt-1 text-xs text-text-muted">{filing.periodLabel} - {filing.state}</div>
                    </div>
                    <AccountingStatusBadge
                      label={filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
                      tone={filingTone[filing.status]}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-text-muted">Due date</span>
                    <span className="font-medium">
                      {new Date(filing.dueDate + "T00:00:00Z").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {daysLeft > 0 && filing.status !== "filed" && (
                    <div className={`mt-2 text-xs ${daysLeft <= 30 ? "text-amber-300" : "text-text-muted"}`}>
                      {daysLeft} days remaining
                    </div>
                  )}
                  {filing.status === "filed" && (
                    <div className="mt-2 text-xs text-emerald-300">Filed and reconciled</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* operator-specific compliance items */}
      <section className="mt-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{profile.icon}</span>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">{profile.label} Compliance</div>
            <h2 className="text-xl font-semibold">Operator-Specific Requirements</h2>
          </div>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Compliance items specific to {profile.label.toLowerCase()} operations. {profile.tagline}.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profile.complianceItems.map((itemId) => {
            const item = complianceItemLabels[itemId] ?? { label: itemId, description: "", category: "General" };
            return (
              <div key={itemId} className="rounded-2xl border border-border bg-surface-mid p-5">
                <AccountingStatusBadge label={item.category} tone="slate" />
                <div className="mt-2 text-sm font-medium text-text-primary">{item.label}</div>
                <p className="mt-1 text-xs text-text-muted">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* compliance alerts */}
      <section className="mt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Compliance Alerts</div>
        <h2 className="mt-2 text-xl font-semibold">Active Alerts</h2>
        <p className="mt-2 text-sm text-text-muted">
          Regulatory, tax, and operational alerts requiring attention. Sorted by severity.
        </p>
        <div className="mt-4 space-y-3">
          {demoAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border bg-surface-mid p-5 ${
                alert.severity === "critical"
                  ? "border-rose-500/30"
                  : alert.severity === "warning"
                    ? "border-amber-500/20"
                    : "border-border"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AccountingStatusBadge
                      label={alert.severity.toUpperCase()}
                      tone={severityTone[alert.severity]}
                    />
                    <AccountingStatusBadge
                      label={alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                      tone="slate"
                    />
                  </div>
                  <div className="mt-2 text-sm font-medium text-text-primary">{alert.title}</div>
                  <p className="mt-1 text-sm text-text-muted">{alert.body}</p>
                </div>
                <div className="shrink-0 text-xs text-text-muted">
                  {new Date(alert.createdAt + "T00:00:00Z").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* source indicator */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        <span className="text-accent">Demo fallback source</span> - This compliance workspace renders from
        inline demo data. Convex integration for <code className="rounded bg-surface px-1 py-0.5 text-xs">cannabisLicenses</code>,{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">taxFilings</code>,{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">complianceAlerts</code>, and{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">complianceDocuments</code> will replace
        the fallback once the compliance backend is seeded.
      </div>
    </AppShell>
  );
}
