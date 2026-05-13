import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Dispensary",
    price: 497,
    period: "/mo",
    description: "Single-location dispensaries getting started with cannabis financial operations",
    features: [
      "Single entity (1 license type)",
      "Up to $2M annual revenue",
      "280E + 471(c) allocation engine",
      "Cash reconciliation",
      "Metrc sync (1 location)",
      "Month-end close workflows",
      "CPA export packets",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Cultivator",
    price: 697,
    period: "/mo",
    description: "Multi-entity operators scaling across licenses and locations",
    features: [
      "Multiple entities & license types",
      "Up to $10M annual revenue",
      "Everything in Dispensary",
      "Multi-entity consolidation",
      "Advanced audit trail",
      "CPA collaboration workspace",
      "Priority support",
      "QuickBooks export",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 1497,
    period: "/mo",
    description: "MSOs with complex multi-state operations and dedicated needs",
    features: [
      "Unlimited entities & licenses",
      "Unlimited revenue",
      "Everything in Cultivator",
      "API access",
      "Custom reporting",
      "Dedicated account manager",
      "SLA guarantees",
      "Multi-state support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const CPA_TIER = {
  name: "CPA Firm",
  price: 199,
  period: "/mo",
  description: "For cannabis CPA firms serving multiple operator clients",
  features: [
    "Cover up to 10 client entities",
    "Full 280E + 471(c) engine for all clients",
    "White-labeled client reports",
    "Bulk client management dashboard",
    "Client onboarding workflow",
    "Compliance monitoring across book",
    "Priority support",
  ],
  cta: "Get CPA Access",
};

export const metadata = {
  title: "Pricing — Tranquillo Green",
  description: "Simple, transparent pricing for cannabis financial operations. From single-location dispensaries to multi-state operators.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-text-primary">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            From automated tax compliance to multi-entity consolidation.
            Every plan includes the full financial operations platform.
          </p>
        </div>
      </div>

      {/* CPA Firm Banner */}
      <div className="border-b border-accent/20 bg-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-xl font-semibold text-accent">
                Are you a cannabis CPA?
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Serve your clients better with our $199/mo CPA Firm plan — covers up to 10 client entities.
              </p>
            </div>
            <a
              href="/contact?type=cpa"
              className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border-2 p-8 transition-all ${
                tier.popular
                  ? "border-brand bg-surface-raised shadow-2xl shadow-brand/10 scale-105"
                  : "border-border bg-surface"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-text-primary">{tier.name}</h3>
                <p className="mt-2 text-sm text-text-muted h-12">{tier.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-text-primary">
                  ${tier.price}
                </span>
                <span className="text-text-muted">{tier.period}</span>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 text-brand" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.price === 1497 ? "/contact" : "/onboarding"}
                className={`block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors ${
                  tier.popular
                    ? "bg-brand text-white hover:bg-brand/90"
                    : "bg-surface-raised text-text-primary border border-border hover:bg-border/50"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* CPA Tier */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-accent">
            For Cannabis CPA Firms
          </h2>
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-surface p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">{CPA_TIER.name}</h3>
                <p className="mt-2 text-sm text-text-muted h-12">{CPA_TIER.description}</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-accent">${CPA_TIER.price}</span>
                <span className="text-text-muted">{CPA_TIER.period}</span>
              </div>
            </div>

            <ul className="mb-8 grid gap-3 sm:grid-cols-2">
              {CPA_TIER.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-5 w-5 flex-shrink-0 text-accent" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/contact?type=cpa"
              className="block w-full rounded-lg bg-accent px-6 py-4 text-center font-semibold text-white transition-colors hover:bg-accent/90"
            >
              {CPA_TIER.cta}
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-text-primary">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary">
                What&apos;s included in the free trial?
              </h3>
              <p className="mt-2 text-text-muted">
                All plans come with a 14-day free trial. No credit card required.
                You&apos;ll get full access to all features in that tier — including
                the 280E allocation engine, cash reconciliation, and CPA exports.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Can I change plans later?
              </h3>
              <p className="mt-2 text-text-muted">
                Yes — upgrade, downgrade, or cancel anytime. Your billing adjusts
                immediately. If you upgrade mid-month, you&apos;ll be prorated for
                the remainder of the billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                What&apos;s the difference between Dispensary and Cultivator?
              </h3>
              <p className="mt-2 text-text-muted">
                Dispensary is for single-location operators under $2M revenue.
                Cultivator adds multi-entity consolidation, advanced audit trail,
                CPA collaboration tools, and priority support for growing operations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Do you offer custom enterprise contracts?
              </h3>
              <p className="mt-2 text-text-muted">
                Yes. Enterprise customers get API access, custom reporting,
                dedicated account management, and SLA guarantees. Contact us to
                discuss multi-state and MSO requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
