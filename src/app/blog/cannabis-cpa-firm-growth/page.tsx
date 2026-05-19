import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Grow Your Cannabis CPA Practice Without Hiring | Tranquillo Green",
  description: "The CPA partner program playbook: how top firms serve 3x more cannabis clients with the same headcount using automation.",
  openGraph: { title: "Grow Your Cannabis CPA Practice | Tranquillo Green", description: "How cannabis CPA firms serve more clients without hiring. Automation, white-label, revenue share.", type: "article" },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <div className="mb-8">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">CPA Channel</span>
          <span className="text-text-muted text-xs ml-3">May 5, 2026 • 9 min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">How to Grow Your Cannabis CPA Practice Without Hiring</h1>
        <p className="text-text-muted text-lg mb-8">The CPA partner program playbook: how top firms serve 3x more cannabis clients with the same headcount using automation.</p>
        <div className="prose prose-invert max-w-none text-text-muted space-y-4">
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Cannabis CPA Bottleneck</h2>
          <p>Cannabis accounting is the fastest-growing niche in the profession. But most CPA firms hit a wall: every new cannabis client means hours of manual 280E work, Metrc reconciliation, and custom reporting. You can't scale by adding headcount — the talent pool is too small.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Multiplication Strategy</h2>
          <p>Top cannabis CPA firms are multiplying their capacity without multiplying their staff. Here's how:</p>
          <h3 className="text-xl font-semibold text-white mt-8 mb-3">1. Automate the Repetitive Work</h3>
          <p>280E COGS allocation, Metrc reconciliation, and workpaper generation are the three biggest time sinks. Each one takes 8-16 hours per client per month when done manually. Automation cuts this to under 2 hours.</p>
          <h3 className="text-xl font-semibold text-white mt-8 mb-3">2. Standardize Your Engagement Model</h3>
          <p>Create a standard cannabis client onboarding process. Same chart of accounts structure, same 280E methodology, same reporting package. Standardization means your team can handle more clients without custom work.</p>
          <h3 className="text-xl font-semibold text-white mt-8 mb-3">3. Use White-Label Reporting</h3>
          <p>Your clients don't need to know what software they're using. White-label reports under your firm's brand make you look more sophisticated and save hours of formatting.</p>
          <h3 className="text-xl font-semibold text-white mt-8 mb-3">4. Offer Advisory, Not Just Compliance</h3>
          <p>Compliance work is a commodity. Advisory — COGS optimization, entity structuring, 471(c) elections, audit defense — commands premium fees and builds stickier relationships.</p>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Numbers</h2>
          <div className="bg-surface-light rounded-lg border border-border p-6 my-6 space-y-2">
            <p className="text-text-muted text-sm">Before automation: 8 clients × $2,000/mo = $16,000/mo (max capacity)</p>
            <p className="text-text-muted text-sm">After automation: 24 clients × $2,000/mo = $48,000/mo (same team)</p>
            <p className="text-emerald-400 text-sm">Revenue increase: 3x with zero additional headcount</p>
          </div>
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How Tranquillo Green Helps</h2>
          <p>Our CPA Partner Program gives you everything you need to scale:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Multi-client portal with entity switching</li>
            <li>Automated 280E + 471(c) allocations per client</li>
            <li>White-label export bundles</li>
            <li>20% revenue share on referred operator clients</li>
            <li>Priority support and quarterly business reviews</li>
          </ul>
        </div>
        <div className="mt-12 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Scale Your Practice</h2>
          <p className="text-text-muted mb-6">Join the CPA Partner Program and serve more clients without hiring.</p>
          <Link href="/cpa-partners" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Apply for Partnership <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </article>
    </main>
  );
}
