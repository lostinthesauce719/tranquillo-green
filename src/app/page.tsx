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
            Your cannabis company is paying{" "}
            <span className="text-accent">up to 70%</span>{" "}
            in taxes.
          </h1>
          <p className="mt-4 text-3xl font-bold leading-tight text-brand sm:text-4xl">
            That ends now.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            280E forces cannabis operators to pay taxes on gross profit — not net.
            The fix is proper COGS allocation. We automate it in 3 minutes.
          </p>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
            With IRC 471(c) small business election, we capture even more costs into COGS —
            facility rent, inventory labor, shipping — turning nondeductible expenses into tax savings.
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
              <div className="text-4xl font-bold text-accent">70%+</div>
              <div className="mt-2 text-sm text-text-muted">
                Effective tax rate without proper COGS allocation
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">$2.2B</div>
              <div className="mt-2 text-sm text-text-muted">
                In excess taxes paid by cannabis operators annually
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand">8-20hrs → 3min</div>
              <div className="mt-2 text-sm text-text-muted">
                Manual 280E workpapers vs. automated allocation
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">471(c)</div>
              <div className="mt-2 text-sm text-text-muted">
                Small business inventory method — capture more costs into COGS
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF POINTS ─────────────────────────────── */}
        <section className="mt-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            How it works
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="tranquillo-card rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-sm transition-all duration-200 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5">
              <AllocationIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                280E + 471(c) Allocation Engine
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Automatically allocates COGS under 26 USC 280E and 471(c) with full audit trail.
                Captures facility rent, inventory labor, and shipping into deductible COGS.
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
              <ExportIcon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary">
                CPA Export Packets
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                One-click export in QBO format. Your CPA gets audit-ready workpapers,
                not a spreadsheet mess.
              </p>
            </div>
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
                maximizing COGS deductions under both provisions.
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
            Audit-ready from day one.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
            Connect QuickBooks + Metrc. Get your 280E + 471(c) allocation in 3 minutes, not 20 hours.
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
