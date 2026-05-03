"use client";

import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import type { InventoryProduct, InventoryBatch, InventoryMovement } from "@/lib/data/inventory";
import { useTenant } from "@/lib/auth/tenant-context";
import { useRouter } from "next/navigation";
import { connectMetrc, getMetrcStatus, syncMetrc } from "@/app/api/metrc/actions";

import { parseCSV } from "@/lib/csv/parse";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

import { importInventoryCsv } from "@/app/api/inventory/import/actions";
import type { MetrcSyncResult } from "@/lib/integrations/metrc-client";
import { useEffect, useState, useRef } from "react";

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
  // CSV import state
  const csvFileRef = useRef<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<"idle" | "parsing" | "ready" | "importing" | "done" | "error" | "dragging">("idle");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [importResults, setImportResults] = useState<Array<{ rowIdx: number; success: boolean; message: string }> | null>(null);



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


  // ── CSV import handlers ──
  const handleCsvFileChange = (file: File) => {
    setCsvFile(file);
    setCsvStatus("parsing");
    setCsvError(null);
    setCsvPreview(null);
    setImportResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0) throw new Error("No headers found in CSV");
        if (rows.length === 0) throw new Error("CSV contains no data rows");
        csvFileRef.current = { headers, rows };
        setCsvPreview({ headers, rows: rows.slice(0, 5) });
        setCsvStatus("ready");
      } catch (err: any) {
        setCsvError(err.message ?? "Failed to parse CSV");
        setCsvStatus("error");
      }
    };
    reader.readAsText(file);
  };

  const handleCsvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleCsvFileChange(dropped);
  };

  const handleCsvImport = async () => {
    if (!csvFileRef.current || !companyId) return;
    setCsvStatus("importing");
    setImportResults(null);
    try {
      const { headers } = csvFileRef.current;
      const rows = csvFileRef.current.rows;

      // Build column-to-field mapping
      const headerToField: Record<string, string> = {};
      for (const h of headers) {
        const norm = h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        if (/sku/.test(norm)) headerToField[h] = "sku";
        else if (/(product|name)/.test(norm)) headerToField[h] = "productName";
        else if (/(qty|quantity)/.test(norm)) headerToField[h] = "quantity";
        else if (/(unit_cost|unitcost|cost)/.test(norm)) headerToField[h] = "unitCost";
        else if (/(package|tag)/.test(norm)) headerToField[h] = "packageTag";
        else if (/(location)/.test(norm)) headerToField[h] = "locationName";
        else if (/(category)/.test(norm)) headerToField[h] = "category";
        else if (/(uom|unit_measure)/.test(norm)) headerToField[h] = "unitOfMeasure";
      }

      const mappedRows: Array<{
        productName: string;
        sku: string;
        packageTag?: string;
        quantity: number;
        unitCost: number;
        category?: string;
        unitOfMeasure?: string;
        locationName?: string;
      }> = [];

      for (const row of rows) {
        const mapped: any = {};
        for (const [col, field] of Object.entries(headerToField)) {
          mapped[field] = row[col]?.trim() ?? "";
        }
        mappedRows.push(mapped as any);
      }

      const results = await importInventoryCsv({ companyId, rows: mappedRows });
      setImportResults(results);
      setCsvStatus("done");
      router.refresh();
    } catch (err: any) {
      setCsvError(err.message ?? "Import failed");
      setCsvStatus("error");
    }
  };

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


      {/* ─── CSV Inventory Import ─── */}
       {source === "convex" && companyId && (
        <div className="mb-8 rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">Inventory CSV Import</h3>

          {csvStatus === "idle" && (
            <div
              className="mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:bg-surface-raised/50 cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); setCsvStatus("dragging"); }}
              onDragLeave={(e) => { e.preventDefault(); setCsvStatus("idle"); }}
              onDrop={handleCsvDrop}
              onClick={() => csvInputRef.current?.click()}
            >
              <UploadCloud className="mb-2 h-6 w-6 text-text-muted" />
              <p className="text-sm text-text-muted">Drag CSV here or click to upload</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={csvInputRef}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFileChange(f); }}
              />
            </div>
          )}

          {csvStatus === "parsing" && (
            <div className="py-4 text-center text-sm text-text-muted">Parsing CSV…</div>
          )}

          {csvError && csvStatus !== "parsing" && (
            <div className="py-2 text-center text-sm text-rose-300">{csvError}</div>
          )}

          {csvPreview && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-text-muted">Preview — {csvPreview.rows.length} rows</span>
                <button
                  onClick={handleCsvImport}
                  disabled={csvStatus === "importing"}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {csvStatus === "importing" ? (
                    <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Importing…</>
                  ) : (
                    "Import to Inventory"
                  )}
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/30">
                      {csvPreview.headers.map((h, idx) => (
                        <th key={idx} className="px-2 py-1 text-left font-medium text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-border/50">
                        {csvPreview.headers.map((h, cIdx) => (
                          <td key={cIdx} className="px-2 py-1 text-white">
                            {row[h] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvPreview.rows.length > 5 && (
                <div className="mt-1 text-xs text-text-muted">Showing first 5 rows</div>
              )}
            </div>
          )}

          {importResults && (
            <div className="mt-4">
              <div className="mb-2 font-semibold text-white">Import Summary</div>
              <ul className="space-y-1">
                {importResults.map((r) => (
                  <li
                    key={r.rowIdx}
                    className={r.success ? "text-emerald-300" : "text-rose-300"}
                  >
                    Row {r.rowIdx + 1}: {r.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
