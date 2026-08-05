"use client";

/**
 * 280E support schedule — live.
 *
 * This page used to render `demoSupportScheduleReport`: a fixed set of invented
 * rows with a fixed period label of "April 2026". It looked like a workpaper and
 * contained nothing from the operator's books.
 *
 * That is the worst kind of wrong page. A missing schedule is honestly missing.
 * A schedule full of plausible numbers is the document an operator would hand to
 * an examiner, and every figure on it would be fictional.
 *
 * It now reads `allocationEngine.getSupportSchedule` and prints, per row, the
 * sentence the engine recorded when it made the allocation — the measurement,
 * not just the result. Where there is nothing to show it says so.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useTenant } from "@/lib/auth/tenant-context";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/* ─── States that are not a schedule ─────────────────────────────────────── */

function Panel({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn" | "danger";
  title: string;
  children: React.ReactNode;
}) {
  const ring =
    tone === "danger"
      ? "border-rose-500/30 bg-rose-500/5"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border bg-surface-mid";
  return (
    <div className={`rounded-2xl border p-6 ${ring}`}>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      <div className="mt-2 text-sm text-text-muted">{children}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-6">
      <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
        ))}
      </div>
    </div>
  );
}

/* ─── The schedule ───────────────────────────────────────────────────────── */

export function SupportScheduleClient() {
  const tenant = useTenant();
  const companyId = tenant.companyId as any;

  const periods = useQuery(api.reportingPeriods.listByCompany, { companyId });
  const [selected, setSelected] = useState<string | null>(null);

  // Default to the most recent period rather than a hardcoded month.
  const periodLabel =
    selected ?? (periods && periods.length > 0 ? periods[periods.length - 1].label : null);

  const report = useQuery(
    api.allocationEngine.getSupportSchedule,
    periodLabel ? { companyId, periodLabel } : "skip",
  );

  if (periods === undefined) return <Loading />;

  if (periods.length === 0) {
    return (
      <Panel title="No reporting periods yet">
        A support schedule covers a period, and this company does not have one
        open. Create a reporting period, post the month&apos;s transactions, and
        the schedule will build itself from the allocations.
        <div className="mt-4">
          <Link href="/dashboard/accounting/periods" className="text-teal-300 underline">
            Open reporting periods →
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-text-muted">Period</span>
        <select
          value={periodLabel ?? ""}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-border bg-surface-deep px-3 py-1.5 text-sm text-text-primary"
        >
          {periods.map((p: any) => (
            <option key={p._id} value={p.label}>
              {p.label} — {p.status}
            </option>
          ))}
        </select>
        {report && (
          <span className="text-xs text-text-muted">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {report === undefined ? (
        <Loading />
      ) : report.rows.length === 0 ? (
        <Panel title={`Nothing allocated in ${report.periodLabel}`}>
          No 280E allocations exist for this period, so there is nothing to
          support. This is not an error — it is what an empty month looks like.
          Post and allocate the period&apos;s costs and they will appear here with
          the basis behind each one.
          <div className="mt-4 flex gap-4">
            <Link href="/dashboard/accounting/transactions" className="text-teal-300 underline">
              Transactions →
            </Link>
            <Link href="/dashboard/allocations" className="text-teal-300 underline">
              Allocations →
            </Link>
          </div>
        </Panel>
      ) : (
        <>
          {/* Self-check. A workpaper that does not foot should say so. */}
          {!report.reconciliation.reconciles && (
            <Panel tone="danger" title="This schedule does not tie to the allocations">
              The rows below total {usd(report.reconciliation.scheduleDeductible)}{" "}
              deductible, but the underlying allocations total{" "}
              {usd(report.reconciliation.allocationDeductible)}. Do not file or
              hand off from this schedule until the difference is explained.
            </Panel>
          )}

          {report.summary.unsubstantiatedCount > 0 && (
            <Panel tone="warn" title={`${report.summary.unsubstantiatedCount} row(s) carry no stated basis`}>
              These were allocated before the basis was recorded, or by a method
              that supplied none. They are included in the totals but cannot be
              defended from this schedule alone. Re-run the allocation to capture
              the measurement.
            </Panel>
          )}

          {/* Totals */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Deductible (COGS)" value={usd(report.summary.totalDeductible)} tone="good" />
            <Stat label="Nondeductible (280E)" value={usd(report.summary.totalNondeductible)} tone="bad" />
            <Stat label="Total reviewed" value={usd(report.summary.totalCost)} />
            <Stat label="Deductible share" value={pct(report.summary.deductiblePercent)} />
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-sm font-semibold text-text-primary">By cost category</div>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Rows</th>
                  <th className="pb-2 text-right">Deductible</th>
                  <th className="pb-2 text-right">Nondeductible</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.categoryBreakdown.map((c: any) => (
                  <tr key={c.category} className="border-t border-border/50">
                    <td className="py-2 capitalize text-text-primary">{c.category}</td>
                    <td className="py-2 text-right text-text-muted">{c.transactionCount}</td>
                    <td className="py-2 text-right text-emerald-300">{usd(c.totalDeductible)}</td>
                    <td className="py-2 text-right text-rose-300">{usd(c.totalNondeductible)}</td>
                    <td className="py-2 text-right text-text-primary">{usd(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The schedule itself */}
          <div className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-sm font-semibold text-text-primary">
              Schedule detail — {report.periodLabel}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Each row states the basis used. That sentence is the substantiation:
              it is what answers an information document request, and it was
              recorded when the allocation was made rather than reconstructed
              afterwards.
            </p>

            <div className="mt-4 space-y-3">
              {report.rows.map((row: any, i: number) => (
                <div key={`${row.transactionId}-${row.accountCode}-${i}`} className="rounded-xl border border-border/60 bg-surface-deep p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-text-muted">{row.accountCode}</span>{" "}
                      <span className="text-sm text-text-primary">{row.accountName}</span>
                      {row.memo && <span className="ml-2 text-xs text-text-muted">— {row.memo}</span>}
                    </div>
                    <div className="text-xs text-text-muted">{row.transactionDate}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-text-muted">
                      Cost <span className="text-text-primary">{usd(row.totalAmount)}</span>
                    </span>
                    <span className="text-text-muted">
                      COGS <span className="text-emerald-300">{usd(row.deductibleAmount)}</span>
                    </span>
                    <span className="text-text-muted">
                      Nondeductible <span className="text-rose-300">{usd(row.nondeductibleAmount)}</span>
                    </span>
                    <span className="text-text-muted">
                      Confidence <span className="text-text-primary">{row.confidence}</span>
                    </span>
                  </div>

                  {row.basisExplanation ? (
                    <p className="mt-2 border-l-2 border-teal-500/40 pl-3 text-xs leading-relaxed text-text-secondary">
                      {row.basisExplanation}
                    </p>
                  ) : (
                    <p className="mt-2 border-l-2 border-amber-500/40 pl-3 text-xs text-amber-300">
                      No basis recorded for this allocation. Re-run it to capture
                      the measurement before relying on this row.
                    </p>
                  )}

                  {row.warnings?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {row.warnings.map((w: any) => (
                        <li key={w.code} className="text-xs text-amber-300">
                          ⚠ {w.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
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
