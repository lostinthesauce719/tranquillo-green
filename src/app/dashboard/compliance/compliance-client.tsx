"use client";

import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/auth/tenant-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
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
  resolvedAt: number | null;
  sourceType: string | null;
  sourceId: string | null;
  dueAt: number | null;
  _creationTime: number;
}

interface ComplianceStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

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

export default function ComplianceClient() {
  const router = useRouter();
  const { companyId } = useTenant();
  const [activeFilter, setActiveFilter] = useState<Severity | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  // Real-time query for unresolved alerts
  const alerts = useQuery(api.compliance.getUnresolvedAlerts, {
    companyId: companyId as any,
  }) as any as ComplianceAlert[] | undefined;

  const stats = useQuery(api.compliance.getAlertStats, {
    companyId: companyId as any,
  }) as any as ComplianceStats | undefined;

  const resolveAlert = useMutation(api.compliance.resolveAlert);
  const generateAlerts = useMutation(api.compliance.generateComplianceAlerts);

  // On mount: trigger alerts generation (idempotent)
  useEffect(() => {
    if (companyId) {
      generateAlerts({ companyId: companyId as any }).catch(console.error);
    }
  }, [companyId]);

  const handleResolve = useCallback(
    async (alertId: string) => {
      try {
        await resolveAlert({ alertId: alertId as any });
        router.refresh();
      } catch (e) {
        console.error("Failed to resolve alert:", e);
      }
    },
    [resolveAlert, router],
  );

  const filteredAlerts = alerts?.filter((a) => {
    if (activeFilter !== "all" && a.severity !== activeFilter) return false;
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    return true;
  });

  if (!alerts || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-6 h-6 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading compliance alerts…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Alerts"
          value={stats.total}
          icon={AlertCircle}
          color="slate"
        />
        <StatCard
          title="Critical"
          value={stats.critical}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Warning"
          value={stats.warning}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Info"
          value={stats.info}
          icon={Info}
          color="blue"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground mr-2">Severity:</span>
        {(["all", "critical", "warning", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setActiveFilter(sev)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              activeFilter === sev
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}

        <span className="text-sm font-medium text-muted-foreground mr-2 ml-4">Category:</span>
        {(["all", "license", "tax"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {cat === "all" ? "All" : categoryLabel[cat]}
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      <div className="space-y-3">
        {filteredAlerts && filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            return (
              <div
                key={alert._id}
                className={`p-4 rounded-lg border bg-card ${cfg.borderClass} ${
                  cfg.bgClass
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.badgeClass} p-1 rounded`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{alert.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${cfg.badgeClass}`}>
                          {alert.severity}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-500/15 text-zinc-300 border border-zinc-500/30">
                          {categoryLabel[alert.category]}
                        </span>
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
                  <button
                    onClick={() => handleResolve(alert._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-300 rounded hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alerts match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "slate" | "red" | "amber" | "blue";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
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
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
      </div>
      <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
    </div>
  );
}
