import Link from "next/link";

const studies = [
  {
    name: "Marcus Whitfield",
    role: "CFO, Greenleaf Dispensaries — Michigan",
    stat: "$94K found",
    quote:
      "We were doing 280E allocations in spreadsheets — 16 hours every month. Tranquillo cut that to under 30 minutes and found $94K in deductions we'd been missing on rent and labor allocation alone.",
  },
  {
    name: "Tomoko Arakawa",
    role: "Controller, Cascade Grow Co. — Oregon",
    stat: "$210K difference",
    quote:
      "Our cultivator client was claiming 28% COGS. After running their data through Tranquillo, we identified 41% — a $210K difference in deductible expenses.",
  },
  {
    name: "Derek Okafor",
    role: "VP Finance, Standard Wellness — Ohio & Arizona",
    stat: "10 hrs/week saved",
    quote:
      "We switched from Flourish + QuickBooks to Tranquillo for our multi-state operation. The Metrc reconciliation alone saves us 10 hours a week across 4 states.",
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Case Studies
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
          Real operators. Real numbers. Real 280E recovery.
        </p>
      </section>
      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-8">
        {studies.map((item) => (
          <article
            key={item.name}
            className="bg-surface-light rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-text-muted text-sm">{item.role}</div>
              </div>
              <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {item.stat}
              </div>
            </div>
            <p className="text-text-muted leading-relaxed">{item.quote}</p>
            <p className="mt-3 text-sm text-text-secondary">
              Outcome: faster close, cleaner audit trail, and a tax position that is defensible if the IRS reviews it.
            </p>
            <div className="mt-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80"
              >
                Book a demo <span aria-hidden>→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
