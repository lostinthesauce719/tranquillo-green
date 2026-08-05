import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, FileCheck, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Cannabis Accounting Software | Tranquillo Green",
  description: "The only accounting platform built for cannabis operators. Automated 280E + 471(c) allocations, Metrc reconciliation, multi-entity consolidation, and CPA-ready exports.",
  openGraph: {
    title: "Cannabis Accounting Software | Tranquillo Green",
    description: "Purpose-built for cannabis. Automated 280E, Metrc reconciliation, multi-entity accounting.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tranquillo Green",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "347",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "347",
      priceCurrency: "USD",
      unitText: "MONTH",
    },
  },
  featureList: [
    "Automated 280E COGS allocation",
    "471(c) election support",
    "Metrc reconciliation",
    "Multi-entity consolidation",
    "CPA-ready workpapers",
    "Audit trail",
  ],
};

export default function CannabisAccountingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-surface-mid">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Cannabis Accounting Software</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            The only platform that understands IRC 280E natively. Automated COGS allocation, Metrc reconciliation, multi-entity consolidation, and CPA-ready exports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/tools/280e-calculator" className="inline-flex items-center justify-center gap-2 border border-border hover:border-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              <Calculator className="w-5 h-5" /> Try the Calculator
            </Link>
          </div>
        </section>

        {/* What Makes Cannabis Accounting Different */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8">What Makes Cannabis Accounting Different</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: "IRC 280E Restrictions", desc: "Unlike any other industry, cannabis businesses can only deduct COGS — not ordinary business expenses. Generic software doesn't enforce this." },
              { icon: <FileCheck className="w-6 h-6 text-emerald-400" />, title: "Seed-to-Sale Tracking", desc: "Metrc, BioTrack, and other state systems must reconcile to your financial records. Most operators do this manually in spreadsheets." },
              { icon: <Zap className="w-6 h-6 text-emerald-400" />, title: "Multi-Entity Complexity", desc: "Vertical operators need separate entities for cultivation, manufacturing, and retail — each with different 280E rules." },
            ].map((item, i) => (
              <div key={i} className="bg-surface-light rounded-xl border border-border p-6">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Everything You Need</h2>
          <div className="space-y-4">
            {[
              { title: "Automated 280E COGS Allocation", desc: "Facility rent (45%), inventory labor (55%), shipping, packaging — calculated automatically with full audit trail." },
              { title: "471(c) Election Support", desc: "Check eligibility and calculate the impact of capitalizing additional costs into inventory." },
              { title: "Metrc Reconciliation", desc: "Daily sync with Metrc packages. Catch inventory variances before they become audit findings." },
              { title: "Multi-Entity Consolidation", desc: "Manage cultivation, manufacturing, and retail entities in one platform. Intercompany eliminations automated." },
              { title: "CPA-Ready Workpapers", desc: "One-click export of 280E workpapers, financial statements, and audit packages. Your CPA will love you." },
              { title: "Month-End Close Automation", desc: "Bank rec, inventory adjustment, 280E allocation — all automated. Close in days, not weeks." },
              { title: "Cash Reconciliation", desc: "Built for cash-heavy operations. Daily cash counts, variance tracking, and deposit matching." },
              { title: "White-Label CPA Exports", desc: "CPA partners can export reports under their own brand. Perfect for firms serving multiple clients." },
            ].map((feature, i) => (
              <div key={i} className="bg-surface-light rounded-xl border border-border p-6 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-sm">✓</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-text-muted text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operator Types */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Built for Every Operator Type</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { type: "Dispensary / Retail", features: ["COGS allocation for retail", "Multi-location support", "Cash reconciliation", "Sales tax automation"] },
              { type: "Cultivator", features: ["471(c) capitalization", "Harvest cost tracking", "Waste accounting", "Metrc package reconciliation"] },
              { type: "Manufacturer", features: ["Batch cost tracking", "COGS for extracts/edibles", "Waste & yield accounting", "Multi-entity transfers"] },
              { type: "Vertical (MSO)", features: ["Intercompany eliminations", "Entity-level reporting", "Consolidated financials", "Transfer pricing"] },
            ].map((item, i) => (
              <div key={i} className="bg-surface-light rounded-xl border border-border p-6">
                <h3 className="text-white font-semibold mb-3">{item.type}</h3>
                <ul className="space-y-2">
                  {item.features.map((f, j) => (
                    <li key={j} className="text-text-muted text-sm flex items-center gap-2">
                      <span className="text-emerald-400">•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Learn More</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/280e-guide" className="bg-surface-light rounded-xl border border-border p-6 hover:border-emerald-500/50 transition-colors group">
              <BookOpen className="w-6 h-6 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400">280E Complete Guide</h3>
              <p className="text-text-muted text-sm">Everything you need to know about IRC 280E compliance, COGS deductions, and the 471(c) election.</p>
            </Link>
            <Link href="/tools/280e-calculator" className="bg-surface-light rounded-xl border border-border p-6 hover:border-emerald-500/50 transition-colors group">
              <Calculator className="w-6 h-6 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400">280E Savings Calculator</h3>
              <p className="text-text-muted text-sm">Calculate your potential tax savings in 60 seconds. Free, no signup required.</p>
            </Link>
            <Link href="/compare/quickbooks-vs-tranquillo-green" className="bg-surface-light rounded-xl border border-border p-6 hover:border-emerald-500/50 transition-colors group">
              <Shield className="w-6 h-6 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400">vs QuickBooks</h3>
              <p className="text-text-muted text-sm">See why cannabis operators are switching from QuickBooks to Tranquillo Green.</p>
            </Link>
            <Link href="/cpa-partners" className="bg-surface-light rounded-xl border border-border p-6 hover:border-emerald-500/50 transition-colors group">
              <FileCheck className="w-6 h-6 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-400">CPA Partner Program</h3>
              <p className="text-text-muted text-sm">Serve more cannabis clients without hiring. White-label exports, 20% revenue share.</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Switch?</h2>
            <p className="text-text-muted mb-6 max-w-xl mx-auto">Import your data from QuickBooks in 24 hours. Most operators see ROI in the first month.</p>
            <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-text-muted text-xs mt-4">14-day free trial • No credit card • 30-day money-back guarantee</p>
          </div>
        </section>
      </main>
    </>
  );
}
