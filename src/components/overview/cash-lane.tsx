import { CASH_RECS, fmtUSD, type RecStatus } from "@/lib/demo/overview-data";
import { GlassCard, GlassPill } from "./glass-card";
import type { CSSProperties } from "react";

type PillTone = "success" | "warning" | "danger" | "info";

const STATUS_CONFIG: Record<RecStatus, { label: string; tone: PillTone }> = {
  balanced:       { label: "Balanced",      tone: "success" },
  investigating:  { label: "Investigating", tone: "warning" },
  exception:      { label: "Exception",     tone: "danger"  },
  ready_to_post:  { label: "Ready to post", tone: "info"    },
};

export function CashLane() {
  return (
    <GlassCard
      hue="var(--hue-cash)"
      title="Cash reconciliations"
      subtitle="Oakland Flagship · April 2026"
      right={
        <a href="/dashboard/reconciliations" style={{ fontSize: 11.5, color: "var(--text-muted)", textDecoration: "none" }}>
          All 4 workspaces →
        </a>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {CASH_RECS.map((rec) => {
          const st = STATUS_CONFIG[rec.status];
          const isBalanced = rec.variance === 0;
          const shortName = rec.loc.split(" — ")[1];
          const typeLabel = rec.type.replace("_", " ");

          return (
            <div
              key={rec.id}
              className="glass"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>
                  {shortName}
                </div>
                <GlassPill tone={st.tone} size="sm">{st.label}</GlassPill>
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {typeLabel}
              </div>
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                <Row label="Expected" value={fmtUSD(rec.expected, 2)} />
                <Row label="Counted"  value={fmtUSD(rec.actual, 2)} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: "1px dashed var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: 10.5, color: "var(--text-secondary)", fontWeight: 500 }}>Variance</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: isBalanced ? "var(--mint)" : "var(--resin)",
                    }}
                  >
                    {isBalanced ? "±0.00" : fmtUSD(rec.variance, 2)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)" }}>Owner · {rec.owner}</div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const s: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10.5,
    color: "var(--text-muted)",
    marginTop: 2,
  };
  return (
    <div style={s}>
      <span>{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}
