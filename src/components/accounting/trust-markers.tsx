import { cn } from "@/lib/utils";
import { AccountingStatusBadge } from "./accounting-status-badge";

/**
 * Reusable trust-signal components for making the product feel
 * more trustworthy, defensible, and audit-ready.
 */

/* ── Evidence Badge ─────────────────────────────────────────── */

type EvidenceTone = "verified" | "partial" | "pending" | "missing" | "info";

const evidenceConfig: Record<EvidenceTone, { label: string; tone: "emerald" | "amber" | "slate" | "rose" | "blue"; icon: string }> = {
  verified: { label: "Evidence verified", tone: "emerald", icon: "✓" },
  partial: { label: "Partial evidence", tone: "amber", icon: "◐" },
  pending: { label: "Evidence pending", tone: "slate", icon: "◌" },
  missing: { label: "Evidence missing", tone: "rose", icon: "!" },
  info: { label: "Source-linked", tone: "blue", icon: "◎" },
};

export function EvidenceBadge({ tone = "info", label }: { tone?: EvidenceTone; label?: string }) {
  const config = evidenceConfig[tone];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
      tone === "verified" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      tone === "partial" && "border-amber-500/20 bg-amber-500/10 text-amber-200",
      tone === "pending" && "border-slate-500/20 bg-slate-500/10 text-slate-300",
      tone === "missing" && "border-rose-500/20 bg-rose-500/10 text-rose-200",
      tone === "info" && "border-blue-500/20 bg-blue-500/10 text-blue-200",
    )}>
      <span className="text-xs">{config.icon}</span>
      {label ?? config.label}
    </span>
  );
}

/* ── Confidence Indicator ───────────────────────────────────── */

export function ConfidenceIndicator({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100);
  const tone: "emerald" | "amber" | "rose" = pct >= 90 ? "emerald" : pct >= 70 ? "amber" : "rose";
  const toneClass = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-surface">
        <div className={cn("h-1.5 rounded-full transition-all", toneClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn(
        "text-[11px] font-medium",
        tone === "emerald" && "text-emerald-300",
        tone === "amber" && "text-amber-300",
        tone === "rose" && "text-rose-300",
      )}>
        {label ? `${label} ${pct}%` : `${pct}%`}
      </span>
    </div>
  );
}

/* ── Reviewer Timestamp ─────────────────────────────────────── */

export function ReviewerTimestamp({
  reviewer,
  timestamp,
  action,
}: {
  reviewer: string;
  timestamp: string;
  action?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-text-muted">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-semibold text-accent">
        {reviewer.charAt(0).toUpperCase()}
      </span>
      <span className="font-medium text-text-primary">{reviewer}</span>
      {action ? <span className="text-text-muted/60">•</span> : null}
      {action ? <span>{action}</span> : null}
      <span className="text-text-muted/60">•</span>
      <span>{timestamp}</span>
    </div>
  );
}

/* ── Audit Context Bar ──────────────────────────────────────── */

export function AuditContextBar({
  sourceSystem,
  lastVerified,
  documentCount,
  confidence,
}: {
  sourceSystem: string;
  lastVerified: string;
  documentCount?: number;
  confidence?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <span className="text-accent">◎</span>
        <span className="font-medium">Source:</span>
        <span className="text-text-primary">{sourceSystem}</span>
      </div>
      <span className="text-text-muted/30">|</span>
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <span className="text-emerald-400">✓</span>
        <span className="font-medium">Last verified:</span>
        <span>{lastVerified}</span>
      </div>
      {documentCount != null ? (
        <>
          <span className="text-text-muted/30">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="font-medium">Docs:</span>
            <span className="text-text-primary">{documentCount}</span>
          </div>
        </>
      ) : null}
      {confidence != null ? (
        <>
          <span className="text-text-muted/30">|</span>
          <ConfidenceIndicator value={confidence} label="Confidence" />
        </>
      ) : null}
    </div>
  );
}

/* ── Source Link Badge ───────────────────────────────────────── */

export function SourceLinkBadge({
  sourceName,
  sourceRef,
  href,
}: {
  sourceName: string;
  sourceRef: string;
  href?: string;
}) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-mono text-text-muted transition hover:border-accent/30 hover:text-text-primary">
      <span className="text-accent text-[10px]">⟐</span>
      <span className="font-medium">{sourceName}</span>
      <span className="text-text-muted/40">:</span>
      <span>{sourceRef}</span>
    </span>
  );

  if (href) {
    return <a href={href} className="no-underline">{inner}</a>;
  }
  return inner;
}

/* ── Integration Trust Indicator ─────────────────────────────── */

type IntegrationStatus = "connected" | "partial" | "disconnected" | "syncing";

const integrationConfig: Record<IntegrationStatus, { tone: "emerald" | "amber" | "rose" | "blue"; icon: string }> = {
  connected: { tone: "emerald", icon: "●" },
  partial: { tone: "amber", icon: "◐" },
  disconnected: { tone: "rose", icon: "○" },
  syncing: { tone: "blue", icon: "◌" },
};

export function IntegrationTrustBadge({
  status,
  label,
  lastSync,
}: {
  status: IntegrationStatus;
  label: string;
  lastSync?: string;
}) {
  const config = integrationConfig[status];
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-sm",
        status === "connected" && "text-emerald-400",
        status === "partial" && "text-amber-400",
        status === "disconnected" && "text-rose-400",
        status === "syncing" && "text-blue-400 animate-pulse",
      )}>
        {config.icon}
      </span>
      <span className="text-[11px] font-medium text-text-primary">{label}</span>
      {lastSync ? (
        <span className="text-[11px] text-text-muted/60">Last sync: {lastSync}</span>
      ) : null}
    </div>
  );
}

/* ── Version Lineage Badge ───────────────────────────────────── */

export function VersionLineageBadge({
  version,
  generatedAt,
  owner,
}: {
  version: string;
  generatedAt: string;
  owner: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">v{version}</span>
      <span className="text-text-muted/30">|</span>
      <span className="text-[11px] text-text-muted">{generatedAt}</span>
      <span className="text-text-muted/30">|</span>
      <span className="text-[11px] text-text-primary">{owner}</span>
    </div>
  );
}

/* ── What-Changed Rationale ──────────────────────────────────── */

export function WhatChangedRationale({
  changes,
}: {
  changes: { field: string; from: string; to: string }[];
}) {
  if (changes.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">What changed</div>
      <div className="mt-2 space-y-1.5">
        {changes.map((change) => (
          <div key={change.field} className="flex items-start gap-2 text-[12px]">
            <span className="font-medium text-text-primary">{change.field}:</span>
            <span className="text-rose-300 line-through">{change.from}</span>
            <span className="text-text-muted/40">→</span>
            <span className="text-emerald-300">{change.to}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Trust Section Header ────────────────────────────────────── */

export function TrustSectionHeader({
  title,
  subtitle,
  evidence,
}: {
  title: string;
  subtitle?: string;
  evidence?: EvidenceTone;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-accent">{title}</div>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>
      {evidence ? <EvidenceBadge tone={evidence} /> : null}
    </div>
  );
}
