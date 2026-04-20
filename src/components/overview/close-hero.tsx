import { CLOSE_DATA } from "@/lib/demo/overview-data";
import { GlassPill } from "./glass-card";
import { Ring } from "./charts";
import Link from "next/link";

export function CloseHero() {
  const { period, dayOfClose, totalCloseDays, percentComplete, cpaHandoffTarget, daysToHandoff, milestones } =
    CLOSE_DATA;

  return (
    <div
      className="breathe"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, var(--hue-close) 14%, var(--surface-raised)), var(--surface) 70%)`,
        border: "1px solid color-mix(in oklch, var(--hue-close) 35%, var(--border))",
        borderRadius: 18,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2,
          background: "linear-gradient(90deg, var(--hue-close), transparent 70%)",
        }}
      />
      {/* ambient glow top-right */}
      <div
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 360,
          background: "radial-gradient(ellipse at top right, color-mix(in oklch, var(--hue-close) 20%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* left: info + milestones */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <GlassPill tone="brand">Close in progress</GlassPill>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Period ·{" "}
              <span className="mono" style={{ color: "var(--text-secondary)" }}>
                {period}
              </span>
            </span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--text-faint)", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              CPA handoff ·{" "}
              <span className="mono" style={{ color: "var(--text-secondary)" }}>
                {cpaHandoffTarget}
              </span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Day {dayOfClose} of {totalCloseDays}
            </h2>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
              · {daysToHandoff} business days to a defensible packet
            </span>
          </div>

          {/* milestone strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${milestones.length}, 1fr)`,
              gap: 6,
            }}
          >
            {milestones.map((ms) => (
              <div key={ms.label}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--border-subtle)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${ms.pct * 100}%`,
                      height: "100%",
                      background:
                        ms.status === "complete"
                          ? "var(--mint)"
                          : ms.status === "active"
                          ? "linear-gradient(90deg, var(--mint), var(--resin))"
                          : "transparent",
                      borderRadius: 3,
                      transition: "width 600ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                  {ms.status === "active" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${ms.pct * 100}%`,
                        width: 2,
                        background: "var(--resin)",
                        boxShadow: "0 0 8px var(--resin)",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10.5,
                    color:
                      ms.status === "pending"
                        ? "var(--text-faint)"
                        : ms.status === "active"
                        ? "var(--resin)"
                        : "var(--text-secondary)",
                    fontWeight: ms.status === "active" ? 600 : 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {ms.status === "complete" && (
                    <span style={{ color: "var(--mint)" }}>✓</span>
                  )}
                  {ms.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right: ring + CTAs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            paddingLeft: 24,
            borderLeft: "1px solid var(--border-subtle)",
          }}
        >
          <Ring
            value={percentComplete}
            size={96}
            stroke={8}
            color="var(--mint)"
            label={`${Math.round(percentComplete * 100)}%`}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 170 }}>
            <Link
              href="/dashboard/accounting/close"
              style={{
                display: "block",
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--mint)",
                color: "#041007",
                border: "none",
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
                boxShadow: "0 2px 12px var(--mint-glow)",
              }}
            >
              Resume close →
            </Link>
            <Link
              href="/dashboard/exports"
              style={{
                display: "block",
                padding: "10px 14px",
                borderRadius: 10,
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                fontSize: 12.5,
                fontWeight: 500,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Preview CPA packet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
