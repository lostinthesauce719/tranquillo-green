"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── Icons ─────────────────────────────────────────────────────── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="3.5 8 6.5 11 12.5 5" />
    </svg>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="6" y="4" width="12" height="6" rx="1" />
      <circle cx="8" cy="14" r="1" /><circle cx="12" cy="14" r="1" /><circle cx="16" cy="14" r="1" />
      <circle cx="8" cy="18" r="1" /><circle cx="12" cy="18" r="1" />
    </svg>
  );
}

/* ─── Inline 280E Calculator ─────────────────────────────────────── */

function InlineCalculator() {
  const [revenue, setRevenue] = useState(2000000);
  const [cogsPct, setCogsPct] = useState(35);
  const [rent, setRent] = useState(120000);
  const [labor, setLabor] = useState(180000);

  const currentCogs = revenue * (cogsPct / 100);
  const optimizedCogs = currentCogs + rent * 0.45 + labor * 0.55;
  const additionalDeductions = optimizedCogs - currentCogs;
  const taxSavings = additionalDeductions * 0.308; // ~30.8% effective rate

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-surface p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
          <CalculatorIcon className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">280E Savings Calculator</h3>
          <p className="text-xs text-text-muted">See how much you could save — no email required</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-text-primary">Annual Revenue</label>
            <span className="text-sm font-semibold text-brand">{fmt(revenue)}</span>
          </div>
          <input type="range" min={500000} max={50000000} step={100000} value={revenue} onChange={(e) => setRevenue(Number(e.target.value))}
            className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--brand) ${((revenue - 500000) / 49500000) * 100}%, var(--border) ${((revenue - 500000) / 49500000) * 100}%)` }} />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-text-primary">Current COGS %</label>
            <span className="text-sm font-semibold text-brand">{cogsPct}%</span>
          </div>
          <input type="range" min={15} max={60} step={1} value={cogsPct} onChange={(e) => setCogsPct(Number(e.target.value))}
            className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--brand) ${((cogsPct - 15) / 45) * 100}%, var(--border) ${((cogsPct - 15) / 45) * 100}%)` }} />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-text-primary">Annual Facility Rent</label>
            <span className="text-sm font-semibold text-brand">{fmt(rent)}</span>
          </div>
          <input type="range" min={0} max={1000000} step={10000} value={rent} onChange={(e) => setRent(Number(e.target.value))}
            className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--brand) ${(rent / 1000000) * 100}%, var(--border) ${(rent / 1000000) * 100}%)` }} />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-text-primary">Inventory-Related Labor</label>
            <span className="text-sm font-semibold text-brand">{fmt(labor)}</span>
          </div>
          <input type="range" min={0} max={2000000} step={10000} value={labor} onChange={(e) => setLabor(Number(e.target.value))}
            className="mt-2 w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, var(--brand) ${(labor / 2000000) * 100}%, var(--border) ${(labor / 2000000) * 100}%)` }} />
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 rounded-xl border border-brand/20 bg-surface-raised p-5">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Estimated Annual Tax Savings</div>
          <div className="mt-2 text-4xl font-bold text-brand sm:text-5xl">{fmt(taxSavings)}</div>
          <div className="mt-2 text-sm text-text-muted">
            from {fmt(additionalDeductions)} in additional COGS deductions
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="text-xs text-text-faint">Current COGS</div>
            <div className="text-sm font-semibold text-text-secondary">{fmt(currentCogs)}</div>
          </div>
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
            <div className="text-xs text-text-faint">Optimized COGS</div>
            <div className="text-sm font-semibold text-brand">{fmt(optimizedCogs)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/demo"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md">
          Schedule a Demo <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/pricing"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-brand/30 hover:text-brand">
          View Pricing
        </Link>
      </div>
    </div>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────── */

const testimonials = [
  {
    quote: "We were doing 280E allocations in spreadsheets — 16 hours every month. Tranquillo cut that to under 30 minutes and found $94K in deductions we'd been missing on rent and labor allocation alone.",
    author: "Marcus Whitfield",
    title: "CFO, Greenleaf Dispensaries — Michigan",
    stat: "$94K found",
  },
  {
    quote: "Our cultivator client was claiming 28% COGS. After running their data through Tranquillo, we identified 41% — a $210K difference in deductible expenses.",
    author: "Tomoko Arakawa",
    title: "Controller, Cascade Grow Co. — Oregon",
    stat: "$210K difference",
  },
  {
    quote: "We switched from Flourish + QuickBooks to Tranquillo for our multi-state operation. The Metrc reconciliation alone saves us 10 hours a week across 4 states.",
    author: "Derek Okafor",
    title: "VP Finance, Standard Wellness — Ohio & Arizona",
    stat: "10 hrs/week saved",
  },
];

/* ─── Page ──────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(212, 146, 42, 0.04), transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 lg:py-24">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Cannabis Financial Operations Platform
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Stop Overpaying on{" "}
            <span className="text-accent">280E.</span>
          </h1>
          <p className="mt-4 text-2xl font-bold leading-tight text-brand sm:text-3xl">
            Most operators leave $75K+ on the table every year.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            Tranquillo Green automates 280E COGS allocation, finds missed deductions, and generates audit-ready workpapers — in minutes, not hours.
          </p>
        </section>

        {/* ── CALCULATOR + CTA ──────────────────────────── */}
        <section className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <InlineCalculator />
          </div>
          <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Why Operators Switch</h2>
              <ul className="mt-4 space-y-3">
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
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">CPA Firms</div>
              <p className="mt-1 text-sm text-text-secondary">
                Serve 3x more clients with multi-client tools, white-label exports, and 20% revenue share.
              </p>
              <Link href="/partner" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80">
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────── */}
        <section className="mt-16 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">$75K+</div>
              <div className="mt-1 text-xs text-text-muted">Average annual savings identified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">16hrs → 3min</div>
              <div className="mt-1 text-xs text-text-muted">280E allocation time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">45K+</div>
              <div className="mt-1 text-xs text-text-muted">Licensed cannabis operators in the US</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">30-day</div>
              <div className="mt-1 text-xs text-text-muted">Money-back guarantee</div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            What operators are saying
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-sm">
                <div className="mb-2 inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">{t.stat}</div>
                <p className="text-sm leading-relaxed text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-3 border-t border-border pt-2">
                  <div className="text-sm font-medium text-text-primary">{t.author}</div>
                  <div className="text-xs text-text-muted">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="mt-16 text-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-8">
          <h2 className="text-2xl font-bold text-text-primary">Find Your Missed Deductions</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
            Use the calculator above to estimate your savings, then schedule a demo to see the full picture for your operation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/demo" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all">
              Schedule a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
              View Pricing
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="mt-16">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-text-faint">
            <Link href="/pricing" className="hover:text-text-muted transition-colors">Pricing</Link>
            <Link href="/partner" className="hover:text-text-muted transition-colors">CPA Partners</Link>
            <Link href="/contact" className="hover:text-text-muted transition-colors">Contact</Link>
            <Link href="/calculator" className="hover:text-text-muted transition-colors">280E Calculator</Link>
          </div>
          <p className="mt-6 text-center text-xs text-text-faint">Tranquillo Green — Cannabis Financial Operations Platform</p>
        </footer>
      </div>
    </main>
  );
}
