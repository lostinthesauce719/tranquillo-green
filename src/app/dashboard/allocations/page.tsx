"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AllocationReviewQueue } from "@/components/accounting/allocation-review-queue";
import { Section471cDashboard } from "@/components/accounting/section-471c-dashboard";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { demoAllocationReviewQueue, summarizeAllocationQueue } from "@/lib/demo/accounting-operations";
import { useTenant } from "@/lib/auth/tenant-context";
import { getOperatorProfile, getCogsCategories, getNondeductibleCategories, getDefaultAllocationMethod, getReclassifiable471cCosts } from "@/lib/operator-profiles";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function AllocationsPage() {
  const summary = summarizeAllocationQueue(demoAllocationReviewQueue);
  const tenant = useTenant();
  const profile = getOperatorProfile(tenant.operatorType ?? "vertical");

  // COGS automation state
  const [autoApproving, setAutoApproving] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [automationResult, setAutomationResult] = useState<{
    action: string;
    message: string;
    details: string[];
    source: string;
  } | null>(null);

  const handleAutoApprove = useCallback(async () => {
    setAutoApproving(true);
    try {
      const res = await fetch("/api/automation/cogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto_approve", confidenceThreshold: 0.9 }),
      });
      const data = await res.json();
      setAutomationResult({
        action: "Auto-approval",
        message: `Approved ${data.approvedCount} allocations`,
        details: data.details ?? [],
        source: data.source ?? "demo",
      });
    } catch (e) {
      setAutomationResult({
        action: "Auto-approval",
        message: "Failed — check console",
        details: [String(e)],
        source: "error",
      });
    } finally {
      setAutoApproving(false);
    }
  }, []);

  const handleRunAll = useCallback(async () => {
    setRunningAll(true);
    try {
      const res = await fetch("/api/automation/cogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_all", confidenceThreshold: 0.9 }),
      });
      const data = await res.json();
      const agentDetails = (data.results ?? []).flatMap((r: any) => r.details ?? []);
      setAutomationResult({
        action: "Full automation",
        message: `${data.agentsRun} agents ran, ${data.totalAlerts} alerts`,
        details: agentDetails,
        source: data.source ?? "demo",
      });
    } catch (e) {
      setAutomationResult({
        action: "Full automation",
        message: "Failed — check console",
        details: [String(e)],
        source: "error",
      });
    } finally {
      setRunningAll(false);
    }
  }, []);
  const cogsCategories = getCogsCategories(tenant.operatorType ?? "vertical");
  const nondeductibleCategories = getNondeductibleCategories(tenant.operatorType ?? "vertical");
  const reclassifiable471c = getReclassifiable471cCosts(tenant.operatorType ?? "vertical");
  const defaultMethod = getDefaultAllocationMethod(tenant.operatorType ?? "vertical");

  // Build cost data for 471(c) engine
  const costDataFor471c = [
    ...cogsCategories.map((c) => ({ code: c.code, name: c.name, amount: 50000, taxTreatment: c.taxTreatment })),
    ...nondeductibleCategories.map((c) => ({ code: c.code, name: c.name, amount: 80000, taxTreatment: c.taxTreatment })),
    ...reclassifiable471c.map((c) => ({ code: c.code, name: c.name, amount: 120000, taxTreatment: c.taxTreatment })),
  ];

  // Demo prior years gross receipts (would come from company settings in production)
  const priorYearsGrossReceipts = [
    { taxYear: 2023, grossReceipts: 8500000 },
    { taxYear: 2024, grossReceipts: 9200000 },
    { taxYear: 2025, grossReceipts: 10100000 },
  ];

  return (
    <AppShell
      title="280E Allocations"
      description="Deterministic 280E review queue for shared occupancy, labor absorption, and policy-based overrides. All decisions are demo-data-backed so operators can walk a real review workflow without live backend dependencies."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Queue items" value={String(summary.total)} detail={`${summary.ready} ready, ${summary.needsSupport} waiting on support`} />
        <MetricCard label="Controller escalations" value={String(summary.pendingController)} detail="Items exceeding policy variance thresholds" />
        <MetricCard label="Recommended deductible" value={currencyFormatter.format(summary.deductible)} detail="Capitalizable or deductible share from current queue" />
        <MetricCard label="280E-limited" value={currencyFormatter.format(summary.nondeductible)} detail={`${summary.approved} items already approved`} />
      </div>

      {/* Operator profile banner */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{profile.icon}</span>
          <div>
            <div className="text-sm font-semibold text-text-primary">{profile.label} — 280E Allocation Profile</div>
            <div className="text-xs text-text-muted">{profile.tagline}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-text-muted uppercase tracking-wider">Default method</div>
            <div className="mt-1 font-medium text-text-primary">{defaultMethod.name}</div>
            <div className="text-xs text-text-muted">{defaultMethod.description}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-text-muted uppercase tracking-wider">COGS categories ({cogsCategories.length})</div>
            <ul className="mt-1 space-y-0.5">
              {cogsCategories.map((c) => (
                <li key={c.code} className="text-xs text-text-muted"><span className="font-mono text-accent">{c.code}</span> {c.name}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="text-xs text-text-muted uppercase tracking-wider">Nondeductible ({nondeductibleCategories.length})</div>
            <ul className="mt-1 space-y-0.5">
              {nondeductibleCategories.map((c) => (
                <li key={c.code} className="text-xs text-text-muted"><span className="font-mono text-accent">{c.code}</span> {c.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Queue rules</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {profile.allocationMethods.map((method) => (
              <div key={method.id} className={`rounded-2xl border bg-surface p-4 text-sm text-text-muted ${method.default ? "border-violet-500/30" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{method.name}</span>
                  {method.default && <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-300">Default</span>}
                </div>
                <p className="mt-1">{method.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Operator workflow</div>
              <ol className="mt-4 space-y-3 text-sm text-text-muted">
                <li>1. Review confidence, driver basis, and supporting policy before accepting the recommended split.</li>
                <li>2. Check evidence completeness. Missing support downgrades the item into a hold state instead of silent posting.</li>
                <li>3. Approve, request support, override the basis, or escalate to controller depending on threshold and policy memo.</li>
                <li>4. Carry approved splits into close workpapers and preserve reviewer attribution for audit support.</li>
              </ol>
            </div>
            <div className="grid gap-3">
              <Link href="/dashboard/allocations/support-schedule" className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20">
                Open support schedule
              </Link>
              <Link href="/dashboard/allocations/history" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open override history
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6">
        {/* COGS Automation Controls */}
        <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span className="text-sm font-medium text-text-primary">COGS Automation</span>
                <Badge variant="info" size="sm">Beta</Badge>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Auto-approve high-confidence allocations (≥90%) and run the full automation suite.
                All actions are logged to the audit trail.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleAutoApprove}
                disabled={autoApproving || runningAll}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {autoApproving ? "Auto-approving..." : "⚡ Auto-approve ≥90%"}
              </button>
              <button
                onClick={handleRunAll}
                disabled={autoApproving || runningAll}
                className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningAll ? "Running..." : "▶ Run all agents"}
              </button>
            </div>
          </div>

          {/* Result banner */}
          {automationResult && (
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-text-primary">
                    {automationResult.action}: {automationResult.message}
                  </span>
                  <Badge variant="neutral" size="sm" className="ml-2">
                    {automationResult.source}
                  </Badge>
                </div>
                <button
                  onClick={() => setAutomationResult(null)}
                  className="text-xs text-text-faint hover:text-text-muted"
                >
                  Dismiss
                </button>
              </div>
              {automationResult.details.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {automationResult.details.map((d, i) => (
                    <li key={i} className="text-xs text-text-muted">
                      · {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {/* 471(c) Dual-Path Analysis */}
        <div className="mb-6">
          <Section471cDashboard
            operatorType={tenant.operatorType ?? "vertical"}
            grossRevenue={25000000}
            costCategories={costDataFor471c}
            priorYearsGrossReceipts={priorYearsGrossReceipts}
          />
        </div>

        <AllocationReviewQueue items={demoAllocationReviewQueue} />
      </div>
    </AppShell>
  );
}
