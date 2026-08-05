import Link from "next/link";

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-text-primary">
          Tranquillo Green Sandbox
        </h1>
        <p className="text-xl text-text-muted">
          Explore a fully-loaded demo environment — no credit card required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
          {[
            { title: "Realistic Demo Data", desc: "100+ products, sales, invoices, and tax calculations pre-loaded" },
            { title: "Multi-State Operations", desc: "See 280E in action across dispensary, cultivation, and manufacturing" },
            { title: "14-Day Trial", desc: "Full access, no commitment. Upgrade anytime." },
          ].map((f) => (
            <div key={f.title} className="p-4 rounded-xl border border-border bg-surface">
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="text-sm text-text-muted mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/auth"
            className="px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition"
          >
            Start Free Demo
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl border border-border text-text-primary hover:bg-surface-raised transition"
          >
            View Public Demo
          </Link>
        </div>
      </div>
    </div>
  );
}