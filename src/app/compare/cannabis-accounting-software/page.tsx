import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Cannabis Accounting Software Comparison 2026 | Tranquillo Green",
  description: "Compare cannabis accounting software: Tranquillo Green vs QuickBooks vs Xero vs manual spreadsheets. See which platform handles 280E, Metrc, and multi-entity.",
  openGraph: { title: "Cannabis Accounting Software Comparison | Tranquillo Green", description: "Side-by-side comparison of cannabis accounting platforms. 280E, Metrc, multi-entity, and more.", type: "website" },
};

const competitors = [
  { name: "Tranquillo Green", tagline: "Purpose-built for cannabis", c280e: true, c471c: true, metrc: true, multiEntity: true, cpaExport: true, auditTrail: true, close: true, price: "$347-$897/mo" },
  { name: "QuickBooks + Spreadsheets", tagline: "Generic accounting + manual work", c280e: false, c471c: false, metrc: false, multiEntity: "Partial", cpaExport: false, auditTrail: false, close: false, price: "$80-$200/mo" },
  { name: "Xero + Add-ons", tagline: "Generic with cannabis plugins", c280e: false, c471c: false, metrc: false, multiEntity: "Partial", cpaExport: false, auditTrail: false, close: false, price: "$100-$300/mo" },
  { name: "GreenBooks CPA", tagline: "CPA firm + software bundle", c280e: true, c471c: false, metrc: false, multiEntity: true, cpaExport: true, auditTrail: true, close: false, price: "$1,250+/mo" },
  { name: "Manual (Excel)", tagline: "Spreadsheets and hope", c280e: "Manual", c471c: "Manual", metrc: "Manual", multiEntity: "Manual", cpaExport: "Manual", auditTrail: false, close: false, price: "$0 + labor" },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <Check className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (val === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
  if (val === "Partial") return <Minus className="w-5 h-5 text-yellow-400 mx-auto" />;
  if (val === "Manual") return <span className="text-yellow-400 text-xs">Manual</span>;
  return <span className="text-text-muted text-xs">{val}</span>;
}

export default function Page() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Cannabis Accounting Software Comparison</h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">See how Tranquillo Green compares to QuickBooks, Xero, and manual approaches for cannabis-specific needs.</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-text-muted font-medium">Feature</th>
                {competitors.map((c) => (
                  <th key={c.name} className="text-center p-4 font-medium min-w-[120px]">
                    <div className={c.name === "Tranquillo Green" ? "text-emerald-400" : "text-text-muted"}>{c.name}</div>
                    <div className="text-xs text-text-muted font-normal mt-1">{c.tagline}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text-muted">
              {[
                ["280E COGS Allocation", "c280e"],
                ["471(c) Election Support", "c471c"],
                ["Metrc Reconciliation", "metrc"],
                ["Multi-Entity Support", "multiEntity"],
                ["CPA-Ready Exports", "cpaExport"],
                ["Audit Trail", "auditTrail"],
                ["Close Automation", "close"],
              ].map(([label, key]) => (
                <tr key={key as string} className="border-b border-border/50">
                  <td className="p-4 text-white">{label}</td>
                  {competitors.map((c) => (
                    <td key={c.name} className="p-4 text-center"><Cell val={c[key as keyof typeof c] as boolean | string} /></td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-border/50">
                <td className="p-4 text-white">Pricing</td>
                {competitors.map((c) => (
                  <td key={c.name} className={`p-4 text-center font-medium ${c.name === "Tranquillo Green" ? "text-emerald-400" : ""}`}>{c.price}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8">The Bottom Line</h2>
        <div className="space-y-4">
          <p className="text-text-muted">Generic accounting software (QuickBooks, Xero) works for most businesses. But cannabis isn't most businesses. The moment you need to comply with IRC 280E, reconcile Metrc data, or consolidate multiple entities, generic tools break down.</p>
          <p className="text-text-muted">Service-based solutions (GreenBooks CPA) work but cost $1,250+/mo and don't scale. Manual approaches are error-prone and create audit risk.</p>
          <p className="text-text-muted">Tranquillo Green is the only platform that combines cannabis-specific automation with self-service pricing. You get the compliance of a CPA firm with the speed and cost of software.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">See the Difference</h2>
          <p className="text-text-muted mb-6">Try Tranquillo Green free for 14 days. Import your data and see how it compares.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
