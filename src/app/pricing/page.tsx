"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

const TIERS = [
  {
    name: "Essential",
    monthlyPrice: 347,
    annualPrice: 260,
    description: "Single-location operators who need 280E compliance done right",
    features: [
      "Single entity (1 license type)",
      "Up to $5M annual revenue",
      "280E + 471(c) allocation engine",
      "Cash reconciliation",
      "Metrc sync (1 location)",
      "Month-end close workflows",
      "CPA export packets (QBO format)",
      "Email support (48hr response)",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    monthlyPrice: 897,
    annualPrice: 673,
    description: "Multi-entity operators, MSOs, and CPA firms who need the full platform",
    features: [
      "Unlimited entities & license types",
      "Unlimited revenue",
      "Everything in Essential",
      "Multi-entity consolidation & eliminations",
      "Advanced audit trail with override logging",
      "CPA collaboration workspace",
      "Priority support (4hr response)",
      "QuickBooks + Xero export",
      "API access",
      "Dedicated account manager",
      "Multi-state support",
    ],
    cta: "Get Started",
    popular: true,
  },
];

const COMPARISON = [
  { feature: "280E + 471(c) Tax Engine", essential: true, premium: true },
  { feature: "Cash Reconciliation", essential: true, premium: true },
  { feature: "Metrc Sync", essential: "1 location", premium: "Unlimited" },
  { feature: "Month-End Close Workflows", essential: true, premium: true },
  { feature: "CPA Export Packets (QBO)", essential: true, premium: true },
  { feature: "Multi-Entity Consolidation", essential: false, premium: true },
  { feature: "Advanced Audit Trail", essential: false, premium: true },
  { feature: "QuickBooks + Xero Export", essential: false, premium: true },
  { feature: "API Access", essential: false, premium: true },
  { feature: "Priority Support (4hr)", essential: false, premium: true },
  { feature: "Dedicated Account Manager", essential: false, premium: true },
  { feature: "Multi-State Support", essential: false, premium: true },
];

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-brand mx-auto" />;
  if (value === false) return <span className="text-text-faint mx-auto block text-center">—</span>;
  return <span className="text-xs text-text-muted mx-auto block text-center">{value}</span>;
}

function btnClass(active: boolean) {
  const base = "px-4 py-2 text-sm font-medium rounded-full transition-all";
  return active
    ? base + " bg-brand text-white shadow-sm"
    : base + " text-text-muted hover:text-text-secondary";
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-text-primary">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Two plans. Every feature you need for cannabis financial operations.
            No hidden fees. No per-transaction charges.
          </p>

          {/* Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-surface-raised px-1.5 py-1.5">
            <button onClick={() => setAnnual(false)} className={btnClass(!annual)}>
              Monthly
            </button>
            <button onClick={() => setAnnual(true)} className={btnClass(annual)}>
              Annual
              <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + (annual ? "bg-white/20 text-white" : "bg-brand/10 text-brand")}>
                -25%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          {TIERS.map((tier) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice;
            const cardClass = tier.popular
              ? "relative rounded-2xl border-2 p-8 transition-all border-brand bg-surface-raised shadow-2xl shadow-brand/10"
              : "relative rounded-2xl border-2 p-8 transition-all border-border bg-surface";
            const ctaClass = tier.popular
              ? "block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors bg-brand text-white hover:bg-brand/90"
              : "block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors bg-surface-raised text-text-primary border border-border hover:bg-border/50";
            return (
              <div key={tier.name} className={cardClass}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-text-primary">{tier.name}</h3>
                  <p className="mt-2 text-sm text-text-muted">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-text-primary">${price}</span>
                  <span className="text-text-muted">/mo</span>
                  {annual && (
                    <div className="mt-1 text-xs text-brand font-medium">
                      Billed annually (${price * 12}/yr)
                    </div>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-5 w-5 flex-shrink-0 text-brand" />
                      <span className="text-sm text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={"/onboarding?plan=" + tier.name.toLowerCase()} className={ctaClass}>
                  {tier.cta}
                </a>
              </div>
            );
          })}
        </div>

        {/* 30-day guarantee */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-2 text-sm text-brand">
            <Check className="h-4 w-4" />
            30-day money-back guarantee — no questions asked
          </div>
        </div>

        {/* Comparison Table */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-text-primary mb-8">
            Compare Plans
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border max-w-3xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left px-4 py-3 font-semibold text-text-primary">Feature</th>
                  <th className="text-center px-4 py-3 font-semibold text-text-primary">Essential</th>
                  <th className="text-center px-4 py-3 font-semibold text-brand">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={"border-b border-border-subtle " + (i % 2 === 0 ? "bg-surface/30" : "bg-surface/10")}>
                    <td className="px-4 py-3 text-text-secondary">{row.feature}</td>
                    <td className="px-4 py-3"><CheckCell value={row.essential} /></td>
                    <td className="px-4 py-3 bg-brand/5"><CheckCell value={row.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-text-primary">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary">Can I switch plans later?</h3>
              <p className="mt-2 text-text-muted">
                Yes — upgrade or downgrade anytime. When you upgrade mid-cycle, you&apos;re prorated for the remainder. Downgrades take effect at the next billing date.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">What&apos;s the 30-day money-back guarantee?</h3>
              <p className="mt-2 text-text-muted">
                If Tranquillo Green doesn&apos;t identify meaningful tax savings or operational value within 30 days of your paid subscription, we&apos;ll refund you in full. No hoops, no hassle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Is there a free trial?</h3>
              <p className="mt-2 text-text-muted">
                We offer a guided demo with a product specialist after verifying your company information. This ensures we show you the right setup for your operation. Schedule a demo to get started.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">What counts as an &quot;entity&quot;?</h3>
              <p className="mt-2 text-text-muted">
                An entity is a distinct legal business with its own license. If you operate a dispensary and a cultivation facility under the same LLC, that&apos;s one entity. If they&apos;re separate LLCs, that&apos;s two.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Do you support my state?</h3>
              <p className="mt-2 text-text-muted">
                We support all state-legal cannabis markets. Metrc integration is available in CA, CO, MI, OR, NY, and 10+ other states. Non-Metrc states use CSV import.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Is my data secure?</h3>
              <p className="mt-2 text-text-muted">
                All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use Clerk for authentication and Convex for backend infrastructure. We never sell or share your financial data.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-8">
          <h2 className="text-2xl font-bold text-text-primary">
            Ready to stop overpaying on 280E?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
            Schedule a demo to see exactly how much you could save. Most operators cover their annual subscription cost in identified tax savings within the first month.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="/demo"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all"
            >
              Schedule a Demo
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/calculator"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all"
            >
              Calculate Savings First
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
