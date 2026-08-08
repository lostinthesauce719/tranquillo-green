import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, X, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "QuickBooks vs Tranquillo Green | Cannabis Accounting Software Comparison",
  description: "QuickBooks wasn't built for cannabis. See how Tranquillo Green handles 280E compliance, Metrc reconciliation, and COGS allocation that QuickBooks can't do.",
  openGraph: {
    title: "QuickBooks vs Tranquillo Green | Cannabis Accounting Comparison",
    description: "Why cannabis operators are switching from QuickBooks to Tranquillo Green for 280E compliance.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can QuickBooks handle 280E compliance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. QuickBooks treats cannabis businesses like any other business, allowing all expense deductions. This creates compliance risk because IRC 280E only allows COGS deductions. QuickBooks has no built-in 280E allocation engine.",
      },
    },
    {
      "@type": "Question",
      name: "Why do cannabis operators switch from QuickBooks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cannabis operators switch because QuickBooks doesn't understand IRC 280E, can't reconcile Metrc inventory to the general ledger, doesn't support multi-entity cannabis structures, and doesn't generate CPA-ready 280E workpapers.",
      },
    },
  ],
};

export default function VsQuickBooksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-surface-mid">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">QuickBooks vs Tranquillo Green</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            QuickBooks is great for most businesses. Cannabis isn't most businesses. Here's why 200+ operators made the switch.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-text-muted font-medium">Feature</th>
                  <th className="text-center p-4 text-text-muted font-medium">QuickBooks</th>
                  <th className="text-center p-4 text-emerald-400 font-medium">Tranquillo Green</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["280E COGS Allocation", false, true],
                  ["471(c) Election Support", false, true],
                  ["Metrc Reconciliation", false, true],
                  ["Multi-Entity Consolidation", "Partial", true],
                  ["CPA-Ready Workpapers", false, true],
                  ["Audit Trail (IRS Defense)", false, true],
                  ["Cannabis Chart of Accounts", false, true],
                  ["Month-End Close Automation", false, true],
                  ["Inventory Variance Detection", false, true],
                  ["White-Label CPA Exports", false, true],
                  ["General Bookkeeping", true, true],
                  ["Invoicing & Payments", true, true],
                  ["Bank Feeds", true, true],
                ].map(([feature, qb, tg], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4 text-white">{feature}</td>
                    <td className="p-4 text-center">
                      {qb === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : qb === "Partial" ? <span className="text-yellow-400">Partial</span> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                    <td className="p-4 text-center">
                      {tg === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Why Switch */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Why Operators Switch from QuickBooks</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "280E Compliance Risk", desc: "QuickBooks lets you deduct rent, marketing, and payroll. Under 280E, most of those deductions are illegal. This creates massive IRS exposure." },
              { title: "Manual COGS Allocation", desc: "Without automated allocation, your team spends 16+ hours/month on spreadsheets. One formula error = $25K+ IRS penalty." },
              { title: "Metrc Blind Spot", desc: "QuickBooks can't see your Metrc data. Inventory variances go undetected until an auditor finds them." },
              { title: "CPA Workpaper Hell", desc: "Your CPA spends half a day rebuilding your 280E workpapers. With Tranquillo, it's one click." },
            ].map((item, i) => (
              <div key={i} className="bg-surface-light rounded-xl border border-border p-6">
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Migration */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Switching is Easy</h2>
            <p className="text-text-muted mb-6">Import your QuickBooks data in 3 steps. Most operators are fully migrated within 24 hours.</p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg mb-1">1. Export</div>
                <p className="text-text-muted text-sm">Export your QuickBooks data as CSV or use our direct integration</p>
              </div>
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg mb-1">2. Import</div>
                <p className="text-text-muted text-sm">We map your chart of accounts to the cannabis-specific structure</p>
              </div>
              <div className="text-center">
                <div className="text-emerald-400 font-bold text-lg mb-1">3. Verify</div>
                <p className="text-text-muted text-sm">Run your first 280E allocation and compare to your existing numbers</p>
              </div>
            </div>
            <div className="text-center">
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
