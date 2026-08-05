"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Download,
  Upload,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

interface MetrcPackage {
  id: string;
  packageTag: string;
  productName: string;
  category: string;
  metrcQuantity: number;
  bookQuantity: number;
  variance: number;
  variancePct: number;
  status: "matched" | "variance" | "investigating" | "resolved";
  lastSync: string;
}

interface ReconSummary {
  totalPackages: number;
  matched: number;
  variance: number;
  investigating: number;
  totalVariance: number;
  lastSync: string;
}

/* ─── Demo Data ─────────────────────────────────────────────────── */

const DEMO_PACKAGES: MetrcPackage[] = [
  { id: "p1", packageTag: "METC-001234", productName: "Blue Dream Flower", category: "Flower", metrcQuantity: 1250.5, bookQuantity: 1250.5, variance: 0, variancePct: 0, status: "matched", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p2", packageTag: "METC-001235", productName: "OG Kush Flower", category: "Flower", metrcQuantity: 890.2, bookQuantity: 887.9, variance: 2.3, variancePct: 0.26, status: "variance", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p3", packageTag: "METC-001236", productName: "Sour Diesel Concentrate", category: "Concentrate", metrcQuantity: 450.0, bookQuantity: 450.0, variance: 0, variancePct: 0, status: "matched", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p4", packageTag: "METC-001237", productName: "Gummy Edibles 100mg", category: "Edible", metrcQuantity: 2400, bookQuantity: 2353, variance: 47, variancePct: 1.96, status: "investigating", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p5", packageTag: "METC-001238", productName: "Vape Cartridge 1g", category: "Vape", metrcQuantity: 1800, bookQuantity: 1800, variance: 0, variancePct: 0, status: "matched", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p6", packageTag: "METC-001239", productName: "Pre-Roll 1g", category: "Flower", metrcQuantity: 5600, bookQuantity: 5580, variance: 20, variancePct: 0.36, status: "variance", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p7", packageTag: "METC-001240", productName: "Topical Cream 50mg", category: "Topical", metrcQuantity: 320, bookQuantity: 320, variance: 0, variancePct: 0, status: "matched", lastSync: "2026-05-17T10:00:00Z" },
  { id: "p8", packageTag: "METC-001241", productName: "Tincture 30ml", category: "Tincture", metrcQuantity: 150, bookQuantity: 142, variance: 8, variancePct: 5.33, status: "investigating", lastSync: "2026-05-17T10:00:00Z" },
];

const SUMMARY: ReconSummary = {
  totalPackages: DEMO_PACKAGES.length,
  matched: DEMO_PACKAGES.filter((p) => p.status === "matched").length,
  variance: DEMO_PACKAGES.filter((p) => p.status === "variance").length,
  investigating: DEMO_PACKAGES.filter((p) => p.status === "investigating").length,
  totalVariance: DEMO_PACKAGES.reduce((s, p) => s + Math.abs(p.variance), 0),
  lastSync: "2026-05-17T10:00:00Z",
};

/* ─── Components ────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: MetrcPackage["status"] }) {
  const config = {
    matched: { label: "Matched", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
    variance: { label: "Variance", color: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: AlertTriangle },
    investigating: { label: "Investigating", color: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: Clock },
    resolved: { label: "Resolved", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30", icon: CheckCircle2 },
  };
  const c = config[status];
  const Icon = c.icon;
  return <span className={"inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border " + c.color}><Icon className="h-3 w-3" />{c.label}</span>;
}

function SummaryCard({ label, value, icon: Icon, color, subtext }: { label: string; value: string; icon: React.ElementType; color: string; subtext?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <Icon className={"h-4 w-4 " + color} />
      </div>
      <div className="mt-2 text-xl font-bold text-text-primary">{value}</div>
      {subtext && <div className="mt-1 text-xs text-text-faint">{subtext}</div>}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function MetrcReconciliationPage() {
  const [activeTab, setActiveTab] = useState<"all" | "variance" | "investigating">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPackages = DEMO_PACKAGES.filter((p) => {
    if (activeTab === "variance" && p.status !== "variance") return false;
    if (activeTab === "investigating" && p.status !== "investigating") return false;
    if (searchQuery && !p.productName.toLowerCase().includes(searchQuery.toLowerCase()) && !p.packageTag.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell title="Metrc Reconciliation" description="Reconcile Metrc inventory with your books. Catch variances before auditors do.">
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Preview</strong> — Sample package data for illustration. Connect Metrc in Settings to reconcile live inventory.
      </div>
      <div className="space-y-6">
        {/* Sync status */}
        <div className="rounded-lg border border-border bg-surface-raised p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
              <RefreshCw className="h-5 w-5 text-brand" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">Last sync: {new Date(SUMMARY.lastSync).toLocaleString()}</div>
              <div className="text-xs text-text-muted">{SUMMARY.totalPackages} packages synced · {SUMMARY.matched} matched · {SUMMARY.variance + SUMMARY.investigating} need attention</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-brand/30 hover:text-brand transition-colors">
              <Upload className="h-3 w-3" /> Import CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
              <RefreshCw className="h-3 w-3" /> Sync Now
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Packages" value={SUMMARY.totalPackages.toString()} icon={Package} color="text-brand" subtext="Across all locations" />
          <SummaryCard label="Matched" value={SUMMARY.matched.toString()} icon={CheckCircle2} color="text-emerald-400" subtext={`${((SUMMARY.matched / SUMMARY.totalPackages) * 100).toFixed(0)}% match rate`} />
          <SummaryCard label="Variances" value={SUMMARY.variance.toString()} icon={AlertTriangle} color="text-amber-400" subtext="Within tolerance" />
          <SummaryCard label="Investigating" value={SUMMARY.investigating.toString()} icon={Clock} color="text-blue-400" subtext="Needs resolution" />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1">
            {(["all", "variance", "investigating"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={"rounded-lg px-4 py-2 text-xs font-medium transition " + (activeTab === tab ? "bg-brand text-white" : "text-text-muted hover:text-text-secondary")}>
                {tab === "all" ? "All" : tab === "variance" ? "Variances" : "Investigating"}
                {tab !== "all" && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                    {tab === "variance" ? SUMMARY.variance : SUMMARY.investigating}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="h-9 w-64 rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none" />
          </div>
        </div>

        {/* Package list */}
        <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Package</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Product</th>
                <th className="text-right px-4 py-3 font-semibold text-text-muted">Metrc Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-text-muted">Book Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-text-muted">Variance</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className={"border-b border-border-subtle hover:bg-surface/50 " + (pkg.status !== "matched" ? "bg-amber-500/5" : "")}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-text-secondary">{pkg.packageTag}</div>
                    <div className="text-xs text-text-faint">{pkg.category}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{pkg.productName}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{pkg.metrcQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{pkg.bookQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {pkg.variance !== 0 ? (
                      <span className={"font-medium " + (Math.abs(pkg.variancePct) > 2 ? "text-red-400" : "text-amber-400")}>
                        {pkg.variance > 0 ? "+" : ""}{pkg.variance.toLocaleString()} ({pkg.variancePct.toFixed(2)}%)
                      </span>
                    ) : (
                      <span className="text-emerald-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={pkg.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {pkg.status === "variance" && (
                        <button className="rounded px-2 py-1 text-xs text-brand hover:bg-brand/10 transition-colors">Investigate</button>
                      )}
                      {pkg.status === "investigating" && (
                        <button className="rounded px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">Resolve</button>
                      )}
                      <button className="rounded p-1 text-text-faint hover:text-text-secondary transition-colors">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-muted">
            Showing {filteredPackages.length} of {SUMMARY.totalPackages} packages
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-brand/30 hover:text-brand transition-colors">
              <Download className="h-3 w-3" /> Export Report
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-brand/30 hover:text-brand transition-colors">
              <Download className="h-3 w-3" /> Export for CPA
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
