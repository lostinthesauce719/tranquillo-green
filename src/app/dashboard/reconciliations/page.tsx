"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";

type PackageStatus = "matched" | "variance" | "missing_in_books" | "resolved";

interface MetrcPackage {
  _id: string;
  packageLabel: string;
  product: string;
  uom: string;
  metrcQty: number;
  bookQty: number;
  status: PackageStatus;
  resolutionNote?: string;
  lastSyncAt: number;
}

const STATUS_META: Record<PackageStatus, { label: string; badge: string }> = {
  matched: { label: "Matched", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  variance: { label: "Variance", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  missing_in_books: { label: "Missing in books", badge: "bg-red-500/15 text-red-300 border-red-500/30" },
  resolved: { label: "Resolved", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
};

export default function MetrcReconciliationPage() {
  const tenant = useTenant();
  const companyId = tenant.companyId;

  const [packages, setPackages] = useState<MetrcPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [filter, setFilter] = useState<PackageStatus | "all">("all");

  const [newLabel, setNewLabel] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newUom, setNewUom] = useState("g");
  const [newMetrcQty, setNewMetrcQty] = useState("");
  const [newBookQty, setNewBookQty] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrc/packages?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load packages");
      setPackages(data.packages ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => ({
    total: packages.length,
    matched: packages.filter((p) => p.status === "matched").length,
    variance: packages.filter((p) => p.status === "variance").length,
    missing: packages.filter((p) => p.status === "missing_in_books").length,
    resolved: packages.filter((p) => p.status === "resolved").length,
  }), [packages]);

  const filtered = filter === "all" ? packages : packages.filter((p) => p.status === filter);

  async function postAction(payload: Record<string, unknown>): Promise<any> {
    const res = await fetch("/api/metrc/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await postAction({
        action: "upsert",
        companyId,
        packageLabel: newLabel.trim(),
        product: newProduct.trim(),
        uom: newUom,
        metrcQty: parseFloat(newMetrcQty) || 0,
        bookQty: parseFloat(newBookQty) || 0,
      });
      setNewLabel("");
      setNewProduct("");
      setNewMetrcQty("");
      setNewBookQty("");
      setShowAddForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to add package");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(pkg: MetrcPackage) {
    if (!resolutionNote.trim()) return;
    try {
      const data = await postAction({ action: "resolve", packageId: pkg._id, resolutionNote: resolutionNote.trim() });
      setPackages((prev) => prev.map((p) => (p._id === pkg._id ? data.package : p)));
      setResolvingId(null);
      setResolutionNote("");
    } catch (e: any) {
      setError(e.message || "Failed to resolve variance");
    }
  }

  async function handleDelete(pkg: MetrcPackage) {
    if (!confirm(`Delete package ${pkg.packageLabel}?`)) return;
    const previous = packages;
    setPackages((prev) => prev.filter((p) => p._id !== pkg._id));
    try {
      await postAction({ action: "delete", packageId: pkg._id });
    } catch (e: any) {
      setPackages(previous);
      setError(e.message || "Failed to delete package");
    }
  }

  return (
    <AppShell title="Metrc Reconciliation" description="Reconcile Metrc package quantities with your books. Catch variances before auditors do.">
      <div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium hover:bg-red-500/10"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center gap-2 text-xs text-text-muted"><Package className="h-4 w-4" /> Packages</div>
            <div className="mt-1 text-2xl font-bold text-text-primary">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Matched</div>
            <div className="mt-1 text-2xl font-bold text-emerald-300">{stats.matched}</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-amber-300"><AlertTriangle className="h-4 w-4" /> Variances</div>
            <div className="mt-1 text-2xl font-bold text-amber-300">{stats.variance + stats.missing}</div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 text-xs text-blue-300"><HelpCircle className="h-4 w-4" /> Resolved</div>
            <div className="mt-1 text-2xl font-bold text-blue-300">{stats.resolved}</div>
          </div>
        </div>

        {/* Filters + add */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "variance", "missing_in_books", "matched", "resolved"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={"rounded-full border px-3 py-1 text-sm transition " + (filter === value ? "border-brand bg-brand text-white" : "border-border bg-surface text-text-muted hover:text-text-primary")}
              >
                {value === "all" ? "All" : STATUS_META[value].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Add Package
          </button>
        </div>

        {showAddForm && (
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Metrc tag</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="1A4060300003F1000001234"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Product</label>
                <input
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="Blue Dream 1g"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Unit</label>
                <select
                  value={newUom}
                  onChange={(e) => setNewUom(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                >
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="ea">ea</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Metrc qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMetrcQty}
                  onChange={(e) => setNewMetrcQty(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Book qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBookQty}
                  onChange={(e) => setNewBookQty(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || saving}
              className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Package"}
            </button>
            <p className="mt-2 text-xs text-text-faint">
              Re-adding an existing tag updates its quantities and recomputes the variance status.
            </p>
          </div>
        )}

        {/* Package table */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg border border-border/50 bg-surface-mid/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-mid py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-text-faint" />
            <p className="text-sm text-text-muted">
              {packages.length === 0
                ? "No packages tracked yet. Add Metrc packages to start reconciling against your books."
                : "No packages match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((pkg) => {
              const variance = pkg.metrcQty - pkg.bookQty;
              const meta = STATUS_META[pkg.status];
              return (
                <div key={pkg._id}>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs text-text-secondary">{pkg.packageLabel}</span>
                        <span className={"rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider " + meta.badge}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {pkg.product || "—"} · Metrc {pkg.metrcQty}{pkg.uom} · Books {pkg.bookQty}{pkg.uom}
                        {variance !== 0 && (
                          <span className={variance > 0 ? " text-amber-300" : " text-red-300"}>
                            {" "}· Δ {variance > 0 ? "+" : ""}{variance.toFixed(2)}{pkg.uom}
                          </span>
                        )}
                      </div>
                      {pkg.resolutionNote && (
                        <div className="mt-1 text-xs text-blue-300">Resolution: {pkg.resolutionNote}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(pkg.status === "variance" || pkg.status === "missing_in_books") && (
                        <button
                          onClick={() => { setResolvingId(resolvingId === pkg._id ? null : pkg._id); setResolutionNote(""); }}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-500/10"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(pkg)}
                        className="rounded-lg border border-border p-2 text-text-faint transition hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {resolvingId === pkg._id && (
                    <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <label className="mb-1 block text-xs text-text-muted">
                        Resolution note (recorded in the audit trail)
                      </label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        rows={2}
                        placeholder="e.g., Data entry error — adjusted book quantity after recount on 8/5."
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleResolve(pkg)}
                          disabled={!resolutionNote.trim()}
                          className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => setResolvingId(null)}
                          className="rounded-lg border border-border px-4 py-1.5 text-sm text-text-muted transition hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
