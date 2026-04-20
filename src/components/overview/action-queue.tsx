"use client";

import { useState } from "react";
import { ACTION_QUEUE, fmtK, type ActionKind } from "@/lib/demo/overview-data";
import { GlassCard, GlassPill } from "./glass-card";

type Filter = "all" | ActionKind;
const FILTERS: Filter[] = ["all", "Allocation", "Rec", "Filing"];

export function ActionQueue() {
  const [filter, setFilter] = useState<Filter>("all");
  const items = filter === "all" ? ACTION_QUEUE : ACTION_QUEUE.filter((i) => i.kind === filter);
  const criticalCount = ACTION_QUEUE.filter((i) => i.severity === "critical").length;

  return (
    <GlassCard
      hue="var(--hue-action)"
      title="Action queue"
      subtitle={
        <span>
          {ACTION_QUEUE.length} items ·{" "}
          <span style={{ color: "var(--danger)" }}>{criticalCount} critical</span>
        </span>
      }
      right={
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 3,
            background: "var(--surface-raised)",
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                background: filter === f ? "var(--surface-overlay)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div>
        {items.map((item, i) => {
          const tone =
            item.severity === "critical" ? "danger" : item.severity === "high" ? "warning" : "neutral";
          const borderColor =
            item.severity === "critical"
              ? "var(--danger)"
              : item.severity === "high"
              ? "var(--resin)"
              : "var(--border-subtle)";

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "3px 90px 1fr auto auto",
                gap: 14,
                alignItems: "center",
                padding: "11px 0",
                borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              {/* severity bar */}
              <div style={{ width: 3, height: 28, background: borderColor, borderRadius: 2 }} />

              {/* pill + kind */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <GlassPill tone={tone} size="sm">{item.severity}</GlassPill>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    paddingLeft: 2,
                  }}
                >
                  {item.kind}
                </span>
              </div>

              {/* title + detail */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.detail}
                </div>
              </div>

              {/* owner + due */}
              <div style={{ textAlign: "right", fontSize: 10.5, color: "var(--text-muted)" }}>
                <div style={{ fontWeight: 500 }}>{item.owner}</div>
                <div
                  className="mono"
                  style={{
                    color: item.due === "Today" ? "var(--resin)" : "var(--text-faint)",
                    marginTop: 2,
                  }}
                >
                  {item.due}
                </div>
              </div>

              {/* amount */}
              <div style={{ textAlign: "right", minWidth: 70 }}>
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.amount < 0 ? "var(--resin)" : "var(--text-primary)",
                  }}
                >
                  {fmtK(Math.abs(item.amount))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
