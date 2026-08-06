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
          <h3 className="text-lg font-semibold text-text-primary">What 280E is costing you</h3>
          <p className="text-xs text-text-muted">Move the sliders — no account, no email</p>
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
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Deductions you may be leaving behind</div>
          <div className="mt-2 text-4xl font-bold text-brand sm:text-5xl">{fmt(taxSavings)}</div>
          <div className="mt-2 text-sm text-text-muted">
            in annual tax, from {fmt(additionalDeductions)} of COGS you could be defending
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="text-xs text-text-faint">COGS you claim now</div>
            <div className="text-sm font-semibold text-text-secondary">{fmt(currentCogs)}</div>
          </div>
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
            <div className="text-xs text-text-faint">COGS you could defend</div>
            <div className="text-sm font-semibold text-brand">{fmt(optimizedCogs)}</div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-text-faint">
          Illustrative estimate from your inputs, using common allocation ratios for facility and
          inventory labor. Your defensible number depends on your books — that&rsquo;s what the platform computes.
        </p>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

const capabilities = [
  {
    title: "280E COGS allocation you can defend",
    body: "Facility, labor, and shipping allocated by policy — every split carries the actor, timestamp, and reason behind it.",
  },
  {
    title: "Metrc reconciled against your books",
    body: "Package-level variance detection, with resolutions written to an audit trail instead of a spreadsheet comment.",
  },
  {
    title: "Financial statements from your ledger",
    body: "P&L, trial balance, and balance sheet computed from posted transactions — with the 280E add-back shown explicitly.",
  },
  {
    title: "CPA handoff without the email thread",
    body: "Grant your accountant scoped access; they see close status, open exceptions, and support schedules directly.",
  },
];

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
            Audit-ready from{" "}
            <span className="text-accent">day one.</span>
          </h1>
          <p className="mt-5 text-xl font-semibold leading-tight text-brand sm:text-2xl">
            280E doesn&rsquo;t punish you for what you spend. It punishes you for what you can&rsquo;t defend.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            Tranquillo Green is the financial operating layer between your POS and your CPA. It
            allocates COGS under 280E, reconciles Metrc to your books, and produces the workpapers
            that stand behind every number — so the deduction survives the exam, not just the filing.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/try" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-ink shadow-sm hover:bg-brand/90 transition-all">
              Explore the live sandbox <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo" className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
              Book a walkthrough
            </Link>
          </div>
          <p className="mt-3 text-xs text-text-faint">
            Free account required · No credit card · Pre-loaded with six months of operator data
          </p>
        </section>

        {/* ── CALCULATOR + WHY ──────────────────────────── */}
        <section className="mt-14 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <InlineCalculator />
          </div>
          <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">The gap nobody fills</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                General ledgers know accounting but nothing about 280E. Seed-to-sale and POS platforms
                know cannabis but treat accounting as an afterthought. Operators end up bridging the
                two by hand, in spreadsheets, every month.
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Works alongside QuickBooks — no ledger migration",
                  "Allocation policies, not one-off spreadsheet math",
                  "Every override captures who, when, and why",
                  "Support schedules tie back to source records",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span className="text-sm text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ─────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            What the platform actually does
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-text-primary">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DEMO PATH ────────────────────────────────── */}
        <section className="mt-16 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">See it on real books, not screenshots</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
              Create an account and you land in a working sandbox — a seeded operator with six months
              of transactions, three locations, live Metrc variances, and an open close. Every number
              on screen is computed, not mocked. Bring your own data whenever you&rsquo;re ready.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Create your account", d: "Email and password. About thirty seconds." },
              { n: "2", t: "Land in a seeded operation", d: "Pre-loaded books, allocations, and exceptions waiting for review." },
              { n: "3", t: "Walk the close", d: "A guided tour runs the workflow end to end — or skip it and poke around." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">{s.n}</div>
                <div className="mt-3 text-sm font-semibold text-text-primary">{s.t}</div>
                <div className="mt-1 text-xs leading-relaxed text-text-muted">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link href="/try" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-ink shadow-sm hover:bg-brand/90 transition-all">
              Start exploring <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
              View pricing
            </Link>
          </div>
        </section>

        {/* ── CPA TRACK ────────────────────────────────── */}
        <section className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 p-8">
          <div className="grid gap-6 md:grid-cols-5 md:items-center">
            <div className="md:col-span-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">For CPA firms</div>
              <h2 className="mt-2 text-2xl font-bold text-text-primary">
                Every cannabis client in one place
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                Your clients grant you scoped access from their own account. You see close status,
                open exceptions, and support schedules per engagement — without chasing a bookkeeper
                for a trial balance export. The allocation work that eats a day per client per month
                is already done and documented when you open it.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col gap-3">
              <Link href="/partner" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-ink transition-all hover:bg-accent/90">
                CPA partner program <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/cpa-partners" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-text-secondary transition-all hover:border-accent/40 hover:text-accent">
                How the portal works
              </Link>
            </div>
          </div>
        </section>

        {/* ── MARKET CONTEXT ───────────────────────────── */}
        <section className="mt-16 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">§280E</div>
              <div className="mt-1 text-xs text-text-muted">Disallows ordinary business deductions — COGS is the only lawful path</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">§471(c)</div>
              <div className="mt-1 text-xs text-text-muted">Inventory method election modeled directly in the platform</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">Metrc</div>
              <div className="mt-1 text-xs text-text-muted">Package-level reconciliation against your posted ledger</div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-text-primary">Find out what your books can defend</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
            Estimate with the calculator above, then open the sandbox and see the workpapers the
            platform produces behind a real allocation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/try" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-ink shadow-sm hover:bg-brand/90 transition-all">
              Explore the sandbox <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
              Talk to us
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="mt-16">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-text-faint">
            <Link href="/pricing" className="hover:text-text-muted transition-colors">Pricing</Link>
            <Link href="/partner" className="hover:text-text-muted transition-colors">CPA Partners</Link>
            <Link href="/280e-guide" className="hover:text-text-muted transition-colors">280E Guide</Link>
            <Link href="/calculator" className="hover:text-text-muted transition-colors">280E Calculator</Link>
            <Link href="/contact" className="hover:text-text-muted transition-colors">Contact</Link>
          </div>
          <p className="mt-6 text-center text-xs text-text-faint">
            Tranquillo Green — Cannabis Financial Operations Platform
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[11px] leading-relaxed text-text-faint">
            Tranquillo Green produces accounting records and workpapers. It is not tax advice, and
            allocation outcomes depend on your facts and your CPA&rsquo;s judgment.
          </p>
        </footer>
      </div>
    </main>
  );
}
