"use client";

import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import type { InventoryProduct, InventoryBatch, InventoryMovement } from "@/lib/data/inventory";
import { useTenant } from "@/lib/auth/tenant-context";
import { useRouter } from "next/navigation";
import { connectMetrc, getMetrcStatus, syncMetrc } from "@/app/api/metrc/actions";
import type { MetrcSyncResult } from "@/lib/integrations/metrc-client";
import { useEffect, useState } from "react";

const movementTypeColor: Record<string, string> = {
  receive: "bg-emerald-500/20 text-emerald-300",
  sale: "bg-blue-500/20 text-blue-300",
  adjustment: "bg-amber-500/20 text-amber-300",
  waste: "bg-red-500/20 text-red-300",
  transfer: "bg-violet-500/20 text-violet-300",
};

const sourceBadge: Record<string, string> = {
  Metrc: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  metrc_import: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  manual: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type Props = {
  source: "demo" | "convex";
  products: InventoryProduct[];
  batches: InventoryBatch[];
  movements: InventoryMovement[];
  stats: {
    totalProducts: number;
    activeProducts: number;
    activeBatches: number;
    totalUnitsOnHand: number;
    totalInventoryValue: number;
  };
};

export default function InventoryClient({ source, products, batches, movements, stats }: Props) {
  const router = useRouter();
  const { companyId } = useTenant();
  const [metrcStatus, setMetrcStatus] = useState<"connected" | "disconnected" | "error" | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<MetrcSyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Load Metrc connection status on mount (only when using Convex data)
  useEffect(() => {
    if (source === "convex" && companyId) {
      (async () => {
        try {
          const status = await getMetrcStatus({ companyId });
          if (status.connected) {
            setMetrcStatus("connected");
            if (status.lastSync) setLastSync(new Date(status.lastSync));
          } else {
            setMetrcStatus("disconnected");
          }
        } catch (e) {
          setMetrcStatus("error");
          setStatusError((e as Error).message);
        }
      })();
    }
  }, [source, companyId]);

  // Handler: sync from Metrc
  async function handleMetrcSync() {
    if (!companyId || metrcStatus !== "connected") return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncMetrc({ companyId });
      setSyncResult(result);
      if (result.success) {
        setLastSync(new Date());
        // Refresh server data to show newly synced inventory
        router.refresh();
      }
    } catch (e: any) {
      setSyncResult({ success: false, source: "demo", packages: 0, movements: 0, discrepancies: [], details: [], error: e.message });
    } finally {
      setSyncing(false);
    }
  }
  const sourceLabel =
    source === "convex" ? "Live Convex data" : "Static demo definitions";

  return (
    <AppShell
      title="Inventory"
      description={
        source === "convex"
          ? `Live inventory from Convex — ${stats.activeBatches} batches, ${stats.totalUnitsOnHand.toLocaleString()} units on hand.`
          : "Seed-to-sale inventory tracking with batch-level cost basis. Connect Convex to enable live data."
      }
    >
      {/* Metrc Integration Panel */}
      {source === "convex" && companyId ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-emerald-300">Metrc Integration</div>
                {metrcStatus === "connected" && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Connected
                  </span>
                )}
                {metrcStatus === "disconnected" && (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                    Disconnected
                  </span>
                )}
                {metrcStatus === "error" && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Error
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Bi-directional sync with California Metrc for package tags, lab results, and state reporting.
              </div>
              {metrcStatus === "connected" && lastSync && (
                <div className="mt-2 text-xs text-text-faint">
                  Last sync: {lastSync.toLocaleString()}
                </div>
              )}
              {statusError && (
                <div className="mt-2 text-xs text-rose-300">Error: {statusError}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {metrcStatus === "connected" ? (
                <button
                  onClick={handleMetrcSync}
                  disabled={syncing}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? "Syncing…" : "Sync Now"}
                </button>
              ) : (
                <a
                  href="/dashboard/settings"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted hover:bg-surface-raised transition-colors"
                >
                  Connect in Settings
                </a>
              )}
            </div>
          </div>

          {/* Sync result summary */}
          {syncResult && (
            <div className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={syncResult.success ? "text-emerald-300" : "text-rose-300"}>{syncResult.success ? "✓ Sync completed" : "✗ Sync failed"}</span>
                {syncResult.success && (
                  <>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">{syncResult.packages} packages</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">{syncResult.movements} movements</span>
                    {syncResult.discrepancies.length > 0 && (
                      <>
                        <span className="text-text-muted">•</span>
                        <span className="text-amber-300">{syncResult.discrepancies.length} discrepancies</span>
                      </>
                    )}
                  </>
                )}
              </div>
              {syncResult.error && <div className="mt-2 text-rose-200">{syncResult.error}</div>}
              {syncResult.details && syncResult.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {syncResult.details.map((d, i) => (
                    <div key={i} className="text-text-muted">• {d}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <div>
            <div className="text-sm font-medium text-text-primary">Metrc Integration</div>
            <div className="mt-1 text-xs text-text-muted">
              Bi-directional sync with California Metrc for package tags, lab results, and state reporting.
            </div>
          </div>
          <a
            href="/dashboard/settings"
            className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300"
          >
            Connect
          </a>
        </div>
      )}
      {/* Summary Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Products" value={String(products.filter((p) => p.active).length)} detail={`${products.filter((p) => p.category === "flower").length} flower SKUs · ${sourceLabel}`} />
        <MetricCard label="Open Batches" value={String(stats.activeBatches)} detail="Packages with available on-hand quantity" />
        <MetricCard label="Total Units On Hand" value={stats.totalUnitsOnHand.toLocaleString()} detail={`Across ${stats.activeBatches} tracked batches`} />
        <MetricCard label="Inventory Value" value={formatCurrency(stats.totalInventoryValue)} detail="Cost basis-weighted valuation" />
      </div>

      {/* Inventory Batches Table */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Inventory Batches</div>
            <div className="mt-1 text-xs text-text-muted">Active package-level inventory with cost basis and source tracking</div>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">SKU</th>
                <th className="pb-3 pr-4 font-medium">Package Tag</th>
                <th className="pb-3 pr-4 font-medium text-right">Qty On Hand</th>
                <th className="pb-3 pr-4 font-medium text-right">Cost Basis</th>
                <th className="pb-3 pr-4 font-medium text-right">Extended Value</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b border-border/50 transition hover:bg-surface/50">
                  <td className="py-3 pr-4 font-medium">{batch.productName}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-muted">{batch.productSku}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-muted">{batch.packageTag.slice(0, 8)}...{batch.packageTag.slice(-4)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{batch.quantityOnHand.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(batch.costBasis)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums font-medium">{formatCurrency(batch.quantityOnHand * batch.costBasis)}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sourceBadge[batch.source] ?? sourceBadge.manual}`}>
                      {batch.source === "metrc_import" ? "Metrc" : batch.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-sm font-semibold text-text-primary">
                <td colSpan={3} className="pt-3 pr-4">Totals</td>
                <td className="pt-3 pr-4 text-right tabular-nums">{stats.totalUnitsOnHand.toLocaleString()}</td>
                <td className="pt-3 pr-4" />
                <td className="pt-3 pr-4 text-right tabular-nums">{formatCurrency(stats.totalInventoryValue)}</td>
                <td className="pt-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recent Movements Table */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Recent Movements</div>
            <div className="mt-1 text-xs text-text-muted">Last {movements.length} inventory transactions across all movement types</div>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium text-right">Quantity</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {movements.map((mov) => (
                <tr key={mov.id} className="border-b border-border/50 transition hover:bg-surface/50">
                  <td className="py-3 pr-4 text-xs text-text-muted">{mov.date}</td>
                  <td className="py-3 pr-4 font-medium">{mov.productName}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${movementTypeColor[mov.movementType] ?? movementTypeColor.adjustment}`}>
                      {mov.movementType}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {mov.quantity > 0 ? "+" : ""}{mov.quantity.toLocaleString()}
                  </td>
                  <td className="py-3 text-xs text-text-muted">{mov.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* source indicator */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
        {source === "convex" ? (
          <span className="text-accent">Live Convex data</span>
        ) : (
          <span className="text-accent">Demo fallback source</span>
        )}
        {" — "}
        {source === "convex"
          ? "Products, batches, and movements loaded from Convex."
          : "This workspace renders from inline demo data. Run the Convex seed to populate live inventory records."}
      </div>
    </AppShell>
  );
}
