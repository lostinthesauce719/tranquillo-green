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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ─── Before/After Comparison ───────────────────────────────────── */

function BeforeAfter() {
  const rows = [
    { task: "280E COGS allocation", before: "16 hrs/mo", after: "3 min" },
    { task: "Month-end close", before: "3 weeks", after: "4 days" },
    { task: "Metrc reconciliation", before: "Manual", after: "Automated" },
    { task: "CPA workpaper prep", before: "4 hrs", after: "1 click" },
    { task: "Multi-entity reporting", before: "Spreadsheets", after: "One platform" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface/60 overflow-hidden">
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Task</div>
        <div className="bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wider text-danger text-center">Before</div>
        <div className="bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand text-center">After</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.task} className={"grid grid-cols-3 gap-px bg-border " + (i % 2 === 0 ? "bg-surface/30" : "bg-surface/10")}>
          <div className="bg-surface/50 px-4 py-3 text-sm text-text-secondary">{r.task}</div>
          <div className="bg-surface/50 px-4 py-3 text-sm text-center text-danger font-medium">{r.before}</div>
          <div className="bg-surface/50 px-4 py-3 text-sm text-center text-brand font-semibold">{r.after}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────── */

const testimonials = [
  {
    quote: "We used to take 3 weeks to close books. Now we're done in 4 days with full 280E allocation reports ready for our tax preparer.",
    author: "Priya Chandrasekaran",
    title: "Director of Finance, Elevate Michigan — Michigan",
    stat: "3 weeks → 4 days",
  },
  {
    quote: "The Metrc reconciliation alone saves us 10 hours a week across 4 states. The 280E engine is the real deal.",
    author: "Derek Okafor",
    title: "VP Finance, Standard Wellness — Ohio & Arizona",
    stat: "10 hrs/week saved",
  },
  {
    quote: "I run a 12-person CPA firm. Before Tranquillo, I could handle maybe 8 operator clients. Now I'm at 22 and still have capacity.",
    author: "Rachel Dominguez",
    title: "Managing Partner, Vertex Tax & Advisory — Colorado",
    stat: "8 → 22 clients",
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
            Close the Books in{" "}
            <span className="text-brand">Days, Not Weeks.</span>
          </h1>
          <p className="mt-4 text-2xl font-bold leading-tight text-accent sm:text-3xl">
            Automated 280E. Metrc-integrated. CPA-ready.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            One platform for every financial operation. Stop juggling spreadsheets and generic accounting software that doesn't understand cannabis.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/demo" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md hover:-translate-y-0.5">
              Schedule a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/calculator" className="inline-flex h-12 items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-8 text-sm font-semibold text-brand transition-all duration-200 hover:bg-brand/15">
              Calculate 280E Savings
            </Link>
          </div>
        </section>

        {/* ── BEFORE/AFTER ─────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted mb-8">
            What changes when you switch
          </h2>
          <BeforeAfter />
        </section>

        {/* ── STATS BAR ────────────────────────────────── */}
        <section className="mt-12 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">8-20hrs → 3min</div>
              <div className="mt-1 text-xs text-text-muted">Manual bookkeeping vs. automated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">3 wks → 4 days</div>
              <div className="mt-1 text-xs text-text-muted">Month-end close time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">45K+</div>
              <div className="mt-1 text-xs text-text-muted">Licensed cannabis operators in the US</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">30-day</div>
              <div className="mt-1 text-xs text-text-muted">Money-back guarantee</div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted mb-8">
            One platform. Every financial operation.
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "280E + 471(c) Tax Engine", desc: "Automated COGS allocation with full audit trail. Captures facility rent, inventory labor, and shipping into deductible COGS." },
              { title: "Metrc-Integrated Books", desc: "Real-time sync between Metrc inventory and your chart of accounts. Variance detection catches discrepancies before auditors do." },
              { title: "Multi-Entity Management", desc: "Consolidate multiple entities, locations, and license types. Intercompany eliminations and unified reporting." },
              { title: "CPA Export Packets", desc: "One-click export in QBO format. Your CPA gets audit-ready workpapers, not a spreadsheet mess." },
              { title: "Month-End Close", desc: "Close the books in days, not weeks. Automated journal entries, period lock, and close checklists." },
              { title: "Cash Reconciliation", desc: "Daily cash reconciliation built for an industry that runs on cash. Bank feeds, variance tracking, deposit matching." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-sm transition-all duration-200 hover:border-brand/20">
                <h3 className="text-base font-semibold text-text-primary">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{card.desc}</p>
              </div>
            ))}
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

        {/* ── CPA SECTION ──────────────────────────────── */}
        <section className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-text-primary">CPA Firms: Serve more clients without hiring</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Multi-client portal, automated 280E allocations, white-label exports, and 20% revenue share on referred clients.
              </p>
              <Link href="/partner" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80">
                Learn about the Partner Program <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="mt-16 text-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-8">
          <h2 className="text-2xl font-bold text-text-primary">Ready to close faster?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">
            Schedule a 30-minute demo. We'll show you exactly how much time (and money) you can save.
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
