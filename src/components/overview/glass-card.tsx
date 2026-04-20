import type { CSSProperties, ReactNode } from "react";

// ── GlassPill ────────────────────────────────────────────────────────────────

type PillTone = "neutral" | "brand" | "warning" | "danger" | "success" | "info" | "violet" | "accent";

const PILL_TONES: Record<PillTone, { bg: string; fg: string; bd: string }> = {
  neutral: { bg: "var(--surface-overlay)",  fg: "var(--text-secondary)", bd: "var(--border)"              },
  brand:   { bg: "var(--mint-soft)",         fg: "var(--mint)",           bd: "rgba(72,192,114,0.3)"       },
  warning: { bg: "var(--resin-soft)",        fg: "var(--resin)",          bd: "rgba(242,177,71,0.3)"       },
  danger:  { bg: "var(--danger-soft)",       fg: "var(--danger)",         bd: "rgba(239,68,68,0.3)"        },
  success: { bg: "var(--success-soft)",      fg: "var(--success)",        bd: "rgba(34,197,94,0.3)"        },
  info:    { bg: "var(--info-soft)",         fg: "var(--info)",           bd: "rgba(59,130,246,0.3)"       },
  violet:  { bg: "var(--violet-soft)",       fg: "var(--violet)",         bd: "rgba(139,92,246,0.3)"       },
  accent:  { bg: "var(--accent-soft)",       fg: "var(--accent)",         bd: "rgba(212,146,42,0.3)"       },
};

export function GlassPill({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: ReactNode;
  tone?: PillTone;
  size?: "sm" | "md";
}) {
  const t = PILL_TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontSize: size === "sm" ? 9.5 : 10.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </span>
  );
}

// ── GlassCard ────────────────────────────────────────────────────────────────

export function GlassCard({
  title,
  subtitle,
  right,
  children,
  hue,
  padding = 18,
  breathe = false,
  className = "",
  style,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  hue?: string;
  padding?: number;
  breathe?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const tintBg = hue
    ? `linear-gradient(180deg, color-mix(in oklch, ${hue} 7%, var(--surface)), var(--surface) 60%)`
    : "var(--surface)";
  const tintBorder = hue ? `color-mix(in oklch, ${hue} 28%, var(--border))` : "var(--border)";

  return (
    <div
      className={`glass${breathe ? " breathe" : ""} ${className}`.trim()}
      style={{
        background: tintBg,
        border: `1px solid ${tintBorder}`,
        borderRadius: 14,
        padding,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {hue && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${hue}, transparent 80%)`,
          }}
        />
      )}
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && (
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--text-faint)",
                  fontWeight: 600,
                }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  marginTop: 6,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
