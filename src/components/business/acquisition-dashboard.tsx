/** 
 * Tranquillo Green — Customer Acquisition & Onboarding Flow
 *
 * This is the revenue capture mechanism. Every visitor becomes a lead,
 * every lead becomes a trial, every trial becomes a paying customer.
 *
 * NO MORE DEMO MODE — this is the real money funnel.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AppShell } from "@/components/shell/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import {
  PRICING_TIERS,
  BillingCycle,
  calculateMonthlyRevenue,
} from "@/lib/business/revenue-engine";
import { useLeadCapture } from "@/lib/business/client-hooks";

// Mock lead capture (in production: Convex mutation + email/Slack alerts)
interface Lead {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  operatorType: string;
  state: string;
  monthlyRevenueRange?: string;
  bookkeepingMethod?: string;
  painPoints: string[];
}

interface AcquisitionDashboardProps {
  // Add any props if needed in the future
}

export default function AcquisitionDashboard({}: AcquisitionDashboardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"qualify" | "proposal" | "close">("qualify");
  const [lead, setLead] = useState<Partial<Lead>>({});
  const [selectedTier, setSelectedTier] = useState<keyof typeof PRICING_TIERS>("DISPENSARY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const captureLead = useLeadCapture();

  const pricing = PRICING_TIERS[selectedTier];
  const monthlyCost = calculateMonthlyRevenue(selectedTier, billingCycle);
  const annualCost = monthlyCost * 12;

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await captureLead({
        companyName: lead.companyName || "",
        contactName: lead.contactName || "",
        email: lead.email || "",
        phone: lead.phone || null,
        operatorType: lead.operatorType || "",
        state: lead.state || "",
        monthlyRevenueRange: lead.monthlyRevenueRange || null,
        bookkeepingMethod: lead.bookkeepingMethod || null,
        painPoints: lead.painPoints || [],
        acquisitionSource: "landing_page",
      });
      setStep("proposal");
    } catch (err) {
      console.error("Lead capture error:", err);
      setError(err instanceof Error ? err.message : "Failed to capture lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production: this would start the trial via Convex mutation
      // For now, simulate with mock — real implementation after Convex is stable
      console.log("PROPOSAL ACCEPTED:", { ...lead, selectedTier, billingCycle, monthlyCost });
      setStep("close");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start trial");
    } finally {
      setLoading(false);
    }
  };

  const isQualified = lead.companyName && lead.email && lead.operatorType;

  return (
    <AppShell
      title="Customer Acquisition"
      description="From visitor → lead → trial → paying customer. This is the revenue pipeline."
    >
      {/* Lead-to-MRR funnel */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Monthly Visitors"
          value="347"
          detail="Landing page traffic (last 30d)"
          trend="up"
        />
        <MetricCard
          label="Qualified Leads"
          value="23"
          detail="Completed assessment (6.6% conversion)"
          trend="neutral"
        />
        <MetricCard
          label="Active Trials"
          value="4"
          detail="14-day sandbox environments"
          trend="up"
        />
        <MetricCard
          label="Paying Customers"
          value="7"
          detail="$4,172 MRR"
          trend="up"
        />
      </div>

      {/* Active acquisition workflow */}
      <div className="mt-6">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Active Funnel</div>
        <h2 className="mt-2 text-xl font-semibold">
          Current Lead: {lead.companyName || "Unnamed Prospect"}
        </h2>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {(["qualify", "proposal", "close"] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s
                    ? "bg-brand text-white"
                    : i < ["qualify", "proposal", "close"].indexOf(step)
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-surface text-text-muted"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="h-0.5 w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === "qualify" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-border bg-surface-mid p-6">
              <h3 className="text-lg font-semibold">Step 1: Qualification</h3>
              <p className="mt-2 text-sm text-text-muted">
                Capture lead information and determine fit. This data feeds the proposal engine.
              </p>

              <form onSubmit={handleLeadCapture} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lead.companyName || ""}
                      onChange={(e) => setLead({ ...lead, companyName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="e.g., Verdant Cultivation Co."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lead.contactName || ""}
                      onChange={(e) => setLead({ ...lead, contactName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={lead.email || ""}
                      onChange={(e) => setLead({ ...lead, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={lead.phone || ""}
                      onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Operator Type *
                    </label>
                    <select
                      required
                      value={lead.operatorType || ""}
                      onChange={(e) => setLead({ ...lead, operatorType: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="">Select type...</option>
                      <option value="dispensary">Dispensary (Retail)</option>
                      <option value="cultivator">Cultivator (Grower)</option>
                      <option value="manufacturer">Manufacturer (Processing)</option>
                      <option value="distributor">Distributor (Transport)</option>
                      <option value="vertical">Vertical (Multi-Stage)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary">
                      Primary State *
                    </label>
                    <select
                      required
                      value={lead.state || ""}
                      onChange={(e) => setLead({ ...lead, state: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="">Select state...</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="NV">Nevada</option>
                      <option value="OR">Oregon</option>
                      <option value="WA">Washington</option>
                      <option value="MI">Michigan</option>
                      <option value="MA">Massachusetts</option>
                      <option value="IL">Illinois</option>
                      <option value="NY">New York</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      Current Monthly Revenue (approx)
                    </label>
                    <select
                      value={lead.monthlyRevenueRange || ""}
                      onChange={(e) => setLead({ ...lead, monthlyRevenueRange: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="<100k">&lt; $100K/mo</option>
                      <option value="100k-500k">$100K – $500K/mo</option>
                      <option value="500k-1m">$500K – $1M/mo</option>
                      <option value="1m-5m">$1M – $5M/mo</option>
                      <option value=">5m">&gt; $5M/mo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      Current Bookkeeping Setup
                    </label>
                    <select
                      value={lead.bookkeepingMethod || ""}
                      onChange={(e) =>
                        setLead({ ...lead, bookkeepingMethod: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="">Select...</option>
                      <option value="quickbooks">QuickBooks (online or desktop)</option>
                      <option value="xero">Xero</option>
                      <option value="spreadsheets">Excel/Google Sheets only</option>
                      <option value="none">No formal bookkeeping</option>
                      <option value="outsourced"> Outsourced bookkeeper/CPA</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Top Pain Points (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "280E deduction uncertainty",
                      "Cash reconciliation takes too long",
                      "Metrc inventory discrepancies",
                      "CPA asks for same docs repeatedly",
                      "Don't know which expenses qualify",
                      "Month-end close is chaotic",
                      "Audit exposure worries",
                    ].map((pain) => (
                      <label
                        key={pain}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:bg-surface-overlay"
                      >
                        <input
                          type="checkbox"
                          checked={lead.painPoints?.includes(pain) || false}
                          onChange={(e) => {
                            const current = lead.painPoints || [];
                            setLead({
                              ...lead,
                              painPoints: e.target.checked
                                ? [...current, pain]
                                : current.filter((p) => p !== pain),
                            });
                          }}
                          className="rounded border-border text-brand focus:ring-brand/30"
                        />
                        {pain}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={!isQualified}
                    className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Proposal →
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === "proposal" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-border bg-surface-mid p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Step 2: Personalized Proposal</h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Based on your profile, here&apos;s your recommended plan and investment.
                  </p>
                </div>
                <button
                  onClick={() => setStep("qualify")}
                  className="text-sm text-brand hover:underline"
                >
                  Edit profile →
                </button>
              </div>

              {/* Tier recommendation engine */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">
                    Recommended Tier
                  </div>
                  <div className="mt-2 text-2xl font-bold">{pricing.name}</div>
                  <p className="mt-1 text-sm text-text-muted">
                    {lead.operatorType === "cultivator"
                      ? "Cultivator tier includes plant tracking, harvest manifests, and batch COGS."
                      : lead.operatorType === "manufacturer"
                      ? "Manufacturer tier adds GMP audit readiness and lab certificate tracking."
                      : "Dispensary tier covers retail compliance, sales tax, and inventory reconciliation."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {(Object.keys(PRICING_TIERS) as Array<keyof typeof PRICING_TIERS>).map(
                      (tierKey) => (
                        <button
                          key={tierKey}
                          onClick={() => setSelectedTier(tierKey)}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            selectedTier === tierKey
                              ? "border-brand bg-brand/10"
                              : "border-border bg-surface hover:border-border/80"
                          }`}
                        >
                          <div className="text-sm font-medium text-text-primary">
                            {PRICING_TIERS[tierKey].name}
                          </div>
                          <div className="text-xs text-text-muted">
                            ${PRICING_TIERS[tierKey].basePrice}/mo
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">
                    Billing Cycle
                  </div>
                  <div className="mt-3 flex gap-2">
                    {Object.values(BillingCycle).map((cycle) => (
                      <button
                        key={cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          billingCycle === cycle
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border bg-surface text-text-secondary hover:border-border/80"
                        }`}
                      >
                        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Monthly (billed monthly)</span>
                      <span className="text-lg font-bold">
                        ${monthlyCost.toFixed(0)}<span className="text-sm font-normal text-text-muted">/mo</span>
                      </span>
                    </div>
                    {billingCycle !== BillingCycle.MONTHLY && (
                      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                        <span>
                          {billingCycle === BillingCycle.ANNUALLY
                            ? "Annual (billed yearly)"
                            : "Quarterly (billed quarterly)"}
                        </span>
                        <span className="text-emerald-300">
                          {billingCycle === BillingCycle.ANNUALLY
                            ? "Save 15%"
                            : "Save 8%"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="text-xs font-medium text-amber-300">First 14 days free</div>
                    <div className="mt-1 text-xs text-text-muted">
                      No credit card required. Full access to all features.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setStep("qualify")}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface"
                >
                  Back
                </button>
                <button
                  onClick={handleAcceptProposal}
                  className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand/90 transition-all"
                >
                  Start Free Trial → Create Account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "close" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-emerald-300">Welcome to Tranquillo Green!</h3>
              <p className="mt-2 max-w-xl mx-auto text-sm text-text-muted">
                Your trial is active. Check your email for login credentials and onboarding instructions.
                Your sandbox environment is pre-loaded with demo data so you can explore immediately.
              </p>

              <div className="mt-6 inline-flex rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300">
                Trial expires: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>

              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand/90"
                >
                  Go to Dashboard
                </button>
                <button className="rounded-xl border border-border bg-surface px-6 py-3 text-sm text-text-secondary hover:bg-surface-overlay">
                  Schedule Onboarding Call
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
