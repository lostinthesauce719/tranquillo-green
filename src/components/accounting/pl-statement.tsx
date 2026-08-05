"use client";

import { useState } from "react";
import { Download, Info } from "lucide-react";
import {
  money,
  firstOfYear,
  today,
  useReport,
  ReportError,
  ReportSkeleton,
  ReportEmpty,
  UnpostedNotice,
  PeriodPicker,
  exportCsv,
} from "./report-shell";

type Line = { code: string; name: string; amount: number; taxTreatment?: string };

type IncomeStatementReport = {
  revenue: Line[];
  cogs: Line[];
  opex: Line[];
  totalRevenue: number;
  totalCogs: number;
  totalOpex: number;
  grossProfit: number;
  grossMargin: number;
  netIncome: number;
  netMargin: number;
  nondeductibleOpex: number;
  deductibleOpex: number;
  taxableIncome280e: number;
  estimatedFederalTax: number;
  postedCount: number;
  unpostedCount: number;
};

function LineRows({ lines, showTax }: { lines: Line[]; showTax?: boolean }) {
  if (lines.length === 0) {
    return <div className="px-5 py-2 text-sm text-text-faint">No activity.</div>;
  }
  return (
    <>
      {lines.map((line) => (
        <div key={line.code} className="flex items-baseline justify-between gap-4 px-5 py-2 text-sm">
          <span className="text-text-secondary">
            <span className="mr-2 font-mono text-xs text-text-faint">{line.code}</span>
            {line.name}
            {showTax && line.taxTreatment === "nondeductible" && (
              <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-red-300">
                280E
              </span>
            )}
          </span>
          <span className="shrink-0 tabular-nums text-text-primary">{money.format(line.amount)}</span>
        </div>
      ))}
    </>
  );
}

function TotalRow({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) {
  return (
    <div
      className={
        "flex items-baseline justify-between gap-4 border-t border-border px-5 py-2.5 text-sm font-semibold " +
        (accent ? "text-brand" : "text-text-primary")
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{money.format(amount)}</span>
    </div>
  );
}

export function PLStatement() {
  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(today);

  const { report, loading, error, reload, companyName } = useReport<IncomeStatementReport>(
    "income-statement",
    { startDate, endDate },
  );

  function handleExport() {
    if (!report) return;
    const rows: Array<Array<string | number>> = [
      ["Profit & Loss", companyName],
      ["Period", `${startDate} to ${endDate}`],
      [],
      ["Section", "Code", "Account", "Amount"],
    ];
    for (const line of report.revenue) rows.push(["Revenue", line.code, line.name, line.amount]);
    rows.push(["", "", "Total Revenue", report.totalRevenue]);
    for (const line of report.cogs) rows.push(["COGS", line.code, line.name, line.amount]);
    rows.push(["", "", "Total COGS", report.totalCogs]);
    rows.push(["", "", "Gross Profit", report.grossProfit]);
    for (const line of report.opex) rows.push(["Operating Expenses", line.code, line.name, line.amount]);
    rows.push(["", "", "Total Operating Expenses", report.totalOpex]);
    rows.push(["", "", "Net Income (book)", report.netIncome]);
    rows.push([]);
    rows.push(["280E", "", "Nondeductible operating expenses", report.nondeductibleOpex]);
    rows.push(["280E", "", "Taxable income under 280E", report.taxableIncome280e]);
    rows.push(["280E", "", "Estimated federal tax (21%)", report.estimatedFederalTax]);
    exportCsv(`profit-and-loss-${endDate}.csv`, rows);
  }

  const hasActivity = report && (report.revenue.length > 0 || report.cogs.length > 0 || report.opex.length > 0);

  return (
    <div className="space-y-5">
      {error && <ReportError message={error} onRetry={reload} />}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PeriodPicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onRefresh={reload}
        />
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
        <ReportEmpty statement="profit &amp; loss statement" />
      ) : (
        <>
          <UnpostedNotice count={report.unpostedCount} />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="text-xs text-text-muted">Revenue</div>
              <div className="mt-1 text-2xl font-bold text-text-primary">{money.format(report.totalRevenue)}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="text-xs text-text-muted">Gross Profit</div>
              <div className="mt-1 text-2xl font-bold text-text-primary">{money.format(report.grossProfit)}</div>
              <div className="mt-1 text-xs text-text-faint">{report.grossMargin.toFixed(1)}% margin</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="text-xs text-text-muted">Net Income</div>
              <div
                className={
                  "mt-1 text-2xl font-bold " + (report.netIncome >= 0 ? "text-emerald-300" : "text-red-300")
                }
              >
                {money.format(report.netIncome)}
              </div>
              <div className="mt-1 text-xs text-text-faint">{report.netMargin.toFixed(1)}% margin</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface-mid">
            <div className="bg-surface/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Revenue
            </div>
            <LineRows lines={report.revenue} />
            <TotalRow label="Total Revenue" amount={report.totalRevenue} />

            <div className="bg-surface/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Cost of Goods Sold
            </div>
            <LineRows lines={report.cogs} />
            <TotalRow label="Total COGS" amount={report.totalCogs} />
            <TotalRow label="Gross Profit" amount={report.grossProfit} accent />

            <div className="bg-surface/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Operating Expenses
            </div>
            <LineRows lines={report.opex} showTax />
            <TotalRow label="Total Operating Expenses" amount={report.totalOpex} />
            <TotalRow label="Net Income (book)" amount={report.netIncome} accent />
          </div>

          {/* 280E reconciliation */}
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-brand">280E Tax View</h3>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              Under IRC §280E only cost of goods sold reduces taxable income. Operating expenses coded
              nondeductible are added back below.
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-text-secondary">Gross profit (revenue less COGS)</span>
                <span className="tabular-nums text-text-primary">{money.format(report.grossProfit)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-secondary">Less: deductible operating expenses</span>
                <span className="tabular-nums text-text-primary">{money.format(report.deductibleOpex)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-secondary">
                  Add back: nondeductible operating expenses (280E)
                </span>
                <span className="tabular-nums text-red-300">{money.format(report.nondeductibleOpex)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-brand/20 pt-2 font-semibold">
                <span className="text-brand">Taxable income under 280E</span>
                <span className="tabular-nums text-brand">{money.format(report.taxableIncome280e)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-secondary">Estimated federal tax at 21%</span>
                <span className="tabular-nums text-text-primary">
                  {money.format(report.estimatedFederalTax)}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-text-faint">
              Estimate only, based on how accounts are coded in your chart of accounts. Confirm treatment
              with your CPA before filing.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
