"use client";

import { useState } from "react";
import { Check, Star, Zap, Building2, Crown } from "lucide-react";

type BillingCycle = "monthly" | "annually";

const TIERS = [
  {
    id: "dispensary",
    name: "Dispensary",
    icon: Zap,
    description: "Single-location dispensaries getting started with 280E compliance",
    priceMonthly: 497,
    annualDiscount: 0.15,
    features: [
      "280E + 471(c) allocation engine",
      "Metrc integration (coming Q3 2026)",
      "Cash reconciliation workspaces",
      "CPA export packets",
      "Compliance deadline tracking",
      "AI assistant",
      "Email support",
    ],
    popular: false,
    stripePriceId: "price_dispensary",
  },
  {
    id: "cultivator",
    name: "Cultivator",
    icon: Star,
    description: "Multi-entity operators scaling across licenses and locations",
    priceMonthly: 697,
    annualDiscount: 0.15,
    features: [
      "Everything in Dispensary",
      "Payroll & labor allocation (280E)",
      "Cultivation-specific compliance",
      "Batch COGS allocation",
      "Inventory variance detection",
      "Metrc plant tracking sync",
      "Priority support",
    ],
    popular: true,
    stripePriceId: "price_cultivator",
  },
  {
    id: "manufacturer",
    name: "Manufacturer",
    icon: Building2,
    description: "Manufacturers with complex multi-product operations",
    priceMonthly: 897,
    annualDiscount: 0.15,
    features: [
      "Everything in Cultivator",
      "GMP audit readiness",
      "Lab certificate tracking",
      "Batch-level cost tracing",
      "Manufacturing overhead allocation",
      "Dedicated account manager",
      "Phone + email support",
    ],
    popular: false,
    stripePriceId: "price_manufacturer",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Crown,
    description: "MSOs with complex multi-state operations",
    priceMonthly: 1497,
    annualDiscount: 0.20,
    features: [
      "Everything in Manufacturer",
      "Unlimited entities & locations",
      "Consolidated financial reporting",
      "Custom integration development",
      "SLA guarantees",
      "On-site training",
      "White-label options",
    ],
    popular: false,
    stripePriceId: "price_enterprise",
  },
];

export function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annually");
  const [loading, setLoading] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  function calculatePrice(monthly: number, discount: number): number {
    if (billingCycle === "annually") {
      return Math.round(monthly * 12 * (1 - discount));
    }
    return monthly * 12;
  }

  async function handleSubscribe(tierId: string, _priceId: string) {
    setLoading(tierId);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Could not start checkout.");

      if (data.kind === "redirect" && data.url) {
        window.location.href = data.url;
        return;
      }
      // Invoice rail: no redirect, so confirm in place with the reference.
      setBillingMessage(data.message ?? "Request received — we'll be in touch.");
    } catch (error: any) {
      setBillingMessage(error.message || "Could not start checkout.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {billingMessage && (
        <div className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-text-secondary">
          {billingMessage}
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${billingCycle === "monthly" ? "text-text-primary font-medium" : "text-text-muted"}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
          className={`relative h-7 w-12 rounded-full transition ${billingCycle === "annually" ? "bg-brand" : "bg-surface-raised"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              billingCycle === "annually" ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-sm ${billingCycle === "annually" ? "text-text-primary font-medium" : "text-text-muted"}`}>
          Annually
        </span>
        {billingCycle === "annually" && (
          <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
            Save up to 20%
          </span>
        )}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const annualPrice = calculatePrice(tier.priceMonthly, tier.annualDiscount);
          const monthlyEquivalent = Math.round(annualPrice / 12);

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                tier.popular
                  ? "border-brand bg-brand/5 shadow-lg shadow-brand/10"
                  : "border-border bg-surface"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  tier.popular ? "bg-brand/20 text-brand" : "bg-surface-raised text-text-muted"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{tier.name}</h3>
                </div>
              </div>

              <p className="mt-3 text-sm text-text-muted flex-1">{tier.description}</p>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary">
                    ${billingCycle === "annually" ? monthlyEquivalent : tier.priceMonthly}
                  </span>
                  <span className="text-text-muted">/mo</span>
                </div>
                {billingCycle === "annually" && (
                  <div className="mt-1 text-xs text-text-muted">
                    ${annualPrice}/year (save {Math.round(tier.annualDiscount * 100)}%)
                  </div>
                )}
              </div>

              <ul className="mt-4 space-y-2 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.id, tier.stripePriceId)}
                disabled={loading === tier.id}
                className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  tier.popular
                    ? "bg-brand text-white hover:bg-brand/90"
                    : "border border-border bg-surface text-text-primary hover:bg-surface-raised"
                }`}
              >
                {loading === tier.id ? "Loading…" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">Frequently Asked Questions</h3>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-text-primary">Can I change plans later?</div>
            <p className="mt-1 text-sm text-text-muted">
              Yes — upgrade or downgrade anytime. Changes take effect at the start of your next billing cycle.
            </p>
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">What payment methods do you accept?</div>
            <p className="mt-1 text-sm text-text-muted">
              Invoice with ACH or wire transfer. Card payment is available where our processor supports your license type — ask us and we'll confirm for your state.
            </p>
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">Is there a free trial?</div>
            <p className="mt-1 text-sm text-text-muted">
              All plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
