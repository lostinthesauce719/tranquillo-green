import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "280E vs 471(c): Which Inventory Method Saves You More? | Tranquillo Green",
  description: "The 471(c) election can significantly increase COGS deductions for cannabis operators. Learn if you qualify and how much you could save.",
  openGraph: { title: "280E vs 471(c) Guide | Tranquillo Green", description: "How to know if the 471(c) election makes sense for your cannabis operation.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Tax Strategy</span>
          <span className="text-text-muted text-xs ml-3">May 12, 2026 • 8 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">280E vs 471(c): Which Inventory Method Saves You More?</h1>
        <p className="text-text-muted text-lg mb-8">The 471(c) election can significantly increase your COGS deductions. Here's how to know if you qualify and how much you could save.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Problem with 280E</h2>
          <p>Under IRC 280E, cannabis businesses can only deduct Cost of Goods Sold. But the definition of COGS under traditional tax rules (IRC 472) is narrow — it mainly includes direct product costs and some overhead. This leaves significant costs classified as "non-deductible" operating expenses.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Enter IRC 471(c)</h2>
          <p>Section 471(c) provides an alternative inventory capitalization method that allows certain businesses to include additional costs in inventory. For cannabis operators, this can mean capitalizing costs that would otherwise be non-deductible under 280E.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Who Qualifies?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Producer or manufacturer</strong> — Not just a retailer. You must be involved in growing or processing.</li>
            <li><strong className="text-white">Under $29M average annual gross receipts</strong> — 3-year average. Most small-to-mid operators qualify.</li>
            <li><strong className="text-white">Proper election filing</strong> — Must attach statement to timely-filed tax return.</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Costs Can You Capitalize?</h2>
          <p>Under 471(c), you can capitalize into inventory:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Administrative costs related to production (supervisors, quality control)</li>
            <li>Repairs and maintenance on production equipment</li>
            <li>Utilities for production facilities</li>
            <li>Insurance on production inventory</li>
            <li>Security for production areas</li>
            <li>Packaging and labeling</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Real-World Impact</h2>
          <div className="bg-surface-light rounded-lg border border-border p-6 my-6 space-y-2">
            <p className="text-text-muted text-sm">Cultivator doing $3M/year:</p>
            <p className="text-text-muted text-sm">Standard COGS: $1,050,000 (35%)</p>
            <p className="text-text-muted text-sm">With 471(c): $1,320,000 (44%)</p>
            <p className="text-text-muted text-sm">Additional deductions: $270,000</p>
            <p className="text-emerald-400 text-sm">Federal tax savings: $270,000 × 21% = $56,700/year</p>
          </div>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How to Make the Election</h2>
          <p>The 471(c) election is made by attaching a statement to your timely-filed tax return (including extensions). The statement must include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your name, address, and EIN</li>
            <li>A description of the inventory method you're electing</li>
            <li>The tax year the election applies to</li>
          </ul>
          <p className="mt-4"><strong className="text-white">Important:</strong> Once made, the election is binding for all future years unless you get IRS consent to change.</p>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Check Your 471(c) Eligibility</h2>
          <p className="text-text-muted mb-6">Our calculator checks if you qualify and estimates your potential savings.</p>
          <Link href="/tools/280e-calculator" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Try the Calculator <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
