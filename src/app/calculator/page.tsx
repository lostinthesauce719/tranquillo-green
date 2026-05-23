"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon } from "lucide-react";

/* ─── Calculator Logic ───────────────────────────────────────────── */

interface CalcInputs {
  annualRevenue: number;
  cogsPercentage: number;
  facilityRent: number;
  inventoryLabor: number;
  shippingCosts: number;
  otherDeductible: number;
  taxRate: number;
}

interface CalcResults {
  currentCogs: number;
  optimizedCogs: number;
  additionalDeductions: number;
  currentTax: number;
  optimizedTax: number;
  annualSavings: number;
}

function calculate280ESavings(inputs: CalcInputs): CalcResults {
  const currentCogs = inputs.annualRevenue * (inputs.cogsPercentage / 100);
  const optimizedCogs =
    currentCogs +
    inputs.facilityRent * 0.45 +
    inputs.inventoryLabor * 0.55 +
    inputs.shippingCosts +
    inputs.otherDeductible;
  const additionalDeductions = optimizedCogs - currentCogs;
  const currentTax = (inputs.annualRevenue - currentCogs) * (inputs.taxRate / 100);
  const optimizedTax = (inputs.annualRevenue - optimizedCogs) * (inputs.taxRate / 100);
  const annualSavings = currentTax - optimizedTax;
  return {
    currentCogs,
    optimizedCogs,
    additionalDeductions,
    currentTax,
    optimizedTax,
    annualSavings,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ─── Slider Input ───────────────────────────────────────────────── */

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  helpText,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  helpText?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-semibold text-brand">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--brand) ${((value - min) / (max - min)) * 100}%, var(--border) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-text-faint mt-1">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
      {helpText && <p className="mt-1 text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function CalculatorPage() {
  const [annualRevenue, setAnnualRevenue] = useState(2000000);
  const [cogsPercentage, setCogsPercentage] = useState(35);
  const [facilityRent, setFacilityRent] = useState(120000);
  const [inventoryLabor, setInventoryLabor] = useState(180000);
  const [shippingCosts, setShippingCosts] = useState(24000);
  const [otherDeductible, setOtherDeductible] = useState(15000);
  const [taxRate, setTaxRate] = useState(21);
  const [showResults, setShowResults] = useState(false);

  const results = calculate280ESavings({
    annualRevenue,
    cogsPercentage,
    facilityRent,
    inventoryLabor,
    shippingCosts,
    otherDeductible,
    taxRate,
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.06), transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(212, 146, 42, 0.03), transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 lg:py-24">

        {/* ── HEADER ───────────────────────────────────── */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand backdrop-blur-sm">
            Free Tool — No Signup Required
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            280E Savings Calculator
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Most cannabis operators miss 30-60% of legitimate COGS deductions.
            See how much you could be saving — in 60 seconds.
          </p>
        </section>

        {/* ── CALCULATOR FORM ──────────────────────────── */}
        <section className="mt-12 rounded-2xl border border-border bg-surface/60 p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            Enter your numbers
          </h2>

          <div className="space-y-8">
            <SliderInput
              label="Annual Revenue"
              value={annualRevenue}
              onChange={setAnnualRevenue}
              min={100000}
              max={50000000}
              step={50000}
              prefix="$"
              helpText="Your total annual gross revenue"
            />

            <SliderInput
              label="Current COGS % of Revenue"
              value={cogsPercentage}
              onChange={setCogsPercentage}
              min={10}
              max={80}
              step={1}
              suffix="%"
              helpText="What percentage of revenue do you currently claim as COGS?"
            />

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Additional Deductible Costs (often missed)
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Under 280E + 471(c), these costs can be allocated to COGS. Most operators miss them entirely.
              </p>

              <div className="space-y-6">
                <SliderInput
                  label="Facility Rent / Lease"
                  value={facilityRent}
                  onChange={setFacilityRent}
                  min={0}
                  max={1000000}
                  step={5000}
                  prefix="$"
                  helpText="~45% of facility rent is typically allocable to COGS"
                />

                <SliderInput
                  label="Inventory-Related Labor"
                  value={inventoryLabor}
                  onChange={setInventoryLabor}
                  min={0}
                  max={2000000}
                  step={5000}
                  prefix="$"
                  helpText="~55% of labor touching inventory is allocable to COGS"
                />

                <SliderInput
                  label="Shipping & Freight (Inbound)"
                  value={shippingCosts}
                  onChange={setShippingCosts}
                  min={0}
                  max={500000}
                  step={1000}
                  prefix="$"
                  helpText="100% of inbound shipping is typically deductible"
                />

                <SliderInput
                  label="Other Deductible Costs"
                  value={otherDeductible}
                  onChange={setOtherDeductible}
                  min={0}
                  max={500000}
                  step={1000}
                  prefix="$"
                  helpText="Packaging, supplies, equipment depreciation, etc."
                />
              </div>
            </div>

            <SliderInput
              label="Effective Federal Tax Rate"
              value={taxRate}
              onChange={setTaxRate}
              min={15}
              max={37}
              step={1}
              suffix="%"
              helpText="Combined federal rate (21% corporate + state considerations)"
            />
          </div>

          <button
            onClick={() => setShowResults(true)}
            className="mt-8 w-full inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"
          >
            Calculate My Savings
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* ── RESULTS ───────────────────────────────────── */}
        {showResults && (
          <section className="mt-12 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Your Estimated 280E Savings
            </h2>

            {/* Big number */}
            <div className="text-center p-8 rounded-xl border border-brand/20 bg-surface/60">
              <div className="text-sm font-medium text-text-muted uppercase tracking-wider">
                Potential Annual Tax Savings
              </div>
              <div className="mt-3 text-5xl font-bold text-brand sm:text-6xl">
                {formatCurrency(results.annualSavings)}
              </div>
              <div className="mt-3 text-sm text-text-muted">
                Based on {formatCurrency(results.additionalDeductions)} in additional COGS deductions
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface/40 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Current Situation
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">COGS Deductions</span>
                    <span className="font-medium text-text-primary">{formatCurrency(results.currentCogs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Est. Federal Tax</span>
                    <span className="font-medium text-danger">{formatCurrency(results.currentTax)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brand/20 bg-surface/40 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand mb-3">
                  With Tranquillo Green
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">COGS Deductions</span>
                    <span className="font-medium text-text-primary">{formatCurrency(results.optimizedCogs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Est. Federal Tax</span>
                    <span className="font-medium text-success">{formatCurrency(results.optimizedTax)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 rounded-lg border border-border bg-surface/30 p-4">
              <p className="text-xs text-text-muted leading-relaxed">
                <strong className="text-text-secondary">Disclaimer:</strong> This calculator provides estimates based on simplified assumptions.
                Actual savings depend on your specific circumstances, state tax rules, and IRS examination risk.
                Consult a cannabis-specialized CPA for definitive advice. Tranquillo Green helps you document and defend every deduction.
              </p>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────── */}
        <section className="mt-12 rounded-2xl border border-border bg-surface-raised p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Ready to capture these savings?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
            Tranquillo Green automates the entire 280E allocation process — from COGS calculation
            to audit-ready documentation. Start your free trial and see the full picture.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-brand/30 hover:text-brand"
            >
              Talk to Sales
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><CheckIcon className="h-3.5 w-3.5 text-brand" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckIcon className="h-3.5 w-3.5 text-brand" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckIcon className="h-3.5 w-3.5 text-brand" /> Cancel anytime</span>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            How Tranquillo Captures These Deductions
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect Your Data",
                desc: "Link your POS, Metrc, and bank accounts. Import historical data via CSV if needed.",
              },
              {
                step: "02",
                title: "Automated Allocation",
                desc: "Our 280E engine categorizes every expense — rent, labor, shipping, supplies — into deductible vs. nondeductible.",
              },
              {
                step: "03",
                title: "Audit-Ready Documentation",
                desc: "Every allocation is documented with full rationale. Export CPA-ready workpapers in one click.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-surface/40 p-6 text-center">
                <div className="text-3xl font-bold text-brand/30">{item.step}</div>
                <h3 className="mt-3 text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="mt-20">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-text-faint">
            <Link href="/" className="hover:text-text-muted transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-text-muted transition-colors">Pricing</Link>
            <Link href="/partner" className="hover:text-text-muted transition-colors">CPA Partners</Link>
            <Link href="/contact" className="hover:text-text-muted transition-colors">Contact</Link>
          </div>
          <p className="mt-6 text-center text-xs text-text-faint">
            Tranquillo Green — Cannabis Financial Operations Platform
          </p>
        </footer>
      </div>
    </main>
  );
}
