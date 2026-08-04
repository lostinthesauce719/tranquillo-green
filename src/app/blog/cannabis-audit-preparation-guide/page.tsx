import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: {
  title: string;
  description: string;
  openGraph: { title: string; description: string; type: string };
} = {
  title: "Cannabis Audit Preparation: Be Ready in 48 Hours | Tranquillo Green",
  description: "Most operators spend weeks preparing for an IRS audit. With the right systems, you can generate audit-ready workpapers in minutes.",
  openGraph: { title: "Cannabis Audit Prep Guide | Tranquillo Green", description: "How to be audit-ready in 48 hours. IRS audit preparation for cannabis operators.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Compliance</span>
          <span className="text-text-muted text-xs ml-3">May 8, 2026 • 11 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">Cannabis Audit Preparation: How to Be Ready in 48 Hours</h1>
        <p className="text-text-muted text-lg mb-8">Most operators spend weeks preparing for an IRS audit. With the right systems, you can generate audit-ready workpapers in minutes.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Triggers a Cannabis Audit?</h2>
          <p>Cannabis operators face higher audit rates than most industries. Common triggers:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>COGS percentage significantly above industry average</li>
            <li>Large year-over-year changes in deductions</li>
            <li>Inconsistent reporting between state and federal returns</li>
            <li>Related-party transactions (common in multi-entity structures)</li>
            <li>Random selection (cannabis is a priority industry for IRS)</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Auditors Look For</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">280E compliance</strong> — Are you only deducting COGS? Are allocations properly documented?</li>
            <li><strong className="text-white">COGS methodology</strong> — Is your allocation method consistent? Is it properly elected?</li>
            <li><strong className="text-white">Inventory reconciliation</strong> — Do your books match Metrc? Are variances explained?</li>
            <li><strong className="text-white">Related-party transactions</strong> — Are intercompany transfers at fair market value?</li>
            <li><strong className="text-white">Cash handling</strong> — Are cash transactions properly recorded and reconciled?</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The 48-Hour Audit Prep Checklist</h2>
          <div className="bg-surface-light rounded-lg border border-border p-6 my-6 space-y-3">
            {[
              "Trial balance with all accounts reconciled",
              "280E COGS allocation workpapers (by category)",
              "471(c) election documentation (if applicable)",
              "Metrc-to-GL reconciliation report",
              "Inventory variance report with explanations",
              "Intercompany transaction schedule",
              "Related-party transaction documentation",
              "Cash reconciliation (daily counts to deposits)",
              "Fixed asset schedule with depreciation",
              "Chart of accounts with 280E mapping",
              "Prior year tax returns",
              "State license and regulatory correspondence",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5">☐</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Makes You Audit-Ready</h2>
          <p>Every transaction in Tranquillo Green is documented with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Source document reference</li>
            <li>280E allocation methodology</li>
            <li>Approval workflow history</li>
            <li>Audit trail (who changed what, when)</li>
          </ul>
          <p className="mt-4">One click generates the complete audit package: workpapers, reconciliation reports, and supporting documentation.</p>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Be Audit-Ready, Always</h2>
          <p className="text-text-muted mb-6">Stop scrambling when the IRS letter arrives. Tranquillo Green keeps you audit-ready year-round.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
