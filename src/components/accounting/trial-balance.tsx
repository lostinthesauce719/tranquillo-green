"use client";

import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────── */

type TrialBalanceAccount = {
  code: string;
  name: string;
  debit: number;
  credit: number;
};

type TrialBalanceGroup = {
  category: string;
  accounts: TrialBalanceAccount[];
};

type TrialBalanceData = {
  period: string;
  companyName: string;
  groups: TrialBalanceGroup[];
  totalDebits: number;
  totalCredits: number;
};

/* ── Demo Data ──────────────────────────────────────────────────────── */

function generateDemoTrialBalance(): TrialBalanceData {
  const groups: TrialBalanceGroup[] = [
    {
      category: "Assets",
      accounts: [
        { code: "1000", name: "Cash — Operating Account", debit: 513000, credit: 0 },
        { code: "1010", name: "Cash — Payroll Account", debit: 107500, credit: 0 },
        { code: "1100", name: "Accounts Receivable", debit: 84200, credit: 0 },
        { code: "1200", name: "Inventory — Flower", debit: 285000, credit: 0 },
        { code: "1210", name: "Inventory — Concentrates", debit: 118000, credit: 0 },
        { code: "1220", name: "Inventory — Edibles & Topicals", debit: 67500, credit: 0 },
        { code: "1500", name: "Equipment & Fixtures", debit: 195000, credit: 0 },
        { code: "1510", name: "Accumulated Depreciation", debit: 0, credit: 48750 },
      ],
    },
    {
      category: "Liabilities",
      accounts: [
        { code: "2000", name: "Accounts Payable", debit: 0, credit: 62400 },
        { code: "2100", name: "Accrued Expenses", debit: 0, credit: 31800 },
        { code: "2200", name: "Sales Tax Payable", debit: 0, credit: 47200 },
        { code: "2300", name: "Excise Tax Payable (280E)", debit: 0, credit: 89600 },
        { code: "2500", name: "Long-term Debt — Equipment Loan", debit: 0, credit: 145000 },
      ],
    },
    {
      category: "Equity",
      accounts: [
        { code: "3000", name: "Member Equity — Contributions", debit: 0, credit: 350000 },
        { code: "3100", name: "Retained Earnings", debit: 0, credit: 199350 },
      ],
    },
    {
      category: "Revenue",
      accounts: [
        { code: "4000", name: "Revenue — Flower Sales", debit: 0, credit: 1420000 },
        { code: "4100", name: "Revenue — Concentrate Sales", debit: 0, credit: 580000 },
        { code: "4200", name: "Revenue — Edible & Topical Sales", debit: 0, credit: 310000 },
      ],
    },
    {
      category: "Cost of Goods Sold",
      accounts: [
        { code: "5000", name: "COGS — Flower", debit: 710000, credit: 0 },
        { code: "5100", name: "COGS — Concentrates", debit: 290000, credit: 0 },
        { code: "5200", name: "COGS — Edibles & Topicals", debit: 155000, credit: 0 },
        { code: "5300", name: "Inventory Adjustments / Shrinkage", debit: 28500, credit: 0 },
      ],
    },
    {
      category: "Operating Expenses",
      accounts: [
        { code: "6000", name: "Salaries & Wages", debit: 312000, credit: 0 },
        { code: "6100", name: "Rent / Lease Expense", debit: 144000, credit: 0 },
        { code: "6200", name: "Utilities", debit: 28500, credit: 0 },
        { code: "6300", name: "Insurance", debit: 47200, credit: 0 },
        { code: "6400", name: "Professional Fees (Legal / CPA)", debit: 62000, credit: 0 },
        { code: "6500", name: "Marketing & Advertising", debit: 38500, credit: 0 },
        { code: "6600", name: "Licenses & Permits", debit: 24000, credit: 0 },
        { code: "6700", name: "Security & Compliance", debit: 56000, credit: 0 },
        { code: "6800", name: "Office & Administrative", debit: 18200, credit: 0 },
      ],
    },
  ];

  // Calculate totals
  let totalDebits = 0;
  let totalCredits = 0;
  for (const group of groups) {
    for (const acct of group.accounts) {
      totalDebits += acct.debit;
      totalCredits += acct.credit;
    }
  }

  return {
    period: "As of March 31, 2026",
    companyName: "Golden State Greens, LLC",
    groups,
    totalDebits,
    totalCredits,
  };
}

/* ── Formatting ─────────────────────────────────────────────────────── */

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmt(n: number): string {
  return currencyFmt.format(n);
}

/* ── Category badge colors ──────────────────────────────────────────── */

const categoryColors: Record<string, string> = {
  Assets: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  Liabilities: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  Equity: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  Revenue: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "Cost of Goods Sold": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "Operating Expenses": "bg-orange-500/10 text-orange-300 border-orange-500/20",
};

/* ── Main Component ─────────────────────────────────────────────────── */

export function TrialBalance() {
  const [data] = useState<TrialBalanceData>(generateDemoTrialBalance);
  const [show280ENote, setShow280ENote] = useState(true);

  const isBalanced = data.totalDebits === data.totalCredits;

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Demo mode</strong> — Showing sample trial balance data for
        Golden State Greens, LLC. Connect your live ledger for real-time
        financial reports.
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-surface-mid p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Trial Balance
            </h2>
            <p className="mt-1 text-sm text-text-muted">{data.companyName}</p>
            <p className="text-sm text-text-muted">{data.period}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                isBalanced
                  ? "border border-success/20 bg-success/10 text-success"
                  : "border border-danger/20 bg-danger/10 text-danger"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isBalanced ? "bg-success" : "bg-danger"
                }`}
              />
              {isBalanced ? "In Balance" : "Out of Balance"}
            </div>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="rounded-2xl border border-border bg-surface-mid overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_140px_140px] gap-4 px-4 py-3 bg-surface/60 border-b border-border text-xs font-semibold uppercase tracking-wider text-text-muted">
          <div>Code</div>
          <div>Account</div>
          <div className="text-right">Debit</div>
          <div className="text-right">Credit</div>
        </div>

        {/* Groups */}
        {data.groups.map((group) => {
          const subtotalDebit = group.accounts.reduce((s, a) => s + a.debit, 0);
          const subtotalCredit = group.accounts.reduce((s, a) => s + a.credit, 0);
          const badgeColor = categoryColors[group.category] ?? "bg-neutral-500/10 text-neutral-300 border-neutral-500/20";

          return (
            <div key={group.category}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface/40 border-b border-border/50">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                  {group.category}
                </span>
              </div>

              {/* Accounts */}
              <div className="divide-y divide-border/20">
                {group.accounts.map((acct) => (
                  <div
                    key={acct.code}
                    className="grid grid-cols-[80px_1fr_140px_140px] gap-4 px-4 py-2.5 hover:bg-surface-overlay/30 transition-colors duration-[var(--duration-fast)]"
                  >
                    <span className="text-xs font-mono text-text-faint tabular-nums">
                      {acct.code}
                    </span>
                    <span className="text-sm text-text-secondary truncate">
                      {acct.name}
                    </span>
                    <span className="text-sm text-text-primary text-right tabular-nums">
                      {acct.debit > 0 ? fmt(acct.debit) : ""}
                    </span>
                    <span className="text-sm text-text-primary text-right tabular-nums">
                      {acct.credit > 0 ? fmt(acct.credit) : ""}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="grid grid-cols-[80px_1fr_140px_140px] gap-4 px-4 py-2.5 bg-surface/50 border-b border-border">
                <div />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted text-right">
                  {group.category} Subtotal
                </span>
                <span className="text-sm font-semibold text-text-primary text-right tabular-nums">
                  {fmt(subtotalDebit)}
                </span>
                <span className="text-sm font-semibold text-text-primary text-right tabular-nums">
                  {fmt(subtotalCredit)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Grand Totals */}
        <div className="grid grid-cols-[80px_1fr_140px_140px] gap-4 px-4 py-3 bg-brand/10 border-t-2 border-brand/30">
          <div />
          <span className="text-base font-bold text-brand text-right">
            Grand Total
          </span>
          <span className="text-base font-bold text-brand text-right tabular-nums">
            {fmt(data.totalDebits)}
          </span>
          <span className="text-base font-bold text-brand text-right tabular-nums">
            {fmt(data.totalCredits)}
          </span>
        </div>
      </div>

      {/* ── 280E COGS Impact Note ─────────────────────────────────────── */}
      {show280ENote && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-accent shrink-0"
                aria-hidden
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <h3 className="text-lg font-semibold text-accent">
                IRC Section 280E — COGS Impact on Trial Balance
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShow280ENote(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
              aria-label="Dismiss"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Under <strong className="text-text-primary">IRC Section 280E</strong>,
            businesses trafficking in Schedule I or II controlled substances cannot
            deduct ordinary business expenses. However,{" "}
            <strong className="text-text-primary">Cost of Goods Sold (COGS)</strong>{" "}
            remains deductible under{" "}
            <strong className="text-text-primary">IRC Section 471(c)</strong>.
            On this trial balance, the COGS accounts (codes 5000–5300) represent the
            <strong className="text-accent"> only deductible expense category</strong>{" "}
            for federal tax purposes. All operating expenses (codes 6000–6800) are
            non-deductible under 280E.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">Total COGS (Deductible)</div>
              <div className="mt-1 text-xl font-bold text-brand">
                {fmt(1183500)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Accounts 5000–5300 — the only federally deductible expenses
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">OpEx (Non-Deductible)</div>
              <div className="mt-1 text-xl font-bold text-text-primary">
                {fmt(730400)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Accounts 6000–6800 — blocked by 280E for federal filing
              </div>
            </div>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="text-xs text-text-muted">Effective Tax Burden</div>
              <div className="mt-1 text-xl font-bold text-accent">
                Elevated
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Taxed on gross profit, not net income — maximize COGS allocation
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Work with a cannabis-specialized CPA to ensure your COGS allocation
            methodology (direct costing, absorption costing, etc.) maximizes your
            allowable deduction while remaining fully compliant with IRC 280E and
            applicable state regulations. Inventory adjustments and shrinkage
            (account 5300) are particularly scrutinized by the IRS.
          </p>
        </div>
      )}

      {/* ── Summary Metrics ──────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Debits</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {fmt(data.totalDebits)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Credits</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {fmt(data.totalCredits)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Net Difference</div>
          <div className={`mt-1 text-2xl font-bold ${isBalanced ? "text-success" : "text-danger"}`}>
            {fmt(Math.abs(data.totalDebits - data.totalCredits))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Accounts</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {data.groups.reduce((s, g) => s + g.accounts.length, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
