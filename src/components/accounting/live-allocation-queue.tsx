"use client";

/**
 * 280E allocation review queue — live.
 *
 * Replaces demoAllocationReviewQueue, which the page it sat on described,
 * accurately, as "demo-data-backed so operators can walk a real review workflow
 * without live backend dependencies". The backend dependency exists and works;
 * the queue simply never used it.
 *
 * This is the workflow the product is for: every cost the engine split, what it
 * split it on, and whether a human has agreed. Approving here writes to the
 * record the support schedule and the CPA handoff read from.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useTenant } from "@/lib/auth/tenant-context";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";

const usd = (n: number) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

type Filter = "needs_review" | "system_applied" | "approved" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "needs_review", label: "Needs review" },
  { key: "system_applied", label: "System applied" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
];

const STATUS_TONE: Record<string, "amber" | "blue" | "emerald"> = {
  needs_review: "amber",
  system_applied: "blue",
  approved: "emerald",
};

const STATUS_LABEL: Record<string, string> = {
  needs_review: "Needs review",
  system_applied: "System applied",
  approved: "Approved",
};

export function LiveAllocationQueue() {
  const tenant = useTenant();
  const companyId = tenant.companyId as any;

  const [filter, setFilter] = useState<Filter>("needs_review");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allocations = useQuery(api.cogsAllocations.listByCompany, {
    companyId,
    ...(filter === "all" ? {} : { reviewStatusFilter: filter }),
  } as any);

  const summary = useQuery(api.allocationEngine.getAllocationSummary, { companyId });

  const approve = useMutation(api.cogsAllocations.approve);
  const reopen = useMutation(api.cogsAllocations.markNeedsReview);

  async function run(id: string, fn: () => Promise<unknown>) {
    setError(null);
    setBusyId(id);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Totals across every allocation, not just the current filter */}
      {summary && summary.allocationCount > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Deductible (COGS)" value={usd(summary.totalDeductible)} tone="good" />
          <Stat label="Nondeductible (280E)" value={usd(summary.totalNondeductible)} tone="bad" />
          <Stat label="Awaiting review" value={String(summary.needsReviewCount)} />
          <Stat label="Average confidence" value={String(summary.averageConfidence)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-xl border px-3 py-2 text-xs transition ${
              filter === f.key
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface text-text-muted hover:bg-surface/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {allocations === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : allocations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="text-sm font-semibold text-text-primary">
            {filter === "needs_review"
              ? "Nothing waiting on you"
              : "No allocations in this state"}
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {filter === "needs_review"
              ? "Every allocation has been reviewed or applied automatically. New ones appear here when costs are posted and allocated."
              : "Post and allocate some costs, and they will show up here."}
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/dashboard/accounting/transactions" className="text-teal-300 underline">
              Transactions →
            </Link>
            <Link href="/dashboard/allocations/policies" className="text-teal-300 underline">
              Allocation policies →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allocations.map((a: any) => {
            const busy = busyId === a._id;
            const total = (a.deductibleAmount ?? 0) + (a.nondeductibleAmount ?? 0);
            const share = total > 0 ? (a.deductibleAmount ?? 0) / total : 0;
            return (
              <div key={a._id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {a.transaction?.reference || a.transaction?.memo || "Transaction"}
                      </span>
                      <AccountingStatusBadge
                        label={STATUS_LABEL[a.reviewStatus] ?? a.reviewStatus}
                        tone={STATUS_TONE[a.reviewStatus] ?? "slate"}
                      />
                      <AccountingStatusBadge label={a.basisType} tone="blue" />
                      {a.confidence != null && (
                        <span className="text-xs text-text-muted">
                          confidence {a.confidence}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="text-text-muted">
                        Cost <span className="text-text-primary">{usd(total)}</span>
                      </span>
                      <span className="text-text-muted">
                        COGS{" "}
                        <span className="text-emerald-300">
                          {usd(a.deductibleAmount)} ({(share * 100).toFixed(1)}%)
                        </span>
                      </span>
                      <span className="text-text-muted">
                        Nondeductible{" "}
                        <span className="text-rose-300">{usd(a.nondeductibleAmount)}</span>
                      </span>
                    </div>

                    {/* The measurement. This is what makes the split defensible,
                        so it belongs in front of the person approving it — not
                        one click away. */}
                    {a.basisExplanation ? (
                      <p className="mt-2 border-l-2 border-teal-500/40 pl-3 text-xs leading-relaxed text-text-secondary">
                        {a.basisExplanation}
                      </p>
                    ) : (
                      <p className="mt-2 border-l-2 border-amber-500/40 pl-3 text-xs text-amber-300">
                        No basis recorded. Re-run this allocation to capture the
                        measurement before approving it.
                      </p>
                    )}

                    {a.warnings?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {a.warnings.map((w: any) => (
                          <li key={w.code} className="text-xs text-amber-300">
                            ⚠ {w.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {a.reviewStatus !== "approved" ? (
                      <button
                        onClick={() => run(a._id, () => approve({ allocationId: a._id }))}
                        disabled={busy}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? "…" : "Approve"}
                      </button>
                    ) : (
                      <button
                        onClick={() => run(a._id, () => reopen({ allocationId: a._id }))}
                        disabled={busy}
                        className="rounded-xl border border-border bg-surface-mid px-3 py-2 text-xs text-text-primary transition hover:bg-surface-mid/70 disabled:opacity-50"
                      >
                        {busy ? "…" : "Reopen"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : "text-text-primary";
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-4">
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
