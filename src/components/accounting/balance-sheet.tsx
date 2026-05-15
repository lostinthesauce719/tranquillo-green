"use client";

import { useState } from "react";

type BalanceSheetLineItem = {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
};

type BalanceSheetSection = {
  title: string;
  items: BalanceSheetLineItem[];
  total: number;
  totalLabel: string;
};

type BalanceSheetData = {
  period: string;
  companyName: string;
  assets: {
    current: BalanceSheetSection;
    nonCurrent: BalanceSheetSection;
    total: number;
  };
  liabilities: {
    current: BalanceSheetSection;
    nonCurrent: BalanceSheetSection;
    total: number;
  };
  equity: {
    items: BalanceSheetLineItem[];
    total: number;
  };
  totalLiabilitiesAndEquity: number;
};

function generateDemoBalanceSheet(): BalanceSheetData {
  const currentAssets: BalanceSheetSection = {
    title: "Current Assets",
    items: [
      { label: "Cash", amount: 420000 },
      { label: "Accounts Receivable", amount: 180000 },
      { label: "Inventory", amount: 520000 },
    ],
    total: 1120000,
    totalLabel: "Total Current Assets",
  };

  const nonCurrentAssets: BalanceSheetSection = {
    title: "Non-Current Assets",
    items: [
      { label: "Equipment", amount: 350000 },
      { label: "Accumulated Depreciation", amount: -85000 },
    ],
    total: 265000,
    totalLabel: "Total Non-Current Assets",
  };

  const totalAssets = currentAssets.total + nonCurrentAssets.total;

  const currentLiabilities: BalanceSheetSection = {
    title: "Current Liabilities",
    items: [
      { label: "Accounts Payable", amount: 95000 },
      { label: "Accrued Expenses", amount: 42000 },
      { label: "Taxes Payable", amount: 128000 },
    ],
    total: 265000,
    totalLabel: "Total Current Liabilities",
  };

  const nonCurrentLiabilities: BalanceSheetSection = {
    title: "Non-Current Liabilities",
    items: [
      { label: "Long-term Debt", amount: 200000 },
    ],
    total: 200000,
    totalLabel: "Total Non-Current Liabilities",
  };

  const totalLiabilities = currentLiabilities.total + nonCurrentLiabilities.total;

  const equityItems: BalanceSheetLineItem[] = [
    { label: "Owner's Equity", amount: 500000 },
    { label: "Retained Earnings", amount: 420000 },
  ];

  const totalEquity = equityItems.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return {
    period: "As of March 31, 2026",
    companyName: "Golden State Greens, LLC",
    assets: {
      current: currentAssets,
      nonCurrent: nonCurrentAssets,
      total: totalAssets,
    },
    liabilities: {
      current: currentLiabilities,
      nonCurrent: nonCurrentLiabilities,
      total: totalLiabilities,
    },
    equity: {
      items: equityItems,
      total: totalEquity,
    },
    totalLiabilitiesAndEquity,
  };
}

const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = currencyFmt.format(abs);
  return amount < 0 ? `(${formatted})` : formatted;
}

function formatAmountK(amount: number): string {
  const abs = Math.abs(amount);
  const kValue = abs / 1000;
  const formatted = `$${kValue.toFixed(0)}K`;
  return amount < 0 ? `(${formatted})` : formatted;
}

/* ── Section Table Component ─────────────────────────────────────────── */

function BalanceSheetSectionTable({
  section,
  isLast,
}: {
  section: BalanceSheetSection;
  isLast?: boolean;
}) {
  return (
    <div>
      <div className="px-4 py-2 bg-surface/40 border-b border-border/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {section.title}
        </span>
      </div>
      <div className="divide-y divide-border/30">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between px-4 py-2.5"
          >
            <span
              className={`text-sm text-text-secondary ${
                item.indent ? "pl-4" : ""
              }`}
            >
              {item.label}
            </span>
            <span className="text-sm text-text-primary tabular-nums">
              {formatAmountK(item.amount)}
            </span>
          </div>
        ))}
      </div>
      <div
        className={`flex items-center justify-between px-4 py-2.5 bg-surface/50 ${
          isLast ? "" : "border-b border-border"
        }`}
      >
        <span className="text-sm font-semibold text-text-primary">
          {section.totalLabel}
        </span>
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {formatAmountK(section.total)}
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export function BalanceSheet() {
  const [data] = useState<BalanceSheetData>(generateDemoBalanceSheet);
  const [show280ENote, setShow280ENote] = useState(true);

  const isBalanced =
    data.assets.total === data.totalLiabilitiesAndEquity;

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Demo mode</strong> — Showing sample balance sheet data for
        Golden State Greens, LLC. Connect your live ledger for real-time
        financial reports.
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface-mid p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Balance Sheet
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
              {isBalanced ? "Balanced" : "Out of Balance"}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Assets | Liabilities + Equity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* ─── LEFT COLUMN: ASSETS ─────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface-mid overflow-hidden">
          <div className="px-4 py-3 bg-surface/60 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary">Assets</h3>
          </div>

          <BalanceSheetSectionTable section={data.assets.current} />

          <BalanceSheetSectionTable section={data.assets.nonCurrent} isLast />

          {/* Total Assets */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand/10 border-t-2 border-brand/30">
            <span className="text-base font-bold text-brand">
              Total Assets
            </span>
            <span className="text-base font-bold text-brand tabular-nums">
              {formatAmountK(data.assets.total)}
            </span>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LIABILITIES + EQUITY ──────────────────── */}
        <div className="space-y-6">
          {/* Liabilities card */}
          <div className="rounded-2xl border border-border bg-surface-mid overflow-hidden">
            <div className="px-4 py-3 bg-surface/60 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">
                Liabilities
              </h3>
            </div>

            <BalanceSheetSectionTable section={data.liabilities.current} />

            <BalanceSheetSectionTable
              section={data.liabilities.nonCurrent}
              isLast
            />

            {/* Total Liabilities */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface/50 border-t border-border">
              <span className="text-sm font-bold text-text-primary">
                Total Liabilities
              </span>
              <span className="text-sm font-bold text-text-primary tabular-nums">
                {formatAmountK(data.liabilities.total)}
              </span>
            </div>
          </div>

          {/* Equity card */}
          <div className="rounded-2xl border border-border bg-surface-mid overflow-hidden">
            <div className="px-4 py-3 bg-surface/60 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">Equity</h3>
            </div>
            <div className="divide-y divide-border/30">
              {data.equity.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-text-secondary">
                    {item.label}
                  </span>
                  <span className="text-sm text-text-primary tabular-nums">
                    {formatAmountK(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            {/* Total Equity */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface/50 border-t border-border">
              <span className="text-sm font-bold text-text-primary">
                Total Equity
              </span>
              <span className="text-sm font-bold text-text-primary tabular-nums">
                {formatAmountK(data.equity.total)}
              </span>
            </div>
          </div>

          {/* Total Liabilities + Equity */}
          <div className="rounded-2xl border border-brand/30 bg-brand/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-base font-bold text-brand">
                Total Liabilities + Equity
              </span>
              <span className="text-base font-bold text-brand tabular-nums">
                {formatAmountK(data.totalLiabilitiesAndEquity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 280E INVENTORY VALUATION NOTE ──────────────────────────── */}
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
                IRC Section 280E — Inventory Valuation Notice
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
            cannabis businesses cannot deduct ordinary business expenses. However,
            <strong className="text-text-primary"> Cost of Goods Sold (COGS)</strong>{" "}
            remains deductible under{" "}
            <strong className="text-text-primary">IRC Section 471(c)</strong>.
            Inventory valuation is therefore{" "}
            <strong className="text-accent">critical</strong> — it directly determines
            your COGS and has a material impact on your federal taxable income.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">Inventory on Books</div>
              <div className="mt-1 text-xl font-bold text-text-primary">
                {formatAmountK(520000)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Current asset — must be valued at lower of cost or market
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">COGS Impact</div>
              <div className="mt-1 text-xl font-bold text-brand">
                Direct
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Inventory changes flow directly to COGS on the income statement
              </div>
            </div>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="text-xs text-text-muted">Compliance Risk</div>
              <div className="mt-1 text-xl font-bold text-accent">
                High
              </div>
              <div className="mt-1 text-xs text-text-muted">
                IRS scrutinizes 280E COGS allocations — maintain detailed records
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Consult with a cannabis-specialized CPA to ensure your inventory
            valuation method (FIFO, weighted average, etc.) maximizes your
            allowable COGS deduction while remaining fully compliant with IRC
            280E and applicable state regulations.
          </p>
        </div>
      )}

      {/* ─── SUMMARY METRICS ───────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Assets</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {formatAmountK(data.assets.total)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Liabilities</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {formatAmountK(data.liabilities.total)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Equity</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {formatAmountK(data.equity.total)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Debt-to-Equity</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {(data.liabilities.total / data.equity.total).toFixed(2)}x
          </div>
        </div>
      </div>
    </div>
  );
}
