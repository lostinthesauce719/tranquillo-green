import Link from "next/link";

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-8">FAQ</h1>
        <div className="space-y-4">
          {[
            { q: "What makes Tranquillo Green different from QuickBooks?", a: "QuickBooks doesn't understand 280E. It treats cannabis businesses like any other business, allowing expense deductions that aren't legal under federal tax code. Tranquillo Green applies 280E rules natively." },
            { q: "Do I need Metrc credentials to use the platform?", a: "No. The platform works in demo mode without any API keys. When you're ready to connect live, you'll need Metrc user credentials which your compliance team can generate." },
            { q: "Can my CPA use this?", a: "Yes. Our CPA Partner program gives accounting firms multi-client access, white-label reports, and dedicated support." },
            { q: "What states do you support?", a: "We support all regulated cannabis states including CA, CO, MI, IL, MA, OR, WA, NV, AZ, OH, and more." },
          ].map((faq, i) => (
            <details key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
              <summary className="px-5 py-4 text-text-primary font-medium cursor-pointer hover:bg-surface-mid transition flex items-center justify-between">
                {faq.q}
                <span className="text-text-muted text-lg">+</span>
              </summary>
              <div className="px-5 pb-4 text-text-secondary text-sm leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition">Get Started</Link>
        </div>
      </div>
    </main>
  );
}