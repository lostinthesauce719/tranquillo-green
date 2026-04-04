import Link from "next/link";

const features = [
  "Cannabis chart of accounts",
  "280E allocation workflows",
  "Inventory-to-books reconciliation",
  "California filing calendar",
  "QuickBooks export",
];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="rounded-3xl border border-border bg-surface p-10 shadow-2xl shadow-black/20">
        <div className="text-xs uppercase tracking-[0.35em] text-accent">Tranquillo Labs</div>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">Tranquillo Green</h1>
        <p className="mt-5 max-w-3xl text-lg text-text-muted">
          Cannabis accounting and compliance infrastructure built to help operators close the books,
          survive 280E, and build toward unified operations.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Open dashboard scaffold</Link>
          <Link href="/docs" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text-primary">View architecture docs</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
