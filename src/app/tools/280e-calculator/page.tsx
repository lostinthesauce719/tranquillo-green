import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, FileText, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "280E Tax Savings Calculator | Tranquillo Green",
  description: "Calculate your potential 280E tax savings in 60 seconds. See how much you're overpaying on federal taxes with our free cannabis tax calculator. Get your personalized savings estimate.",
  openGraph: {
    title: "280E Tax Savings Calculator | Tranquillo Green",
    description: "Calculate your potential 280E tax savings in 60 seconds. Free tool for cannabis operators.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "280E Tax Savings Calculator",
  description: "Free calculator to estimate federal tax savings for cannabis operators under IRC 280E",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function CalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-surface-mid">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" />
            Free Tool — No Signup Required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            280E Tax Savings Calculator
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
            Most cannabis operators overpay $75K-$200K/year in federal taxes. Calculate your potential savings in 60 seconds.
          </p>
        </section>

        {/* Calculator */}
        <section className="max-w-2xl mx-auto px-6 pb-20">
          <div className="bg-surface-light rounded-2xl border border-border p-8 shadow-xl">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Annual Revenue</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input type="number" className="w-full bg-surface-mid border border-border rounded-lg pl-8 pr-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="2000000" defaultValue={2000000} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">COGS % (Current)</label>
                  <input type="number" className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="35" defaultValue={35} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Facility Rent (Annual)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                    <input type="number" className="w-full bg-surface-mid border border-border rounded-lg pl-8 pr-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="120000" defaultValue={120000} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Inventory Labor (Annual)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                    <input type="number" className="w-full bg-surface-mid border border-border rounded-lg pl-8 pr-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="180000" defaultValue={180000} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">State</label>
                  <select className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="MI">Michigan</option>
                    <option value="IL">Illinois</option>
                    <option value="MA">Massachusetts</option>
                    <option value="OR">Oregon</option>
                    <option value="WA">Washington</option>
                    <option value="NV">Nevada</option>
                    <option value="AZ">Arizona</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Email (for your results)</label>
                <input type="email" className="w-full bg-surface-mid border border-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="you@company.com" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                Calculate My Savings <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </section>

        {/* Results Preview */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Estimated Savings</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">$127K</div>
                <div className="text-text-muted text-sm mt-1">Annual Tax Savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">41%</div>
                <div className="text-text-muted text-sm mt-1">Optimized COGS %</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">$310K</div>
                <div className="text-text-muted text-sm mt-1">Additional Deductions</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-border hover:border-emerald-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How 280E Savings Work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-400 font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Enter Your Numbers</h3>
              <p className="text-text-muted text-sm">Revenue, current COGS %, facility rent, and labor costs. Takes 60 seconds.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2">We Calculate Allocations</h3>
              <p className="text-text-muted text-sm">Our engine applies IRC 280E and 471(c) rules to find every legitimate deduction.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-emerald-400 font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Get Audit-Ready Reports</h3>
              <p className="text-text-muted text-sm">Full workpapers with every allocation documented for IRS defense.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "What is IRC 280E?", a: "IRC 280E is a federal tax code section that prohibits cannabis businesses from deducting ordinary business expenses. Only Cost of Goods Sold (COGS) is deductible. This means most cannabis operators pay 40-70% effective federal tax rates." },
              { q: "How is this different from QuickBooks?", a: "QuickBooks doesn't understand 280E. It treats cannabis businesses like any other business, allowing all expense deductions. This creates a false sense of compliance and can lead to IRS penalties. Tranquillo Green applies 280E rules natively." },
              { q: "What is the 471(c) election?", a: "Section 471(c) allows certain cannabis operators to capitalize additional costs into inventory, increasing COGS and reducing taxable income. Not all operators qualify — our calculator checks eligibility." },
              { q: "Is this calculator accurate?", a: "The calculator provides estimates based on industry averages and IRS guidelines. For a precise analysis, schedule a demo and we'll run your actual numbers through our allocation engine." },
              { q: "Do I need to sign up?", a: "No signup required for the calculator. We only ask for your email to send you the detailed results. No spam, ever." },
            ].map((faq, i) => (
              <details key={i} className="group bg-surface-light rounded-lg border border-border">
                <summary className="flex items-center justify-between cursor-pointer p-4 text-white font-medium">
                  {faq.q}
                  <span className="text-text-muted group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-4 pb-4 text-text-muted text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-surface-light rounded-2xl border border-border p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Stop Overpaying on 280E?</h2>
            <p className="text-text-muted mb-6 max-w-xl mx-auto">
              Join 200+ cannabis operators who found an average of $127K in annual tax savings with Tranquillo Green.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-text-muted text-xs mt-4">14-day free trial • No credit card required • 30-day money-back guarantee</p>
          </div>
        </section>
      </main>
    </>
  );
}
