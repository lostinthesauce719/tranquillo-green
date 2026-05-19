import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "White-Label Cannabis Accounting: A CPA Firm's Secret Weapon | Tranquillo Green",
  description: "How to offer branded financial reporting to cannabis clients without building software from scratch. White-label exports, multi-client portal, revenue share.",
  openGraph: { title: "White-Label Cannabis Accounting | Tranquillo Green", description: "Offer branded cannabis accounting reports to your clients. No software development required.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">CPA Channel</span>
          <span className="text-text-muted text-xs ml-3">May 3, 2026 • 7 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">White-Label Cannabis Accounting: A CPA Firm's Secret Weapon</h1>
        <p className="text-text-muted text-lg mb-8">How to offer branded financial reporting to cannabis clients without building software from scratch.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Problem: Clients Expect Sophisticated Reporting</h2>
          <p>Cannabis operators are getting more sophisticated. They expect real-time dashboards, automated reports, and professional workpapers. But most CPA firms are still delivering PDFs and spreadsheets. The gap between client expectations and firm capabilities is widening.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Solution: White-Label Platform</h2>
          <p>White-label means your clients see your firm's branding — not a third-party software name. They log into a portal with your logo. Reports come with your letterhead. Workpapers carry your firm's name. It looks like you built a custom platform. You didn't.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What You Can White-Label</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Financial statements</strong> — P&L, balance sheet, cash flow with your branding</li>
            <li><strong className="text-white">280E workpapers</strong> — COGS allocation schedules, 471(c) calculations</li>
            <li><strong className="text-white">Audit packages</strong> — Complete workpaper bundles for IRS defense</li>
            <li><strong className="text-white">Client portal</strong> — Branded dashboard where clients view their data</li>
            <li><strong className="text-white">Monthly reports</strong> — Automated delivery with your commentary</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Why This Matters for Growth</h2>
          <p>Firms that offer white-label reporting win bigger clients, retain them longer, and command higher fees. It's the difference between a $500/mo bookkeeping engagement and a $3,000/mo CFO advisory relationship.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Does It</h2>
          <p>Our white-label system lets you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Upload your firm's logo and brand colors</li>
            <li>Customize report templates</li>
            <li>Set up a branded client portal URL</li>
            <li>Automate report delivery on your schedule</li>
            <li>Add your own commentary and analysis</li>
          </ul>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Start White-Labeling Today</h2>
          <p className="text-text-muted mb-6">Offer branded cannabis accounting to your clients. No development required.</p>
          <Link href="/cpa-partners" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Apply for Partnership <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
