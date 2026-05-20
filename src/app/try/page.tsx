import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Play, Check, Clock, Shield, Zap, BarChart3, FileCheck, Calculator, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Try Tranquillo Green Free | 14-Day Demo Sandbox",
  description: "Get instant access to a fully-loaded demo sandbox. Explore 280E allocations, Metrc reconciliation, multi-entity accounting — no credit card required.",
  openGraph: {
    title: "Try Tranquillo Green Free | Demo Sandbox",
    description: "Instant access to a pre-loaded demo. Guided walkthrough included. No credit card.",
    type: "website",
  },
};

const features = [
  { icon: <BarChart3 className="w-5 h-5" />, title: "280E COGS Allocation", desc: "See automated allocation across facility rent, labor, shipping, and more" },
  { icon: <FileCheck className="w-5 h-5" />, title: "Metrc Reconciliation", desc: "Pre-loaded with sample Metrc data — watch variance detection in action" },
  { icon: <Calculator className="w-5 h-5" />, title: "471(c) Election", desc: "Explore the inventory capitalization impact on your tax bill" },
  { icon: <Zap className="w-5 h-5" />, title: "Month-End Close", desc: "Walk through a full close workflow from bank rec to financial statements" },
  { icon: <Users className="w-5 h-5" />, title: "Multi-Entity", desc: "Switch between cultivation, manufacturing, and retail entities" },
  { icon: <Shield className="w-5 h-5" />, title: "Audit Trail", desc: "Every action documented for IRS defense — see the full paper trail" },
];

const steps = [
  { num: "1", title: "Sign Up", desc: "Create a free account — takes 30 seconds" },
  { num: "2", title: "Instant Access", desc: "Sandbox is pre-loaded with 100+ transactions, 3 locations, 6 months of data" },
  { num: "3", title: "Guided Tour", desc: "Follow the interactive walkthrough — we'll show you every feature" },
  { num: "4", title: "Go Live", desc: "When you're ready, import your own data and go production" },
];

export default function TryPage() {
  return (
    <main className="min-h-screen bg-surface-mid">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
          <Play className="w-4 h-4" />
          Free Demo — No Credit Card
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Try Tranquillo Green.<br />No strings attached.
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
          Get instant access to a fully-loaded demo sandbox with pre-populated data. Follow the guided walkthrough to see every feature. Free for 14 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg">
            Start Your Free Demo <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-border hover:border-emerald-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Schedule a Live Demo Instead
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-text-muted">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400" /> 14-day access</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Full features</span>
        </div>
      </section>

      {/* What's Inside */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">What's Inside Your Demo</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-surface-light rounded-xl border border-border p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                <p className="text-text-muted text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-400 font-bold">{s.num}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{s.title}</h3>
              <p className="text-text-muted text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Data Preview */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-surface-light rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Pre-Loaded Demo Data</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-400">Green Cross</div>
              <div className="text-text-muted text-sm mt-1">Dispensary, Denver CO</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">100+</div>
              <div className="text-text-muted text-sm mt-1">Sample Transactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">6 Months</div>
              <div className="text-text-muted text-sm mt-1">Of Historical Data</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-text-muted">
            {["3 locations", "2 entities", "12 chart accounts", "Metrc packages", "POS transactions", "Payroll entries", "Bank reconciliations", "280E allocations"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 bg-surface-mid rounded-lg px-3 py-2">
                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Explore?</h2>
          <p className="text-text-muted mb-6 max-w-xl mx-auto">
            Your sandbox is waiting. Sign up, and you'll be walking through the product in under 2 minutes.
          </p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg">
            Start Your Free Demo <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-text-muted text-xs mt-4">Free for 14 days • No credit card • Full access • Guided walkthrough</p>
        </div>
      </section>
    </main>
  );
}
