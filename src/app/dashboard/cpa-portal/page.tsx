"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Settings,
  BarChart3,
  ArrowRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

interface CPAClient {
  id: string;
  companyName: string;
  state: string;
  operatorType: string;
  revenue: string;
  lastAllocation: string;
  status: "active" | "pending" | "overdue";
  alerts: number;
  monthlySpend: number;
}

interface AllocationSummary {
  totalClients: number;
  activeAllocations: number;
  overdue: number;
  totalRevenue: number;
  avgSavings: number;
}

/* ─── Demo Data ─────────────────────────────────────────────────── */

const DEMO_CLIENTS: CPAClient[] = [
  { id: "c1", companyName: "Greenleaf Dispensaries", state: "MI", operatorType: "Dispensary", revenue: "$4.2M", lastAllocation: "2026-05-01", status: "active", alerts: 0, monthlySpend: 347 },
  { id: "c2", companyName: "Cascade Grow Co.", state: "OR", operatorType: "Cultivator", revenue: "$2.8M", lastAllocation: "2026-04-28", status: "active", alerts: 1, monthlySpend: 347 },
  { id: "c3", companyName: "Standard Wellness", state: "OH", operatorType: "MSO", revenue: "$18.5M", lastAllocation: "2026-05-10", status: "active", alerts: 0, monthlySpend: 897 },
  { id: "c4", companyName: "Elevate Michigan", state: "MI", operatorType: "Dispensary", revenue: "$6.1M", lastAllocation: "2026-04-15", status: "overdue", alerts: 3, monthlySpend: 347 },
  { id: "c5", companyName: "Pacific Cannabis Advisory", state: "CA", operatorType: "Manufacturer", revenue: "$3.4M", lastAllocation: "2026-05-05", status: "active", alerts: 0, monthlySpend: 347 },
  { id: "c6", companyName: "Verdant Labs", state: "CO", operatorType: "Manufacturer", revenue: "$1.9M", lastAllocation: "2026-03-20", status: "overdue", alerts: 2, monthlySpend: 347 },
];

const SUMMARY: AllocationSummary = {
  totalClients: DEMO_CLIENTS.length,
  activeAllocations: DEMO_CLIENTS.filter((c) => c.status === "active").length,
  overdue: DEMO_CLIENTS.filter((c) => c.status === "overdue").length,
  totalRevenue: 36900000,
  avgSavings: 94200,
};

/* ─── Components ────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: CPAClient["status"] }) {
  const config = {
    active: { label: "Active", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    pending: { label: "Pending", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    overdue: { label: "Overdue", color: "bg-red-500/15 text-red-300 border-red-500/30" },
  };
  const c = config[status];
  return <span className={"px-2 py-0.5 text-xs rounded-full border " + c.color}>{c.label}</span>;
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <Icon className={"h-4 w-4 " + color} />
      </div>
      <div className="mt-2 text-xl font-bold text-text-primary">{value}</div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function CPAPartnerPortal() {
  const [activeTab, setActiveTab] = useState<"clients" | "allocations" | "exports" | "settings">("clients");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = DEMO_CLIENTS.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell title="CPA Partner Portal" description="Manage all your cannabis clients from one dashboard.">
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Preview</strong> — Sample client data for illustration. Multi-client CPA workspaces are not yet available.
      </div>
      <div className="space-y-6">
        {/* Partner banner */}
        <div className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <Building2 className="h-4 w-4 text-brand" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">CPA Partner — Pro Plan</div>
              <div className="text-xs text-text-muted">Up to 10 clients · White-label enabled · Priority support</div>
            </div>
          </div>
          <Link href="/partner/upgrade" className="text-xs font-medium text-brand hover:text-brand/80">
            Upgrade to Enterprise →
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Clients" value={SUMMARY.totalClients.toString()} icon={Users} color="text-brand" />
          <SummaryCard label="Active Allocations" value={SUMMARY.activeAllocations.toString()} icon={CheckCircle2} color="text-emerald-400" />
          <SummaryCard label="Overdue" value={SUMMARY.overdue.toString()} icon={AlertCircle} color="text-red-400" />
          <SummaryCard label="Avg. Client Savings" value={`$${(SUMMARY.avgSavings / 1000).toFixed(0)}K/yr`} icon={DollarSign} color="text-accent" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1">
          {(["clients", "allocations", "exports", "settings"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition " + (activeTab === tab ? "bg-brand text-white" : "text-text-muted hover:text-text-secondary")}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── CLIENTS TAB ──────────────────────────────────────────── */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full h-10 rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors">
                  <Filter className="h-3 w-3" /> Filter
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                  <Plus className="h-3 w-3" /> Add Client
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredClients.map((client) => (
                <div key={client.id} className="rounded-xl border border-border bg-surface-raised p-4 hover:border-brand/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                        <Building2 className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-primary">{client.companyName}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                          <span>{client.state}</span>
                          <span>·</span>
                          <span>{client.operatorType}</span>
                          <span>·</span>
                          <span>{client.revenue} revenue</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {client.alerts > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                          <AlertCircle className="h-3 w-3" /> {client.alerts} alerts
                        </span>
                      )}
                      <StatusBadge status={client.status} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span>Last allocation: {client.lastAllocation}</span>
                    <div className="flex items-center gap-4">
                      <span>${client.monthlySpend}/mo</span>
                      <button className="inline-flex items-center gap-1 text-brand hover:text-brand/80">
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button className="inline-flex items-center gap-1 text-brand hover:text-brand/80">
                        <FileText className="h-3 w-3" /> Export
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ALLOCATIONS TAB ───────────────────────────────────────── */}
        {activeTab === "allocations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Recent Allocations</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                <Plus className="h-3 w-3" /> Run Allocation
              </button>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Period</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted">COGS %</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-muted">Savings</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { client: "Greenleaf Dispensaries", period: "Q1 2026", cogs: "41%", savings: "$94,200", status: "completed" },
                    { client: "Cascade Grow Co.", period: "Q1 2026", cogs: "38%", savings: "$67,800", status: "completed" },
                    { client: "Standard Wellness", period: "Q1 2026", cogs: "44%", savings: "$312,000", status: "completed" },
                    { client: "Elevate Michigan", period: "Q1 2026", cogs: "39%", savings: "$128,400", status: "overdue" },
                    { client: "Pacific Cannabis Advisory", period: "Q1 2026", cogs: "36%", savings: "$54,200", status: "completed" },
                  ].map((row) => (
                    <tr key={row.client} className="border-b border-border-subtle hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium text-text-primary">{row.client}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.period}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{row.cogs}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand">{row.savings}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={row.status as "active" | "pending" | "overdue"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXPORTS TAB ──────────────────────────────────────────── */}
        {activeTab === "exports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Export Center</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                <Download className="h-3 w-3" /> Build Packet
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "280E Allocation Report", description: "Full COGS allocation with audit trail", format: "PDF + CSV", icon: FileText },
                { name: "QBO Workpapers", description: "QuickBooks-compatible workpapers", format: "CSV + PDF", icon: FileText },
                { name: "Metrc Reconciliation", description: "Inventory variance report", format: "PDF", icon: BarChart3 },
                { name: "Month-End Close Packet", description: "Complete close documentation", format: "PDF + Excel", icon: FileText },
                { name: "Tax Support Schedule", description: "IRC 280E/471(c) documentation", format: "PDF", icon: FileText },
                { name: "Custom Report", description: "Build your own export", format: "Any", icon: Settings },
              ].map((exportItem) => (
                <div key={exportItem.name} className="rounded-xl border border-border bg-surface-raised p-4 hover:border-brand/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                      <exportItem.icon className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-text-primary">{exportItem.name}</h4>
                      <span className="text-xs text-text-faint">{exportItem.format}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mb-3">{exportItem.description}</p>
                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:border-brand/30 hover:text-brand transition-colors">
                    <Download className="h-3 w-3" /> Generate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Firm Profile</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Firm Name</label>
                  <input type="text" defaultValue="Vertex Tax & Advisory" className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Contact Email</label>
                  <input type="email" defaultValue="rachel@vertextax.com" className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">White-Label Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded accent-brand" />
                  <span className="text-sm text-text-secondary">Enable white-label exports</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded accent-brand" />
                  <span className="text-sm text-text-secondary">Show firm branding on reports</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded accent-brand" />
                  <span className="text-sm text-text-secondary">Hide Tranquillo Green branding</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Share</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-text-muted mb-1">Referred clients</div>
                  <div className="text-2xl font-bold text-text-primary">3</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-text-muted mb-1">Monthly revenue share</div>
                  <div className="text-2xl font-bold text-brand">$208</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-text-muted mb-1">Annual projected</div>
                  <div className="text-2xl font-bold text-accent">$2,496</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted">Earn 20% of client subscription fees for referred operators. Payouts monthly via ACH.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
