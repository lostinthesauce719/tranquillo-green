import Link from "next/link";
import {
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  BarChart3,
  MessageSquare,
  ChevronRight,
  Users,
  TrendingUp,
  FileCheck,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";

// ---------------------------------------------------------------------------
// Demo client data — simulates a CPA firm managing 14 cannabis operators
// ---------------------------------------------------------------------------

type AllocationStatus = "approved" | "in_review" | "pending" | "blocked";
type PeriodCloseStatus = "closed" | "ready_to_close" | "in_progress" | "not_started";
type ExportStatus = "ready" | "partial" | "not_ready";

type Client = {
  id: string;
  name: string;
  slug: string;
  licenseType: string;
  state: string;
  lastActivity: string;
  currentPeriod: string;
  allocationStatus: AllocationStatus;
  periodCloseStatus: PeriodCloseStatus;
  exportStatus: ExportStatus;
  openItems: number;
  revenue: number;
  notes?: string;
};

const demoClients: Client[] = [
  {
    id: "1",
    name: "Verdant Cultivation Co.",
    slug: "verdant-cultivation",
    licenseType: "Cultivation",
    state: "CA",
    lastActivity: "2 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "ready_to_close",
    exportStatus: "ready",
    openItems: 0,
    revenue: 342000,
  },
  {
    id: "2",
    name: "Pacific Dispensary Group",
    slug: "pacific-dispensary",
    licenseType: "Retail",
    state: "CA",
    lastActivity: "45 min ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "in_review",
    periodCloseStatus: "in_progress",
    exportStatus: "partial",
    openItems: 3,
    revenue: 891000,
    notes: "3 allocation items need CP review before close",
  },
  {
    id: "3",
    name: "Emerald Extracts LLC",
    slug: "emerald-extracts",
    licenseType: "Manufacturing",
    state: "CA",
    lastActivity: "1 day ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "pending",
    periodCloseStatus: "not_started",
    exportStatus: "not_ready",
    openItems: 7,
    revenue: 567000,
    notes: "Awaiting COGS documentation from operator",
  },
  {
    id: "4",
    name: "High Desert Distribution",
    slug: "high-desert-dist",
    licenseType: "Distribution",
    state: "CA",
    lastActivity: "3 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "closed",
    exportStatus: "ready",
    openItems: 0,
    revenue: 1240000,
  },
  {
    id: "5",
    name: "Sierra Green Farms",
    slug: "sierra-green",
    licenseType: "Cultivation",
    state: "CA",
    lastActivity: "6 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "in_review",
    periodCloseStatus: "in_progress",
    exportStatus: "partial",
    openItems: 2,
    revenue: 289000,
    notes: "280E support schedule incomplete",
  },
  {
    id: "6",
    name: "Bay Area Wellness Ctr",
    slug: "bay-area-wellness",
    licenseType: "Retail",
    state: "CA",
    lastActivity: "12 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "ready_to_close",
    exportStatus: "ready",
    openItems: 1,
    revenue: 712000,
  },
  {
    id: "7",
    name: "Redwood Remedies",
    slug: "redwood-remedies",
    licenseType: "Manufacturing",
    state: "CA",
    lastActivity: "2 days ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "blocked",
    periodCloseStatus: "not_started",
    exportStatus: "not_ready",
    openItems: 12,
    revenue: 445000,
    notes: "Blocked — missing Q1 bank reconciliations",
  },
  {
    id: "8",
    name: "Golden State Gardens",
    slug: "golden-state",
    licenseType: "Cultivation",
    state: "CA",
    lastActivity: "5 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "closed",
    exportStatus: "ready",
    openItems: 0,
    revenue: 523000,
  },
  {
    id: "9",
    name: "SoCal Cannabis Co.",
    slug: "socal-cannabis",
    licenseType: "Retail",
    state: "CA",
    lastActivity: "8 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "in_review",
    periodCloseStatus: "in_progress",
    exportStatus: "partial",
    openItems: 4,
    revenue: 1180000,
    notes: "Multi-location variance needs reconciliation",
  },
  {
    id: "10",
    name: "Humboldt Heritage Farms",
    slug: "humboldt-heritage",
    licenseType: "Cultivation",
    state: "CA",
    lastActivity: "1 day ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "ready_to_close",
    exportStatus: "ready",
    openItems: 0,
    revenue: 198000,
  },
  {
    id: "11",
    name: "Pacific Coast Extracts",
    slug: "pacific-extracts",
    licenseType: "Manufacturing",
    state: "CA",
    lastActivity: "3 days ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "pending",
    periodCloseStatus: "not_started",
    exportStatus: "not_ready",
    openItems: 9,
    revenue: 334000,
    notes: "New client — onboarding in progress",
  },
  {
    id: "12",
    name: "Valley Verde Dispensary",
    slug: "valley-verde",
    licenseType: "Retail",
    state: "CA",
    lastActivity: "10 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "ready_to_close",
    exportStatus: "partial",
    openItems: 1,
    revenue: 567000,
  },
  {
    id: "13",
    name: "Monterey Bay Cannabis",
    slug: "monterey-bay",
    licenseType: "Distribution",
    state: "CA",
    lastActivity: "4 hours ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "in_review",
    periodCloseStatus: "in_progress",
    exportStatus: "partial",
    openItems: 5,
    revenue: 890000,
    notes: "Transportation cost allocation under review",
  },
  {
    id: "14",
    name: "Kern County Cultivators",
    slug: "kern-county",
    licenseType: "Cultivation",
    state: "CA",
    lastActivity: "1 day ago",
    currentPeriod: "Mar 2026",
    allocationStatus: "approved",
    periodCloseStatus: "closed",
    exportStatus: "ready",
    openItems: 0,
    revenue: 276000,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const allocationStatusConfig: Record<
  AllocationStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  approved: {
    label: "Approved",
    color: "bg-emerald-500/15 text-emerald-300",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  in_review: {
    label: "In Review",
    color: "bg-amber-500/15 text-amber-300",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    color: "bg-blue-500/15 text-blue-300",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  blocked: {
    label: "Blocked",
    color: "bg-red-500/15 text-red-300",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

const periodCloseConfig: Record<
  PeriodCloseStatus,
  { label: string; color: string }
> = {
  closed: { label: "Closed", color: "bg-emerald-500/15 text-emerald-300" },
  ready_to_close: { label: "Ready", color: "bg-violet-500/15 text-violet-300" },
  in_progress: { label: "In Progress", color: "bg-amber-500/15 text-amber-300" },
  not_started: { label: "Not Started", color: "bg-neutral-500/15 text-neutral-400" },
};

const exportStatusConfig: Record<
  ExportStatus,
  { label: string; color: string }
> = {
  ready: { label: "Ready", color: "bg-emerald-500/15 text-emerald-300" },
  partial: { label: "Partial", color: "bg-amber-500/15 text-amber-300" },
  not_ready: { label: "Not Ready", color: "bg-neutral-500/15 text-neutral-400" },
};

const licenseTypeColor: Record<string, string> = {
  Cultivation: "bg-emerald-500/10 text-emerald-300",
  Retail: "bg-violet-500/10 text-violet-300",
  Manufacturing: "bg-amber-500/10 text-amber-300",
  Distribution: "bg-blue-500/10 text-blue-300",
};

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------

function StatusBadge({
  config,
}: {
  config: { label: string; color: string; icon?: React.ReactNode };
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CpaPortalPage() {
  const totalClients = demoClients.length;
  const closedClients = demoClients.filter(
    (c) => c.periodCloseStatus === "closed"
  ).length;
  const exportReadyClients = demoClients.filter(
    (c) => c.exportStatus === "ready"
  ).length;
  const blockedClients = demoClients.filter(
    (c) => c.allocationStatus === "blocked"
  ).length;
  const totalOpenItems = demoClients.reduce((sum, c) => sum + c.openItems, 0);
  const totalRevenue = demoClients.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <AppShell
      title="CPA Portal"
      description="Multi-client command center for managing cannabis operator portfolios. Monitor allocation status, period close readiness, and export handoff across your entire book of business."
    >
      {/* Portfolio health bar */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
          blockedClients === 0
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}
      >
        {blockedClients === 0 ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
        )}
        <div>
          <div
            className={`text-sm font-medium ${
              blockedClients === 0 ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {blockedClients === 0
              ? "Portfolio health nominal"
              : `${blockedClients} client${blockedClients > 1 ? "s" : ""} blocked — attention required`}
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            {closedClients} of {totalClients} periods closed &middot;{" "}
            {exportReadyClients} export bundles ready &middot; {totalOpenItems}{" "}
            open action items
          </div>
        </div>
      </div>

      {/* Portfolio metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active clients"
          value={String(totalClients)}
          detail={`${closedClients} periods closed this cycle`}
        />
        <MetricCard
          label="Open action items"
          value={String(totalOpenItems)}
          detail={`${demoClients.filter((c) => c.openItems > 0).length} clients with open items`}
        />
        <MetricCard
          label="Export-ready"
          value={`${exportReadyClients}/${totalClients}`}
          detail={`${totalClients - exportReadyClients} bundles incomplete`}
        />
        <MetricCard
          label="Portfolio revenue"
          value={currencyFormatter.format(totalRevenue)}
          detail="Current period aggregate"
        />
      </div>

      {/* Quick stats row */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">
              Allocations
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold">
              {
                demoClients.filter((c) => c.allocationStatus === "approved")
                  .length
              }
            </span>
            <span className="text-sm text-text-muted">/ {totalClients} approved</span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs text-amber-300/70">
              {demoClients.filter((c) => c.allocationStatus === "in_review").length} in review
            </span>
            <span className="text-xs text-text-muted/40">&middot;</span>
            <span className="text-xs text-blue-300/70">
              {demoClients.filter((c) => c.allocationStatus === "pending").length} pending
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
              <FileCheck className="h-4 w-4 text-violet-400" />
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">
              Period Close
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold">{closedClients}</span>
            <span className="text-sm text-text-muted">/ {totalClients} closed</span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs text-violet-300/70">
              {demoClients.filter((c) => c.periodCloseStatus === "ready_to_close").length} ready
            </span>
            <span className="text-xs text-text-muted/40">&middot;</span>
            <span className="text-xs text-amber-300/70">
              {demoClients.filter((c) => c.periodCloseStatus === "in_progress").length} in progress
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-text-muted/60">
              Urgent Items
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold">
              {blockedClients + demoClients.filter((c) => c.openItems >= 5).length}
            </span>
            <span className="text-sm text-text-muted">clients need attention</span>
          </div>
          <div className="mt-2 text-xs text-text-muted/70">
            {blockedClients} blocked &middot;{" "}
            {demoClients.filter((c) => c.openItems >= 5 && c.allocationStatus !== "blocked").length}{" "}
            with 5+ open items
          </div>
        </div>
      </div>

      {/* Client list — the command center table */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">
              Client Portfolio
            </div>
            <div className="mt-1 text-lg font-semibold">
              Active Operators ({totalClients})
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Users className="h-3.5 w-3.5" />
            All California licensed operators
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          {/* Table header */}
          <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.5fr_0.5fr] gap-3 border-b border-border bg-surface-mid/50 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-text-muted/50">
            <div>Client</div>
            <div>Allocations</div>
            <div>Period Close</div>
            <div>Export</div>
            <div className="text-center">Open</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Client rows */}
          {demoClients.map((client, index) => (
            <div
              key={client.id}
              className={`grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.5fr_0.5fr] gap-3 items-center px-5 py-4 transition hover:bg-surface-mid/30 ${
                index < demoClients.length - 1 ? "border-b border-border/50" : ""
              } ${client.allocationStatus === "blocked" ? "bg-red-500/[0.03]" : ""}`}
            >
              {/* Client info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-text-muted/40 shrink-0" />
                  <span className="truncate text-sm font-medium">
                    {client.name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${licenseTypeColor[client.licenseType] ?? "bg-neutral-500/10 text-neutral-400"}`}
                  >
                    {client.licenseType}
                  </span>
                  <span className="text-[11px] text-text-muted/40">
                    {client.state}
                  </span>
                  <span className="text-[11px] text-text-muted/30">&middot;</span>
                  <span className="text-[11px] text-text-muted/40">
                    {client.lastActivity}
                  </span>
                </div>
                {client.notes && (
                  <div className="mt-1 truncate text-[11px] text-amber-300/50">
                    {client.notes}
                  </div>
                )}
              </div>

              {/* Allocation status */}
              <div>
                <StatusBadge
                  config={allocationStatusConfig[client.allocationStatus]}
                />
              </div>

              {/* Period close status */}
              <div>
                <StatusBadge
                  config={periodCloseConfig[client.periodCloseStatus]}
                />
                <div className="mt-1 text-[11px] text-text-muted/40">
                  {client.currentPeriod}
                </div>
              </div>

              {/* Export status */}
              <div>
                <StatusBadge config={exportStatusConfig[client.exportStatus]} />
              </div>

              {/* Open items */}
              <div className="text-center">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    client.openItems === 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : client.openItems >= 5
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {client.openItems}
                </span>
              </div>

              {/* Quick actions */}
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/dashboard/exports`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-muted/60 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
                  title="View exports"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/dashboard/allocations`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-muted/60 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                  title="Review allocations"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Link>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-muted/60 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                  title="Contact client"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <Link
                  href={`/dashboard`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-text-muted/60 transition hover:border-border hover:bg-surface-mid hover:text-text-primary"
                  title="Open workspace"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom panels — quick access */}
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Needs attention */}
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">
                Needs Attention
              </div>
              <div className="mt-1.5 text-lg font-semibold">
                Clients with open items or blocks
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {demoClients
              .filter((c) => c.openItems > 0)
              .sort((a, b) => b.openItems - a.openItems)
              .slice(0, 5)
              .map((client) => (
                <div
                  key={client.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 transition ${
                    client.allocationStatus === "blocked"
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        client.allocationStatus === "blocked"
                          ? "bg-red-500/15 text-red-300"
                          : client.openItems >= 5
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-blue-500/15 text-blue-300"
                      }`}
                    >
                      {client.openItems}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {client.name}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-text-muted/60">
                        {client.notes ?? `${client.openItems} open items`}
                      </div>
                    </div>
                  </div>
                  <StatusBadge
                    config={allocationStatusConfig[client.allocationStatus]}
                  />
                </div>
              ))}
          </div>
        </section>

        {/* Portfolio breakdown */}
        <section className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">
            Portfolio Breakdown
          </div>
          <div className="mt-1.5 text-lg font-semibold">
            By license type
          </div>
          <div className="mt-5 space-y-4">
            {["Cultivation", "Retail", "Manufacturing", "Distribution"].map(
              (type) => {
                const clients = demoClients.filter(
                  (c) => c.licenseType === type
                );
                const revenue = clients.reduce((sum, c) => sum + c.revenue, 0);
                const closed = clients.filter(
                  (c) => c.periodCloseStatus === "closed"
                ).length;
                return (
                  <div key={type} className="rounded-2xl border border-border bg-surface px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${licenseTypeColor[type]}`}
                        >
                          {type}
                        </span>
                        <span className="text-sm text-text-muted">
                          {clients.length} client{clients.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {currencyFormatter.format(revenue)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-text-muted/50 mb-1.5">
                        <span>
                          Close: {closed}/{clients.length}
                        </span>
                        <span>
                          {Math.round((closed / clients.length) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/60 transition-all"
                          style={{
                            width: `${(closed / clients.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Quick links */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/exports"
              className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              All exports
            </Link>
            <Link
              href="/dashboard/allocations"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
            >
              <TrendingUp className="h-4 w-4" />
              All allocations
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
