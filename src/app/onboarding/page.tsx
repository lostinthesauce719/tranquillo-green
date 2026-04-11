"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPERATOR_TYPES = [
  { value: "dispensary", label: "Dispensary" },
  { value: "cultivator", label: "Cultivator" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "vertical", label: "Vertical (Integrated)" },
];

const ACCOUNTING_METHODS = [
  { value: "cash", label: "Cash Basis" },
  { value: "accrual", label: "Accrual Basis" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState("CA");
  const [operatorType, setOperatorType] = useState("dispensary");
  const [accountingMethod, setAccountingMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, state, operatorType, accountingMethod }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Onboarding failed.");
        setLoading(false);
        return;
      }

      // Redirect to dashboard - the layout will pick up the new tenant.
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">
            Tranquillo Green
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-text-primary">
            Create Your Company
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Set up your cannabis operation to get started. We will seed a
            standard chart of accounts tailored to your operator type.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20 space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="company-name"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
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

          <div>
            <label
              htmlFor="state"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              State
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="operator-type"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Operator Type
            </label>
            <select
              id="operator-type"
              value={operatorType}
              onChange={(e) => setOperatorType(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              {OPERATOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="accounting-method"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Default Accounting Method
            </label>
            <select
              id="accounting-method"
              value={accountingMethod}
              onChange={(e) => setAccountingMethod(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              {ACCOUNTING_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating company..." : "Create Company & Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
