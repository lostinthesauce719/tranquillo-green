"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  BarChart3,
  DollarSign,
  MousePointer,
  Eye,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Settings,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Target,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

interface Campaign {
  id: string;
  name: string;
  platform: "google" | "linkedin" | "reddit";
  status: "active" | "paused" | "draft";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  startDate: string;
}

interface Ad {
  id: string;
  campaignId: string;
  name: string;
  headline: string;
  description: string;
  status: "active" | "paused";
  impressions: number;
  clicks: number;
  ctr: number;
}

/* ─── Demo Data ─────────────────────────────────────────────────── */

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    name: "280E Tax Savings",
    platform: "google",
    status: "active",
    budget: 50,
    spent: 387.50,
    impressions: 12400,
    clicks: 412,
    conversions: 28,
    ctr: 3.32,
    cpc: 0.94,
    cpa: 13.84,
    startDate: "2026-05-01",
  },
  {
    id: "c2",
    name: "Metrc Integration",
    platform: "google",
    status: "active",
    budget: 30,
    spent: 156.20,
    impressions: 5800,
    clicks: 174,
    conversions: 11,
    ctr: 3.0,
    cpc: 0.90,
    cpa: 14.20,
    startDate: "2026-05-01",
  },
  {
    id: "c3",
    name: "CPA Partnership",
    platform: "google",
    status: "active",
    budget: 30,
    spent: 89.40,
    impressions: 3200,
    clicks: 96,
    conversions: 8,
    ctr: 3.0,
    cpc: 0.93,
    cpa: 11.18,
    startDate: "2026-05-08",
  },
  {
    id: "c4",
    name: "Operator Awareness",
    platform: "linkedin",
    status: "active",
    budget: 40,
    spent: 215.60,
    impressions: 8900,
    clicks: 124,
    conversions: 9,
    ctr: 1.39,
    cpc: 1.74,
    cpa: 23.96,
    startDate: "2026-05-01",
  },
  {
    id: "c5",
    name: "CPA Partnership (LI)",
    platform: "linkedin",
    status: "paused",
    budget: 25,
    spent: 67.50,
    impressions: 2100,
    clicks: 31,
    conversions: 3,
    ctr: 1.48,
    cpc: 2.18,
    cpa: 22.50,
    startDate: "2026-05-08",
  },
  {
    id: "c6",
    name: "r/cannabisindustry",
    platform: "reddit",
    status: "active",
    budget: 20,
    spent: 42.80,
    impressions: 18500,
    clicks: 278,
    conversions: 15,
    ctr: 1.50,
    cpc: 0.15,
    cpa: 2.85,
    startDate: "2026-05-15",
  },
];

const DEMO_ADS: Ad[] = [
  { id: "a1", campaignId: "c1", name: "280E Software - Ad 1", headline: "Cannabis 280E Tax Software | Save $75K+", description: "Stop overpaying on 280E. Automated COGS allocation.", status: "active", impressions: 7200, clicks: 268, ctr: 3.72 },
  { id: "a2", campaignId: "c1", name: "280E Software - Ad 2", headline: "Stop Overpaying on 280E | Find Deductions", description: "Most operators leave $75K+ on the table.", status: "active", impressions: 5200, clicks: 144, ctr: 2.77 },
  { id: "a3", campaignId: "c4", name: "Operator - Single Image", headline: "Your 280E Allocations Shouldn't Take 16hrs", description: "Automates COGS allocation under IRC 280E.", status: "active", impressions: 8900, clicks: 124, ctr: 1.39 },
];

/* ─── Components ────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: Campaign["platform"] }) {
  const config = {
    google: { label: "Google", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    linkedin: { label: "LinkedIn", color: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    reddit: { label: "Reddit", color: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  };
  const c = config[platform];
  return <span className={"px-2 py-0.5 text-xs rounded-full border " + c.color}>{c.label}</span>;
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const config = {
    active: { label: "Active", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: Play },
    paused: { label: "Paused", color: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: Pause },
    draft: { label: "Draft", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30", icon: Settings },
  };
  const c = config[status];
  const Icon = c.icon;
  return <span className={"inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border " + c.color}><Icon className="h-3 w-3" />{c.label}</span>;
}

function MetricCard({ label, value, change, icon: Icon, color }: { label: string; value: string; change?: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <Icon className={"h-4 w-4 " + color} />
      </div>
      <div className="mt-2 text-2xl font-bold text-text-primary">{value}</div>
      {change !== undefined && (
        <div className={"mt-1 flex items-center gap-1 text-xs " + (change >= 0 ? "text-emerald-400" : "text-red-400")}>
          {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-overlay transition-colors">
      {copied ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "ads" | "creative">("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const totalSpent = DEMO_CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const totalClicks = DEMO_CAMPAIGNS.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = DEMO_CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const totalImpressions = DEMO_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);
  const avgCTR = totalClicks / totalImpressions * 100;
  const avgCPA = totalSpent / totalConversions;

  return (
    <AppShell title="Ad Campaigns" description="Manage and monitor your advertising campaigns across Google, LinkedIn, and Reddit.">
      <div className="space-y-6">
        {/* Demo banner */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
          <strong>Demo mode</strong> — Showing sample campaign data. Connect your ad accounts for live metrics.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1">
          {(["overview", "campaigns", "ads", "creative"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition " + (activeTab === tab ? "bg-brand text-white" : "text-text-muted hover:text-text-secondary")}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Spent" value={`$${totalSpent.toFixed(2)}`} change={12} icon={DollarSign} color="text-brand" />
              <MetricCard label="Impressions" value={totalImpressions.toLocaleString()} change={8} icon={Eye} color="text-blue-400" />
              <MetricCard label="Clicks" value={totalClicks.toLocaleString()} change={15} icon={MousePointer} color="text-accent" />
              <MetricCard label="Conversions" value={totalConversions.toString()} change={22} icon={Target} color="text-emerald-400" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="text-xs font-medium text-text-muted">Avg. CTR</div>
                <div className="mt-1 text-2xl font-bold text-text-primary">{avgCTR.toFixed(2)}%</div>
                <div className="mt-1 text-xs text-emerald-400">↑ 0.3% vs last period</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="text-xs font-medium text-text-muted">Avg. CPA</div>
                <div className="mt-1 text-2xl font-bold text-text-primary">${avgCPA.toFixed(2)}</div>
                <div className="mt-1 text-xs text-emerald-400">↓ $2.10 vs last period</div>
              </div>
            </div>

            {/* Platform breakdown */}
            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Performance by Platform</h3>
              <div className="space-y-4">
                {(["google", "linkedin", "reddit"] as const).map((platform) => {
                  const campaigns = DEMO_CAMPAIGNS.filter((c) => c.platform === platform);
                  const spent = campaigns.reduce((s, c) => s + c.spent, 0);
                  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
                  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
                  const cpa = conversions > 0 ? spent / conversions : 0;
                  return (
                    <div key={platform} className="flex items-center gap-4">
                      <PlatformBadge platform={platform} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">${spent.toFixed(2)} spent</span>
                          <span className="text-text-muted">{clicks} clicks · {conversions} conv.</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min((spent / totalSpent) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-primary">${cpa.toFixed(0)} CPA</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-3">
              <a href="/dashboard/campaigns?tab=campaigns" className="rounded-xl border border-border bg-surface-raised p-4 hover:border-brand/30 transition-colors">
                <Play className="h-5 w-5 text-brand mb-2" />
                <div className="text-sm font-medium text-text-primary">Launch Campaign</div>
                <div className="text-xs text-text-muted mt-1">Set up a new ad campaign</div>
              </a>
              <a href="/dashboard/campaigns?tab=creative" className="rounded-xl border border-border bg-surface-raised p-4 hover:border-brand/30 transition-colors">
                <BarChart3 className="h-5 w-5 text-accent mb-2" />
                <div className="text-sm font-medium text-text-primary">View Creative</div>
                <div className="text-xs text-text-muted mt-1">Browse ad copy and variants</div>
              </a>
              <a href="/leads" className="rounded-xl border border-border bg-surface-raised p-4 hover:border-brand/30 transition-colors">
                <Users className="h-5 w-5 text-emerald-400 mb-2" />
                <div className="text-sm font-medium text-text-primary">View Leads</div>
                <div className="text-xs text-text-muted mt-1">See captured leads</div>
              </a>
            </div>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ────────────────────────────────────────── */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">All Campaigns ({DEMO_CAMPAIGNS.length})</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors">
                <Play className="h-4 w-4" /> New Campaign
              </button>
            </div>

            <div className="space-y-3">
              {DEMO_CAMPAIGNS.map((campaign) => (
                <div key={campaign.id} className="rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PlatformBadge platform={campaign.platform} />
                      <div>
                        <h4 className="text-sm font-medium text-text-primary">{campaign.name}</h4>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                          <span>${campaign.budget}/day budget</span>
                          <span>·</span>
                          <span>Started {campaign.startDate}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-4">
                    <div>
                      <div className="text-xs text-text-faint">Spent</div>
                      <div className="text-sm font-semibold text-text-primary">${campaign.spent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-faint">Impressions</div>
                      <div className="text-sm font-semibold text-text-primary">{campaign.impressions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-faint">Clicks</div>
                      <div className="text-sm font-semibold text-text-primary">{campaign.clicks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-faint">CTR</div>
                      <div className="text-sm font-semibold text-text-primary">{campaign.ctr}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-faint">CPA</div>
                      <div className="text-sm font-semibold text-text-primary">${campaign.cpa.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>Budget used</span>
                      <span>{((campaign.spent / (campaign.budget * 14)) * 100).toFixed(0)}% of 2-week budget</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min((campaign.spent / (campaign.budget * 14)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADS TAB ──────────────────────────────────────────────── */}
        {activeTab === "ads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Ad Copy ({DEMO_ADS.length})</h3>
            </div>

            <div className="space-y-3">
              {DEMO_ADS.map((ad) => (
                <div key={ad.id} className="rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ad.status} />
                      <span className="text-xs text-text-muted">{ad.name}</span>
                    </div>
                    <CopyButton text={`${ad.headline}\n\n${ad.description}`} />
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3">
                    <div className="text-sm font-medium text-text-primary">{ad.headline}</div>
                    <div className="text-xs text-text-muted mt-1">{ad.description}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-xs text-text-muted">
                    <span>{ad.impressions.toLocaleString()} impressions</span>
                    <span>{ad.clicks} clicks</span>
                    <span>{ad.ctr}% CTR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CREATIVE TAB ─────────────────────────────────────────── */}
        {activeTab === "creative" && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-text-primary">Ad Creative Library</h3>

            {/* Google Ads */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Google Ads</h4>
              <div className="space-y-3">
                {[
                  { name: "280E Software - Ad 1", h1: "Cannabis 280E Tax Software", h2: "Save $75K+ on Federal Taxes", h3: "Automated COGS Allocation", desc: "Stop overpaying on 280E. Tranquillo Green automates COGS allocation, finds missed deductions, and generates audit-ready workpapers. Calculate your savings in 60 seconds." },
                  { name: "280E Software - Ad 2", h1: "Stop Overpaying on 280E", h2: "Find Missed Deductions Fast", h3: "Built for Cannabis Operators", desc: "Most operators leave $75K+ on the table. Our 280E engine finds facility rent, labor, and shipping deductions your current software misses. Free calculator." },
                  { name: "Metrc Integration", h1: "Metrc + Accounting, One Platform", h2: "Stop Reconciling Manually", h3: "Real-Time Inventory Sync", desc: "Tranquillo Green syncs Metrc with your books automatically. Catch variances before auditors do. Multi-entity, multi-state, fully compliant." },
                  { name: "CPA Partnership", h1: "Cannabis CPA Firm Software", h2: "Serve 3x More Clients", h3: "White-Label 280E Reports", desc: "Purpose-built for cannabis CPA firms. Multi-client portal, automated 280E allocations, white-label exports, 20% revenue share." },
                ].map((ad) => (
                  <div key={ad.name} className="rounded-xl border border-border bg-surface-raised p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-muted">{ad.name}</span>
                      <CopyButton text={`${ad.h1}\n${ad.h2}\n${ad.h3}\n\n${ad.desc}`} />
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3 space-y-1">
                      <div className="text-sm font-medium text-blue-400">{ad.h1}</div>
                      <div className="text-sm font-medium text-blue-400">{ad.h2}</div>
                      <div className="text-sm font-medium text-blue-400">{ad.h3}</div>
                      <div className="text-xs text-text-muted mt-2">{ad.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LinkedIn Ads */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">LinkedIn Ads</h4>
              <div className="space-y-3">
                {[
                  { name: "Operator - Single Image", headline: "Your 280E allocations shouldn't take 16 hours/month", body: "Tranquillo Green automates COGS allocation under IRC 280E and 471(c). Full audit trail. Metrc-integrated. CPA-ready exports. Most operators find $75K+ in missed deductions.", cta: "Calculate Your Savings" },
                  { name: "Operator - Carousel", headline: "5 Ways Cannabis Operators Overpay on 280E", body: "Card 1: Most operators overpay $75K+ in federal taxes every year. Card 2: Manual allocations take 16 hours/month. Card 3: Metrc reconciliation that catches variances. Card 4: CPA-ready audit packets. Card 5: Calculate your savings →", cta: "Learn More" },
                  { name: "CPA Partnership", headline: "Stop rebuilding 280E cost studies from scratch", body: "Tranquillo Green's CPA Partner Program gives you multi-client tools, automated allocations, white-label exports, and 20% revenue share. Serve more clients without hiring.", cta: "Apply for Partnership" },
                ].map((ad) => (
                  <div key={ad.name} className="rounded-xl border border-border bg-surface-raised p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-muted">{ad.name}</span>
                      <CopyButton text={`${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`} />
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                      <div className="text-sm font-medium text-text-primary">{ad.headline}</div>
                      <div className="text-xs text-text-muted">{ad.body}</div>
                      <div className="inline-block rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white">{ad.cta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reddit Ads */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Reddit Ads</h4>
              <div className="space-y-3">
                {[
                  { name: "280E Deductions Post", title: "We built software that finds missed 280E deductions. Here's what we found.", body: "We analyzed 50+ cannabis operator tax returns and found that 73% were overpaying on 280E by an average of $94K/year. The main culprit? Missed COGS deductions on facility rent and inventory labor. We built a free calculator to estimate your potential savings. No email required." },
                  { name: "Month-End Close Poll", title: "How much time does your team spend on month-end close?", body: "We surveyed 100+ cannabis operators. Average: 3 weeks. The ones using Tranquillo Green: 4 days. The difference? Automated 280E allocations, Metrc reconciliation, and CPA-ready exports in one platform." },
                ].map((ad) => (
                  <div key={ad.name} className="rounded-xl border border-border bg-surface-raised p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-muted">{ad.name}</span>
                      <CopyButton text={`${ad.title}\n\n${ad.body}`} />
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                      <div className="text-sm font-medium text-text-primary">{ad.title}</div>
                      <div className="text-xs text-text-muted">{ad.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
