import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog | Cannabis Accounting & 280E Compliance | Tranquillo Green",
  description: "Expert guides on cannabis accounting, 280E tax compliance, Metrc reconciliation, COGS allocation, and CPA firm growth. Updated weekly.",
  openGraph: {
    title: "Cannabis Accounting Blog | Tranquillo Green",
    description: "Expert guides on 280E, Metrc, COGS, and cannabis financial operations.",
    type: "website",
  },
};

const posts = [
  {
    slug: "cannabis-cogs-allocation-guide",
    title: "Cannabis COGS Allocation: The Complete Guide for 2026",
    excerpt: "Everything you need to know about Cost of Goods Sold allocation under IRC 280E. Includes facility rent, labor, shipping, and the 471(c) election.",
    date: "2026-05-17",
    readTime: "12 min",
    category: "280E Compliance",
  },
  {
    slug: "metrc-reconciliation-guide",
    title: "Metrc Reconciliation: How to Match Seed-to-Sale Data to Your Books",
    excerpt: "Step-by-step guide to reconciling Metrc packages with your general ledger. Catch variances before auditors do.",
    date: "2026-05-15",
    readTime: "10 min",
    category: "Inventory",
  },
  {
    slug: "280e-vs-471c-cannabis",
    title: "280E vs 471(c): Which Inventory Method Saves You More?",
    excerpt: "The 471(c) election can significantly increase your COGS deductions. Here's how to know if you qualify and how much you could save.",
    date: "2026-05-12",
    readTime: "8 min",
    category: "Tax Strategy",
  },
  {
    slug: "cannabis-month-end-close-checklist",
    title: "The Cannabis Month-End Close Checklist (Free Template)",
    excerpt: "Close your books in days, not weeks. This checklist covers every step from bank rec to 280E allocation review.",
    date: "2026-05-10",
    readTime: "15 min",
    category: "Operations",
  },
  {
    slug: "cannabis-audit-preparation-guide",
    title: "Cannabis Audit Preparation: How to Be Ready in 48 Hours",
    excerpt: "Most operators spend weeks preparing for an IRS audit. With the right systems, you can generate audit-ready workpapers in minutes.",
    date: "2026-05-08",
    readTime: "11 min",
    category: "Compliance",
  },
  {
    slug: "cannabis-cpa-firm-growth",
    title: "How to Grow Your Cannabis CPA Practice Without Hiring",
    excerpt: "The CPA partner program playbook: how top firms serve 3x more cannabis clients with the same headcount using automation.",
    date: "2026-05-05",
    readTime: "9 min",
    category: "CPA Channel",
  },
  {
    slug: "white-label-cannabis-accounting",
    title: "White-Label Cannabis Accounting: A CPA Firm's Secret Weapon",
    excerpt: "How to offer branded financial reporting to cannabis clients without building software from scratch.",
    date: "2026-05-03",
    readTime: "7 min",
    category: "CPA Channel",
  },
  {
    slug: "280e-rescheduling-2026",
    title: "280E Rescheduling in 2026: What Cannabis Operators Need to Know",
    excerpt: "Trump signed the executive order. Here's what Schedule III means for your tax strategy, and why you still need proper accounting.",
    date: "2026-05-01",
    readTime: "10 min",
    category: "Industry News",
  },
];

export default function BlogIndex() {
  return (
    <main className="min-h-screen bg-surface-mid">
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Cannabis Accounting Blog</h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Expert guides on 280E compliance, Metrc reconciliation, COGS allocation, and growing your cannabis accounting practice.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block bg-surface-light rounded-xl border border-border p-6 hover:border-emerald-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{post.category}</span>
                <span className="text-text-muted text-xs">{post.date}</span>
                <span className="text-text-muted text-xs">• {post.readTime} read</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">{post.title}</h2>
              <p className="text-text-muted text-sm">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
