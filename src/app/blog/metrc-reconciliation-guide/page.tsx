import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Metrc Reconciliation Guide: Match Seed-to-Sale to Your Books | Tranquillo Green",
  description: "Step-by-step guide to reconciling Metrc packages with your general ledger. Catch inventory variances before auditors do. Free checklist included.",
  openGraph: {
    title: "Metrc Reconciliation Guide | Tranquillo Green",
    description: "How to reconcile Metrc seed-to-sale data to your accounting books. Step-by-step process, common variances, and automation tips.",
    type: "article",
  },
};

export default function MetrcReconciliationPage() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Inventory</span>
          <span className="text-text-muted text-xs ml-3">May 15, 2026 • 10 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">Metrc Reconciliation: How to Match Seed-to-Sale Data to Your Books</h1>
        <p className="text-text-muted text-lg mb-8">Monthly Metrc-to-general-ledger reconciliation is the single most important accounting process for cannabis operators. Here's how to do it right.</p>

        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Why Metrc Reconciliation Matters</h2>
          <p>Metrc (Marijuana Enforcement Tracking Reconciliation Compliance) is the seed-to-sale tracking system used by most legal cannabis states. Every plant, package, and sale is tracked. But Metrc data and your accounting books are two separate systems — and they rarely match perfectly.</p>
          <p>Unreconciled variances can mean:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">License risk</strong> — State regulators can suspend your license for unexplained inventory discrepancies</li>
            <li><strong className="text-white">Tax exposure</strong> — If your books show more inventory than Metrc, you may be under-reporting COGS</li>
            <li><strong className="text-white">Audit findings</strong> — IRS and state auditors compare Metrc data to your financial statements</li>
            <li><strong className="text-white">Theft detection</strong> — Variances often reveal internal theft or process failures</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Reconciliation Process (Step-by-Step)</h2>
          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 1: Export Metrc Data</h3>
          <p>Export your Metrc packages report for the period. You need: package ID, product type, quantity, unit of measure, and status (active, transferred, destroyed).</p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 2: Export GL Inventory Balances</h3>
          <p>Run an inventory valuation report from your accounting system. This should show ending inventory by product category.</p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 3: Map Product Categories</h3>
          <p>Metrc uses its own product types. Map each Metrc product type to your GL inventory accounts. This is where most operators get stuck — the naming doesn't match.</p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 4: Compare Quantities</h3>
          <p>For each product category, compare Metrc quantity to GL quantity. Document all variances, even small ones.</p>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 5: Investigate Variances</h3>
          <p>Common causes of variances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Timing differences (sales recorded in GL but not yet in Metrc)</li>
            <li>Waste/destroyed product not recorded in GL</li>
            <li>Transfers between locations not synced</li>
            <li>Data entry errors in either system</li>
            <li>Scale calibration issues</li>
            <li>Internal theft</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mt-8 mb-3">Step 6: Record Adjustments</h3>
          <p>Create journal entries to adjust inventory to match Metrc (the source of truth). Document the reason for each adjustment.</p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Common Variance Thresholds</h2>
          <div className="bg-surface-light rounded-lg border border-border p-6 my-6">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="text-left py-2 text-text-muted">Product Type</th><th className="text-right py-2 text-text-muted">Acceptable Variance</th></tr></thead>
              <tbody className="text-text-muted">
                <tr className="border-b border-border/50"><td className="py-2">Flower</td><td className="text-right">±2%</td></tr>
                <tr className="border-b border-border/50"><td className="py-2">Concentrates</td><td className="text-right">±1%</td></tr>
                <tr className="border-b border-border/50"><td className="py-2">Edibles</td><td className="text-right">±3%</td></tr>
                <tr className="border-b border-border/50"><td className="py-2">Pre-rolls</td><td className="text-right">±3%</td></tr>
                <tr><td className="py-2">Plants</td><td className="text-right">±0% (exact match required)</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Automates This</h2>
          <p>Our Metrc integration automatically:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pulls package data daily via Metrc API</li>
            <li>Maps product types to your GL accounts</li>
            <li>Compares Metrc quantities to GL balances</li>
            <li>Flags variances exceeding your thresholds</li>
            <li>Generates adjustment journal entries</li>
            <li>Creates a reconciliation report for your records</li>
          </ul>
        </div>

        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Automate Your Metrc Reconciliation</h2>
          <p className="text-text-muted mb-6">Stop spending hours on spreadsheets. Tranquillo Green reconciles Metrc to your books daily.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
