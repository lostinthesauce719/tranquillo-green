import { AppShell } from "@/components/shell/app-shell";
import { CloseHero } from "@/components/overview/close-hero";
import { KpiRow } from "@/components/overview/kpi-row";
import { ExposurePanel } from "@/components/overview/exposure-panel";
import { CashLane } from "@/components/overview/cash-lane";
import { ActionQueue } from "@/components/overview/action-queue";
import { VarianceCard, FilingsCard, PipelineCard, ActivityCard } from "@/components/overview/right-rail";

export default function DashboardPage() {
  return (
    <AppShell
      title="Overview"
      description="Everything you need to move from intake to trusted CPA handoff."
    >
      {/* Phase label + system status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          marginTop: -8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "var(--resin)",
            fontWeight: 600,
          }}
        >
          Phase 1 · Command
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            fontSize: 11.5,
          }}
        >
          <span
            className="dot-live"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--mint)",
              boxShadow: "0 0 8px var(--mint-glow)",
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--text-secondary)" }}>All systems nominal</span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: 999,
              background: "var(--text-faint)",
              display: "inline-block",
            }}
          />
          <span className="mono" style={{ color: "var(--text-muted)", fontSize: 10.5 }}>
            Synced 2m ago
          </span>
        </div>
      </div>

      {/* Main content stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <CloseHero />
        <KpiRow />

        {/* Two-column grid: main panels + right rail */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ExposurePanel />
            <CashLane />
            <ActionQueue />
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <VarianceCard />
            <FilingsCard />
            <PipelineCard />
            <ActivityCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
