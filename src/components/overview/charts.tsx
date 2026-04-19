"use client";

import { useId } from "react";
import type { AllocationTrendPoint, VariancePoint, PipelineStage } from "@/lib/demo/overview-data";

// ── Sparkline ────────────────────────────────────────────────────────────────

export function Sparkline({
  data,
  color = "var(--brand)",
  width = 120,
  height = 32,
  fill = true,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  const uid = useId();
  const id = "sg_" + uid.replace(/:/g, "");
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const points = data.map((v, i): [number, number] => [
    i * step,
    height - ((v - min) / range) * (height - 4) - 2,
  ]);
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaPath = `${path} L${points[points.length - 1][0]},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) =>
        i === points.length - 1 ? (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={color} stroke="var(--surface)" strokeWidth="1.5" />
        ) : null
      )}
    </svg>
  );
}

// ── Ring ─────────────────────────────────────────────────────────────────────

export function Ring({
  value,
  size = 72,
  stroke = 6,
  color = "var(--brand)",
  track = "var(--border)",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div
          className="mono"
          style={{ fontSize: size / 4.5, fontWeight: 600, letterSpacing: "-0.02em", textAlign: "center" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ── StackedBarChart ───────────────────────────────────────────────────────────

export function StackedBarChart({ data, height = 150 }: { data: AllocationTrendPoint[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.ded + d.non));
  const barW = 28;
  const gap = 28;
  const width = data.length * (barW + gap) - gap + 40;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0}
          x2={width}
          y1={height - t * (height - 30)}
          y2={height - t * (height - 30)}
          stroke="var(--border-subtle)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}
      {data.map((d, i) => {
        const x = 20 + i * (barW + gap);
        const total = d.ded + d.non;
        const totalH = (total / max) * (height - 30);
        const dedH = (d.ded / total) * totalH;
        const nonH = totalH - dedH;
        const y = height - 20 - totalH;
        const isLast = i === data.length - 1;
        return (
          <g key={d.m}>
            <rect
              x={x} y={y} width={barW} height={nonH}
              fill={isLast ? "var(--resin)" : "rgba(242,177,71,0.45)"}
              rx="2"
            />
            <rect
              x={x} y={y + nonH} width={barW} height={dedH}
              fill={isLast ? "var(--mint)" : "var(--mint-soft)"}
              stroke={isLast ? "var(--mint)" : "rgba(72,192,114,0.4)"}
              strokeWidth="1"
              rx="2"
            />
            <text
              x={x + barW / 2} y={height - 4}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="Inter"
            >
              {d.m}
            </text>
            {isLast && (
              <text
                x={x + barW / 2} y={y - 8}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {(total / 1000).toFixed(0)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── VarianceChart ─────────────────────────────────────────────────────────────

export function VarianceChart({ data, height = 80 }: { data: VariancePoint[]; height?: number }) {
  const max = Math.max(...data.map((d) => Math.abs(d.v)));
  const barW = 18;
  const gap = 16;
  const width = data.length * (barW + gap);
  return (
    <svg width={width} height={height}>
      <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="var(--border)" strokeWidth="1" />
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const h = (Math.abs(d.v) / max) * (height / 2 - 14);
        const y = d.v < 0 ? height / 2 : height / 2 - h;
        const isLast = i === data.length - 1;
        return (
          <g key={d.m}>
            <rect
              x={x} y={y} width={barW} height={h}
              fill={isLast ? "var(--resin)" : "rgba(242,177,71,0.4)"}
              rx="2"
            />
            <text
              x={x + barW / 2} y={height - 2}
              textAnchor="middle"
              fill="var(--text-faint)"
              fontSize="9"
              fontFamily="Inter"
            >
              {d.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── FunnelChart ───────────────────────────────────────────────────────────────

export function FunnelChart({ data }: { data: PipelineStage[] }) {
  const max = data[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {data.map((d, i) => {
        const w = (d.count / max) * 100;
        const next = data[i + 1];
        const loss = next ? ((d.count - next.count) / d.count) * 100 : 0;
        return (
          <div key={d.stage} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 110, fontSize: 11.5, color: "var(--text-secondary)" }}>{d.stage}</div>
            <div style={{ flex: 1, position: "relative", height: 22 }}>
              <div
                style={{
                  width: `${w}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, var(--mint-soft), rgba(72,192,114,${0.4 - i * 0.05}))`,
                  border: "1px solid rgba(72,192,114,0.4)",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 8,
                }}
              >
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-primary)" }}>
                  {d.count}
                </span>
              </div>
            </div>
            <div className="mono" style={{ width: 60, textAlign: "right", fontSize: 10.5, color: "var(--text-muted)" }}>
              {i > 0 ? `-${loss.toFixed(0)}%` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
