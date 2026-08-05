"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
// Types inlined for MVP
interface TaxType {
  _id: string;
  name: string;
  code: string;
}

interface TaxJurisdiction {
  _id: string;
  jurisdictionName: string;
  jurisdictionLevel: string;
}

interface TaxProfile {
  primaryJurisdictionId?: string | null;
  nexusStates?: string[];
  taxTypesEnabled?: string[];
  filingCalendar?: Record<string, string>;
}


interface TaxSettingsPanelProps {
  className?: string;
}

export function TaxSettingsPanel({ className }: TaxSettingsPanelProps) {
  const tenant = useTenant();
  const canEdit = tenant.role === "owner" || tenant.role === "controller";

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);

  // Form fields
  const [primaryJurisdictionId, setPrimaryJurisdictionId] = useState<string>("");
  const [nexusStates, setNexusStates] = useState<string[]>(["CA"]);
  const [taxTypesEnabled, setTaxTypesEnabled] = useState<string[]>([]);
  const [filingCalendar, setFilingCalendar] = useState<Record<string, string>>({});

  // Demo fallback: pre-populate with CA data when API returns empty
  const demoJurisdictions: TaxJurisdiction[] = [
    { _id: "j-ca", jurisdictionName: "California", jurisdictionLevel: "state" },
    { _id: "j-ca-excise", jurisdictionName: "California Excise", jurisdictionLevel: "state" },
    { _id: "j-ca-local", jurisdictionName: "California Local", jurisdictionLevel: "local" },
  ];

  const demoTaxTypes: TaxType[] = [
    { _id: "tt-excise", name: "Cannabis Excise Tax", code: "EXCISE" },
    { _id: "tt-sales", name: "Sales Tax", code: "SALES" },
    { _id: "tt-cultivation", name: "Cultivation Tax", code: "CULT" },
    { _id: "tt-local", name: "Local Cannabis Tax", code: "LOCAL" },
  ];

  const effectiveJurisdictions = jurisdictions.length > 0 ? jurisdictions : demoJurisdictions;
  const effectiveTaxTypes = taxTypes.length > 0 ? taxTypes : demoTaxTypes;

  // Load on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax");
        const data = await res.json();
        if (data.ok) {
          setProfile(data.profile);
          setTaxTypes(data.taxTypes || []);
          setJurisdictions(data.jurisdictions || []);

          if (data.profile) {
            setPrimaryJurisdictionId(data.profile.primaryJurisdictionId ?? "");
            setNexusStates(data.profile.nexusStates ?? ["CA"]);
            setTaxTypesEnabled(data.profile.taxTypesEnabled ?? []);
            setFilingCalendar(data.profile.filingCalendar ?? {});
          } else {
            // Demo mode: pre-populate CA
            setPrimaryJurisdictionId("j-ca");
            setNexusStates(["CA"]);
            setTaxTypesEnabled(["tt-excise", "tt-sales"]);
          }
        } else {
          // API failed — use demo defaults
          setPrimaryJurisdictionId("j-ca");
          setNexusStates(["CA"]);
          setTaxTypesEnabled(["tt-excise", "tt-sales"]);
        }
      } catch (e) {
        setMessage({ type: "error", text: "Failed to load tax settings" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryJurisdictionId: primaryJurisdictionId || null,
          nexusStates,
          filingCalendar,
          taxTypesEnabled,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "Tax settings saved successfully." });
        setProfile(data.profile ?? profile);
      } else {
        setMessage({ type: "error", text: data.message ?? "Save failed" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }

  function toggleTaxType(code: string) {
    setTaxTypesEnabled((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  // Helper: get jurisdiction display label
  function jurisdictionLabel(j: TaxJurisdiction) {
    return `${j.jurisdictionName} (${j.jurisdictionLevel})`;
  }

  if (loading) {
    return <div className="p-4 text-text-muted">Loading tax settings…</div>;
  }

  return (
    <section className={`rounded-2xl border border-border bg-surface-mid p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Tax Configuration</h2>
        <p className="mt-1 text-sm text-text-muted">
          Configure tax jurisdictions, filing frequencies, and enabled tax types for your company.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Primary Jurisdiction */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Primary Tax Jurisdiction</label>
            <select
              value={primaryJurisdictionId}
              onChange={(e) => setPrimaryJurisdictionId(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:opacity-50"
            >
              <option value="">Select jurisdiction…</option>
              {effectiveJurisdictions.map((j) => (
                <option key={j._id} value={j._id}>
                  {jurisdictionLabel(j)}
                </option>
              ))}
            </select>
          </div>

          {/* Nexus states (multi-select) */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">Nexus States (where you operate)</label>
            <div className="flex flex-wrap gap-2">
              {["CO", "CA"].map((st) => (
                <label
                  key={st}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition ${
                    nexusStates.includes(st)
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-muted hover:border-brand/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={nexusStates.includes(st)}
                    disabled={!canEdit}
                    onChange={() => {
                      if (!canEdit) return;
                      setNexusStates((prev) =>
                        prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
                      );
                    }}
                    className="accent-brand"
                  />
                  {st}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Enabled Tax Types */}
        <div>
          <label className="mb-2 block text-xs text-text-muted">Enabled Tax Types</label>
          <div className="flex flex-wrap gap-3">
            {effectiveTaxTypes.map((tt) => (
              <label
                key={tt._id}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                  taxTypesEnabled.includes(tt._id)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-text-muted hover:border-brand/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={taxTypesEnabled.includes(tt._id)}
                  disabled={!canEdit}
                  onChange={() => {
                    if (!canEdit) return;
                    toggleTaxType(tt._id);
                  }}
                  className="accent-brand"
                />
                {tt.name}
                <span className="text-[10px] opacity-60">({tt.code})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filing Calendar */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-medium text-text-primary">Filing Calendar</h3>
          <p className="text-xs text-text-muted">
            Filing frequencies are determined per jurisdiction and tax type based on state rules.
            Configure your jurisdictions and tax types above to auto-generate filing deadlines.
          </p>
          {Object.keys(filingCalendar).length > 0 && (
            <div className="mt-3 space-y-1">
              {Object.entries(filingCalendar).map(([key, freq]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{key}</span>
                  <span className="text-text-muted">{freq}</span>
                </div>
              ))}
            </div>
          )}
          {Object.keys(filingCalendar).length === 0 && (
            <div className="mt-3 rounded-lg border border-dashed border-border px-4 py-3 text-center text-xs text-text-muted">
              No filing calendar configured yet. Select a jurisdiction and tax types above to get started.
            </div>
          )}
        </div>

        {/* Save button */}
        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Tax Settings"}
          </button>
        )}
      </form>
    </section>
  );
}
