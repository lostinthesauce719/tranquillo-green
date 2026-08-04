"use client";

import { useState } from "react";

type PLLineItem = {
  label: string;
  amount: number;
  indent?: boolean;
  bold?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
};

type PLSection = {
  title: string;
  items: PLLineItem[];
  total: number;
  totalLabel: string;
};

type PLStatementData = {
  period: string;
  companyName: string;
  sections: PLSection[];
  netIncome: number;
  netIncome280e?: number;
  taxSavings?: number;
};

// Demo P&L data for Golden State Greens
function generateDemoPL(): PLStatementData {
  const revenue: PLSection = {
    title: "Revenue",
    items: [
      { label: "Retail Sales", amount: 4820000 },
      { label: "Delivery Revenue", amount: 1240000 },
      { label: "Wholesale Revenue", amount: 890000 },
      { label: "Other Revenue", amount: 120000 },
    ],
    total: 7070000,
    totalLabel: "Total Revenue",
  };

  const cogs: PLSection = {
    title: "Cost of Goods Sold (COGS)",
    items: [
      { label: "Beginning Inventory", amount: 420000, indent: true },
      { label: "Purchases", amount: 2180000, indent: true },
      { label: "Cultivation Labor (plant-touching)", amount: 680000, indent: true },
      { label: "Packaging & Materials", amount: 340000, indent: true },
      { label: "Freight & Shipping", amount: 120000, indent: true },
      { label: "Ending Inventory", amount: -520000, indent: true },
    ],
    total: 3220000,
    totalLabel: "Total COGS",
  };

  const grossProfit = revenue.total - cogs.total;

  const operatingExpenses: PLSection = {
    title: "Operating Expenses",
    items: [
      { label: "Rent & Lease", amount: 480000 },
      { label: "Payroll (non-plant-touching)", amount: 1240000 },
      { label: "Marketing & Advertising", amount: 320000 },
      { label: "Insurance", amount: 180000 },
      { label: "Professional Services (CPA, Legal)", amount: 240000 },
      { label: "Utilities", amount: 144000 },
      { label: "Depreciation", amount: 96000 },
      { label: "Software & Technology", amount: 72000 },
      { label: "Security", amount: 120000 },
      { label: "Repairs & Maintenance", amount: 60000 },
      { label: "Office & Supplies", amount: 36000 },
      { label: "Travel & Entertainment", amount: 24000 },
      { label: "Licenses & Permits", amount: 48000 },
      { label: "Bank Fees & Merchant Processing", amount: 84000 },
    ],
    total: 3144000,
    totalLabel: "Total Operating Expenses",
  };

  const operatingIncome = grossProfit - operatingExpenses.total;

  const otherItems: PLSection = {
    title: "Other Income / (Expenses)",
    items: [
      { label: "Interest Income", amount: 2000 },
      { label: "Interest Expense", amount: -48000 },
    ],
    total: -46000,
    totalLabel: "Total Other",
  };

  const netIncomeBeforeTax = operatingIncome + otherItems.total;

  const taxExpense: PLSection = {
    title: "Tax Expense",
    items: [
      { label: "Federal Income Tax (21%)", amount: Math.round(netIncomeBeforeTax * 0.21) },
      { label: "State Income Tax (CA 8.84%)", amount: Math.round(netIncomeBeforeTax * 0.0884) },
      { label: "Payroll Taxes (Employer)", amount: 312000 },
      { label: "Excise Tax", amount: 420000 },
      { label: "Property Tax", amount: 36000 },
    ],
    total: Math.round(netIncomeBeforeTax * 0.21) + Math.round(netIncomeBeforeTax * 0.0884) + 312000 + 420000 + 36000,
    totalLabel: "Total Tax Expense",
  };

  const netIncome = netIncomeBeforeTax - taxExpense.total;

  // 280E impact: without proper COGS allocation, taxable income would be much higher
  const netIncome280e = grossProfit - operatingExpenses.total + otherItems.total - Math.round((grossProfit - operatingExpenses.total + otherItems.total) * 0.21) - Math.round((grossProfit - operatingExpenses.total + otherItems.total) * 0.0884) - 312000 - 420000 - 36000;
  const taxSavings = netIncome280e - netIncome;

  return {
    period: "Q1 2026 (Jan 1 – Mar 31)",
    companyName: "Golden State Greens, LLC",
    sections: [revenue, cogs, operatingExpenses, otherItems, taxExpense],
    netIncome,
    netIncome280e,
    taxSavings,
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

export function PLStatement() {
  const [data] = useState<PLStatementData>(generateDemoPL);
  const [show280e, setShow280e] = useState(true);
  const [showPop, setShowPop] = useState(true);

  // Prior period data (Q4 2025) for comparison
  const priorPeriod: PLStatementData = {
    period: "Q4 2025 (Oct 1 – Dec 31)",
    companyName: data.companyName,
    sections: [
      {
        title: "Revenue",
        items: [
          { label: "Retail Sales", amount: 4200000 },
          { label: "Delivery Revenue", amount: 1050000 },
          { label: "Wholesale Revenue", amount: 780000 },
          { label: "Other Revenue", amount: 95000 },
        ],
        total: 6125000,
        totalLabel: "Total Revenue",
      },
      {
        title: "Cost of Goods Sold (COGS)",
        items: [
          { label: "Beginning Inventory", amount: 380000, indent: true },
          { label: "Purchases", amount: 1950000, indent: true },
          { label: "Cultivation Labor (plant-touching)", amount: 620000, indent: true },
          { label: "Packaging & Materials", amount: 310000, indent: true },
          { label: "Freight & Shipping", amount: 105000, indent: true },
          { label: "Ending Inventory", amount: -420000, indent: true },
        ],
        total: 2945000,
        totalLabel: "Total COGS",
      },
      {
        title: "Operating Expenses",
        items: [
          { label: "Rent & Lease", amount: 460000 },
          { label: "Payroll (non-plant-touching)", amount: 1180000 },
          { label: "Marketing & Advertising", amount: 290000 },
          { label: "Insurance", amount: 175000 },
          { label: "Professional Services (CPA, Legal)", amount: 220000 },
          { label: "Utilities", amount: 138000 },
          { label: "Depreciation", amount: 92000 },
          { label: "Software & Technology", amount: 68000 },
          { label: "Security", amount: 115000 },
          { label: "Repairs & Maintenance", amount: 55000 },
          { label: "Office & Supplies", amount: 34000 },
          { label: "Travel & Entertainment", amount: 22000 },
          { label: "Licenses & Permits", amount: 46000 },
          { label: "Bank Fees & Merchant Processing", amount: 78000 },
        ],
        total: 2973000,
        totalLabel: "Total Operating Expenses",
      },
      {
        title: "Other Income / (Expenses)",
        items: [
          { label: "Interest Income", amount: 1800 },
          { label: "Interest Expense", amount: -45000 },
        ],
        total: -43200,
        totalLabel: "Total Other",
      },
      {
        title: "Tax Expense",
        items: [
          { label: "Federal Income Tax (21%)", amount: Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.21) },
          { label: "State Income Tax (CA 8.84%)", amount: Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.0884) },
          { label: "Payroll Taxes (Employer)", amount: 298000 },
          { label: "Excise Tax", amount: 380000 },
          { label: "Property Tax", amount: 34000 },
        ],
        total: Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.21) + Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.0884) + 298000 + 380000 + 34000,
        totalLabel: "Total Tax Expense",
      },
    ],
    netIncome: (6125000 - 2945000 - 2973000 + -43200) - (Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.21) + Math.round((6125000 - 2945000 - 2973000 + -43200) * 0.0884) + 298000 + 380000 + 34000),
    netIncome280e: (6125000 - 2945000 - 2973000 + -43200) - (Math.round((6125000 - 2973000 + -43200) * 0.21) + Math.round((6125000 - 2973000 + -43200) * 0.0884) + 298000 + 380000 + 34000),
    taxSavings: 0,
  };

  const grossProfit = data.sections[0].total - data.sections[1].total;
  const operatingIncome = grossProfit - data.sections[2].total;
  const netBeforeTax = operatingIncome + data.sections[3].total;

  const priorGrossProfit = priorPeriod.sections[0].total - priorPeriod.sections[1].total;
  const priorOperatingIncome = priorGrossProfit - priorPeriod.sections[2].total;
  const priorNetBeforeTax = priorOperatingIncome + priorPeriod.sections[3].total;

  function popChange(current: number, prior: number): { pct: string; positive: boolean } | null {
    if (prior === 0) return null;
    const change = ((current - prior) / Math.abs(prior)) * 100;
    return { pct: Math.abs(change).toFixed(1), positive: change >= 0 };
  }

  function handleDownloadPDF() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Demo mode</strong> — Showing sample financial data for Golden State Greens, LLC. Connect your live ledger for real-time reports.
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface-mid p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Income Statement</h2>
            <p className="mt-1 text-sm text-text-muted">{data.companyName}</p>
            <p className="text-sm text-text-muted">{data.period}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={show280e}
                onChange={(e) => setShow280e(e.target.checked)}
                className="rounded accent-brand"
              />
              Show 280E comparison
            </label>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showPop}
                onChange={(e) => setShowPop(e.target.checked)}
                className="rounded accent-brand"
              />
              Show prior period
            </label>
            <button
              onClick={handleDownloadPDF}
              className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:text-text-primary hover:border-brand/50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* P&L Table */}
      <div className="rounded-2xl border border-border bg-surface-mid overflow-hidden">
        <p className="block sm:hidden px-4 pt-3 text-xs text-text-muted italic">Scroll horizontally to see all columns</p>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider text-text-muted">Line Item</th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs uppercase tracking-wider text-text-muted">{data.period.split("(")[0].trim()}</th>
              {showPop && (
                <>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs uppercase tracking-wider text-text-muted">{priorPeriod.period.split("(")[0].trim()}</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Change</th>
                </>
              )}
              {show280e && (
                <th className="px-4 sm:px-6 py-3 text-right text-xs uppercase tracking-wider text-text-muted">% of Rev</th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Revenue Section */}
            <tr className="border-b border-border/50 bg-surface/30">
              <td className="px-6 py-3 font-semibold text-text-primary" colSpan={show280e ? 3 : 2}>
                {data.sections[0].title}
              </td>
            </tr>
            {data.sections[0].items.map((item) => (
              <tr key={item.label} className="border-b border-border/30">
                <td className={`px-6 py-2.5 text-text-secondary ${item.indent ? "pl-10" : ""}`}>
                  {item.label}
                </td>
                <td className="px-6 py-2.5 text-right text-text-primary">{formatAmount(item.amount)}</td>
                {show280e && (
                  <td className="px-6 py-2.5 text-right text-text-muted">
                    {((item.amount / data.sections[0].total) * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-b border-border bg-surface/50">
              <td className="px-6 py-3 font-semibold text-text-primary">{data.sections[0].totalLabel}</td>
              <td className="px-6 py-3 text-right font-semibold text-text-primary">{formatAmount(data.sections[0].total)}</td>
              {show280e && <td className="px-6 py-3 text-right text-text-muted">100.0%</td>}
            </tr>

            {/* COGS Section */}
            <tr className="border-b border-border/50 bg-surface/30">
              <td className="px-6 py-3 font-semibold text-text-primary" colSpan={show280e ? 3 : 2}>
                {data.sections[1].title}
              </td>
            </tr>
            {data.sections[1].items.map((item) => (
              <tr key={item.label} className="border-b border-border/30">
                <td className={`px-6 py-2.5 text-text-secondary ${item.indent ? "pl-10" : ""}`}>
                  {item.label}
                </td>
                <td className="px-6 py-2.5 text-right text-text-primary">{formatAmount(item.amount)}</td>
                {show280e && (
                  <td className="px-6 py-2.5 text-right text-text-muted">
                    {((item.amount / data.sections[0].total) * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-b border-border bg-surface/50">
              <td className="px-6 py-3 font-semibold text-text-primary">{data.sections[1].totalLabel}</td>
              <td className="px-6 py-3 text-right font-semibold text-text-primary">{formatAmount(data.sections[1].total)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right text-text-muted">
                  {((data.sections[1].total / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Gross Profit */}
            <tr className="border-b-2 border-brand/30 bg-brand/5">
              <td className="px-6 py-3 font-bold text-brand">Gross Profit</td>
              <td className="px-6 py-3 text-right font-bold text-brand">{formatAmount(grossProfit)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right font-bold text-brand">
                  {((grossProfit / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Operating Expenses */}
            <tr className="border-b border-border/50 bg-surface/30">
              <td className="px-6 py-3 font-semibold text-text-primary" colSpan={show280e ? 3 : 2}>
                {data.sections[2].title}
              </td>
            </tr>
            {data.sections[2].items.map((item) => (
              <tr key={item.label} className="border-b border-border/30">
                <td className={`px-6 py-2.5 text-text-secondary ${item.indent ? "pl-10" : ""}`}>
                  {item.label}
                </td>
                <td className="px-6 py-2.5 text-right text-text-primary">{formatAmount(item.amount)}</td>
                {show280e && (
                  <td className="px-6 py-2.5 text-right text-text-muted">
                    {((item.amount / data.sections[0].total) * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-b border-border bg-surface/50">
              <td className="px-6 py-3 font-semibold text-text-primary">{data.sections[2].totalLabel}</td>
              <td className="px-6 py-3 text-right font-semibold text-text-primary">{formatAmount(data.sections[2].total)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right text-text-muted">
                  {((data.sections[2].total / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Operating Income */}
            <tr className="border-b-2 border-border bg-surface/50">
              <td className="px-6 py-3 font-bold text-text-primary">Operating Income</td>
              <td className="px-6 py-3 text-right font-bold text-text-primary">{formatAmount(operatingIncome)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right text-text-muted">
                  {((operatingIncome / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Other Income/Expenses */}
            <tr className="border-b border-border/50 bg-surface/30">
              <td className="px-6 py-3 font-semibold text-text-primary" colSpan={show280e ? 3 : 2}>
                {data.sections[3].title}
              </td>
            </tr>
            {data.sections[3].items.map((item) => (
              <tr key={item.label} className="border-b border-border/30">
                <td className={`px-6 py-2.5 text-text-secondary ${item.indent ? "pl-10" : ""}`}>
                  {item.label}
                </td>
                <td className="px-6 py-2.5 text-right text-text-primary">{formatAmount(item.amount)}</td>
                {show280e && (
                  <td className="px-6 py-2.5 text-right text-text-muted">
                    {((Math.abs(item.amount) / data.sections[0].total) * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}

            {/* Net Before Tax */}
            <tr className="border-b border-border bg-surface/50">
              <td className="px-6 py-3 font-semibold text-text-primary">Net Income Before Tax</td>
              <td className="px-6 py-3 text-right font-semibold text-text-primary">{formatAmount(netBeforeTax)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right text-text-muted">
                  {((netBeforeTax / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Tax Expense */}
            <tr className="border-b border-border/50 bg-surface/30">
              <td className="px-6 py-3 font-semibold text-text-primary" colSpan={show280e ? 3 : 2}>
                {data.sections[4].title}
              </td>
            </tr>
            {data.sections[4].items.map((item) => (
              <tr key={item.label} className="border-b border-border/30">
                <td className={`px-6 py-2.5 text-text-secondary ${item.indent ? "pl-10" : ""}`}>
                  {item.label}
                </td>
                <td className="px-6 py-2.5 text-right text-text-primary">{formatAmount(item.amount)}</td>
                {show280e && (
                  <td className="px-6 py-2.5 text-right text-text-muted">
                    {((item.amount / data.sections[0].total) * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-b border-border bg-surface/50">
              <td className="px-6 py-3 font-semibold text-text-primary">{data.sections[4].totalLabel}</td>
              <td className="px-6 py-3 text-right font-semibold text-text-primary">{formatAmount(data.sections[4].total)}</td>
              {show280e && (
                <td className="px-6 py-3 text-right text-text-muted">
                  {((data.sections[4].total / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>

            {/* Net Income */}
            <tr className="border-t-2 border-brand bg-brand/10">
              <td className="px-6 py-4 font-bold text-brand text-base">Net Income</td>
              <td className="px-6 py-4 text-right font-bold text-brand text-base">{formatAmount(data.netIncome)}</td>
              {show280e && (
                <td className="px-6 py-4 text-right font-bold text-brand">
                  {((data.netIncome / data.sections[0].total) * 100).toFixed(1)}%
                </td>
              )}
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* 280E Impact Analysis */}
      {show280e && data.taxSavings !== undefined && data.taxSavings !== 0 && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h3 className="text-lg font-semibold text-brand">280E Tax Impact Analysis</h3>
          <p className="mt-1 text-sm text-text-muted">
            Proper COGS allocation under IRC 280E and 471(c) reduces your taxable income.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">Without 280E Optimization</div>
              <div className="mt-1 text-xl font-bold text-danger">{formatAmount(data.netIncome280e ?? 0)}</div>
              <div className="mt-1 text-xs text-text-muted">Net income if no COGS allocation</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">With 280E Optimization</div>
              <div className="mt-1 text-xl font-bold text-brand">{formatAmount(data.netIncome)}</div>
              <div className="mt-1 text-xs text-text-muted">Current net income with COGS</div>
            </div>
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-4">
              <div className="text-xs text-text-muted">Tax Savings from COGS</div>
              <div className="mt-1 text-xl font-bold text-brand">{formatAmount(Math.abs(data.taxSavings))}</div>
              <div className="mt-1 text-xs text-text-muted">Estimated annual savings</div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Gross Margin</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {((grossProfit / data.sections[0].total) * 100).toFixed(1)}%
          </div>
          {showPop && (() => {
            const change = popChange(grossProfit / data.sections[0].total, priorGrossProfit / priorPeriod.sections[0].total);
            return change ? (
              <div className={`mt-0.5 text-xs ${change.positive ? "text-success" : "text-danger"}`}>
                {change.positive ? "↑" : "↓"} {change.pct}% vs prior
              </div>
            ) : null;
          })()}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Operating Margin</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {((operatingIncome / data.sections[0].total) * 100).toFixed(1)}%
          </div>
          {showPop && (() => {
            const change = popChange(operatingIncome / data.sections[0].total, priorOperatingIncome / priorPeriod.sections[0].total);
            return change ? (
              <div className={`mt-0.5 text-xs ${change.positive ? "text-success" : "text-danger"}`}>
                {change.positive ? "↑" : "↓"} {change.pct}% vs prior
              </div>
            ) : null;
          })()}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Net Margin</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {((data.netIncome / data.sections[0].total) * 100).toFixed(1)}%
          </div>
          {showPop && (() => {
            const priorNetIncome = priorPeriod.netIncome;
            const change = popChange(data.netIncome / data.sections[0].total, priorNetIncome / priorPeriod.sections[0].total);
            return change ? (
              <div className={`mt-0.5 text-xs ${change.positive ? "text-success" : "text-danger"}`}>
                {change.positive ? "↑" : "↓"} {change.pct}% vs prior
              </div>
            ) : null;
          })()}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Effective Tax Rate</div>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {data.sections[4].total > 0 ? ((data.sections[4].total / netBeforeTax) * 100).toFixed(1) : "0.0"}%
          </div>
          {showPop && (() => {
            const priorTaxRate = priorPeriod.sections[4].total > 0 ? (priorPeriod.sections[4].total / priorNetBeforeTax) * 100 : 0;
            const currentRate = data.sections[4].total > 0 ? (data.sections[4].total / netBeforeTax) * 100 : 0;
            const change = popChange(currentRate, priorTaxRate);
            return change ? (
              <div className={`mt-0.5 text-xs ${change.positive ? "text-danger" : "text-success"}`}>
                {change.positive ? "↑" : "↓"} {change.pct}% vs prior
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Period-over-Period Comparison Table */}
      {showPop && (
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <h3 className="text-lg font-semibold text-text-primary">Period-over-Period Comparison</h3>
          <p className="mt-1 text-sm text-text-muted">Q1 2026 vs Q4 2025 — key metrics</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-text-muted">Metric</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-text-muted">Q1 2026</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-text-muted">Q4 2025</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-text-muted">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="px-4 py-2 text-text-secondary">Total Revenue</td>
                  <td className="px-4 py-2 text-right text-text-primary">{formatAmount(data.sections[0].total)}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{formatAmount(priorPeriod.sections[0].total)}</td>
                  <td className="px-4 py-2 text-right">
                    {(() => { const c = popChange(data.sections[0].total, priorPeriod.sections[0].total); return c ? <span className={c.positive ? "text-success" : "text-danger"}>{c.positive ? "↑" : "↓"} {c.pct}%</span> : null; })()}
                  </td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-4 py-2 text-text-secondary">Total COGS</td>
                  <td className="px-4 py-2 text-right text-text-primary">{formatAmount(data.sections[1].total)}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{formatAmount(priorPeriod.sections[1].total)}</td>
                  <td className="px-4 py-2 text-right">
                    {(() => { const c = popChange(data.sections[1].total, priorPeriod.sections[1].total); return c ? <span className={c.positive ? "text-warning" : "text-success"}>{c.positive ? "↑" : "↓"} {c.pct}%</span> : null; })()}
                  </td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-4 py-2 text-text-secondary">Gross Profit</td>
                  <td className="px-4 py-2 text-right text-text-primary">{formatAmount(grossProfit)}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{formatAmount(priorGrossProfit)}</td>
                  <td className="px-4 py-2 text-right">
                    {(() => { const c = popChange(grossProfit, priorGrossProfit); return c ? <span className={c.positive ? "text-success" : "text-danger"}>{c.positive ? "↑" : "↓"} {c.pct}%</span> : null; })()}
                  </td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-4 py-2 text-text-secondary">Operating Expenses</td>
                  <td className="px-4 py-2 text-right text-text-primary">{formatAmount(data.sections[2].total)}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{formatAmount(priorPeriod.sections[2].total)}</td>
                  <td className="px-4 py-2 text-right">
                    {(() => { const c = popChange(data.sections[2].total, priorPeriod.sections[2].total); return c ? <span className={c.positive ? "text-warning" : "text-success"}>{c.positive ? "↑" : "↓"} {c.pct}%</span> : null; })()}
                  </td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-4 py-2 text-text-secondary">Net Income</td>
                  <td className="px-4 py-2 text-right text-text-primary">{formatAmount(data.netIncome)}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{formatAmount(priorPeriod.netIncome)}</td>
                  <td className="px-4 py-2 text-right">
                    {(() => { const c = popChange(data.netIncome, priorPeriod.netIncome); return c ? <span className={c.positive ? "text-success" : "text-danger"}>{c.positive ? "↑" : "↓"} {c.pct}%</span> : null; })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
