"use client";

import { useState } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";

type Policy = {
  id: string;
  name: string;
  method: "square_footage" | "labor" | "custom";
  effectiveFrom: string;
  status: "active" | "inactive";
};

const METHOD_LABELS: Record<Policy["method"], string> = {
  square_footage: "Square Footage",
  labor: "Labor Hours",
  custom: "Custom Policy",
};

const METHOD_DESCRIPTIONS: Record<Policy["method"], string> = {
  square_footage:
    "Allocates based on cannabis-dedicated square footage vs total facility area. Best for rent, utilities, and building costs.",
  labor:
    "Allocates based on cannabis-related labor hours vs total hours. Best for shared staff, admin overhead, and management costs.",
  custom:
    "Uses a fixed percentage defined by policy memo. Best for professional fees and unusual mixed-purpose expenses.",
};

// Demo seed policies
const SEED_POLICIES: Policy[] = [
  {
    id: "pol-001",
    name: "Primary Facility Allocation",
    method: "square_footage",
    effectiveFrom: "2026-01-01",
    status: "active",
  },
  {
    id: "pol-002",
    name: "Shared Labor Policy Q4 2025",
    method: "labor",
    effectiveFrom: "2025-10-01",
    status: "inactive",
  },
  {
    id: "pol-003",
    name: "Legal & Accounting Split",
    method: "custom",
    effectiveFrom: "2025-07-01",
    status: "inactive",
  },
];

export function AllocationPolicyWorkspace() {
  const [policies, setPolicies] = useState<Policy[]>(SEED_POLICIES);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    method: "square_footage" as Policy["method"],
    effectiveFrom: new Date().toISOString().split("T")[0],
  });

  function handleCreate() {
    if (!form.name.trim()) return;

    const newPolicy: Policy = {
      id: `pol-${Date.now()}`,
      name: form.name,
      method: form.method,
      effectiveFrom: form.effectiveFrom,
      status: policies.length === 0 ? "active" : "inactive",
    };

    setPolicies((prev) => [newPolicy, ...prev]);
    setForm({
      name: "",
      method: "square_footage",
      effectiveFrom: new Date().toISOString().split("T")[0],
    });
    setIsCreating(false);
  }

  function handleActivate(id: string) {
    setPolicies((prev) =>
      prev.map((p) => ({
        ...p,
        status: p.id === id ? "active" : "inactive",
      }))
    );
  }

  function handleDeactivate(id: string) {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "inactive" } : p))
    );
  }

  function handleDelete(id: string) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  }

  const activePolicy = policies.find((p) => p.status === "active");

  return (
    <div className="space-y-6">
      {/* Active policy banner */}
      {activePolicy && (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Active allocation policy
              </div>
              <h2 className="mt-2 text-xl font-semibold text-emerald-100">
                {activePolicy.name}
              </h2>
              <p className="mt-2 text-sm text-emerald-200/80">
                {METHOD_DESCRIPTIONS[activePolicy.method]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AccountingStatusBadge label="Active" tone="emerald" />
              <AccountingStatusBadge
                label={METHOD_LABELS[activePolicy.method]}
                tone="blue"
              />
              <span className="text-sm text-emerald-200/60">
                Since {activePolicy.effectiveFrom}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Create new policy */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">
              Allocation policies
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Define how shared costs split between deductible (COGS) and
              nondeductible (280E-limited) amounts.
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Primary Facility Allocation"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  Allocation method
                </label>
                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      method: e.target.value as Policy["method"],
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
                >
                  <option value="square_footage">Square Footage</option>
                  <option value="labor">Labor Hours</option>
                  <option value="custom">Custom Policy</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-text-muted">
                  Effective from
                </label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, effectiveFrom: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-text-muted">
              {METHOD_DESCRIPTIONS[form.method]}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-40"
              >
                Create policy
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted transition hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Policy list */}
      <div className="space-y-4">
        {policies.map((policy) => (
          <section
            key={policy.id}
            className="rounded-2xl border border-border bg-surface-mid p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-text-primary">
                    {policy.name}
                  </h3>
                  <AccountingStatusBadge
                    label={policy.status}
                    tone={
                      policy.status === "active" ? "emerald" : "slate"
                    }
                  />
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-text-muted">
                  <AccountingStatusBadge
                    label={METHOD_LABELS[policy.method]}
                    tone="blue"
                  />
                  <span>Effective from {policy.effectiveFrom}</span>
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {METHOD_DESCRIPTIONS[policy.method]}
                </p>
              </div>
              <div className="flex gap-2">
                {policy.status !== "active" && (
                  <button
                    onClick={() => handleActivate(policy.id)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
                  >
                    Activate
                  </button>
                )}
                {policy.status === "active" && (
                  <button
                    onClick={() => handleDeactivate(policy.id)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-muted transition hover:text-text-primary"
                  >
                    Deactivate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(policy.id)}
                  disabled={policy.status === "active"}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
