"use client";

/**
 * Allocation policy workspace — live.
 *
 * This held three invented policies in React state. "Create" pushed onto an
 * array, "activate" flipped a local flag, and a refresh put the fixtures back.
 * An operator could spend ten minutes setting up their 280E policy and lose it
 * without ever being told anything failed — while the allocation engine went on
 * using whatever policy was actually in the database.
 *
 * A policy is the governing document for every cost split the product makes. Of
 * the pages backed by fixtures, this was the one where the gap between what the
 * screen said and what the system did could go unnoticed longest.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useTenant } from "@/lib/auth/tenant-context";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";

type Method =
  | "square_footage"
  | "labor"
  | "custom"
  | "flat_percentage"
  | "flat_amount";

const METHOD_LABELS: Record<Method, string> = {
  square_footage: "Square Footage",
  labor: "Labor Hours",
  custom: "Custom Ratio",
  flat_percentage: "Flat Percentage",
  flat_amount: "Flat Amount",
};

const METHOD_DESCRIPTIONS: Record<Method, string> = {
  square_footage:
    "Splits cost by production floor area against total facility area. Supported by a floor plan or lease schedule. Best for rent, utilities and building costs.",
  labor:
    "Splits cost by production hours against total paid hours. Supported by timesheets or a payroll export. Best for shared staff and supervision.",
  custom:
    "A ratio you enter yourself. Defensible only if you retain the working papers behind it — the system records the number, not your reasoning.",
  flat_percentage:
    "A standing percentage applied to every cost, with no measurement behind it. Quick to run and the weakest to defend.",
  flat_amount:
    "A fixed dollar amount treated as COGS-eligible, capped at the cost. Also unmeasured.",
};

/**
 * How well each method holds up if the allocation is questioned.
 *
 * This is shown at the point of choosing rather than buried in help text.
 * flat_percentage and flat_amount exist because they were asked for, and they
 * are legitimate choices — but Reg. 1.471-11 contemplates a measured basis, and
 * an operator picking one deserves to know that before they pick it, not in a
 * warning after the fact.
 */
const METHOD_STRENGTH: Record<Method, { label: string; tone: "emerald" | "amber" | "rose" }> = {
  square_footage: { label: "Measured — strongest", tone: "emerald" },
  labor: { label: "Measured — strong", tone: "emerald" },
  custom: { label: "Unmeasured — keep your workings", tone: "amber" },
  flat_percentage: { label: "Unmeasured — hardest to defend", tone: "rose" },
  flat_amount: { label: "Unmeasured — hardest to defend", tone: "rose" },
};

const ALL_METHODS = Object.keys(METHOD_LABELS) as Method[];

const todayISO = () => new Date().toISOString().split("T")[0];

export function AllocationPolicyWorkspace() {
  const tenant = useTenant();
  const companyId = tenant.companyId as any;

  const policies = useQuery(api.allocationPolicies.listByCompany, { companyId });
  const createPolicy = useMutation(api.allocationPolicies.create);
  const updatePolicy = useMutation(api.allocationPolicies.update);
  const removePolicy = useMutation(api.allocationPolicies.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    method: "square_footage" as Method,
    effectiveFrom: todayISO(),
  });

  /**
   * Every mutation runs through this.
   *
   * The backend refuses things on purpose — deleting a policy with allocations
   * attached to it, for one — and those refusals are the useful part. Swallowing
   * them would leave the operator clicking a button that does nothing, which is
   * the failure mode this whole page had.
   */
  async function run(id: string | null, fn: () => Promise<unknown>) {
    setError(null);
    setBusyId(id ?? "new");
    try {
      await fn();
      return true;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setError("Give the policy a name you'll recognise in a year's time.");
      return;
    }
    const ok = await run(null, () =>
      createPolicy({
        companyId,
        name: form.name.trim(),
        method: form.method,
        effectiveFrom: form.effectiveFrom,
        // First policy becomes active; later ones start inactive so activating
        // is always a deliberate act. The backend deactivates the incumbent.
        status: (policies?.length ?? 0) === 0 ? "active" : "inactive",
      }),
    );
    if (ok) {
      setForm({ name: "", method: "square_footage", effectiveFrom: todayISO() });
      setIsCreating(false);
    }
  }

  if (policies === undefined) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  const activePolicy = policies.find((p: any) => p.status === "active");

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="text-sm font-semibold text-rose-200">That didn&apos;t go through</div>
          <p className="mt-1 text-sm text-rose-200/80">{error}</p>
        </div>
      )}

      {/* Which policy is actually governing allocations right now */}
      {activePolicy ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Active allocation policy
              </div>
              <h2 className="mt-2 text-xl font-semibold text-emerald-100">
                {activePolicy.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-200/80">
                {METHOD_DESCRIPTIONS[activePolicy.method as Method]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <AccountingStatusBadge label="Active" tone="emerald" />
              <AccountingStatusBadge
                label={METHOD_LABELS[activePolicy.method as Method] ?? activePolicy.method}
                tone="blue"
              />
              <span className="text-sm text-emerald-200/60">
                Since {activePolicy.effectiveFrom}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="text-sm font-semibold text-amber-100">No active policy</div>
          <p className="mt-1 text-sm text-amber-200/80">
            Nothing is governing how shared costs split right now. Allocations
            need a policy to run against — create one below, or activate an
            existing one.
          </p>
        </section>
      )}

      {/* Create */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">
              Allocation policies
            </div>
            <p className="mt-1 text-sm text-text-muted">
              How shared costs split between deductible (COGS) and nondeductible
              amounts under 280E. One policy is active at a time.
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => { setIsCreating(true); setError(null); }}
              className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent transition hover:bg-accent/20"
            >
              New policy
            </button>
          )}
        </div>

        {isCreating && (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <div className="text-sm font-medium text-text-primary">
              Create allocation policy
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  Policy name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Facility costs by production area"
                  className="mt-2 w-full rounded-xl border border-border bg-surface-deep px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  Method
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as Method }))}
                  className="mt-2 w-full rounded-xl border border-border bg-surface-deep px-3 py-2 text-sm text-text-primary"
                >
                  {ALL_METHODS.map((m) => (
                    <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  Effective from
                </label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-border bg-surface-deep px-3 py-2 text-sm text-text-primary"
                />
              </div>
            </div>

            {/* Say how defensible the choice is while it is still a choice. */}
            <div className="mt-4 rounded-xl border border-border/60 bg-surface-deep p-4">
              <div className="flex flex-wrap items-center gap-3">
                <AccountingStatusBadge
                  label={METHOD_STRENGTH[form.method].label}
                  tone={METHOD_STRENGTH[form.method].tone}
                />
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {METHOD_DESCRIPTIONS[form.method]}
              </p>
              {(form.method === "flat_percentage" || form.method === "flat_amount") && (
                <p className="mt-2 text-xs text-rose-300">
                  Allocations made on this basis are flagged for review and must
                  be acknowledged before a CPA handoff. Reg. 1.471-11
                  contemplates a measured allocation; a flat figure is the first
                  thing an examiner asks about.
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={busyId === "new"}
                className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {busyId === "new" ? "Creating…" : "Create policy"}
              </button>
              <button
                onClick={() => { setIsCreating(false); setError(null); }}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="mt-5 space-y-3">
          {policies.length === 0 && !isCreating && (
            <p className="text-sm text-text-muted">
              No policies yet. The allocation engine cannot split a cost without
              one.
            </p>
          )}

          {policies.map((p: any) => {
            const method = p.method as Method;
            const busy = busyId === p._id;
            return (
              <div
                key={p._id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{p.name}</span>
                      <AccountingStatusBadge
                        label={p.status === "active" ? "Active" : "Inactive"}
                        tone={p.status === "active" ? "emerald" : "slate"}
                      />
                      <AccountingStatusBadge
                        label={METHOD_LABELS[method] ?? p.method}
                        tone="blue"
                      />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      Effective from {p.effectiveFrom}
                      {METHOD_STRENGTH[method] && ` · ${METHOD_STRENGTH[method].label}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {p.status === "active" ? (
                      <button
                        onClick={() => run(p._id, () => updatePolicy({ policyId: p._id, status: "inactive" }))}
                        disabled={busy}
                        className="rounded-xl border border-border bg-surface-mid px-3 py-2 text-xs text-text-primary transition hover:bg-surface-mid/70 disabled:opacity-50"
                      >
                        {busy ? "…" : "Deactivate"}
                      </button>
                    ) : (
                      <button
                        onClick={() => run(p._id, () => updatePolicy({ policyId: p._id, status: "active" }))}
                        disabled={busy}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? "…" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => run(p._id, () => removePolicy({ policyId: p._id }))}
                      disabled={busy}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50"
                    >
                      {busy ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-text-muted">
          A policy with allocations already booked against it cannot be deleted —
          deactivate it instead. Removing it would leave those allocations
          pointing at nothing, and the basis for each one is what makes it
          defensible.
        </p>
      </section>
    </div>
  );
}
