"use client";

import { Fragment, useState } from "react";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
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

type TrialBalanceReport = {
  groups: Array<{
    category: string;
    accounts: Array<{ code: string; name: string; debit: number; credit: number }>;
  }>;
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
  postedCount: number;
  unpostedCount: number;
  accountsWithActivity: number;
};

export function TrialBalance() {
  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(today);

  const { report, loading, error, reload, companyName } = useReport<TrialBalanceReport>(
    "trial-balance",
    { startDate, endDate },
  );

  function handleExport() {
    if (!report) return;
    const rows: Array<Array<string | number>> = [
      ["Trial Balance", companyName],
      ["Period", `${startDate} to ${endDate}`],
      [],
      ["Category", "Code", "Account", "Debit", "Credit"],
    ];
    for (const group of report.groups) {
      for (const account of group.accounts) {
        rows.push([group.category, account.code, account.name, account.debit, account.credit]);
      }
    }
    rows.push([]);
    rows.push(["", "", "Totals", report.totalDebits, report.totalCredits]);
    exportCsv(`trial-balance-${endDate}.csv`, rows);
  }

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
          disabled={!report || report.accountsWithActivity === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : !report || report.accountsWithActivity === 0 ? (
        <ReportEmpty statement="trial balance" />
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
                In balance — debits equal credits across {report.accountsWithActivity} accounts from{" "}
                {report.postedCount} posted transaction{report.postedCount === 1 ? "" : "s"}.
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Out of balance by {money.format(Math.abs(report.totalDebits - report.totalCredits))}.
                Review recent journal entries.
              </>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-mid">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-faint">
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Account</th>
                  <th className="px-5 py-3 text-right font-semibold">Debit</th>
                  <th className="px-5 py-3 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {report.groups.map((group) => (
                  <Fragment key={group.category}>
                    <tr className="bg-surface/60">
                      <td colSpan={4} className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-accent">
                        {group.category}
                      </td>
                    </tr>
                    {group.accounts.map((account) => (
                      <tr key={group.category + account.code} className="border-b border-border/40">
                        <td className="px-5 py-2.5 font-mono text-xs text-text-muted">{account.code}</td>
                        <td className="px-5 py-2.5 text-text-secondary">{account.name}</td>
                        <td className="px-5 py-2.5 text-right text-text-primary">
                          {account.debit ? money.format(account.debit) : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right text-text-primary">
                          {account.credit ? money.format(account.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface/60">
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-sm font-semibold text-text-primary">Totals</td>
                  <td className="px-5 py-3 text-right font-semibold text-text-primary">
                    {money.format(report.totalDebits)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-text-primary">
                    {money.format(report.totalCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
