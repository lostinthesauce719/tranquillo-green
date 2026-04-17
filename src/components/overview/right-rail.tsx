import { VARIANCE_TREND, FILINGS, PIPELINE, ACTIVITY, fmtK, type ActivityTag } from "@/lib/demo/overview-data";
import { GlassCard } from "./glass-card";
import { VarianceChart, FunnelChart } from "./charts";

// ── VarianceCard ─────────────────────────────────────────────────────────────

export function VarianceCard() {
  return (
    <GlassCard hue="var(--hue-variance)" title="Cash variance · 6mo" subtitle="Absolute $ by month">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <VarianceChart data={VARIANCE_TREND} height={80} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            Current
          </div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: "var(--resin)" }}>
            -$146
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            6mo avg
          </div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>
            -$234
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── FilingsCard ───────────────────────────────────────────────────────────────

export function FilingsCard() {
  return (
    <GlassCard
      hue="var(--hue-filings)"
      title="Upcoming filings"
      right={
        <a href="/dashboard/compliance" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>
          All →
        </a>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FILINGS.map((f) => (
          <div
            key={f.form}
            style={{
              padding: 10,
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: f.daysLeft <= 10 ? "var(--resin)" : "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {f.daysLeft}d
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
                {f.form} · {f.due}
              </span>
              {f.amount != null && (
                <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {fmtK(f.amount)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── PipelineCard ──────────────────────────────────────────────────────────────

export function PipelineCard() {
  return (
    <GlassCard hue="var(--hue-pipeline)" title="Transaction pipeline" subtitle="842 imported this period">
      <FunnelChart data={PIPELINE} />
    </GlassCard>
  );
}

// ── ActivityCard ──────────────────────────────────────────────────────────────

const DOT_COLOR: Record<ActivityTag, string> = {
  approve:  "var(--mint)",
  alert:    "var(--resin)",
  import:   "var(--info)",
  evidence: "var(--accent)",
  lock:     "var(--violet)",
  filing:   "var(--info)",
};

export function ActivityCard() {
  const events = ACTIVITY.slice(0, 6);
  return (
    <GlassCard hue="var(--hue-activity)" title="Activity pulse" subtitle="Audit trail · last hour">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {events.map((a, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "14px 1fr auto",
              gap: 8,
              padding: "8px 0",
              borderBottom: i < events.length - 1 ? "1px solid var(--border-subtle)" : "none",
              alignItems: "flex-start",
            }}
          >
            <div style={{ paddingTop: 5 }}>
              <span
                className="dot-live"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: DOT_COLOR[a.tag],
                  display: "block",
                }}
              />
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{a.who}</span>
              <span style={{ color: "var(--text-muted)" }}> {a.what}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", paddingTop: 2 }}>
              {a.t}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
