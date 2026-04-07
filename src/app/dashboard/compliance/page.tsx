import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import {
  summarizeCompliance,
  DEMO_LICENSES,
  DEMO_TAX_FILINGS,
  DEMO_COMPLIANCE_ALERTS,
  DEMO_COMPLIANCE_DOCUMENTS,
} from "@/lib/demo/compliance";

/* ── helpers ─────────────────────────────────────────────────────── */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function daysLeftColor(days: number) {
  if (days < 30) return "text-red-400";
  if (days < 90) return "text-amber-400";
  return "text-emerald-400";
}

function licenseStatusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-amber-500/15 text-amber-400",
    expired: "bg-red-500/15 text-red-400",
    renewal: "bg-blue-500/15 text-blue-400",
  };
  return map[status] ?? "bg-zinc-700 text-zinc-300";
}

function filingStatusBadge(status: string) {
  const map: Record<string, string> = {
    filed: "bg-emerald-500/15 text-emerald-400",
    ready: "bg-blue-500/15 text-blue-400",
    pending: "bg-amber-500/15 text-amber-400",
    late: "bg-red-500/15 text-red-400",
  };
  return map[status] ?? "bg-zinc-700 text-zinc-300";
}

function severityIcon(sev: string) {
  if (sev === "critical") return "🔴";
  if (sev === "warning") return "🟡";
  return "🔵";
}

function severityColor(sev: string) {
  if (sev === "critical") return "border-red-500/40";
  if (sev === "warning") return "border-amber-500/40";
  return "border-blue-500/40";
}

function categoryBadge(cat: string) {
  const map: Record<string, string> = {
    license: "bg-violet-500/15 text-violet-400",
    tax: "bg-rose-500/15 text-rose-400",
    reconciliation: "bg-cyan-500/15 text-cyan-400",
    allocation: "bg-orange-500/15 text-orange-400",
  };
  return map[cat] ?? "bg-zinc-700 text-zinc-300";
}

function docStatusBadge(status: string) {
  const map: Record<string, string> = {
    current: "bg-emerald-500/15 text-emerald-400",
    archived: "bg-zinc-500/15 text-zinc-400",
    draft: "bg-amber-500/15 text-amber-400",
  };
  return map[status] ?? "bg-zinc-700 text-zinc-300";
}

function docTypeLabel(t: string) {
  const map: Record<string, string> = {
    license_copy: "License Copy",
    tax_return: "Tax Return",
    audit_packet: "Audit Packet",
    sop: "SOP",
  };
  return map[t] ?? t;
}

/* ── page ────────────────────────────────────────────────────────── */

export default function CompliancePage() {
  const summary = summarizeCompliance();

  return (
    <AppShell
      title="Compliance"
      description="California license tracking, filing calendar, alerts, and audit bundle generation for Green Harvest CA."
    >
      {/* ── Metric cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Licenses"
          value={String(summary.activeLicenses)}
          detail={`${summary.expiringLicenses} expiring within 90 days`}
        />
        <MetricCard
          label="Pending Filings"
          value={String(summary.pendingFilings)}
          detail={`${summary.overdueFilings} overdue — action required`}
        />
        <MetricCard
          label="Critical Alerts"
          value={String(summary.criticalAlerts)}
          detail={`${summary.totalAlerts} total unresolved alerts`}
        />
        <MetricCard
          label="Documents on File"
          value={String(summary.documentsOnFile)}
          detail="Current licenses, returns & SOPs"
        />
      </div>

      {/* ── Licenses table ────────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          License Registry
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4">License #</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Issued</th>
                <th className="pb-3 pr-4">Expires</th>
                <th className="pb-3 text-right">Days Left</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LICENSES.map((lic) => (
                <tr
                  key={lic.id}
                  className="border-b border-border/50 text-text-primary"
                >
                  <td className="py-3 pr-4 font-mono text-xs">
                    {lic.licenseNumber}
                  </td>
                  <td className="py-3 pr-4">{lic.licenseType}</td>
                  <td className="py-3 pr-4 text-text-muted">
                    {lic.locationName}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${licenseStatusBadge(lic.status)}`}
                    >
                      {lic.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-muted">
                    {fmtDate(lic.issuedAt)}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">
                    {fmtDate(lic.expiresAt)}
                  </td>
                  <td
                    className={`py-3 text-right font-semibold ${daysLeftColor(lic.daysUntilExpiry)}`}
                  >
                    {lic.daysUntilExpiry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Filing calendar ───────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          Filing Calendar
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Period</th>
                <th className="pb-3 pr-4">Due Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Est. Amount</th>
                <th className="pb-3">Prepared By</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TAX_FILINGS.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-border/50 text-text-primary"
                >
                  <td className="py-3 pr-4">{f.filingType}</td>
                  <td className="py-3 pr-4 text-text-muted">{f.periodLabel}</td>
                  <td className="py-3 pr-4 text-text-muted">
                    {fmtDate(f.dueDate)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${filingStatusBadge(f.status)}`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {usd.format(f.estimatedAmount)}
                  </td>
                  <td className="py-3 text-text-muted">{f.preparedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Compliance alerts ─────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          Compliance Alerts
        </h2>
        <div className="mt-4 grid gap-3">
          {DEMO_COMPLIANCE_ALERTS.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border-l-4 ${severityColor(a.severity)} bg-surface p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-base leading-none">
                    {severityIcon(a.severity)}
                  </span>
                  <div>
                    <div className="font-medium text-text-primary">
                      {a.title}
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{a.body}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${categoryBadge(a.category)}`}
                  >
                    {a.category}
                  </span>
                  <span className="text-xs text-text-muted">
                    {fmtDate(a.createdAt)}
                  </span>
                </div>
              </div>
              {a.resolvedAt && (
                <div className="mt-2 text-xs text-emerald-400">
                  ✓ Resolved {fmtDate(a.resolvedAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Document registry ─────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          Document Registry
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Period</th>
                <th className="pb-3 pr-4">Generated</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_COMPLIANCE_DOCUMENTS.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border/50 text-text-primary"
                >
                  <td className="py-3 pr-4">{d.title}</td>
                  <td className="py-3 pr-4 text-text-muted">
                    {docTypeLabel(d.type)}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">
                    {d.periodLabel ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">
                    {fmtDate(d.generatedAt)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${docStatusBadge(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
