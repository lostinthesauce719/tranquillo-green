import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users, DollarSign, FileCheck, Headphones } from "lucide-react";

export const metadata: Metadata = {
  title: "CPA Partner Program | Tranquillo Green for Cannabis Accounting Firms",
  description: "Grow your cannabis accounting practice without hiring. Multi-client portal, automated 280E allocations, white-label exports, and 20% revenue share. Apply today.",
  openGraph: {
    title: "CPA Partner Program | Tranquillo Green",
    description: "Serve 3x more cannabis clients with the same headcount. White-label 280E reports, automated allocations, 20% revenue share.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tranquillo Green CPA Partner Program",
  description: "Partner program for cannabis accounting firms offering multi-client tools, automated 280E allocations, and white-label exports",
  url: "https://tranquillo.green/cpa-partners",
};

export default function CPAPartnersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-surface-mid">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <Users className="w-4 h-4" />
            CPA Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Serve More Cannabis Clients. Hire Zero.</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            The only platform built for cannabis CPA firms. Multi-client portal, automated 280E + 471(c) allocations, white-label exports, and 20% revenue share.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#apply" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Apply for Partnership <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-border hover:border-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Schedule a Demo
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "3-4x", label: "More Clients Per Head" },
              { value: "16 hrs", label: "Saved Per Client/Month" },
              { value: "20%", label: "Revenue Share" },
              { value: "1-click", label: "CPA Workpapers" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-text-muted text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Everything You Need to Scale</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Users className="w-6 h-6 text-emerald-400" />, title: "Multi-Client Portal", desc: "Manage all your cannabis clients from one dashboard. Switch between entities in one click. Role-based access for your team." },
              { icon: <FileCheck className="w-6 h-6 text-emerald-400" />, title: "Automated 280E + 471(c)", desc: "Every allocation is calculated automatically with full audit trail. No more rebuilding cost studies from scratch each quarter." },
              { icon: <DollarSign className="w-6 h-6 text-emerald-400" />, title: "White-Label Exports", desc: "Export workpapers, financial statements, and tax packages under your firm's brand. Your clients never see our name." },
              { icon: <Headphones className="w-6 h-6 text-emerald-400" />, title: "Dedicated Partner Support", desc: "Priority support channel, quarterly business reviews, and early access to new features. We succeed when you succeed." },
            ].map((item, i) => (
              <div key={i} className="bg-surface-light rounded-xl border border-border p-6">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Partner Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-surface-light rounded-xl border border-border p-8">
              <h3 className="text-white font-bold text-lg mb-2">CPA Partner</h3>
              <div className="text-3xl font-bold text-white mb-1">$199<span className="text-text-muted text-lg font-normal">/mo</span></div>
              <p className="text-text-muted text-sm mb-6">Up to 10 client entities</p>
              <ul className="space-y-3 mb-8">
                {["Multi-client portal", "Automated 280E allocations", "White-label exports", "Email support"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-text-muted text-sm">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="#apply" className="block text-center bg-surface-mid hover:bg-surface-mid/80 text-white font-semibold py-3 rounded-lg transition-colors border border-border">
                Apply Now
              </Link>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 p-8">
              <div className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded mb-2">Most Popular</div>
              <h3 className="text-white font-bold text-lg mb-2">CPA Pro</h3>
              <div className="text-3xl font-bold text-white mb-1">$499<span className="text-text-muted text-lg font-normal">/mo</span></div>
              <p className="text-text-muted text-sm mb-6">Unlimited client entities</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Partner", "Unlimited clients", "20% revenue share", "Priority support", "Quarterly business reviews", "Early feature access"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-text-muted text-sm">
                    <span className="text-emerald-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="#apply" className="block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors">
                Apply Now
              </Link>
            </div>
          </div>
        </section>

        {/* Application */}
        <section id="apply" className="max-w-2xl mx-auto px-6 pb-20">
          <div className="bg-surface-light rounded-2xl border border-border p-8">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Apply for Partnership</h2>
            <p className="text-text-muted text-center mb-8">We accept 10 new partners per quarter. Apply now to secure your spot.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="First Name" />
                <input className="bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Last Name" />
              </div>
              <input className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Firm Name" />
              <input type="email" className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Work Email" />
              <input className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Phone" />
              <select className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Current cannabis clients</option>
                <option value="0">None yet — starting practice</option>
                <option value="1-5">1-5 clients</option>
                <option value="6-20">6-20 clients</option>
                <option value="20+">20+ clients</option>
              </select>
              <textarea className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24" placeholder="Tell us about your practice and goals..." />
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                Submit Application <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
