"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPERATOR_TYPES = [
  { value: "dispensary", label: "Dispensary", icon: "🏪", desc: "Retail cannabis operations" },
  { value: "cultivator", label: "Cultivator", icon: "🌱", desc: "Cannabis cultivation and harvest" },
  { value: "manufacturer", label: "Manufacturer", icon: "⚗️", desc: "Extraction and infused products" },
  { value: "distributor", label: "Distributor", icon: "🚛", desc: "Distribution and logistics" },
  { value: "delivery", label: "Delivery", icon: "🛵", desc: "Direct-to-consumer delivery" },
  { value: "vertical", label: "Vertical (Integrated)", icon: "🌿", desc: "Seed-to-sale operations" },
];

const ACCOUNTING_METHODS = [
  { value: "cash", label: "Cash Basis", desc: "Record transactions when cash changes hands" },
  { value: "accrual", label: "Accrual Basis", desc: "Record transactions when earned/incurred" },
];

const METRC_STATES = [
  "CA", "CO", "MI", "MA", "OR", "IL", "NV", "MD", // Add more Metrc states as needed
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];


const STEPS = [
  { id: "company", label: "Company Info" },
  { id: "operator", label: "Operator Type" },
  { id: "integrations", label: "Integrations" },
  { id: "471c", label: "471(c) Eligibility" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1: Company
  const [name, setName] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [accountingMethods, setAccountingMethods] = useState<string[]>([]);
  const [operatorTypes, setOperatorTypes] = useState<string[]>([]);
  // IRC 471 classification and measured allocation bases. Without these the
  // reclassification engine correctly refuses to reclassify anything, so the
  // operator gets no 280E benefit — which is why they are collected up front.
  const [inventoryRole, setInventoryRole] = useState<"" | "reseller" | "producer">("");
  const [productionSqFt, setProductionSqFt] = useState("");
  const [totalSqFt, setTotalSqFt] = useState("");
  const [productionHours, setProductionHours] = useState("");
  const [totalHours, setTotalHours] = useState("");

  // Step 2: Operator Types (multi-select)

  // Step 3: Integrations (skip-able)
  const [metrcSkipped, setMetrcSkipped] = useState(false);
  const [qboSkipped, setQboSkipped] = useState(false);

  // Step 4: 471(c)
  const [priorYear1, setPriorYear1] = useState(new Date().getFullYear() - 3);
  const [receipts1, setReceipts1] = useState("");
  const [priorYear2, setPriorYear2] = useState(new Date().getFullYear() - 2);
  const [receipts2, setReceipts2] = useState("");
  const [priorYear3, setPriorYear3] = useState(new Date().getFullYear() - 1);
  const [receipts3, setReceipts3] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avgReceipts = (() => {
    const r1 = parseFloat(receipts1) || 0;
    const r2 = parseFloat(receipts2) || 0;
    const r3 = parseFloat(receipts3) || 0;
    return (r1 + r2 + r3) / 3;
  })();
  // IRC 448(c) is inflation-adjusted annually; this was hardcoded at the 2018
  // figure of 25,000,000, so the UI told operators between $25M and the current
  // threshold that they were ineligible. $32,000,000 for tax years beginning in
  // 2026 (Rev. Proc. 2025-32). The server re-checks against the versioned table
  // in convex/lib/taxConstants.ts, which is authoritative.
  const GROSS_RECEIPTS_THRESHOLD_2026 = 32_000_000;
  const is471cEligible = avgReceipts > 0 && avgReceipts <= GROSS_RECEIPTS_THRESHOLD_2026;

  const formatUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  async function handleFinish() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          states,
          operatorTypes,
          accountingMethods,
          inventoryRole: inventoryRole || undefined,
          productionSqFt: productionSqFt ? Number(productionSqFt) : undefined,
          totalSqFt: totalSqFt ? Number(totalSqFt) : undefined,
          productionHours: productionHours ? Number(productionHours) : undefined,
          totalHours: totalHours ? Number(totalHours) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Onboarding failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Tranquillo Green</div>
          <h1 className="mt-3 text-3xl font-semibold text-text-primary">Set Up Your Operation</h1>
          <p className="mt-2 text-sm text-text-muted">
            Connect your cannabis operation in minutes. We&apos;ll configure everything for 280E + 471(c) compliance.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i < step
                    ? "bg-brand text-white"
                    : i === step
                    ? "bg-brand/20 text-brand border border-brand/30"
                    : "bg-surface-raised text-text-faint"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${i < step ? "bg-brand" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Step 1 of 4</div>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">Company Information</h2>
                <p className="mt-1 text-sm text-text-muted">Tell us about your cannabis operation.</p>
              </div>

              <div>
                <label htmlFor="company-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emerald Valley Cultivation, LLC"
                  className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="states" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Operating State(s)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {METRC_STATES.map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-2 rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary cursor-pointer hover:border-brand/30"
                      >
                        <input
                          type="checkbox"
                          value={s}
                          checked={states.includes(s)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStates([...states, s]);
                            } else {
                              setStates(states.filter((state) => state !== s));
                            }
                          }}
                          className="h-4 w-4 rounded border-border bg-surface-raised text-brand focus:ring-brand/50"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">
                    Accounting Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNTING_METHODS.map((m) => {
                      const selected = accountingMethods.includes(m.value);
                      return (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => {
                            if (selected) {
                              setAccountingMethods(accountingMethods.filter((v) => v !== m.value));
                            } else {
                              setAccountingMethods([...accountingMethods, m.value]);
                            }
                          }}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                            selected
                              ? "border-brand/30 bg-brand/10 text-text-primary"
                              : "border-border bg-surface-mid text-text-secondary hover:border-border/80"
                          }`}
                        >
                          <div className="font-medium">{m.label}</div>
                          <div className="text-xs text-text-muted mt-0.5">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                // accountingMethods is collected on this step and is required by
                // /api/onboarding. It was missing from this gate, so you could
                // advance without choosing one and only find out at the final
                // submit, as a generic "Missing required fields."
                disabled={
                  !name.trim() ||
                  states.length === 0 ||
                  accountingMethods.length === 0
                }
                className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Operator Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Step 2 of 4</div>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">Operator Type</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Select all operations that apply to your business. We&apos;ll configure COGS categories and 471(c) reclassifiable costs for your types.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {OPERATOR_TYPES.map((t) => {
                  const selected = operatorTypes.includes(t.value);
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => {
                        if (selected) {
                          setOperatorTypes(operatorTypes.filter((v) => v !== t.value));
                        } else {
                          setOperatorTypes([...operatorTypes, t.value]);
                        }
                      }}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? "border-brand/30 bg-brand/10"
                          : "border-border bg-surface-mid hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{t.label}</div>
                          <div className="text-xs text-text-muted">{t.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

                            {/* IRC 471 classification and measured allocation bases.
                  Collected here because without them the reclassification engine
                  refuses to reclassify anything — correct, but it means no 280E
                  benefit. Worded for an operator, not an accountant. */}
              <div className="space-y-4 rounded-xl border border-border bg-surface-mid p-5">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Do you own your product while it&apos;s being made?
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    This decides which costs you&apos;re allowed to treat as cost of
                    goods sold — which is the main way to reduce a 280E tax bill.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setInventoryRole("producer")}
                    className={`rounded-xl border p-4 text-left transition ${
                      inventoryRole === "producer"
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface hover:border-border/70"
                    }`}
                  >
                    <div className="text-sm font-medium text-text-primary">
                      Yes — we grow or make it
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      You own the plants or ingredients through production. You can
                      count more of your costs — like grow-space rent and production
                      wages — toward cost of goods sold.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInventoryRole("reseller")}
                    className={`rounded-xl border p-4 text-left transition ${
                      inventoryRole === "reseller"
                        ? "border-brand bg-brand/10"
                        : "border-border bg-surface hover:border-border/70"
                    }`}
                  >
                    <div className="text-sm font-medium text-text-primary">
                      No — we buy finished product
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      You buy product ready to sell. Generally you can only count
                      what you paid for it plus the cost of getting it to you.
                    </div>
                  </button>
                </div>

                {inventoryRole === "reseller" && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    Buying finished product usually limits cost of goods sold to the
                    invoice price plus freight. A court denied a dispensary&apos;s
                    attempt to include rent and overhead on these facts
                    (Patients Mutual / &ldquo;Harborside&rdquo;). Tranquillo Green will
                    flag any allocation that goes beyond this so you can decide
                    knowingly.
                  </p>
                )}

                {inventoryRole === "producer" && (
                  <div className="space-y-4">
                    <p className="text-xs text-text-muted">
                      These two measurements are what justify your numbers if they&apos;re
                      ever questioned. Estimates are not enough — use your lease and
                      your payroll records.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="prod-sqft" className="mb-1.5 block text-xs font-medium text-text-secondary">
                          Production / grow space (sq ft)
                        </label>
                        <input
                          id="prod-sqft"
                          type="number"
                          min="0"
                          value={productionSqFt}
                          onChange={(e) => setProductionSqFt(e.target.value)}
                          placeholder="6000"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="total-sqft" className="mb-1.5 block text-xs font-medium text-text-secondary">
                          Total space you occupy (sq ft)
                        </label>
                        <input
                          id="total-sqft"
                          type="number"
                          min="0"
                          value={totalSqFt}
                          onChange={(e) => setTotalSqFt(e.target.value)}
                          placeholder="10000"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="prod-hours" className="mb-1.5 block text-xs font-medium text-text-secondary">
                          Production hours (per month)
                        </label>
                        <input
                          id="prod-hours"
                          type="number"
                          min="0"
                          value={productionHours}
                          onChange={(e) => setProductionHours(e.target.value)}
                          placeholder="1200"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="total-hours" className="mb-1.5 block text-xs font-medium text-text-secondary">
                          Total paid hours (per month)
                        </label>
                        <input
                          id="total-hours"
                          type="number"
                          min="0"
                          value={totalHours}
                          onChange={(e) => setTotalHours(e.target.value)}
                          placeholder="2000"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    {Number(productionSqFt) > 0 && Number(totalSqFt) > 0 && (
                      <p className="text-xs text-text-muted">
                        {Number(productionSqFt) > Number(totalSqFt) ? (
                          <span className="text-rose-300">
                            Production space can&apos;t be larger than your total space.
                          </span>
                        ) : (
                          <>
                            That&apos;s{" "}
                            <span className="font-semibold text-text-primary">
                              {((Number(productionSqFt) / Number(totalSqFt)) * 100).toFixed(1)}%
                            </span>{" "}
                            of your space — so that share of rent can count toward cost
                            of goods sold.
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {!inventoryRole && (
                  <p className="text-xs text-text-faint">
                    You can set this later, but until you do we won&apos;t move any
                    costs into cost of goods sold — we&apos;d rather record nothing
                    than guess.
                  </p>
                )}
              </div>

<div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-border bg-surface-mid px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-surface"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={operatorTypes.length === 0}
                  className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Integrations */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Step 3 of 4</div>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">Connect Integrations</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Connect Metrc and QuickBooks for real-time data sync. You can skip this and connect later.
                </p>
              </div>

              {/* Metrc */}
              <div className="rounded-xl border border-border bg-surface-mid p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌿</span>
                      <span className="font-semibold text-text-primary">Metrc</span>
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                        Sandbox Ready
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      Sync seed-to-sale inventory data. Requires your Metrc user key and license number.
                      {states?.includes("CO") && " Colorado sandbox is pre-configured."}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {metrcSkipped ? (
                      <span className="text-xs text-text-faint">Skipped</span>
                    ) : (
                      <button
                        onClick={() => setMetrcSkipped(true)}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:bg-surface/80"
                      >
                        Skip for now
                      </button>
                    )}
                  </div>
                </div>
                {!metrcSkipped && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
                    Connect Metrc from Settings → Integrations after creating your company.
                  </div>
                )}
              </div>

              {/* QuickBooks */}
              <div className="rounded-xl border border-border bg-surface-mid p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <span className="font-semibold text-text-primary">QuickBooks Online</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                        OAuth Ready
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      Import chart of accounts, transactions, and journal entries. One-click CPA export in QBO format.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {qboSkipped ? (
                      <span className="text-xs text-text-faint">Skipped</span>
                    ) : (
                      <button
                        onClick={() => setQboSkipped(true)}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:bg-surface/80"
                      >
                        Skip for now
                      </button>
                    )}
                  </div>
                </div>
                {!qboSkipped && (
                  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">
                    Connect QuickBooks from Settings → Integrations after creating your company.
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-border bg-surface-mid px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-surface"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: 471(c) Eligibility */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Step 4 of 4</div>
                <h2 className="mt-2 text-xl font-semibold text-text-primary">IRC 471(c) Eligibility Test</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Enter your prior 3 years of gross receipts to test 471(c) eligibility. This is optional — you can add it later.
                </p>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-violet-300">What is 471(c)?</div>
                <p className="mt-2 text-sm text-text-muted">
                  IRC Section 471(c) allows small businesses (average gross receipts ≤ $25M for 3 prior years)
                  to treat inventory as non-incidental materials and supplies. For cannabis operators, this means
                  <strong className="text-violet-200"> more costs can be capitalized into COGS</strong> — making them
                  deductible even under 280E.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Tax Year {i === 0 ? priorYear1 : i === 1 ? priorYear2 : priorYear3}
                    </label>
                    <input
                      type="number"
                      value={i === 0 ? receipts1 : i === 1 ? receipts2 : receipts3}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (i === 0) setReceipts1(val);
                        else if (i === 1) setReceipts2(val);
                        else setReceipts3(val);
                      }}
                      placeholder="Gross receipts"
                      className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </div>
                ))}
              </div>

              {/* Eligibility Result */}
              {parseFloat(receipts1) > 0 && parseFloat(receipts2) > 0 && parseFloat(receipts3) > 0 && (
                <div className={`rounded-xl border p-4 ${
                  is471cEligible
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-rose-500/20 bg-rose-500/5"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${is471cEligible ? "text-emerald-200" : "text-rose-200"}`}>
                        {is471cEligible ? "✓ Eligible for 471(c)" : "✗ Not Eligible for 471(c)"}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        3-year average: {formatUSD(avgReceipts)} (threshold: $25,000,000)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${is471cEligible ? "text-emerald-200" : "text-rose-200"}`}>
                        {formatUSD(avgReceipts)}
                      </div>
                      <div className="text-xs text-text-faint">avg. gross receipts</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-border bg-surface-mid px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-surface"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="rounded-xl border border-border bg-surface-mid px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-surface"
                >
                  Skip
                </button>
                <button
                  onClick={handleFinish}
                  // Was `loading || !name.trim()`, so this stayed enabled with
                  // empty states / operatorTypes / accountingMethods — reachable
                  // via the Skip button — and failed server-side instead.
                  disabled={
                    loading ||
                    !name.trim() ||
                    states.length === 0 ||
                    operatorTypes.length === 0 ||
                    accountingMethods.length === 0
                  }
                  className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating company..." : "Create Company & Get Started"}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Done (fallback) */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="text-4xl">🌿</div>
              <h2 className="text-xl font-semibold text-text-primary">All Set!</h2>
              <p className="text-sm text-text-muted">Redirecting to your dashboard...</p>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                {loading ? "Loading..." : "Go to Dashboard"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
