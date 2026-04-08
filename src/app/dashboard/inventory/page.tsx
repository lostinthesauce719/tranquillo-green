import { AppShell } from '@/components/shell/app-shell';
import { MetricCard } from '@/components/ui/metric-card';
import {
  demoProducts,
  demoBatches,
  demoMovements,
  demoSyncStatuses,
  summarizeInventory,
} from '@/lib/demo/inventory';
import type { BatchStatus, SyncStatus } from '@/lib/demo/inventory';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const usd = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtNum = (n: number) => n.toLocaleString('en-US');

const batchStatusColor: Record<BatchStatus, string> = {
  in_stock: 'bg-emerald-500/20 text-emerald-400',
  low_stock: 'bg-amber-500/20 text-amber-400',
  depleted: 'bg-red-500/20 text-red-400',
  quarantined: 'bg-violet-500/20 text-violet-400',
};

const syncStatusColor: Record<SyncStatus, string> = {
  synced: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
};

const complianceColor: Record<string, string> = {
  compliant: 'text-emerald-400',
  pending_review: 'text-amber-400',
  non_compliant: 'text-red-400',
};

const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Resolve product name from SKU
// ---------------------------------------------------------------------------

const productNameBySku = Object.fromEntries(demoProducts.map((p) => [p.sku, p.name]));

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InventoryPage() {
  const summary = summarizeInventory();
  const sortedMovements = [...demoMovements].sort(
    (a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime(),
  );

  return (
    <AppShell
      title="Inventory"
      description="Track-and-trace inventory synced with METRC. Monitor stock levels, batch compliance, and reconciliation drift."
    >
      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total SKUs"
          value={String(summary.totalProducts)}
          detail={`${demoProducts.length} total · ${demoProducts.filter((p) => !p.active).length} inactive`}
        />
        <MetricCard
          label="Units on Hand"
          value={fmtNum(summary.totalUnitsOnHand)}
          detail={`${summary.lowStockCount} low stock · ${summary.quarantinedCount} quarantined`}
        />
        <MetricCard
          label="Inventory Value"
          value={usd(summary.totalCostBasis)}
          detail="Weighted-average cost basis"
        />
        <MetricCard
          label="Drift %"
          value={`${summary.driftPercent.toFixed(1)}%`}
          detail="METRC vs local variance"
        />
      </div>

      {/* ── Products ──────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Products</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-mid">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">UoM</th>
                <th className="px-4 py-3 font-medium">Compliance</th>
                <th className="px-4 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {demoProducts.map((p) => (
                <tr key={p.sku} className="border-b border-border/50 last:border-0 hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3">{p.unitOfMeasure}</td>
                  <td className="px-4 py-3">
                    <span className={complianceColor[p.complianceStatus] ?? 'text-text-muted'}>
                      {label(p.complianceStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="text-emerald-400">●&nbsp;Yes</span>
                    ) : (
                      <span className="text-red-400">●&nbsp;No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Batches ───────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Inventory Batches</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-mid">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">Package Tag</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Cost Basis</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {demoBatches.map((b) => (
                <tr
                  key={b.packageTag}
                  className="border-b border-border/50 last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {b.packageTag.slice(0, 8)}…{b.packageTag.slice(-6)}
                  </td>
                  <td className="px-4 py-3">{productNameBySku[b.productSku] ?? b.productSku}</td>
                  <td className="px-4 py-3 text-text-muted">{b.locationName}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtNum(b.quantityOnHand)}</td>
                  <td className="px-4 py-3 text-right font-mono">{usd(b.costBasis)}</td>
                  <td className="px-4 py-3 text-text-muted">{label(b.source)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${batchStatusColor[b.status]}`}
                    >
                      {label(b.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Recent Movements ──────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Recent Movements</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-mid">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Package Tag</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {sortedMovements.map((m, i) => (
                <tr
                  key={`${m.batchPackageTag}-${i}`}
                  className="border-b border-border/50 last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-3 text-text-muted">{fmtDate(m.movementDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    …{m.batchPackageTag.slice(-8)}
                  </td>
                  <td className="px-4 py-3 capitalize">{m.movementType}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      m.quantity < 0 ? 'text-red-400' : m.quantity > 0 ? 'text-emerald-400' : 'text-text-muted'
                    }`}
                  >
                    {m.quantity > 0 ? '+' : ''}
                    {fmtNum(m.quantity)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{m.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Metrc Sync Status ─────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Metrc Sync Status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {demoSyncStatuses.map((s) => (
            <div
              key={s.locationName}
              className="rounded-2xl border border-border bg-surface-mid p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-text-primary">{s.locationName}</span>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${syncStatusColor[s.status]}`}
                >
                  {label(s.status)}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-text-muted">Last Sync</dt>
                <dd className="text-right text-text-primary">{fmtDate(s.lastSyncAt)}</dd>
                <dt className="text-text-muted">Records</dt>
                <dd className="text-right font-mono text-text-primary">{fmtNum(s.recordsProcessed)}</dd>
                <dt className="text-text-muted">Next Sync</dt>
                <dd className="text-right text-text-primary">{fmtDate(s.nextScheduledSync)}</dd>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
