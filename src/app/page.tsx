import Link from "next/link";

/* ─── Proof point icons ──────────────────────────────────────── */

function AllocationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MetrcIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="3.5 8 6.5 11 12.5 5" />
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <line x1="6" y1="18" x2="6" y2="17.5" />
      <line x1="18" y1="18" x2="18" y2="17.5" />
    </svg>
  );
}

function EntityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
    </svg>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function HomePage() {
  const cpaFeatures = [
    "280E + 471(c) allocation reports for every client",
    "471(c) eligibility testing and method election tracking",
    "Metrc sync across all operator accounts",
    "One-click QBO export — CPA-ready workpapers",
    "Filing calendar with deadline tracking",
    "Multi-entity dashboard",
    "Audit trail on every adjustment",
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.08), transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(212, 146, 42, 0.04), transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 lg:py-24">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Cannabis Financial Operations Platform
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Financial operations built for{" "}
            <span className="text-accent">cannabis.</span>
          </h1>
          <p className="mt-4 text-3xl font-bold leading-tight text-brand sm:text-4xl">
            From seed to sale to IRS audit.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Multi-entity accounting, automated 280E allocations, Metrc-integrated inventory,
            and cash reconciliation — in one platform that keeps your CFO, your CPA,
            and the IRS on the same page.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md hover:-translate-y-0.5"
            >
              Open Demo
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-xl border border-brand/30 bg-brand/10 px-8 text-sm font-semibold text-brand transition-all duration-200 hover:bg-brand/15"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────── */}
        <section className="mt-20 rounded-2xl border border-border bg-surface/60 p-8 backdrop-blur-sm">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">45K+</div>
              <div className="mt-2 text-sm text-text-muted">
                Licensed cannabis operators in the US
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">$2.2B</div>
              <div className="mt-2 text-sm text-text-muted">
                In excess taxes paid by operators annually
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand">8-20hrs → 3min</div>
              <div className="mt-2 text-sm text-text-muted">
                Manual bookkeeping vs. automated close
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">280E+471c</div>
              <div className="mt-2 text-sm text-text-muted">
                Tax compliance engine — included in every plan
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF POINTS: FINANCIAL OPERATIONS PILLARS ── */}
        <section className="mt-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            One platform. Every financial operation.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <AllocationIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                280E + 471(c) Tax Engine
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Automated COGS allocation under IRC 280E and 471(c) with full audit trail.
                Captures facility rent, inventory labor, and shipping into deductible COGS.
                Keeps you compliant as the tax landscape shifts.
              </p>
            </div>

            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <MetrcIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                Metrc-Integrated Books
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Real-time sync between Metrc inventory and your chart of accounts.
                Variance detection catches discrepancies before auditors do.
              </p>
            </div>

            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <CashIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                Cash Reconciliation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Daily cash reconciliation built for an industry that runs on cash.
                Bank feed integration, variance tracking, and deposit matching
                — so your books match what's in the vault.
              </p>
            </div>

            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <EntityIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                Multi-Entity Management
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Consolidate multiple entities, locations, and license types.
                Intercompany eliminations, unified reporting, and per-entity
                P&L — built for operators who've outgrown spreadsheets.
              </p>
            </div>

            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <ExportIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                CPA Export Packets
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                One-click export in QBO format. Your CPA gets audit-ready workpapers,
                not a spreadsheet mess. White-label ready for CPA firms.
              </p>
            </div>

            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <CheckIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                Month-End Close
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Close the books in days, not weeks. Automated journal entries,
                period lock, close checklists, and review workflows —
                so you're always audit-ready.
              </p>
            </div>
          </div>
        </section>

        {/* ── CFO / OPERATOR SECTION ───────────────────── */}
        <section className="mt-20 rounded-2xl border border-border bg-surface-raised p-8 lg:p-12">
          <div className="lg:flex lg:items-start lg:gap-12">
            <div className="lg:flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                For Cannabis CFOs & Operators
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">
                Your financial stack, finally unified.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-muted">
                Cannabis operators juggle 4-7 software systems. Tranquillo replaces the
                accounting, tax compliance, and reconciliation layer with one platform
                that talks to your POS, your seed-to-sale system, and your CPA.
              </p>
              <p className="mt-4 text-base leading-relaxed text-text-muted">
                Whether you're a single-location dispensary or a multi-state operator
                with 10+ entities — the platform scales with you.
              </p>
            </div>

            <ul className="mt-8 space-y-3 lg:mt-0 lg:w-80">
              {[
                "Multi-entity consolidation & intercompany eliminations",
                "Automated 280E + 471(c) COGS allocation",
                "Metrc inventory ↔ books reconciliation",
                "Daily cash reconciliation & bank feeds",
                "CPA-ready audit packets & workpapers",
                "Month-end close workflows & checklists",
                "Role-based access (CFO, controller, CPA, viewer)",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CPA SECTION ──────────────────────────────── */}
        <section className="mt-20 rounded-2xl border border-border bg-surface-raised p-8 lg:p-12">
          <div className="lg:flex lg:items-start lg:gap-12">
            <div className="lg:flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                For Cannabis CPAs
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">
                Manage all your cannabis clients from one dashboard.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-muted">
                Stop rebuilding 280E and 471(c) allocations from scratch for every client.
                Tranquillo gives you the tools to serve cannabis operators at scale —
                with white-label exports, multi-client workflows, and audit-ready documentation.
              </p>
            </div>

            <ul className="mt-8 space-y-3 lg:mt-0 lg:w-80">
              {cpaFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────── */}
        <section className="mt-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">
            Financial clarity for cannabis operators.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
            From automated tax compliance to multi-entity consolidation —
            see why cannabis operators and their CPAs are switching to Tranquillo Green.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"
            >
              Start Free Demo
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <section className="mt-20 text-center">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
          <p className="mt-6 text-xs text-text-faint">
            Tranquillo Green — Cannabis Financial Operations Platform
          </p>
        </section>
      </div>
    </main>
  );
}
