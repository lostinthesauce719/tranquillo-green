import { ALLOCATIONS, fmtUSD, fmtK, fmtPct } from "@/lib/demo/overview-data";
import { Sparkline } from "./charts";

type Delta = { positive: boolean; value: string };

function KpiTile({
  label,
  value,
  suffix,
  sub,
  delta,
  trend,
  accent,
  hue,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  sub: string;
  delta?: Delta;
  trend?: number[];
  accent?: string;
  hue?: string;
}) {
  const tintBg = hue
    ? `linear-gradient(180deg, color-mix(in oklch, ${hue} 8%, var(--surface)), var(--surface) 65%)`
    : "var(--surface)";
  const tintBorder = hue ? `color-mix(in oklch, ${hue} 30%, var(--border))` : "var(--border)";

  return (
    <div
      className="glass"
      style={{
        background: tintBg,
        border: `1px solid ${tintBorder}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 132,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hue && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${hue}, transparent 80%)`,
          }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontSize: 10.5,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--text-faint)",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {delta && (
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: delta.positive ? "var(--mint)" : "var(--resin)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {delta.positive ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <div
          className="mono"
          style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}
        >
          {value}
        </div>
        {suffix && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{sub}</div>
      <div style={{ marginTop: "auto", height: 32 }}>
        {trend && <Sparkline data={trend} color={accent ?? "var(--mint)"} width={220} height={32} />}
      </div>
    </div>
  );
}

export function KpiRow() {
  const inQueue = ALLOCATIONS.ready + ALLOCATIONS.needsSupport + ALLOCATIONS.pendingController;
  const total = ALLOCATIONS.deductible + ALLOCATIONS.nondeductible;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <KpiTile
        hue="var(--hue-kpis)"
        label="Allocation queue"
        value={inQueue}
        suffix={`/ ${ALLOCATIONS.total}`}
        sub={`${ALLOCATIONS.approved} approved · ${ALLOCATIONS.needsSupport} need support`}
        delta={{ positive: false, value: "+3 vs Mar" }}
        trend={[22, 28, 25, 31, 27, 33]}
        accent="var(--mint)"
      />
      <KpiTile
        hue="var(--hue-280e)"
        label="Unreconciled cash"
        value={fmtUSD(146)}
        sub="2 workspaces in follow-up · 2 ready"
        delta={{ positive: true, value: "33% vs Mar" }}
        trend={[420, 380, 520, 290, 320, 146]}
        accent="var(--resin)"
      />
      <KpiTile
        hue="var(--hue-cash)"
        label="280E exposure"
        value={fmtK(ALLOCATIONS.nondeductible)}
        sub={`${fmtPct(ALLOCATIONS.nondeductible / total, 1)} of total spend this period`}
        delta={{ positive: false, value: "+5.2%" }}
        trend={ALLOCATIONS.trend.map((t) => t.non)}
        accent="var(--resin)"
      />
      <KpiTile
        hue="var(--hue-action)"
        label="Filings due"
        value="2"
        suffix="· 9d"
        sub="CA excise Apr 30 · sales & use May 2"
        trend={[2, 2, 3, 2, 2, 2]}
        accent="var(--info)"
      />
    </div>
  );
}
