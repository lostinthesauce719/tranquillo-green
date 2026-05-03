"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/auth/tenant-context";

interface TaxRate {
  _id: string;
  jurisdictionId: string;
  jurisdictionName?: string;
  taxTypeId: string;
  taxTypeCode?: string;
  taxTypeName?: string;
  rate: number;
  rateType: "percentage" | "fixed_amount";
  effectiveFrom: number;
  effectiveTo?: number | null;
  productCategoryFilter?: string | null;
  notes?: string | null;
}

interface TaxRateTableProps {
  className?: string;
}

export function TaxRateTable({ className }: TaxRateTableProps) {
  const tenant = useTenant();
  const canEdit = tenant.role === "owner" || tenant.role === "controller";

  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TaxRate>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/rates");
        const data = await res.json();
        if (data.ok) setRates(data.rates);
      } catch (e) {
        setMessage({ type: "error", text: "Failed to load tax rates" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(rate: TaxRate) {
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        rateId: editingId,
        jurisdictionId: editForm.jurisdictionId ?? rate.jurisdictionId,
        taxTypeId: editForm.taxTypeId ?? rate.taxTypeId,
        rate: editForm.rate ?? rate.rate,
        rateType: editForm.rateType ?? rate.rateType,
        effectiveFrom: editForm.effectiveFrom ?? rate.effectiveFrom,
        effectiveTo: editForm.effectiveTo ?? rate.effectiveTo,
        productCategoryFilter: editForm.productCategoryFilter ?? rate.productCategoryFilter ?? null,
        notes: editForm.notes ?? rate.notes ?? null,
      };

      const res = await fetch("/api/tax/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Tax rate updated." });
        setEditingId(null);
        // Refresh list
        const rere = await fetch("/api/tax/rates");
        const rd = await rere.json();
        if (rd.ok) setRates(rd.rates);
      } else {
        setMessage({ type: "error", text: data.message ?? "Update failed" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(rate: TaxRate) {
    setEditingId(rate._id);
    setEditForm({ ...rate });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function formatDate(ts: number | null | undefined) {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString();
  }

  if (loading) {
    return <div className="p-4 text-text-muted">Loading tax rates…</div>;
  }

  return (
    <section className={`rounded-2xl border border-border bg-surface-mid p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Tax Rate Table</h3>
          <p className="text-sm text-text-muted">View and edit tax rates by jurisdiction and type.</p>
        </div>
        {canEdit && (
          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
            Admin Only
          </span>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === "success" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-surface/80 text-[10px] uppercase tracking-[0.15em] text-text-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Jurisdiction</th>
                <th className="px-4 py-3 font-medium">Tax Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category Filter</th>
                <th className="px-4 py-3 font-medium">Effective From</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rates.map((rate) => (
                <tr key={rate._id} className="align-top transition hover:bg-surface/60">
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-text-primary">
                    {rate.jurisdictionName ?? rate.jurisdictionId}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-text-primary">{rate.taxTypeName ?? rate.taxTypeId}</span>
                    {rate.taxTypeCode && (
                      <div className="text-xs text-text-muted/60">{rate.taxTypeCode}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-text-primary">
                      {rate.rateType === "percentage" ? `${(rate.rate * 100).toFixed(2)}%` : `$${rate.rate.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-text-muted/70 uppercase">{rate.rateType}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {rate.productCategoryFilter ?? "All"}
                  </td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDate(rate.effectiveFrom)}
                    {rate.effectiveTo && ` → ${formatDate(rate.effectiveTo)}`}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === rate._id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(rate)}
                          disabled={saving}
                          className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(rate)}
                        disabled={!canEdit}
                        className="rounded border border-transparent px-2 py-1 text-xs text-brand hover:bg-brand/10 disabled:opacity-30"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    No tax rates defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form (inline row expansion could go here; simplified for now as prompts) */}
    </section>
  );
}
