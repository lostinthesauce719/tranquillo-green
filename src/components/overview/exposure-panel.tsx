import { ALLOCATIONS, fmtK, fmtPct } from "@/lib/demo/overview-data";
import { GlassCard, GlassPill } from "./glass-card";
import { StackedBarChart } from "./charts";

export function ExposurePanel() {
  const curr = ALLOCATIONS.trend[ALLOCATIONS.trend.length - 1];
  const total = curr.ded + curr.non;

  return (
    <GlassCard
      hue="var(--hue-280e)"
      title="280E Exposure"
      subtitle={
        <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          Deductible vs nondeductible spend
          <GlassPill tone="brand" size="sm">Defensible</GlassPill>
        </span>
      }
      right={
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--mint)", display: "inline-block" }} />
            <span style={{ color: "var(--text-muted)" }}>Deductible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--resin)", display: "inline-block" }} />
            <span style={{ color: "var(--text-muted)" }}>Nondeductible</span>
          </div>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 24 }}>
        <StackedBarChart data={ALLOCATIONS.trend} height={180} />

        <div
          style={{
            borderLeft: "1px solid var(--border-subtle)",
            paddingLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            justifyContent: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--text-faint)",
                fontWeight: 600,
              }}
            >
              Current period
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>
              {fmtK(total)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {ALLOCATIONS.total} allocation items
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Deductible bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: "var(--text-secondary)" }}>Deductible</span>
                <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {fmtK(curr.ded)}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden" }}>
                <div
                  style={{ width: `${(curr.ded / total) * 100}%`, height: "100%", background: "var(--mint)" }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                {fmtPct(curr.ded / total, 1)} of total
              </div>
            </div>

            {/* Nondeductible bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: "var(--text-secondary)" }}>Nondeductible (280E)</span>
                <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {fmtK(curr.non)}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border-subtle)", overflow: "hidden" }}>
                <div
                  style={{ width: `${(curr.non / total) * 100}%`, height: "100%", background: "var(--resin)" }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                {fmtPct(curr.non / total, 1)} of total
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
