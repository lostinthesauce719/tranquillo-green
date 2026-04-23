"use client";

import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
   MONOCHROMATIC PLAYING CARD
   — Perspective hover, iridescence, noise texture, specular mouse glow
   — Every visual aspect is tweakable via props
   ═══════════════════════════════════════════════════════════════════ */

export type Suit = "♠" | "♥" | "♦" | "♣";

export interface PlayingCardTweaks {
  tiltMaxDeg: number;
  perspective: number;
  scale: number;
  springStiffness: number;
  glowIntensity: number;
  glowRadius: number;
  glowSpread: number;
  specularSize: number;
  specularIntensity: number;
  iridescenceStrength: number;
  iridescenceHueShift: number;
  noiseOpacity: number;
  noiseScale: number;
  borderGlow: number;
  borderWidth: number;
  pipSize: number;
  cornerRankSize: number;
  backPatternOpacity: number;
  transitionMs: number;
}

export const DEFAULT_CARD_TWEAKS: PlayingCardTweaks = {
  tiltMaxDeg: 18,
  perspective: 800,
  scale: 1.06,
  springStiffness: 0.08,
  glowIntensity: 0.55,
  glowRadius: 60,
  glowSpread: 30,
  specularSize: 50,
  specularIntensity: 0.8,
  iridescenceStrength: 0.35,
  iridescenceHueShift: 0.8,
  noiseOpacity: 0.06,
  noiseScale: 1.5,
  borderGlow: 0.35,
  borderWidth: 1.5,
  pipSize: 1.4,
  cornerRankSize: 1.2,
  backPatternOpacity: 0.15,
  transitionMs: 400,
};

interface PlayingCardProps {
  rank?: string;
  suit?: Suit;
  faceUp?: boolean;
  tweaks?: Partial<PlayingCardTweaks>;
  label?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  baseHue?: number;
  baseSaturation?: number;
  baseLightness?: number;
  className?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  "♠": "♠",
  "♥": "♥",
  "♦": "♦",
  "♣": "♣",
  leaf: "🌿",
  diamond: "◆",
  drop: "💧",
  star: "★",
};

function hsl(h: number, s: number, l: number, a?: number) {
  return a !== undefined
    ? `hsla(${h}, ${s}%, ${l}%, ${a})`
    : `hsl(${h}, ${s}%, ${l}%)`;
}

export function PlayingCard({
  rank = "A",
  suit = "♠",
  faceUp = true,
  tweaks = {},
  label = "Tranquillo",
  width = 280,
  height = 400,
  borderRadius = 16,
  baseHue = 152,
  baseSaturation = 60,
  baseLightness = 30,
  className,
}: PlayingCardProps) {
  const t = { ...DEFAULT_CARD_TWEAKS, ...tweaks };

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [entered, setEntered] = useState(false);
  const rafRef = useRef<number | null>(null);
  const targetTilt = useRef({ x: 0, y: 0 });

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Smooth tilt interpolation
  const animateTilt = useCallback(() => {
    setTilt((prev) => {
      const dx = targetTilt.current.x - prev.x;
      const dy = targetTilt.current.y - prev.y;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return prev;
      return {
        x: prev.x + dx * t.springStiffness,
        y: prev.y + dy * t.springStiffness,
      };
    });
    rafRef.current = requestAnimationFrame(animateTilt);
  }, [t.springStiffness]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animateTilt);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animateTilt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
      targetTilt.current = {
        x: (0.5 - y) * t.tiltMaxDeg * 2,
        y: (x - 0.5) * t.tiltMaxDeg * 2,
      };
    },
    [t.tiltMaxDeg]
  );

  const handleMouseLeave = useCallback(() => {
    targetTilt.current = { x: 0, y: 0 };
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // SVG noise filter
  const noiseId = useMemo(() => `noise-${Math.random().toString(36).slice(2, 8)}`, []);

  // Computed colors
  const cardBg = hsl(baseHue, baseSaturation, baseLightness);
  const cardBgLight = hsl(baseHue, baseSaturation, baseLightness + 8);
  const cardBgDark = hsl(baseHue, baseSaturation, baseLightness - 5);
  const borderColor = hsl(baseHue, baseSaturation - 10, baseLightness + 20, t.borderGlow);
  const innerBorderColor = hsl(baseHue, baseSaturation, baseLightness + 30, 0.15);
  const textColor = hsl(baseHue, baseSaturation - 30, 90);
  const textColorMuted = hsl(baseHue, baseSaturation - 40, 70, 0.7);
  const glowColor = hsl(baseHue, baseSaturation + 10, baseLightness + 25, t.glowIntensity);

  // Specular follows mouse
  const specX = mousePos.x * 100;
  const specY = mousePos.y * 100;

  // Iridescent gradient angle based on mouse
  const iridAngle =
    Math.atan2(mousePos.y - 0.5, mousePos.x - 0.5) * (180 / Math.PI) + 90;

  // Dynamic shadow based on tilt
  const shadowX = tilt.y * -0.8;
  const shadowY = tilt.x * 0.8 + 8;
  const dynamicShadow = `${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.5), 0 0 ${t.glowSpread}px ${glowColor}`;

  const symbol = SUIT_SYMBOLS[suit] ?? suit;

  const cardStyle: React.CSSProperties = faceUp
    ? {
        width,
        height,
        borderRadius,
        background: `linear-gradient(145deg, ${cardBgLight}, ${cardBg}, ${cardBgDark})`,
        border: `${t.borderWidth}px solid ${borderColor}`,
        boxShadow: dynamicShadow,
        transform: `
          rotateX(${tilt.x}deg)
          rotateY(${tilt.y}deg)
          scale(${isHovered ? t.scale : 1})
          ${entered ? "translateY(0)" : "translateY(30px)"}
        `,
        opacity: entered ? 1 : 0,
        transition: isHovered
          ? `box-shadow 0.15s ease-out, opacity 0.6s ease-out`
          : `transform ${t.transitionMs}ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease-out, opacity ${t.transitionMs}ms ease-out`,
        position: "relative" as const,
        overflow: "hidden" as const,
        cursor: "default",
        transformStyle: "preserve-3d" as const,
        willChange: "transform, box-shadow",
      }
    : {
        width,
        height,
        borderRadius,
        background: `linear-gradient(145deg, ${cardBgDark}, ${cardBg}, ${cardBgLight})`,
        border: `${t.borderWidth}px solid ${borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 ${t.glowSpread}px ${hsl(baseHue, baseSaturation, baseLightness + 15, 0.2)}`,
        transform: entered ? "translateY(0)" : "translateY(30px)",
        opacity: entered ? 1 : 0,
        transition: `opacity ${t.transitionMs}ms ease-out, transform ${t.transitionMs}ms ease-out`,
        position: "relative" as const,
        overflow: "hidden" as const,
        cursor: "default",
      };

  if (!faceUp) {
    return (
      <div
        style={{
          perspective: `${t.perspective}px`,
          width: width + 20,
          height: height + 20,
        }}
        className={`inline-flex items-center justify-center ${className ?? ""}`}
      >
        <div style={cardStyle}>
          {/* Back pattern */}
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: borderRadius - 4,
              border: `${t.borderWidth}px solid ${hsl(baseHue, baseSaturation - 20, baseLightness + 15, 0.25)}`,
              opacity: t.backPatternOpacity + 0.1,
              background: `repeating-linear-gradient(45deg, ${hsl(baseHue, baseSaturation, baseLightness + 10, 0.08)} 0px, ${hsl(baseHue, baseSaturation, baseLightness + 10, 0.08)} 1px, transparent 1px, transparent 8px)`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        perspective: `${t.perspective}px`,
        width: width + 20,
        height: height + 20,
      }}
      className={`inline-flex items-center justify-center ${className ?? ""}`}
    >
      {/* SVG noise filter (hidden) */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id={noiseId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={t.noiseScale}
              numOctaves={4}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={cardStyle}
      >
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: borderRadius - 1,
            border: `1px solid ${innerBorderColor}`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Iridescent sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius,
            background: `linear-gradient(${iridAngle}deg,
              transparent 15%,
              hsla(${baseHue + 40}, 80%, 70%, ${t.iridescenceStrength * 0.3}) 30%,
              hsla(${baseHue - 24}, 70%, 60%, ${t.iridescenceStrength * 0.2}) 48%,
              hsla(${baseHue + 12}, 90%, 75%, ${t.iridescenceStrength * 0.45}) 62%,
              hsla(${baseHue - 32}, 75%, 65%, ${t.iridescenceStrength * 0.25}) 78%,
              transparent 90%
            )`,
            mixBlendMode: "overlay",
            pointerEvents: "none",
            zIndex: 2,
            transition: "background 0.1s ease-out",
          }}
        />

        {/* Specular highlight (follows mouse) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius,
            background: `radial-gradient(
              circle ${t.specularSize * 3.6}px at ${specX}% ${specY}%,
              rgba(255, 255, 255, ${t.specularIntensity * 0.5}) 0%,
              rgba(255, 255, 255, ${t.specularIntensity * 0.15}) 30%,
              transparent 70%
            )`,
            mixBlendMode: "soft-light",
            pointerEvents: "none",
            zIndex: 3,
            transition: "background 0.05s ease-out",
          }}
        />

        {/* Edge glow (follows mouse) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius,
            background: `radial-gradient(
              ellipse ${t.specularSize * 4.3}px ${t.specularSize * 2.8}px at ${specX}% ${specY}%,
              ${hsl(baseHue, baseSaturation + 20, baseLightness + 35, t.glowIntensity * 0.4)} 0%,
              transparent 60%
            )`,
            pointerEvents: "none",
            zIndex: 4,
            transition: "background 0.08s ease-out",
          }}
        />

        {/* Noise texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius,
            filter: `url(#${noiseId})`,
            opacity: t.noiseOpacity,
            mixBlendMode: "overlay",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Top-left corner */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: t.cornerRankSize * 35,
              fontWeight: 700,
              lineHeight: 1,
              color: textColor,
              fontFamily: "serif",
              textShadow: `0 0 12px ${glowColor}`,
            }}
          >
            {rank}
          </span>
          <span
            style={{
              fontSize: t.pipSize * 20,
              lineHeight: 1,
              filter: `drop-shadow(0 0 6px ${glowColor})`,
              color: textColor,
            }}
          >
            {symbol}
          </span>
        </div>

        {/* Center suit (large) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 80,
            opacity: 0.2,
            filter: `drop-shadow(0 0 20px ${glowColor})`,
            color: textColor,
            zIndex: 10,
          }}
        >
          {symbol}
        </div>

        {/* Bottom-right corner (inverted) */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            transform: "rotate(180deg)",
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: t.cornerRankSize * 35,
              fontWeight: 700,
              lineHeight: 1,
              color: textColor,
              fontFamily: "serif",
              textShadow: `0 0 12px ${glowColor}`,
            }}
          >
            {rank}
          </span>
          <span
            style={{
              fontSize: t.pipSize * 20,
              lineHeight: 1,
              filter: `drop-shadow(0 0 6px ${glowColor})`,
              color: textColor,
            }}
          >
            {symbol}
          </span>
        </div>

        {/* Label */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: textColorMuted,
            fontFamily: "sans-serif",
            zIndex: 10,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// Re-export as default for backward compatibility
export default PlayingCard;
