import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";

// --- Inline demo data ---

type DemoProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
};

type DemoBatch = {
  id: string;
  product: DemoProduct;
  packageTag: string;
  quantityOnHand: number;
  costBasis: number;
  source: string;
};

type DemoMovement = {
  id: string;
  batchId: string;
  product: DemoProduct;
  movementType: string;
  quantity: number;
  date: string;
  note: string;
};

const demoProducts: DemoProduct[] = [
  { id: "prod-1", sku: "FLWR-OG-KUSH-3.5", name: "OG Kush Flower 3.5g", category: "flower", unitOfMeasure: "g" },
  { id: "prod-2", sku: "PRRL-GLUE-10PK", name: "GG #4 Pre-Roll 10pk", category: "pre-roll", unitOfMeasure: "pk" },
  { id: "prod-3", sku: "VPE-GSC-1G", name: "GSC Live Resin Cart 1g", category: "vape", unitOfMeasure: "ea" },
  { id: "prod-4", sku: "EDBL-GUMMY-20PK", name: "Sativa Gummies 20ct", category: "edible", unitOfMeasure: "ea" },
  { id: "prod-5", sku: "CONC-BHO-1G", name: "Blue Dream BHO Shatter 1g", category: "concentrate", unitOfMeasure: "g" },
  { id: "prod-6", sku: "FLWR-PINK-7G", name: "Pink Panties Flower 7g", category: "flower", unitOfMeasure: "g" },
];

const demoBatches: DemoBatch[] = [
  { id: "batch-1", product: demoProducts[0], packageTag: "1A4060300001C10000010012", quantityOnHand: 420, costBasis: 5.25, source: "Metrc" },
  { id: "batch-2", product: demoProducts[0], packageTag: "1A4060300001C10000010018", quantityOnHand: 112, costBasis: 5.50, source: "Metrc" },
  { id: "batch-3", product: demoProducts[1], packageTag: "1A4060300001C20000020045", quantityOnHand: 340, costBasis: 18.00, source: "manual" },
  { id: "batch-4", product: demoProducts[2], packageTag: "1A4060300001C30000030078", quantityOnHand: 560, costBasis: 22.50, source: "Metrc" },
  { id: "batch-5", product: demoProducts[3], packageTag: "1A4060300001C40000040091", quantityOnHand: 180, costBasis: 14.00, source: "manual" },
  { id: "batch-6", product: demoProducts[4], packageTag: "1A4060300001C50000050112", quantityOnHand: 95, costBasis: 28.00, source: "Metrc" },
  { id: "batch-7", product: demoProducts[5], packageTag: "1A4060300001C10000060130", quantityOnHand: 224, costBasis: 4.75, source: "Metrc" },
];

const demoMovements: DemoMovement[] = [
  { id: "mov-1", batchId: "batch-1", product: demoProducts[0], movementType: "receive", quantity: 500, date: "2026-04-01", note: "Initial harvest intake" },
  { id: "mov-2", batchId: "batch-1", product: demoProducts[0], movementType: "sale", quantity: -80, date: "2026-04-03", note: "Wholesale to Green Leaf Dispensary" },
  { id: "mov-3", batchId: "batch-3", product: demoProducts[1], movementType: "receive", quantity: 500, date: "2026-04-02", note: "Production run PR-0402 complete" },
  { id: "mov-4", batchId: "batch-3", product: demoProducts[1], movementType: "sale", quantity: -160, date: "2026-04-05", note: "Retail POS morning batch" },
  { id: "mov-5", batchId: "batch-4", product: demoProducts[2], movementType: "receive", quantity: 600, date: "2026-04-03", note: "Cart fill from live resin run" },
  { id: "mov-6", batchId: "batch-4", product: demoProducts[2], movementType: "sale", quantity: -40, date: "2026-04-06", note: "Retail POS evening batch" },
  { id: "mov-7", batchId: "batch-6", product: demoProducts[4], movementType: "adjustment", quantity: -5, date: "2026-04-04", note: "QC failed units pulled" },
  { id: "mov-8", batchId: "batch-7", product: demoProducts[5], movementType: "transfer", quantity: 0, date: "2026-04-05", note: "Location transfer: Oakland to Richmond" },
];

const movementTypeColor: Record<string, string> = {
  receive: "bg-emerald-500/20 text-emerald-300",
  sale: "bg-blue-500/20 text-blue-300",
  adjustment: "bg-amber-500/20 text-amber-300",
  waste: "bg-red-500/20 text-red-300",
  transfer: "bg-violet-500/20 text-violet-300",
};

const sourceBadge: Record<string, string> = {
  Metrc: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  manual: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

// --- Helpers ---

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

// --- Page ---

export default function InventoryPage() {
  const totalProducts = demoProducts.length;
  const activeBatches = demoBatches.length;
  const totalUnitsOnHand = demoBatches.reduce((sum, b) => sum + b.quantityOnHand, 0);
  const totalInventoryValue = demoBatches.reduce((sum, b) => sum + b.quantityOnHand * b.costBasis, 0);

  return (
    <AppShell
      title="Inventory"
      description="Seed-to-sale inventory tracking with batch-level cost basis, real-time package counts, and Metrc state reporting integration."
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
        <MetricCard label="Active Products" value={String(totalProducts)} detail={`${demoProducts.filter((p) => p.category === "flower").length} flower SKUs, ${demoProducts.filter((p) => p.category !== "flower").length} other`} />
        <MetricCard label="Open Batches" value={String(activeBatches)} detail="Packages with available on-hand quantity" />
        <MetricCard label="Total Units On Hand" value={totalUnitsOnHand.toLocaleString()} detail={`Across ${activeBatches} tracked batches`} />
        <MetricCard label="Inventory Value" value={formatCurrency(totalInventoryValue)} detail="Cost basis-weighted valuation" />
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
              {demoBatches.map((batch) => (
                <tr key={batch.id} className="border-b border-border/50 transition hover:bg-surface/50">
                  <td className="py-3 pr-4 font-medium">{batch.product.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-muted">{batch.product.sku}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-muted">{batch.packageTag.slice(0, 8)}...{batch.packageTag.slice(-4)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{batch.quantityOnHand.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(batch.costBasis)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums font-medium">{formatCurrency(batch.quantityOnHand * batch.costBasis)}</td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sourceBadge[batch.source] ?? sourceBadge.manual}`}>
                      {batch.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border text-sm font-semibold text-text-primary">
                <td colSpan={3} className="pt-3 pr-4">Totals</td>
                <td className="pt-3 pr-4 text-right tabular-nums">{totalUnitsOnHand.toLocaleString()}</td>
                <td className="pt-3 pr-4" />
                <td className="pt-3 pr-4 text-right tabular-nums">{formatCurrency(totalInventoryValue)}</td>
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
            <div className="mt-1 text-xs text-text-muted">Last 8 inventory transactions across all movement types</div>
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
              {demoMovements.map((mov) => (
                <tr key={mov.id} className="border-b border-border/50 transition hover:bg-surface/50">
                  <td className="py-3 pr-4 text-xs text-text-muted">{mov.date}</td>
                  <td className="py-3 pr-4 font-medium">{mov.product.name}</td>
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
    </AppShell>
  );
}
