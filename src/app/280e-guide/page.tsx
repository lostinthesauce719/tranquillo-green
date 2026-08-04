import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, FileCheck, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "The Complete 280E Guide for Cannabis Operators | Tranquillo Green",
  description: "Everything you need to know about IRC 280E compliance. What's deductible, what's not, how to calculate COGS, the 471(c) election, and how to stay audit-ready.",
  openGraph: { title: "The Complete 280E Guide | Tranquillo Green", description: "IRC 280E explained for cannabis operators. COGS deductions, 471(c) election, audit preparation, and compliance strategies.", type: "article" },
};

export default function Guide280EPage() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
          <BookOpen className="w-4 h-4" />
          Complete Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">The Complete 280E Guide for Cannabis Operators</h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
          Everything you need to know about IRC 280E compliance — what's deductible, what's not, how to calculate COGS, the 471(c) election, and how to stay audit-ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/tools/280e-calculator" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            <Calculator className="w-5 h-5" /> Calculate Your Savings
          </Link>
          <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 border border-border hover:border-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="prose prose-invert max-w-none text-text-muted space-y-6">
          <h2 className="text-2xl font-bold text-white">What Is IRC 280E?</h2>
          <p>IRC Section 280E is a federal tax code provision that prohibits businesses trafficking in controlled substances (Schedule I or II) from deducting ordinary business expenses. Only Cost of Goods Sold (COGS) is deductible.</p>
          <p>This means cannabis businesses — even in legal states — cannot deduct rent, marketing, payroll (non-inventory), insurance, or most operating expenses on their federal tax returns. The result: effective federal tax rates of 40-70%.</p>

          <h2 className="text-2xl font-bold text-white mt-12">What IS Deductible Under 280E</h2>
          <div className="bg-surface-light rounded-xl border border-border p-6 space-y-3">
            <h3 className="text-white font-semibold">Direct COGS (100% deductible)</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Cost of inventory sold (flower, edibles, concentrates)</li>
              <li>Shipping and freight to receive inventory</li>
              <li>Product packaging materials</li>
              <li>Mandatory state testing</li>
            </ul>
            <h3 className="text-white font-semibold mt-4">Allocated COGS (partially deductible)</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Facility rent: 45% deductible (production/storage portion)</li>
              <li>Inventory labor: 55% deductible (direct inventory handling)</li>
              <li>Utilities for production: allocated by square footage</li>
              <li>Insurance on inventory: 100% deductible</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12">What Is NOT Deductible</h2>
          <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6 space-y-2">
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Facility rent for retail/admin space (55% of total rent)</li>
              <li>Marketing and advertising</li>
              <li>Sales team payroll</li>
              <li>Administrative staff payroll</li>
              <li>Professional fees (legal, accounting)</li>
              <li>Insurance on non-inventory assets</li>
              <li>Office supplies and equipment</li>
              <li>Travel and entertainment</li>
              <li>Charitable contributions</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12">The 471(c) Election</h2>
          <p>Section 471(c) allows certain cannabis operators to capitalize additional costs into inventory beyond traditional COGS rules. This can significantly increase deductible expenses for qualifying producers and manufacturers.</p>
          <p><strong className="text-white">Qualifying criteria:</strong> Producer/manufacturer (not retail-only), under $29M average annual gross receipts, proper election filing.</p>
          <p><strong className="text-white">Additional capitalizable costs:</strong> Administrative production costs, repairs, utilities, security, quality control.</p>

          <h2 className="text-2xl font-bold text-white mt-12">Common 280E Mistakes</h2>
          <div className="space-y-3">
            {[
              { mistake: "Deducting all expenses like a normal business", risk: "IRS audit, penalties, back taxes" },
              { mistake: "Only claiming product cost as COGS", risk: "Leaving $100K-$500K in deductions on the table" },
              { mistake: "Using the wrong rent allocation percentage", risk: "IRS disallowance of COGS claims" },
              { mistake: "No documentation for allocations", risk: "Burden of proof shifts to you in an audit" },
              { mistake: "Not filing 471(c) election when eligible", risk: "Missing additional capitalization benefits" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface-light rounded-lg border border-border p-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm">{item.mistake}</p>
                  <p className="text-red-400 text-xs mt-1">Risk: {item.risk}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mt-12">280E Rescheduling Update</h2>
          <p>The December 2025 executive order directing rescheduling to Schedule III could eventually eliminate 280E. But the transition will take 12-24 months, and 280E still applies for current tax years. <strong className="text-white">Don't stop complying.</strong></p>
          <p>Even after rescheduling, proper COGS tracking, Metrc reconciliation, and multi-entity accounting will remain essential. The operators who have clean books today will transition smoothly tomorrow.</p>

          <h2 className="text-2xl font-bold text-white mt-12">Related Resources</h2>
          <div className="grid md:grid-cols-2 gap-4 not-prose">
            <Link href="/tools/280e-calculator" className="bg-surface-light rounded-xl border border-border p-4 hover:border-emerald-500/50 transition-colors">
              <Calculator className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-white font-medium text-sm">280E Savings Calculator</h3>
              <p className="text-text-muted text-xs mt-1">Calculate your potential savings in 60 seconds</p>
            </Link>
            <Link href="/blog/cannabis-cogs-allocation-guide" className="bg-surface-light rounded-xl border border-border p-4 hover:border-emerald-500/50 transition-colors">
              <FileCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-white font-medium text-sm">COGS Allocation Guide</h3>
              <p className="text-text-muted text-xs mt-1">Complete guide to COGS allocation under 280E</p>
            </Link>
            <Link href="/blog/cannabis-audit-preparation-guide" className="bg-surface-light rounded-xl border border-border p-4 hover:border-emerald-500/50 transition-colors">
              <Shield className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-white font-medium text-sm">Audit Preparation Guide</h3>
              <p className="text-text-muted text-xs mt-1">How to be audit-ready in 48 hours</p>
            </Link>
            <Link href="/blog/280e-vs-471c-cannabis" className="bg-surface-light rounded-xl border border-border p-4 hover:border-emerald-500/50 transition-colors">
              <BookOpen className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-white font-medium text-sm">280E vs 471(c)</h3>
              <p className="text-text-muted text-xs mt-1">Which inventory method saves you more</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Stop Overpaying on 280E</h2>
          <p className="text-text-muted mb-6 max-w-xl mx-auto">Automate your 280E compliance with Tranquillo Green. Most operators find $75K-$200K in annual savings.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-text-muted text-xs mt-4">14-day free trial • No credit card • 30-day money-back guarantee</p>
        </div>
      </section>
    </main>
  );
}
