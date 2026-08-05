"use client";

import { useState } from "react";
import { evaluateStructures, type OptimizationInput, type StructureRecommendation } from "@/lib/plan-b/entity-optimizer";

export default function PlanBPage() {
  const [view, setView] = useState<"input" | "results">("input");
  const [result, setResult] = useState<{
    recommendations: StructureRecommendation[];
    bestStructure: string;
    projectedSavings: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<OptimizationInput>({
    currentRevenue: 8_000_000,
    revenueByCategory: {
      retail: 5_000_000,
      cultivation: 2_000_000,
      manufacturing: 0,
      distribution: 500_000,
      delivery: 500_000,
    },
    state: "CA",
    currentStructure: "single",
    hasCultivationLicense: true,
    hasManufacturingLicense: false,
    hasRetailLicense: true,
    hasDistributionLicense: false,
    priority: "tax_savings",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan-b/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({
          recommendations: data.recommendations,
          bestStructure: data.summary.bestStructure,
          projectedSavings: data.summary.projectedTaxSavings,
        });
        setView("results");
      } else {
        alert(data.error || "Failed to evaluate");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-text-primary">Plan B: Entity Structuring Optimizer</h1>
          <p className="mt-1 text-sm text-text-muted">
            Internal tool — not linked from navigation. Evaluate legal structures for 280E + 471(c) optimization.
          </p>
        </div>

        {view === "input" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: Input Form */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Company Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Current Annual Revenue</label>
                  <input
                    type="number"
                    value={form.currentRevenue}
                    onChange={(e) => setForm({ ...form, currentRevenue: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-brand focus:outline-none"
                  >
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="OR">Oregon</option>
                    <option value="WA">Washington</option>
                    <option value="NV">Nevada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-brand focus:outline-none"
                  >
                    <option value="tax_savings">Maximize Tax Savings</option>
                    <option value="defensibility">Audit Defensibility</option>
                    <option value="simplicity">Operational Simplicity</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.hasCultivationLicense}
                      onChange={(e) => setForm({ ...form, hasCultivationLicense: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-text-secondary">Cultivation</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.hasManufacturingLicense}
                      onChange={(e) => setForm({ ...form, hasManufacturingLicense: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-text-secondary">Manufacturing</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.hasRetailLicense}
                      onChange={(e) => setForm({ ...form, hasRetailLicense: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-text-secondary">Retail/Dispensary</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.hasDistributionLicense}
                      onChange={(e) => setForm({ ...form, hasDistributionLicense: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-sm text-text-secondary">Distribution</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                {loading ? "Evaluating..." : "Evaluate Structures"}
              </button>
            </div>

            {/* Right: Info Panel */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-xl font-semibold text-text-primary">Revenue Breakdown</h2>
              <div className="space-y-3">
                <RevenueSlider
                  label="Retail"
                  value={form.revenueByCategory.retail}
                  onChange={(v) => setForm({
                    ...form,
                    revenueByCategory: { ...form.revenueByCategory, retail: v },
                  })}
                />
                <RevenueSlider
                  label="Cultivation"
                  value={form.revenueByCategory.cultivation}
                  onChange={(v) => setForm({
                    ...form,
                    revenueByCategory: { ...form.revenueByCategory, cultivation: v },
                  })}
                />
                <RevenueSlider
                  label="Manufacturing"
                  value={form.revenueByCategory.manufacturing}
                  onChange={(v) => setForm({
                    ...form,
                    revenueByCategory: { ...form.revenueByCategory, manufacturing: v },
                  })}
                />
                <RevenueSlider
                  label="Distribution"
                  value={form.revenueByCategory.distribution}
                  onChange={(v) => setForm({
                    ...form,
                    revenueByCategory: { ...form.revenueByCategory, distribution: v },
                  })}
                />
                <RevenueSlider
                  label="Delivery"
                  value={form.revenueByCategory.delivery}
                  onChange={(v) => setForm({
                    ...form,
                    revenueByCategory: { ...form.revenueByCategory, delivery: v },
                  })}
                />
              </div>

              <div className="mt-6 rounded-lg bg-accent/5 p-4">
                <h3 className="font-semibold text-accent">Stealth Mode Active</h3>
                <p className="mt-1 text-sm text-text-muted">
                  This page is intentionally hidden from navigation. Access via direct URL or internal tools only.
                  Do not share externally without approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {view === "results" && result && (
          <div className="space-y-6">
            <button
              onClick={() => setView("input")}
              className="text-sm text-brand hover:underline"
            >
              ← Back to input
            </button>

            <div className="rounded-2xl border-2 border-brand bg-brand-soft p-6">
              <h2 className="text-xl font-semibold text-text-primary">Best Recommendation</h2>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-brand capitalize">{result.bestStructure.replace("_", " ")}</span>
                <span className="text-lg text-text-muted">
                  → ${result.projectedSavings.toLocaleString()}/yr tax savings
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.recommendations.map((rec) => (
                <div
                  key={rec.structure}
                  className={`rounded-2xl border-2 p-6 transition-all ${
                    rec.structure === result.bestStructure
                      ? "border-brand bg-surface-raised shadow-lg"
                      : "border-border bg-surface"
                  }`}
                >
                  <h3 className="text-lg font-bold text-text-primary capitalize">
                    {rec.structure.replace("_", " ")}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-text-muted">Score</span>
                    <span className={`text-lg font-semibold ${rec.score >= 80 ? "text-brand" : rec.score >= 60 ? "text-accent" : "text-text-secondary"}`}>
                      {rec.score}/100
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-text-secondary">{rec.description}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Tax Savings</span>
                      <span className="font-medium text-text-primary">${rec.annualTaxSavings.toLocaleString()}/yr</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Setup Cost</span>
                      <span className="font-medium text-text-primary">${rec.setupCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Complexity</span>
                      <span className={`capitalize font-medium ${
                        rec.complianceComplexity === "high" ? "text-red-400" :
                        rec.complianceComplexity === "medium" ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {rec.complianceComplexity}
                      </span>
                    </div>
                  </div>

                  {rec.requiredPartners.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                        Required Partners
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rec.requiredPartners.map((partner) => (
                          <span
                            key={partner}
                            className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-text-secondary"
                          >
                            {partner}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.suggestedEntities.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-text-faint">
                        Suggested Entities
                      </div>
                      <ul className="mt-1 space-y-1">
                        {rec.suggestedEntities.map((entity) => (
                          <li key={entity.name} className="text-sm text-text-secondary">
                            • {entity.name} — {entity.purpose}
                            {entity.licenseType && (
                              <span className="ml-1 text-xs text-text-faint">({entity.licenseType})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <label className="font-medium text-text-secondary">{label}</label>
        <span className="text-text-muted">${(value / 1_000_000).toFixed(1)}M</span>
      </div>
      <input
        type="range"
        min="0"
        max="10000000"
        step="100000"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
    </div>
  );
}
