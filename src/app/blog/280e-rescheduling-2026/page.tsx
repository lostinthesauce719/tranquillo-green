import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "280E Rescheduling 2026: What Cannabis Operators Need to Know | Tranquillo Green",
  description: "Trump signed the executive order to reschedule cannabis to Schedule III. Here's what it means for your tax strategy, and why you still need proper accounting.",
  openGraph: { title: "280E Rescheduling 2026 Guide | Tranquillo Green", description: "What Schedule III means for cannabis operators. Tax strategy, compliance, and why accounting still matters.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Industry News</span>
          <span className="text-text-muted text-xs ml-3">May 1, 2026 • 10 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">280E Rescheduling in 2026: What Cannabis Operators Need to Know</h1>
        <p className="text-text-muted text-lg mb-8">Trump signed the executive order. Here's what Schedule III means for your tax strategy, and why you still need proper accounting.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Just Happened</h2>
          <p>In December 2025, President Trump signed an executive order directing the DEA to reschedule cannabis from Schedule I to Schedule III under the Controlled Substances Act. This is the most significant federal cannabis policy change in decades.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Schedule III Means for 280E</h2>
          <p>Under Schedule III, cannabis businesses would no longer be subject to IRC 280E. This means:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Normal business deductions return</strong> — Rent, marketing, payroll, insurance all become deductible again</li>
            <li><strong className="text-white">Effective tax rates drop 40-50%</strong> — From 70%+ effective rates to normal 21-35% corporate rates</li>
            <li><strong className="text-white">Banking becomes easier</strong> — Schedule III substances can be prescribed, opening financial services</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">But Here's What Doesn't Change</h2>
          <p>Rescheduling doesn't eliminate the need for proper accounting. You still need:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Accurate COGS tracking</strong> — Even without 280E, COGS is still the largest deduction. Get it wrong, you overpay.</li>
            <li><strong className="text-white">Metrc reconciliation</strong> — State tracking requirements don't change with federal rescheduling.</li>
            <li><strong className="text-white">Multi-entity accounting</strong> — Vertical operators still need entity-level reporting and consolidation.</li>
            <li><strong className="text-white">State tax compliance</strong> — State cannabis taxes are unaffected by federal rescheduling.</li>
            <li><strong className="text-white">Audit-ready documentation</strong> — The IRS will still audit cannabis businesses. Good records are your defense.</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Transition Period</h2>
          <p>Rescheduling is not instantaneous. The DEA must go through a rulemaking process that could take 12-24 months. During this transition:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>280E still applies for current tax years</li>
            <li>Operators should maintain compliance with existing rules</li>
            <li>Planning for the transition (entity structure, accounting method changes) should start now</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">What Operators Should Do Now</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong className="text-white">Don't stop tracking COGS</strong> — Your current 280E compliance is still required</li>
            <li><strong className="text-white">Clean up your books</strong> — When 280E goes away, your historical data matters for the transition</li>
            <li><strong className="text-white">Review entity structure</strong> — Normal tax rules may favor different structures than 280E optimization</li>
            <li><strong className="text-white">Build audit-ready records</strong> — The IRS will look at prior years' 280E compliance during the transition</li>
          </ol>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Adapts</h2>
          <p>Our platform is built to handle both 280E and post-280E accounting. When the rules change, your software adapts — no migration required. We're already building the post-280E allocation engine so you're ready on day one.</p>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Be Ready for What's Next</h2>
          <p className="text-text-muted mb-6">Tranquillo Green works under 280E today and post-280E tomorrow. No migration required.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
