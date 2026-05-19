import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cannabis Month-End Close Checklist (Free Template) | Tranquillo Green",
  description: "Close your cannabis books in days, not weeks. This checklist covers every step from bank rec to 280E allocation review. Free downloadable template.",
  openGraph: { title: "Month-End Close Checklist | Tranquillo Green", description: "Step-by-step cannabis month-end close checklist. Bank rec, inventory, 280E allocation, and more.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Operations</span>
          <span className="text-text-muted text-xs ml-3">May 10, 2026 • 15 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">The Cannabis Month-End Close Checklist</h1>
        <p className="text-text-muted text-lg mb-8">Close your books in days, not weeks. This checklist covers every step from bank reconciliation to 280E allocation review.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Day 1-2: Transaction Capture</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Import all bank and credit card transactions</li>
            <li>Record cash deposits (critical for cannabis operators)</li>
            <li>Record all sales transactions from POS</li>
            <li>Record all bills and expenses</li>
            <li>Record payroll journal entries</li>
            <li>Record any intercompany transfers</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Day 3-4: Reconciliation</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bank reconciliation — all accounts</li>
            <li>Credit card reconciliation</li>
            <li>Metrc reconciliation — compare packages to GL inventory</li>
            <li>POS reconciliation — sales to deposits</li>
            <li>Intercompany reconciliation — eliminate intercompany balances</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Day 5-6: Adjustments</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Inventory adjustments (from Metrc reconciliation)</li>
            <li>280E COGS allocation entries</li>
            <li>471(c) capitalization entries (if applicable)</li>
            <li>Depreciation and amortization</li>
            <li>Accruals (expenses incurred but not yet billed)</li>
            <li>Prepaid expense amortization</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Day 7: Review & Close</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review trial balance for unusual items</li>
            <li>Review 280E allocation report</li>
            <li>Review inventory variance report</li>
            <li>Generate financial statements</li>
            <li>Lock the period</li>
            <li>Distribute reports to stakeholders</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Cuts This to 2 Days</h2>
          <p>Our automation handles the most time-consuming steps:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Bank feeds</strong> — Transactions import automatically daily</li>
            <li><strong className="text-white">Metrc sync</strong> — Inventory reconciliation runs automatically</li>
            <li><strong className="text-white">280E allocation</strong> — One-click COGS calculation</li>
            <li><strong className="text-white">Intercompany elimination</strong> — Automated across entities</li>
            <li><strong className="text-white">Period lock</strong> — One click to close and lock</li>
          </ul>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Close Faster</h2>
          <p className="text-text-muted mb-6">Automate your month-end close with Tranquillo Green. Most operators cut close time by 60%.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
