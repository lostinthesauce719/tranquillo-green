"use client";

import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import type { InventoryProduct, InventoryBatch, InventoryMovement } from "@/lib/data/inventory";

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
      {/* Metrc Coming Soon Badge */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text-primary">Metrc Integration</div>
          <div className="mt-1 text-xs text-text-muted">
            Bi-directional sync with California Metrc for package tags, lab results, and state reporting.
          </div>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Coming Soon
        </span>
      </div>

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
