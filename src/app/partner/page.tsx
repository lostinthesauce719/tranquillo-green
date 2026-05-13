import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  Shield,
  Download,
  Palette,
  Clock,
  BarChart3,
  Zap,
  ChevronRight,
  Star,
  Quote,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens (matching globals.css)
// ---------------------------------------------------------------------------
const BRAND_GREEN = "var(--brand)";
const ACCENT_AMBER = "var(--accent)";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const howItWorks = [
  {
    step: "01",
    title: "Connect Client",
    description:
      "Add your cannabis operator client to the portal. Link their QuickBooks, POS, or seed-to-sale system in minutes.",
    icon: Users,
  },
  {
    step: "02",
    title: "TG Allocates",
    description:
      "Our 280E allocation engine runs the cost study automatically—categorizing every expense as deductible or nondeductible.",
    icon: BarChart3,
  },
  {
    step: "03",
    title: "Export Audit-Ready Packet",
    description:
      "Download a complete, documented 280E support package: PDF summary, CSV detail, and ZIP evidence bundle.",
    icon: Download,
  },
];

const features = [
  {
    icon: Users,
    title: "Multi-Client Portal",
    description:
      "Manage 20+ cannabis operators from a single dashboard. Monitor allocation status, period close, and exports across your entire portfolio.",
  },
  {
    icon: Palette,
    title: "White-Label Exports",
    description:
      "Export branded reports under your firm's name and logo. Present polished deliverables to clients without mentioning TG.",
  },
  {
    icon: Shield,
    title: "Complete Audit Trail",
    description:
      "Every allocation decision, override, and approval is logged with timestamps. Defend your methodology in any IRS examination.",
  },
  {
    icon: FileText,
    title: "CPA Export Bundles",
    description:
      "One-click download of PDF summaries, CSV transaction detail, and ZIP evidence packets. Everything a tax preparer needs.",
  },
  {
    icon: Clock,
    title: "Period Close Tracking",
    description:
      "Monitor close readiness across clients. Know exactly which operators are on track and which need attention.",
  },
  {
    icon: Zap,
    title: "Automated Allocations",
    description:
      "Replace 40+ hours of manual cost study work per client. The engine handles routine allocations; you focus on exceptions.",
  },
];

const pricingTiers = [
  {
    name: "CPA Partner",
    price: "$199",
    period: "/mo",
    description: "For firms managing their first cannabis clients",
    features: [
      "Multi-client portal (up to 10 clients)",
      "Standard export bundles",
      "Email support",
      "Basic allocation engine",
      "Period close tracking",
      "CSV data exports",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "CPA Pro",
    price: "$499",
    period: "/mo",
    description: "For established cannabis accounting practices",
    features: [
      "Unlimited client portal",
      "White-label exports",
      "Priority support + dedicated CSM",
      "Advanced allocation customization",
      "Co-marketing opportunities",
      "Custom report templates",
      "API access",
      "Bulk export operations",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Revenue Share",
    price: "20%",
    period: " rev share",
    description: "Refer clients and earn recurring revenue",
    features: [
      "Earn 20% of client subscription",
      "Recurring monthly payouts",
      "Client referral tracking",
      "Co-branded landing pages",
      "Marketing materials provided",
      "Quarterly business reviews",
    ],
    cta: "Apply for Partnership",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote:
      "We used to spend 40+ hours building 280E cost studies by hand. Now we do it in under 4 hours with TG. Our clients get better results and we can take on 3x more accounts.",
    author: "Sarah Chen",
    title: "Partner, Greenfield CPA Group",
    rating: 5,
  },
  {
    quote:
      "The audit trail alone is worth the subscription. When the IRS asks questions, we have every allocation decision documented with full rationale.",
    author: "Michael Rodriguez",
    title: "Founder, Cannabis Compliance Partners",
    rating: 5,
  },
  {
    quote:
      "White-label exports let us deliver professional packages under our brand. Our clients think we built this technology in-house.",
    author: "Jessica Park",
    title: "Senior Manager, Pacific Cannabis Advisory",
    rating: 5,
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <div
          className="text-xs uppercase tracking-[0.35em] text-accent mb-3"
          style={{ color: ACCENT_AMBER }}
        >
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-lg text-text-muted">{description}</p>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-6 transition-all duration-200 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
        style={{ backgroundColor: "rgba(34, 133, 90, 0.1)" }}
      >
        <Icon className="h-5 w-5 text-brand" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
  badge,
}: (typeof pricingTiers)[0]) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        highlighted
          ? "border-brand/50 bg-surface-mid shadow-lg shadow-brand/10"
          : "border-border bg-surface-mid"
      }`}
    >
      {badge && (
        <div
          className="inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
          style={{ backgroundColor: "rgba(34, 133, 90, 0.15)", color: "#86efac" }}
        >
          <Star className="h-3 w-3" />
          {badge}
        </div>
      )}
      <div className="text-lg font-semibold">{name}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-sm text-text-muted">{period}</span>
      </div>
      <p className="mt-2 text-sm text-text-muted">{description}</p>
      <div className="mt-6 flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: "#22855a" }}
              />
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
          highlighted
            ? "text-white hover:opacity-90"
            : "border border-border hover:border-brand/50 hover:bg-brand/5"
        }`}
        style={
          highlighted
            ? { backgroundColor: "var(--brand)" }
            : undefined
        }
      >
        {cta}
      </button>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  title,
  rating,
}: (typeof testimonials)[0]) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-6">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-current"
            style={{ color: "#d4922a" }}
          />
        ))}
      </div>
      <Quote className="h-5 w-5 text-text-faint mb-2" />
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="border-t border-border pt-3">
        <div className="font-medium text-sm">{author}</div>
        <div className="text-xs text-text-muted">{title}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PartnerPage() {
  return (
    <main className="min-h-screen">
      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 133, 90, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(212, 146, 42, 0.08), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div
              className="text-xs uppercase tracking-[0.35em] mb-4"
              style={{ color: ACCENT_AMBER }}
            >
              CPA Partner Program
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              The financial operations platform your cannabis clients need.
            </h1>
            <p className="mt-6 text-xl text-text-muted leading-relaxed max-w-2xl">
              Multi-entity accounting, automated 280E allocations, Metrc-integrated inventory,
              and cash reconciliation — in one platform. White-label ready so you can deliver
              it under your firm&apos;s brand.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "var(--brand)" }}
              >
                Apply for Partner Access
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-brand/50 hover:bg-brand/5">
                Watch Demo
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="CPA Partner Program"
            title="Offer your clients a complete financial operations platform"
            description="From automated tax compliance to multi-entity consolidation — deliver more value to every cannabis client."
          />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="rounded-2xl border border-border bg-surface-mid p-8 h-full">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                    style={{ backgroundColor: "rgba(34, 133, 90, 0.1)" }}
                  >
                    <step.icon className="h-6 w-6 text-brand" />
                  </div>
                  <div
                    className="text-xs font-medium uppercase tracking-widest mb-2"
                    style={{ color: ACCENT_AMBER }}
                  >
                    Step {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="h-6 w-6 text-text-faint" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT CPAs GET ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="What CPAs Get"
            title="Everything you need to run a modern cannabis practice"
            description="Purpose-built tools for cannabis-specialized accounting firms."
          />
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple, transparent pricing that scales with you"
            description="Choose the plan that fits your practice size and growth stage."
          />
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-text-muted">
            All plans include a 14-day free trial. No credit card required to start.
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader
            eyebrow="Trusted by Cannabis CPAs"
            title="Firms already scaling with Tranquillo Green"
            description="Join the firms automating their 280E workflows and growing their cannabis practices."
          />

          {/* Firm logos placeholder */}
          <div className="mt-12 rounded-2xl border border-border bg-surface-mid p-8">
            <div className="text-center text-sm text-text-muted mb-6">
              Trusted by firms including
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {[
                "Greenfield CPA Group",
                "Cannabis Compliance Partners",
                "Pacific Cannabis Advisory",
                "Verdant Tax Solutions",
                "Emerald Accounting Co.",
              ].map((firm) => (
                <div
                  key={firm}
                  className="flex items-center gap-2 text-text-faint"
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{firm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.author} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / APPLICATION FORM ──────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl border border-border bg-surface-mid p-8 sm:p-12">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left: copy */}
              <div>
                <div
                  className="text-xs uppercase tracking-[0.35em] mb-4"
                  style={{ color: ACCENT_AMBER }}
                >
                  Get Started
                </div>
                <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                  Apply for Partner Access
                </h2>
                <p className="mt-4 text-lg text-text-muted leading-relaxed">
                  Join the growing network of cannabis CPAs using Tranquillo Green to
                  automate 280E compliance. Fill out the form and our partnerships team
                  will reach out within 24 hours.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    Free 14-day trial for qualifying firms
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    Dedicated onboarding support
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                    No long-term contracts
                  </div>
                </div>
                <div className="mt-8 border-t border-border pt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Mail className="h-4 w-4 text-text-faint" />
                    partners@tranquillogreen.com
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Phone className="h-4 w-4 text-text-faint" />
                    (415) 555-0142
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <Globe className="h-4 w-4 text-text-faint" />
                    tranquillogreen.com/partner
                  </div>
                </div>
              </div>

              {/* Right: form */}
              <div className="rounded-2xl border border-border bg-background p-6">
                <form className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-faint transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-faint transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
                        placeholder="Smith"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Firm Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-faint transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="Smith & Associates CPA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-faint transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
                      placeholder="jane@smithcpa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Cannabis Clients
                    </label>
                    <select className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30">
                      <option value="">Select range</option>
                      <option value="1-5">1–5 clients</option>
                      <option value="6-15">6–15 clients</option>
                      <option value="16-30">16–30 clients</option>
                      <option value="30+">30+ clients</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      How can we help?
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-primary placeholder:text-text-faint transition-colors focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30 resize-none"
                      placeholder="Tell us about your 280E workflow challenges..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    Submit Application
                  </button>
                  <p className="text-xs text-text-faint text-center">
                    By submitting, you agree to our{" "}
                    <Link href="/terms" className="text-brand hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-brand hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: "rgba(34, 133, 90, 0.2)" }}
              >
                <Building2 className="h-4 w-4 text-brand" />
              </div>
              <span className="text-sm font-medium">Tranquillo Green</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <Link href="/privacy" className="hover:text-text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-text-primary transition-colors">
                Terms
              </Link>
              <Link href="/docs" className="hover:text-text-primary transition-colors">
                Docs
              </Link>
              <Link href="/sign-in" className="hover:text-text-primary transition-colors">
                Sign In
              </Link>
            </div>
            <div className="text-xs text-text-faint">
              &copy; {new Date().getFullYear()} Tranquillo Green. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
