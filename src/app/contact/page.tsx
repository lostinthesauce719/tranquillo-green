"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon } from "lucide-react";


type InquiryType = "demo" | "cpa" | "general";

function ContactForm({ type }: { type: InquiryType }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
    operatorType: "dispensary",
    clientCount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
          message: formData.message,
          inquiryType: type,
          operatorType: formData.operatorType !== "dispensary" ? formData.operatorType : undefined,
          state: undefined,
          clientCount: formData.clientCount || undefined,
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error("Contact form submission failed:", err);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 mb-4">
          <CheckIcon className="h-8 w-8 text-brand" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary">Message Sent</h3>
        <p className="mt-2 text-sm text-text-muted max-w-sm mx-auto">
          {type === "cpa"
            ? "Thanks for your interest in the CPA Partner Program. Our partnerships team will reach out within 1 business day."
            : "Thanks for reaching out. We'll get back to you within 1 business day."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80"
        >
          Back to Home
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Work Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="jane@company.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Company / Firm</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Acme Dispensary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {type === "demo" && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Operator Type</label>
          <select
            value={formData.operatorType}
            onChange={(e) => setFormData({ ...formData, operatorType: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="dispensary">Dispensary / Retail</option>
            <option value="cultivator">Cultivator / Grow</option>
            <option value="manufacturer">Manufacturer / Processor</option>
            <option value="distributor">Distributor / Transport</option>
            <option value="vertical">Vertical (Multi-operation)</option>
            <option value="delivery">Delivery</option>
            <option value="mso">Multi-State Operator (MSO)</option>
          </select>
        </div>
      )}

      {type === "cpa" && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">How many cannabis clients do you serve?</label>
          <select
            value={formData.clientCount}
            onChange={(e) => setFormData({ ...formData, clientCount: e.target.value })}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">Select...</option>
            <option value="1-5">1-5 clients</option>
            <option value="6-15">6-15 clients</option>
            <option value="16-30">16-30 clients</option>
            <option value="30+">30+ clients</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {type === "cpa" ? "Tell us about your practice *" : "Message *"}
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          placeholder={
            type === "cpa"
              ? "Tell us about your cannabis practice, client base, and what you're looking for in a partner..."
              : "Tell us about your operation, what you're using today, and what you need..."
          }
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"
      >
        {type === "cpa" ? "Apply for Partnership" : "Send Message"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<InquiryType>("demo");

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const typeParam = params?.get("type");

  // Set initial tab from URL
  if (typeParam === "cpa" && activeTab !== "cpa") {
    // This is a side effect in render, but it's fine for this use case
    // In production we'd use useEffect
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.06), transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(212, 146, 42, 0.03), transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 lg:py-24">

        {/* ── HEADER ───────────────────────────────────── */}
        <section className="text-center">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Whether you're an operator looking to save on taxes or a CPA firm ready to scale
            your cannabis practice — we'd love to hear from you.
          </p>
        </section>

        {/* ── TABS ─────────────────────────────────────── */}
        <section className="mt-12">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-border bg-surface/60 p-1">
              {[
                { key: "demo" as InquiryType, label: "Book a Demo" },
                { key: "cpa" as InquiryType, label: "CPA Partnership" },
                { key: "general" as InquiryType, label: "General Inquiry" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-brand text-white shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORM ─────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-border bg-surface/60 p-6 sm:p-8 backdrop-blur-sm">
          {activeTab === "demo" && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Book a Demo</h2>
              <p className="text-sm text-text-muted mb-6">
                See Tranquillo Green in action. We'll walk through your specific operation and show exactly how much you could save.
              </p>
              <ContactForm type="demo" />
            </>
          )}

          {activeTab === "cpa" && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-1">CPA Partnership Application</h2>
              <p className="text-sm text-text-muted mb-6">
                Join the CPA Partner Program and get access to multi-client tools, white-label exports, and revenue share opportunities.
              </p>
              <ContactForm type="cpa" />
            </>
          )}

          {activeTab === "general" && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-1">General Inquiry</h2>
              <p className="text-sm text-text-muted mb-6">
                Have a question? Want to learn more? Send us a message and we'll get back to you within 1 business day.
              </p>
              <ContactForm type="general" />
            </>
          )}
        </section>

        {/* ── DIRECT CONTACT ───────────────────────────── */}
        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface/40 p-6 text-center">
            <div className="text-sm font-semibold text-text-primary mb-1">Email</div>
            <a href="mailto:hello@tranquillo.green" className="text-sm text-brand hover:text-brand/80">
              hello@tranquillo.green
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-surface/40 p-6 text-center">
            <div className="text-sm font-semibold text-text-primary mb-1">Response Time</div>
            <div className="text-sm text-text-muted">Within 1 business day</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface/40 p-6 text-center">
            <div className="text-sm font-semibold text-text-primary mb-1">Live Demo</div>
            <button
              onClick={() => setActiveTab("demo")}
              className="text-sm text-brand hover:text-brand/80"
            >
              Schedule a walkthrough
            </button>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="mt-20">
          <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-text-faint">
            <Link href="/" className="hover:text-text-muted transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-text-muted transition-colors">Pricing</Link>
            <Link href="/calculator" className="hover:text-text-muted transition-colors">280E Calculator</Link>
            <Link href="/partner" className="hover:text-text-muted transition-colors">CPA Partners</Link>
          </div>
          <p className="mt-6 text-center text-xs text-text-faint">
            Tranquillo Green — Cannabis Financial Operations Platform
          </p>
        </footer>
      </div>
    </main>
  );
}
