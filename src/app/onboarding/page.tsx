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
  const is471cEligible = avgReceipts > 0 && avgReceipts <= 25_000_000;

  const formatUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  async function handleFinish() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, states, operatorTypes: operatorTypes, accountingMethods: accountingMethods }),
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
                disabled={!name.trim() || states.length === 0}
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
                  disabled={loading || !name.trim()}
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
