"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BadgeCheck,
  FileText,
  RefreshCw,
} from "lucide-react";

type Severity = "info" | "warning" | "critical";
type Category = "license" | "tax" | "reconciliation" | "allocation";

interface ComplianceAlert {
  _id: string;
  companyId: string;
  category: Category;
  severity: Severity;
  title: string;
  body: string;
  resolvedAt?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  dueAt?: number | null;
  _creationTime: number;
}

interface ComplianceStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

interface ComplianceLicense {
  _id: string;
  licenseType: string;
  licenseNumber: string;
  state: string;
  status: "active" | "pending" | "expired";
  issuedAt?: number;
  expiresAt?: number;
}

interface ComplianceFiling {
  _id: string;
  filingType: string;
  periodLabel: string;
  dueDate: string;
  status: "pending" | "ready" | "filed" | "late";
}

const EMPTY_STATS: ComplianceStats = { total: 0, critical: 0, warning: 0, info: 0 };

const categoryLink: Record<Category, { href: string; label: string }> = {
  license: { href: "/dashboard/compliance", label: "View License Details" },
  tax: { href: "/dashboard/compliance", label: "View Filing Calendar" },
  reconciliation: { href: "/dashboard/reconciliations", label: "Open Reconciliation" },
  allocation: { href: "/dashboard/allocations", label: "Review Allocations" },
};

const severityConfig: Record<
  Severity,
  { icon: React.ElementType; badgeClass: string; bgClass: string; borderClass: string }
> = {
  critical: {
    icon: AlertCircle,
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    bgClass: "border-l-red-500",
    borderClass: "border-l-4",
  },
  warning: {
    icon: AlertTriangle,
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bgClass: "border-l-amber-500",
    borderClass: "border-l-4",
  },
  info: {
    icon: Info,
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    bgClass: "border-l-blue-500",
    borderClass: "border-l-4",
  },
};

const categoryLabel: Record<Category, string> = {
  license: "License",
  tax: "Tax",
  reconciliation: "Reconciliation",
  allocation: "Allocation",
};

const licenseStatusClass: Record<ComplianceLicense["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  expired: "bg-red-500/15 text-red-300 border-red-500/30",
};

const filingStatusClass: Record<ComplianceFiling["status"], string> = {
  filed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ready: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  late: "bg-red-500/15 text-red-300 border-red-500/30",
};

/* ─── Stat Card ───────────────────────────────────────────────────── */

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: "slate" | "red" | "amber" | "blue" }) {
  const colorClasses: Record<string, string> = {
    slate: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  };
  return (
    <div className="p-4 rounded-xl border bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className={"w-4 h-4 " + colorClasses[color]} />
      </div>
      <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
    </div>
  );
}

/* ─── Alert Row (with inline dropdown detail) ─────────────────────── */

function AlertRow({
  alert,
  isExpanded,
  onToggle,
  onResolve,
  resolving,
}: {
  alert: ComplianceAlert;
  isExpanded: boolean;
  onToggle: () => void;
  onResolve: (id: string) => void;
  resolving: boolean;
}) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  const isOverdue = alert.dueAt && alert.dueAt < Date.now();
  const daysSinceCreated = Math.floor((Date.now() - alert._creationTime) / (1000 * 60 * 60 * 24));
  const link = categoryLink[alert.category];

  return (
    <div>
      {/* Alert row — always visible */}
      <div
        className={"p-4 rounded-lg border bg-card " + cfg.borderClass + " " + cfg.bgClass + " shadow-sm hover:shadow-md transition-shadow cursor-pointer"}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Icon className={"w-5 h-5 mt-0.5 flex-shrink-0 " + cfg.badgeClass + " p-1 rounded"} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{alert.title}</h4>
                <span className={"px-2 py-0.5 text-xs rounded-full border " + cfg.badgeClass}>
                  {alert.severity}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-500/15 text-zinc-300 border border-zinc-500/30">
                  {categoryLabel[alert.category]}
                </span>
                {isOverdue && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.body}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {alert.dueAt && (
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Due: {new Date(alert.dueAt).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(alert._creationTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-text-faint hidden sm:block">
              {isExpanded ? "Close" : "Review"}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown detail panel — inline below the alert */}
      {isExpanded && (
        <div className="mt-2 ml-4 border-l-2 border-brand/30 pl-4 space-y-3 pb-2">
          {/* Full description */}
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-faint mb-2">Details</div>
            <p className="text-sm text-text-secondary leading-relaxed">{alert.body}</p>
          </div>

          {/* Metadata grid */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-faint mb-1">Created</div>
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Calendar className="w-3.5 h-3.5 text-text-faint" />
                {new Date(alert._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                <span className="text-text-faint">({daysSinceCreated}d ago)</span>
              </div>
            </div>
            {alert.dueAt && (
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-text-faint mb-1">Due Date</div>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Clock className="w-3.5 h-3.5 text-text-faint" />
                  {new Date(alert.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {isOverdue && <span className="text-red-400 text-xs font-medium">OVERDUE</span>}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-faint mb-1">Source</div>
              <div className="text-sm text-text-secondary">{alert.sourceType || "System"}</div>
            </div>
          </div>

          {/* Recommended action */}
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand mb-1">Recommended Action</div>
            <p className="text-sm text-text-secondary">
              {alert.category === "tax" && "Review the 280E COGS allocation splits for the overdue quarter. Verify all facility rent, inventory labor, and shipping costs are properly categorized. Export the allocation report for your CPA."}
              {alert.category === "license" && "Begin the license renewal application process. Gather required documentation including financial statements, proof of insurance, and updated operating procedures. Submit at least 30 days before expiration."}
              {alert.category === "reconciliation" && "Investigate the variance between Metrc and book inventory. Check for data entry errors, unrecorded adjustments, or timing differences. Document the resolution for audit trail."}
              {alert.category === "allocation" && "Review your current inventory accounting method with your CPA. A 471(c) election may allow you to capitalize additional costs into inventory, reducing taxable income."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href={link.href}
              className="inline-flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand/20"
              onClick={(e) => e.stopPropagation()}
            >
              {link.label}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(alert._id); }}
              disabled={resolving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {resolving ? "Resolving…" : "Resolve"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition hover:text-text-secondary hover:bg-surface-overlay"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */

export default function ComplianceClient() {
  const tenant = useTenant();
  const companyId = tenant.companyId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [stats, setStats] = useState<ComplianceStats>(EMPTY_STATS);
  const [licenses, setLicenses] = useState<ComplianceLicense[]>([]);
  const [filings, setFilings] = useState<ComplianceFiling[]>([]);
  const [activeFilter, setActiveFilter] = useState<Severity | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compliance?companyId=${companyId}${refresh ? "&refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load compliance data");
      setAlerts(data.alerts ?? []);
      setStats(data.stats ?? EMPTY_STATS);
      setLicenses(data.licenses ?? []);
      setFilings(data.filings ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load(true);
  }, [load]);

  const handleResolve = useCallback(
    async (alertId: string) => {
      setResolvingId(alertId);
      try {
        const res = await fetch("/api/compliance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resolve", alertId }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Failed to resolve alert");
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        setStats((prev) => {
          const resolved = alerts.find((a) => a._id === alertId);
          if (!resolved) return { ...prev, total: Math.max(0, prev.total - 1) };
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            [resolved.severity]: Math.max(0, prev[resolved.severity] - 1),
          };
        });
        setExpandedAlertId(null);
      } catch (e: any) {
        setError(e.message || "Failed to resolve alert");
      } finally {
        setResolvingId(null);
      }
    },
    [alerts]
  );

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter !== "all" && a.severity !== activeFilter) return false;
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    return true;
  });

  const sortedFilings = [...filings].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border/50 bg-card/50" />
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border/50 bg-card/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium hover:bg-red-500/10"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Alerts" value={stats.total} icon={AlertCircle} color="slate" />
        <StatCard title="Critical" value={stats.critical} icon={AlertCircle} color="red" />
        <StatCard title="Warning" value={stats.warning} icon={AlertTriangle} color="amber" />
        <StatCard title="Info" value={stats.info} icon={Info} color="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground mr-2">Severity:</span>
        {(["all", "critical", "warning", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setActiveFilter(sev)}
            className={"px-3 py-1 text-sm rounded-full border transition-colors " + (activeFilter === sev ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent")}
          >
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}

        <span className="text-sm font-medium text-muted-foreground mr-2 ml-4">Category:</span>
        {(["all", "license", "tax", "reconciliation", "allocation"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={"px-3 py-1 text-sm rounded-full border transition-colors " + (selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent")}
          >
            {cat === "all" ? "All" : categoryLabel[cat]}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertRow
              key={alert._id}
              alert={alert}
              isExpanded={expandedAlertId === alert._id}
              onToggle={() => setExpandedAlertId(expandedAlertId === alert._id ? null : alert._id)}
              onResolve={handleResolve}
              resolving={resolvingId === alert._id}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {alerts.length === 0
                ? "All clear — no open compliance alerts."
                : "No alerts match the current filters."}
            </p>
          </div>
        )}
      </div>

      {/* Licenses */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="mb-4 flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-semibold text-text-primary">Licenses</h3>
        </div>
        {licenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-faint">
                  <th className="pb-2 pr-4 font-semibold">Type</th>
                  <th className="pb-2 pr-4 font-semibold">Number</th>
                  <th className="pb-2 pr-4 font-semibold">State</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Expires</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic._id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 text-text-secondary">{lic.licenseType}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-text-secondary">{lic.licenseNumber}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{lic.state}</td>
                    <td className="py-2.5 pr-4">
                      <span className={"px-2 py-0.5 text-xs rounded-full border " + licenseStatusClass[lic.status]}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-text-secondary">
                      {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No licenses on file. Add licenses in Settings to enable expiry tracking.</p>
        )}
      </section>

      {/* Filing calendar */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-semibold text-text-primary">Filing Calendar</h3>
        </div>
        {sortedFilings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-faint">
                  <th className="pb-2 pr-4 font-semibold">Filing</th>
                  <th className="pb-2 pr-4 font-semibold">Period</th>
                  <th className="pb-2 pr-4 font-semibold">Due</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilings.map((filing) => (
                  <tr key={filing._id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 text-text-secondary">{filing.filingType}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{filing.periodLabel}</td>
                    <td className="py-2.5 pr-4 text-text-secondary">{filing.dueDate}</td>
                    <td className="py-2.5">
                      <span className={"px-2 py-0.5 text-xs rounded-full border " + filingStatusClass[filing.status]}>
                        {filing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No tax filings tracked yet. Filings appear here once your tax profile is configured.</p>
        )}
      </section>
    </div>
  );
}
