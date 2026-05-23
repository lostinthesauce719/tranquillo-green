"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon, Download, Mail } from "lucide-react";

const leadMagnets = [
  {
    id: "280e-guide",
    title: "280E Deduction Checklist",
    description: "The complete list of deductible COGS categories most operators miss. Includes facility rent allocation, labor classification, and 471(c) election criteria.",
    icon: "📋",
    pages: "12 pages",
  },
  {
    id: "cogs-calculator",
    title: "COGS Optimization Spreadsheet",
    description: "Pre-built Excel template with formulas for calculating optimal COGS allocation across multiple entities and license types.",
    icon: "📊",
    pages: "Excel template",
  },
  {
    id: "close-playbook",
    title: "Month-End Close Playbook",
    description: "Step-by-step close checklist built for cannabis operators. Includes reconciliation workflows, period lock procedures, and CPA handoff templates.",
    icon: "📖",
    pages: "18 pages",
  },
];

export default function LeadsPage() {
  const [email, setEmail] = useState("");
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const handleDownload = (id: string) => {
    if (!email) return;
    // In production, this would POST to a Convex mutation
    setDownloaded(id);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.06), transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 lg:py-24">

        {/* Header */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent backdrop-blur-sm">
            <Download className="h-3 w-3" />
            Free Resources
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Cannabis Accounting Resources
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary">
            Free guides, templates, and calculators for cannabis operators and CPAs. No spam. Unsubscribe anytime.
          </p>
        </section>

        {/* Lead Magnets */}
        <div className="space-y-6">
          {leadMagnets.map((lm) => (
            <div key={lm.id} className="rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{lm.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-text-primary">{lm.title}</h3>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">{lm.pages}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{lm.description}</p>

                  {downloaded === lm.id ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-brand">
                      <CheckIcon className="h-4 w-4" />
                      <span>Check your email — we sent the download link!</span>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full h-10 rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <button
                        onClick={() => handleDownload(lm.id)}
                        disabled={!email}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className="h-4 w-4" />
                        Get Free Download
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="mt-8 text-center text-xs text-text-muted">
          Join 500+ cannabis operators and CPAs who get our weekly insights. No spam. Unsubscribe anytime.
        </div>

        {/* CTA */}
        <div className="mt-12 text-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-8">
          <h2 className="text-xl font-bold text-text-primary">Ready to automate your 280E allocations?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            These resources are a starting point. Tranquillo Green automates everything they cover.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/demo" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all">
              Schedule a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/calculator" className="inline-flex h-11 items-center rounded-xl border border-border px-6 text-sm font-semibold text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
              Try the Calculator
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
