"use client";

import { useState } from "react";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  money,
  today,
  useReport,
  ReportError,
  ReportSkeleton,
  ReportEmpty,
  UnpostedNotice,
  AsOfPicker,
  exportCsv,
} from "./report-shell";

type Line = { code: string; name: string; subcategory?: string; amount: number };

type BalanceSheetReport = {
  assets: Line[];
  liabilities: Line[];
  equityAccounts: Line[];
  totalAssets: number;
  totalLiabilities: number;
  contributedEquity: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
  postedCount: number;
  unpostedCount: number;
};

function Section({
  title,
  lines,
  total,
  totalLabel,
}: {
  title: string;
  lines: Line[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{title}</div>
      {lines.length === 0 ? (
        <p className="text-sm text-text-faint">No balances.</p>
      ) : (
        <div className="space-y-1.5">
          {lines.map((line) => (
            <div key={line.code} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-text-secondary">
                <span className="mr-2 font-mono text-xs text-text-faint">{line.code}</span>
                {line.name}
              </span>
              <span className="shrink-0 tabular-nums text-text-primary">{money.format(line.amount)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3 text-sm font-semibold">
        <span className="text-text-primary">{totalLabel}</span>
        <span className="tabular-nums text-text-primary">{money.format(total)}</span>
      </div>
    </div>
  );
}

export function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState(today);

  const { report, loading, error, reload, companyName } = useReport<BalanceSheetReport>(
    "balance-sheet",
    { asOfDate },
  );

  function handleExport() {
    if (!report) return;
    const rows: Array<Array<string | number>> = [
      ["Balance Sheet", companyName],
      ["As of", asOfDate],
      [],
      ["Section", "Code", "Account", "Amount"],
    ];
    for (const line of report.assets) rows.push(["Assets", line.code, line.name, line.amount]);
    rows.push(["", "", "Total Assets", report.totalAssets]);
    for (const line of report.liabilities) rows.push(["Liabilities", line.code, line.name, line.amount]);
    rows.push(["", "", "Total Liabilities", report.totalLiabilities]);
    for (const line of report.equityAccounts) rows.push(["Equity", line.code, line.name, line.amount]);
    rows.push(["Equity", "", "Retained Earnings (derived)", report.retainedEarnings]);
    rows.push(["", "", "Total Equity", report.totalEquity]);
    rows.push(["", "", "Total Liabilities & Equity", report.totalLiabilitiesAndEquity]);
    exportCsv(`balance-sheet-${asOfDate}.csv`, rows);
  }

  const hasActivity =
    report && (report.assets.length > 0 || report.liabilities.length > 0 || report.equityAccounts.length > 0);

  return (
    <div className="space-y-5">
      {error && <ReportError message={error} onRetry={reload} />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <AsOfPicker asOfDate={asOfDate} onChange={setAsOfDate} onRefresh={reload} />
        <button
          onClick={handleExport}
          disabled={!hasActivity}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : !hasActivity || !report ? (
        <ReportEmpty statement="balance sheet" />
      ) : (
        <>
          <UnpostedNotice count={report.unpostedCount} />

          <div
            className={
              "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm " +
              (report.balanced
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                : "border-red-500/20 bg-red-500/5 text-red-300")
            }
          >
            {report.balanced ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Balanced — assets equal liabilities plus equity.
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Does not balance:{" "}
                {money.format(Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity))} difference
                between assets and liabilities plus equity.
              </>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Assets" lines={report.assets} total={report.totalAssets} totalLabel="Total Assets" />
            <div className="space-y-4">
              <Section
                title="Liabilities"
                lines={report.liabilities}
                total={report.totalLiabilities}
                totalLabel="Total Liabilities"
              />
              <div className="rounded-2xl border border-border bg-surface-mid p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Equity</div>
                <div className="space-y-1.5">
                  {report.equityAccounts.map((line) => (
                    <div key={line.code} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-text-secondary">
                        <span className="mr-2 font-mono text-xs text-text-faint">{line.code}</span>
                        {line.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-text-primary">{money.format(line.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-text-secondary">
                      Retained Earnings
                      <span className="ml-2 text-xs text-text-faint">(derived from posted activity)</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-text-primary">
                      {money.format(report.retainedEarnings)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span className="text-text-primary">Total Equity</span>
                  <span className="tabular-nums text-text-primary">{money.format(report.totalEquity)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
                <div className="flex items-baseline justify-between text-sm font-semibold">
                  <span className="text-brand">Total Liabilities &amp; Equity</span>
                  <span className="tabular-nums text-brand">
                    {money.format(report.totalLiabilitiesAndEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
