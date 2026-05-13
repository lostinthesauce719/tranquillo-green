"use client";

import { useZenMode } from "./zen-mode-provider";
import { cn } from "@/lib/utils";

/* ─── Sakura petal SVG ─────────────────────────────────────────── */

function SakuraPetal({ className, delay }: { className?: string; delay: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("absolute pointer-events-none", className)}
      style={{
        animation: `sakura-drift 4s ease-in-out ${delay}s infinite`,
      }}
      aria-hidden
    >
      <path
        d="M8 0C8 0 12 4 12 8C12 12 8 16 8 16C8 16 4 12 4 8C4 4 8 0 8 0Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  );
}

/* ─── Lotus icon (zen off) ─────────────────────────────────────── */

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* Center petal */}
      <path
        d="M12 4C12 4 14 8 14 12C14 16 12 20 12 20C12 20 10 16 10 12C10 8 12 4 12 4Z"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Left petal */}
      <path
        d="M12 8C12 8 8 6 5 8C2 10 4 14 4 14C4 14 6 12 8 11C10 10 12 8 12 8Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Right petal */}
      <path
        d="M12 8C12 8 16 6 19 8C22 10 20 14 20 14C20 14 18 12 16 11C14 10 12 8 12 8Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {/* Base line */}
      <path
        d="M6 18C8 16 10 15 12 15C14 15 16 16 18 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fillOpacity="0"
      />
    </svg>
  );
}

/* ─── Leaf sparkle (zen on) ────────────────────────────────────── */

function LeafSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* Happy leaf face */}
      <path
        d="M6 20C6 20 4 12 10 7C16 2 20 2 20 2C20 2 18 10 12 15C6 20 6 20 6 20Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Leaf vein */}
      <path
        d="M6 20C10 16 15 10 20 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Kawaii eye — left */}
      <circle cx="11" cy="10" r="1" fill="currentColor" fillOpacity="0.7" />
      {/* Kawaii eye — right */}
      <circle cx="15" cy="8" r="1" fill="currentColor" fillOpacity="0.7" />
      {/* Happy mouth */}
      <path
        d="M10 13C11 14.5 13.5 14 14 12.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fillOpacity="0"
      />
      {/* Sparkle */}
      <path
        d="M18 5L19 3L20 5L19 4L18 5Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  );
}

/* ─── Tranquillo Button ────────────────────────────────────────── */

export function TranquilloButton({
  className,
  showLabel = false,
}: {
  className?: string;
  /** Show "Zen" / "Pro" label next to the icon */
  showLabel?: boolean;
}) {
  const { zen, toggleZen } = useZenMode();

  return (
    <button
      type="button"
      onClick={toggleZen}
      aria-label={zen ? "Switch to professional mode" : "Switch to zen mode"}
      aria-pressed={zen}
      className={cn(
        // Base
        "group relative inline-flex items-center gap-2 rounded-xl font-medium",
        "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",

        // Zen off — subtle pill
        !zen &&
          "h-9 px-3 text-xs text-text-muted bg-surface border border-border-subtle hover:bg-surface-overlay hover:text-text-secondary hover:border-border",

        // Zen on — glowing sakura pill
        zen &&
          "h-9 px-3 text-xs text-brand bg-brand-soft border border-brand/20 shadow-[0_0_16px_rgba(92,184,136,0.12)] hover:shadow-[0_0_24px_rgba(92,184,136,0.2)]",

        className
      )}
    >
      {/* Sakura petals (only when zen active) */}
      {zen && (
        <>
          <SakuraPetal
            className="-top-1 -left-1 w-2.5 h-2.5 text-brand/50"
            delay={0}
          />
          <SakuraPetal
            className="-top-2 left-3 w-2 h-2 text-accent/40"
            delay={1.2}
          />
          <SakuraPetal
            className="-top-0.5 right-0 w-2 h-2 text-violet/40"
            delay={2.4}
          />
        </>
      )}

      {/* Icon */}
      <span
        className={cn(
          "relative z-10 flex h-5 w-5 items-center justify-center transition-transform duration-[var(--duration-normal)]",
          zen ? "scale-110" : "scale-100 group-hover:scale-105"
        )}
      >
        {zen ? (
          <LeafSparkle className="h-5 w-5 text-brand" />
        ) : (
          <LotusIcon className="h-5 w-5 text-text-muted group-hover:text-text-secondary" />
        )}
      </span>

      {/* Label */}
      {showLabel && (
        <span className="relative z-10">
          {zen ? "Zen" : "Pro"}
        </span>
      )}

      {/* Hover glow ring */}
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-opacity duration-[var(--duration-normal)]",
          zen
            ? "bg-brand/5 opacity-100 group-hover:bg-brand/10"
            : "bg-brand/0 opacity-0 group-hover:bg-brand/5 group-hover:opacity-100"
        )}
        aria-hidden
      />
    </button>
  );
}
