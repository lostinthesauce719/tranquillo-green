"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon, Calculator } from "lucide-react";

/* ─── UTM Parser ────────────────────────────────────────────────── */

function getUTM(): { source: string; medium: string; campaign: string } {
  if (typeof window === "undefined") return { source: "direct", medium: "none", campaign: "none" };
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || "direct",
    medium: params.get("utm_medium") || "none",
    campaign: params.get("utm_campaign") || "none",
  };
}

/* ─── Google Ads Landing Page ───────────────────────────────────── */

export default function GoogleAdsLanding() {
  const [utm, setUTM] = useState({ source: "direct", medium: "none", campaign: "none" });
  const [revenue, setRevenue] = useState(2000000);
  const [cogsPct, setCogsPct] = useState(35);
  const [rent, setRent] = useState(120000);
  const [labor, setLabor] = useState(180000);

  useEffect(() => {
    setUTM(getUTM());
  }, []);

  const currentCogs = revenue * (cogsPct / 100);
  const optimizedCogs = currentCogs + rent * 0.45 + labor * 0.55;
  const additionalDeductions = optimizedCogs - currentCogs;
  const taxSavings = additionalDeductions * 0.308;
  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const isGoogle = utm.source === "google";
  const isLinkedIn = utm.source === "linkedin";
  const isReddit = utm.source === "reddit";

  // Customize headline based on source
  const headline = isGoogle
    ? "Stop Overpaying on 280E"
    : isLinkedIn
    ? "Your 280E Allocations Shouldn't Take 16 Hours/Month"
    : isReddit
    ? "Most Cannabis Operators Overpay $75K+ in Federal Taxes"
    : "Stop Overpaying on 280E";

  const subhead = isGoogle
    ? "Find your missed deductions in 60 seconds — no email required"
    : isLinkedIn
    ? "Automate 280E COGS allocation and reclaim your team's time"
    : isReddit
    ? "We built a free calculator to estimate your potential savings"
    : "Most operators leave $75K+ on the table every year";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.08), transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 lg:py-16">

        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent backdrop-blur-sm mb-6">
            <Calculator className="h-3 w-3" />
            Free 280E Savings Calculator
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {headline.split(" ").map((word, i) => (
              <span key={i}>{i === 0 || (isGoogle && i === 2) || (isLinkedIn && i === 1) ? <span className="text-accent">{word} </span> : <span>{word} </span>}</span>
            ))}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">{subhead}</p>
        </section>

        {/* Calculator */}
        <section className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-surface p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-5">Estimate Your Savings</h3>
            <div className="space-y-5">
              {[
                { label: "Annual Revenue", value: revenue, set: setRevenue, min: 500000, max: 50000000, step: 100000, prefix: "$" },
                { label: "Current COGS %", value: cogsPct, set: setCogsPct, min: 15, max: 60, step: 1, suffix: "%" },
                { label: "Annual Facility Rent", value: rent, set: setRent, min: 0, max: 1000000, step: 10000, prefix: "$" },
                { label: "Inventory Labor", value: labor, set: setLabor, min: 0, max: 2000000, step: 10000, prefix: "$" },
              ].map((field) => (
                <div key={field.label}>
                  <div className="flex items-baseline justify-between">
                    <label className="text-sm font-medium text-text-primary">{field.label}</label>
                    <span className="text-sm font-semibold text-brand">{field.prefix || ""}{field.value.toLocaleString()}{field.suffix || ""}</span>
                  </div>
                  <input type="range" min={field.min} max={field.max} step={field.step} value={field.value} onChange={(e) => field.set(Number(e.target.value))}
                    className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, var(--brand) ${((field.value - field.min) / (field.max - field.min)) * 100}%, var(--border) ${((field.value - field.min) / (field.max - field.min)) * 100}%)` }} />
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-brand/20 bg-surface-raised p-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Estimated Annual Tax Savings</div>
              <div className="mt-2 text-4xl font-bold text-brand">{fmt(taxSavings)}</div>
              <div className="mt-2 text-sm text-text-muted">from {fmt(additionalDeductions)} in additional COGS deductions</div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Why Operators Switch</h3>
              <ul className="space-y-3">
                {[
                  "Automated 280E + 471(c) COGS allocation",
                  "Metrc-integrated inventory reconciliation",
                  "Multi-entity consolidation",
                  "CPA-ready audit packets",
                  "Month-end close in days, not weeks",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">CPA Firms</div>
              <p className="text-sm text-text-secondary">Serve 3x more clients with multi-client tools, white-label exports, and 20% revenue share.</p>
            </div>

            <Link href="/demo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all">
              Schedule a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-text-muted text-center">30-day money-back guarantee · No long-term contracts</p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { quote: "Found $94K in missed deductions from prior year.", author: "Marcus Whitfield", title: "CFO, Michigan" },
            { quote: "16 hours/month → under 30 minutes on allocations.", author: "Tomoko Arakawa", title: "Controller, Oregon" },
            { quote: "3 weeks → 4 days for month-end close.", author: "Priya Chandrasekaran", title: "DOF, Michigan" },
          ].map((t) => (
            <div key={t.author} className="rounded-xl border border-border bg-surface/40 p-4">
              <p className="text-sm text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-2 text-xs text-text-muted">{t.author}, {t.title}</div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent mb-6" />
          <p className="text-xs text-text-faint">Tranquillo Green — Cannabis Financial Operations Platform</p>
        </footer>
      </div>
    </main>
  );
}
