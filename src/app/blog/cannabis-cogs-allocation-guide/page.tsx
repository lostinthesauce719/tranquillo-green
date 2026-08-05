import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cannabis COGS Allocation: The Complete Guide for 2026 | Tranquillo Green",
  description: "Complete guide to cannabis COGS allocation under IRC 280E. Learn what's deductible, how to calculate facility rent and labor allocations, and when the 471(c) election makes sense.",
  openGraph: {
    title: "Cannabis COGS Allocation Guide 2026 | Tranquillo Green",
    description: "Everything cannabis operators need to know about COGS allocation under 280E. Includes examples, calculations, and the 471(c) election.",
    type: "article",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cannabis COGS Allocation: The Complete Guide for 2026",
  description: "Complete guide to cannabis COGS allocation under IRC 280E",
  author: { "@type": "Organization", name: "Tranquillo Green" },
  datePublished: "2026-05-17",
  publisher: { "@type": "Organization", name: "Tranquillo Green" },
};

export default function COGSGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-surface-mid">
        <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
          <div className="mb-8">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">280E Compliance</span>
            <span className="text-text-muted text-xs ml-3">May 17, 2026 • 12 min read</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">Cannabis COGS Allocation: The Complete Guide for 2026</h1>
          <p className="text-text-muted text-lg mb-8">Everything cannabis operators need to know about Cost of Goods Sold allocation under IRC 280E — including facility rent, labor, shipping, and the 471(c) election.</p>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Is COGS Under 280E?</h2>
            <p className="text-text-muted mb-4">Under IRC 280E, cannabis businesses cannot deduct ordinary business expenses. The only deductions allowed are Cost of Goods Sold (COGS). This means every dollar you can legitimately classify as COGS directly reduces your federal tax bill.</p>
            <p className="text-text-muted mb-4">The problem: most operators only claim product cost as COGS. They leave 30-60% of legitimate deductions on the table — facility rent, inventory labor, shipping, and more.</p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">What's Deductible as COGS?</h2>
            <p className="text-text-muted mb-4">Under IRC 280E and related case law (Californians Helping to Alleviate Medical Problems v. Commissioner), the following are deductible as COGS:</p>
            <ul className="text-text-muted mb-4 list-disc pl-6 space-y-2">
              <li><strong className="text-white">Direct product cost</strong> — Cost of inventory sold (flower, edibles, concentrates, etc.)</li>
              <li><strong className="text-white">Facility rent (45%)</strong> — 45% of facility rent attributable to production/inventory storage is deductible</li>
              <li><strong className="text-white">Inventory labor (55%)</strong> — 55% of labor costs for employees directly involved in inventory management</li>
              <li><strong className="text-white">Inbound shipping</strong> — Freight costs to receive inventory</li>
              <li><strong className="text-white">Packaging</strong> — Product packaging materials</li>
              <li><strong className="text-white">Quality testing</strong> — Mandatory state testing costs</li>
              <li><strong className="text-white">Insurance on inventory</strong> — Insurance for stored product</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">How to Calculate COGS Allocation</h2>
            <p className="text-text-muted mb-4">Here's the formula most operators get wrong:</p>
            <div className="bg-surface-light rounded-lg border border-border p-6 my-6">
              <p className="text-white font-mono text-sm mb-2">COGS = Direct Product Cost + (Facility Rent × 45%) + (Inventory Labor × 55%) + Inbound Shipping + Packaging + Testing</p>
            </div>
            <p className="text-text-muted mb-4">Example for a dispensary doing $5M/year:</p>
            <div className="bg-surface-light rounded-lg border border-border p-6 my-6 space-y-2">
              <p className="text-text-muted text-sm">Direct product cost: $1,750,000 (35%)</p>
              <p className="text-text-muted text-sm">Facility rent allocation: $120,000 × 45% = $54,000</p>
              <p className="text-text-muted text-sm">Inventory labor: $180,000 × 55% = $99,000</p>
              <p className="text-text-muted text-sm">Inbound shipping: $28,000</p>
              <p className="text-text-muted text-sm">Packaging: $42,000</p>
              <p className="text-text-muted text-sm">Testing: $15,000</p>
              <p className="text-white font-semibold border-t border-border pt-2 mt-2">Total COGS: $1,988,000 (39.8%)</p>
              <p className="text-emerald-400 text-sm">vs. $1,750,000 without proper allocation = $238,000 additional deductions</p>
              <p className="text-emerald-400 text-sm">Federal tax savings: $238,000 × 21% = $49,980/year</p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">The 471(c) Election</h2>
            <p className="text-text-muted mb-4">Section 471(c) allows certain cannabis operators to capitalize additional costs into inventory beyond what traditional COGS rules permit. This can significantly increase your deductible expenses.</p>
            <p className="text-text-muted mb-4">To qualify, you must:</p>
            <ul className="text-text-muted mb-4 list-disc pl-6 space-y-2">
              <li>Be a producer or manufacturer (not just a retailer)</li>
              <li>Have average annual gross receipts under $29M (3-year average)</li>
              <li>Properly document the election on your tax return</li>
            </ul>
            <p className="text-text-muted mb-4">The 471(c) election allows you to capitalize:</p>
            <ul className="text-text-muted mb-4 list-disc pl-6 space-y-2">
              <li>Administrative costs related to production</li>
              <li>Repairs and maintenance on production equipment</li>
              <li>Utilities for production facilities</li>
              <li>Quality control costs</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">Common COGS Mistakes</h2>
            <div className="space-y-4 mb-8">
              {[
                { mistake: "Only claiming product cost", impact: "Leaving $100K-$500K in deductions on the table" },
                { mistake: "Using the wrong rent percentage", impact: "IRS expects 45% for production facilities, not 100%" },
                { mistake: "Including non-deductible labor", impact: "Only inventory-related labor qualifies — not admin or sales" },
                { mistake: "No documentation", impact: "Without proper records, the IRS will disallow your COGS claims" },
                { mistake: "Not filing 471(c) election", impact: "Missing out on additional capitalization opportunities" },
              ].map((item, i) => (
                <div key={i} className="bg-surface-light rounded-lg border border-border p-4">
                  <p className="text-white font-medium text-sm">{item.mistake}</p>
                  <p className="text-red-400 text-sm mt-1">Impact: {item.impact}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Automates COGS</h2>
            <p className="text-text-muted mb-4">Our allocation engine automatically:</p>
            <ul className="text-text-muted mb-4 list-disc pl-6 space-y-2">
              <li>Calculates proper COGS allocation across all categories</li>
              <li>Applies the correct percentages for your operator type</li>
              <li>Checks 471(c) eligibility and calculates the election impact</li>
              <li>Generates full audit trail documentation</li>
              <li>Produces CPA-ready workpapers in one click</li>
            </ul>
          </div>

          <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Calculate Your COGS Savings</h2>
            <p className="text-text-muted mb-6">See how much you could save with proper COGS allocation. Free 60-second calculator.</p>
            <Link href="/tools/280e-calculator" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Try the Calculator <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
