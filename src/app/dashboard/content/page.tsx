"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import {
  Calendar,
  Clock,
  Send,
  Edit3,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  ExternalLink,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Mail,
  Twitter,
  Linkedin,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

interface ContentItem {
  id: string;
  platform: "twitter" | "linkedin" | "reddit" | "email";
  type: "post" | "thread" | "comment" | "email";
  status: "scheduled" | "published" | "draft" | "failed";
  scheduledDate: string;
  content: string;
  engagement?: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

/* ─── Demo Data ─────────────────────────────────────────────────── */

const DEMO_CONTENT: ContentItem[] = [
  { id: "co1", platform: "twitter", type: "thread", status: "scheduled", scheduledDate: "2026-05-18T09:00:00Z", content: "Most cannabis operators overpay $75K+ in federal taxes every year. Not because they're bad at math. Because their software doesn't understand 280E. Here's what's actually happening 👇 (1/7)" },
  { id: "co2", platform: "linkedin", type: "post", status: "scheduled", scheduledDate: "2026-05-19T08:30:00Z", content: "Your controller just spent 16 hours this month on 280E COGS allocations. Manual splits across 3 entities. Copy-paste from QuickBooks. And they'll do it again next month. Here's the math: 16 hours × $75/hr = $1,200/month in labor..." },
  { id: "co3", platform: "reddit", type: "comment", status: "scheduled", scheduledDate: "2026-05-20T12:30:00Z", content: "We switched from QuickBooks + spreadsheets to Tranquillo Green about 6 months ago. The 280E allocation engine alone saved us probably 15 hours/month and found deductions we were missing on rent and labor allocation..." },
  { id: "co4", platform: "twitter", type: "post", status: "published", scheduledDate: "2026-05-15T09:00:00Z", content: "How many hours does your team spend on month-end close? 🔘 0-5 hours 🔘 5-10 hours 🔘 10-20 hours 🔘 20+ hours", engagement: { impressions: 4200, clicks: 89, conversions: 12 } },
  { id: "co5", platform: "email", type: "email", status: "scheduled", scheduledDate: "2026-05-22T10:00:00Z", content: "Subject: Your 280E savings could be $75K+ — Hi [First Name], You ran the 280E calculator. Here's what the numbers say..." },
  { id: "co6", platform: "linkedin", type: "post", status: "published", scheduledDate: "2026-05-14T08:30:00Z", content: "CASE STUDY: How a 3-location Michigan dispensary found $210K in missed deductions. The operator was claiming 28% COGS. After running their data through Tranquillo Green's 280E engine: → Identified 41% COGS (13 percentage point difference)...", engagement: { impressions: 8900, clicks: 234, conversions: 18 } },
];

/* ─── Components ────────────────────────────────────────────────── */

function PlatformIcon({ platform }: { platform: ContentItem["platform"] }) {
  const config = {
    twitter: { icon: Twitter, color: "text-sky-400", label: "Twitter" },
    linkedin: { icon: Linkedin, color: "text-blue-400", label: "LinkedIn" },
    reddit: { icon: MessageSquare, color: "text-orange-400", label: "Reddit" },
    email: { icon: Mail, color: "text-brand", label: "Email" },
  };
  const c = config[platform];
  const Icon = c.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={"h-4 w-4 " + c.color} />
      <span className="text-xs text-text-muted">{c.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const config = {
    scheduled: { label: "Scheduled", color: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: Clock },
    published: { label: "Published", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
    draft: { label: "Draft", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30", icon: Edit3 },
    failed: { label: "Failed", color: "bg-red-500/15 text-red-300 border-red-500/30", icon: AlertCircle },
  };
  const c = config[status];
  const Icon = c.icon;
  return <span className={"inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border " + c.color}><Icon className="h-3 w-3" />{c.label}</span>;
}

/* ─── Main Page ─────────────────────────────────────────────────── */

export default function ContentEnginePage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "content" | "analytics">("calendar");
  const [filterPlatform, setFilterPlatform] = useState<"all" | ContentItem["platform"]>("all");

  const filteredContent = DEMO_CONTENT.filter((c) => {
    if (filterPlatform !== "all" && c.platform !== filterPlatform) return false;
    return true;
  });

  const scheduledCount = DEMO_CONTENT.filter((c) => c.status === "scheduled").length;
  const publishedCount = DEMO_CONTENT.filter((c) => c.status === "published").length;
  const totalImpressions = DEMO_CONTENT.reduce((s, c) => s + (c.engagement?.impressions || 0), 0);
  const totalClicks = DEMO_CONTENT.reduce((s, c) => s + (c.engagement?.clicks || 0), 0);
  const totalConversions = DEMO_CONTENT.reduce((s, c) => s + (c.engagement?.conversions || 0), 0);

  return (
    <AppShell title="Content Engine" description="Automate your content marketing across Twitter, LinkedIn, Reddit, and email.">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Scheduled</span>
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2 text-xl font-bold text-text-primary">{scheduledCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Published</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl font-bold text-text-primary">{publishedCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Impressions</span>
              <BarChart3 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 text-xl font-bold text-text-primary">{totalImpressions.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Conversions</span>
              <Send className="h-4 w-4 text-brand" />
            </div>
            <div className="mt-2 text-xl font-bold text-text-primary">{totalConversions}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1">
          {(["calendar", "content", "analytics"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition " + (activeTab === tab ? "bg-brand text-white" : "text-text-muted hover:text-text-secondary")}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── CALENDAR TAB ─────────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Content Calendar</h3>
              <div className="flex items-center gap-2">
                <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as typeof filterPlatform)}
                  className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-text-primary focus:border-brand focus:outline-none">
                  <option value="all">All platforms</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="reddit">Reddit</option>
                  <option value="email">Email</option>
                </select>
                <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                  <Plus className="h-3 w-3" /> Create Post
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredContent.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={item.platform} />
                      <span className="text-xs text-text-muted">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-text-faint">{new Date(item.scheduledDate).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{item.content}</p>
                  {item.engagement && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                      <span>{item.engagement.impressions.toLocaleString()} impressions</span>
                      <span>{item.engagement.clicks} clicks</span>
                      <span>{item.engagement.conversions} conversions</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-overlay transition-colors">
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary hover:bg-surface-overlay transition-colors">
                      <Copy className="h-3 w-3" /> Duplicate
                    </button>
                    {item.status === "scheduled" && (
                      <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-brand hover:bg-brand/10 transition-colors">
                        <Send className="h-3 w-3" /> Publish Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENT TAB ─────────────────────────────────────────── */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Content Library</h3>
              <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition-colors">
                <Plus className="h-3 w-3" /> New Content
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "280E Tax Savings Thread", platform: "Twitter", type: "7-tweet thread", status: "Ready to publish" },
                { title: "Month-End Close Post", platform: "LinkedIn", type: "Single post", status: "Ready to publish" },
                { title: "Metrc Reconciliation Comment", platform: "Reddit", type: "Comment", status: "Ready to publish" },
                { title: "CPA Partnership Announcement", platform: "LinkedIn", type: "Single post", status: "Draft" },
                { title: "Lead Nurture Email #1", platform: "Email", type: "Welcome email", status: "Ready to publish" },
                { title: "Case Study: Michigan", platform: "LinkedIn", type: "Long-form post", status: "Ready to publish" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between mb-2">
                    <PlatformIcon platform={item.platform.toLowerCase() as ContentItem["platform"]} />
                    <span className="text-xs text-text-faint">{item.type}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary">{item.title}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-text-muted">{item.status}</span>
                    <button className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand/80">
                      <ExternalLink className="h-3 w-3" /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ───────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="text-xs font-medium text-text-muted">Total Impressions</div>
                <div className="mt-2 text-2xl font-bold text-text-primary">{totalImpressions.toLocaleString()}</div>
                <div className="mt-1 text-xs text-emerald-400">↑ 23% vs last week</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="text-xs font-medium text-text-muted">Total Clicks</div>
                <div className="mt-2 text-2xl font-bold text-text-primary">{totalClicks}</div>
                <div className="mt-1 text-xs text-emerald-400">↑ 15% vs last week</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="text-xs font-medium text-text-muted">Conversions</div>
                <div className="mt-2 text-2xl font-bold text-text-primary">{totalConversions}</div>
                <div className="mt-1 text-xs text-emerald-400">↑ 30% vs last week</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-raised p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Performance by Platform</h3>
              <div className="space-y-4">
                {(["twitter", "linkedin", "reddit", "email"] as const).map((platform) => {
                  const items = DEMO_CONTENT.filter((c) => c.platform === platform && c.engagement);
                  const impressions = items.reduce((s, c) => s + (c.engagement?.impressions || 0), 0);
                  const clicks = items.reduce((s, c) => s + (c.engagement?.clicks || 0), 0);
                  const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : "0";
                  return (
                    <div key={platform} className="flex items-center gap-4">
                      <PlatformIcon platform={platform} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">{impressions.toLocaleString()} impressions</span>
                          <span className="text-text-muted">{clicks} clicks · {ctr}% CTR</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min((impressions / totalImpressions) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
