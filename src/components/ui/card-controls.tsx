"use client";

import React from "react";
import { type PlayingCardTweaks, DEFAULT_CARD_TWEAKS } from "./playing-card";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step, onChange, unit = "" }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-faint font-mono">
          {typeof value === "number" ? (Number.isInteger(step) ? value : value.toFixed(2)) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none bg-surface-raised cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,133,90,0.4)]
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-0"
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export interface CardControlsProps {
  tweaks: PlayingCardTweaks;
  onChange: (tweaks: PlayingCardTweaks) => void;
}

export function CardControls({ tweaks, onChange }: CardControlsProps) {
  const set = (key: keyof PlayingCardTweaks, value: number | string) => {
    onChange({ ...tweaks, [key]: value });
  };

  return (
    <div className="tranquillo-card w-72 p-5 space-y-5 overflow-y-auto max-h-[80vh]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Card Tweaks</h3>
        <button
          onClick={() => onChange({ ...DEFAULT_CARD_TWEAKS })}
          className="text-[10px] uppercase tracking-wider text-brand hover:text-brand/80 transition"
        >
          Reset
        </button>
      </div>

      <Section title="Perspective">
        <Slider label="Tilt Range" value={tweaks.tiltMaxDeg} min={2} max={45} step={1} onChange={(v) => set("tiltMaxDeg", v)} unit="°" />
        <Slider label="FOV" value={tweaks.perspective} min={300} max={2000} step={50} onChange={(v) => set("perspective", v)} unit="px" />
        <Slider label="Hover Scale" value={tweaks.scale} min={1} max={1.2} step={0.01} onChange={(v) => set("scale", v)} unit="x" />
        <Slider label="Smoothing" value={tweaks.springStiffness} min={0.02} max={0.5} step={0.01} onChange={(v) => set("springStiffness", v)} />
      </Section>

      <Section title="Glow">
        <Slider label="Intensity" value={tweaks.glowIntensity} min={0} max={1} step={0.01} onChange={(v) => set("glowIntensity", v)} />
        <Slider label="Radius" value={tweaks.glowRadius} min={10} max={150} step={5} onChange={(v) => set("glowRadius", v)} unit="px" />
        <Slider label="Spread" value={tweaks.glowSpread} min={-40} max={20} step={1} onChange={(v) => set("glowSpread", v)} unit="px" />
      </Section>

      <Section title="Specular">
        <Slider label="Spot Size" value={tweaks.specularSize} min={20} max={120} step={5} onChange={(v) => set("specularSize", v)} unit="%" />
        <Slider label="Intensity" value={tweaks.specularIntensity} min={0} max={1} step={0.01} onChange={(v) => set("specularIntensity", v)} />
      </Section>

      <Section title="Iridescence">
        <Slider label="Strength" value={tweaks.iridescenceStrength} min={0} max={1} step={0.01} onChange={(v) => set("iridescenceStrength", v)} />
        <Slider label="Hue Shift" value={tweaks.iridescenceHueShift} min={0} max={2} step={0.05} onChange={(v) => set("iridescenceHueShift", v)} unit="°/px" />
      </Section>

      <Section title="Noise">
        <Slider label="Opacity" value={tweaks.noiseOpacity} min={0} max={0.3} step={0.005} onChange={(v) => set("noiseOpacity", v)} />
        <Slider label="Grain Scale" value={tweaks.noiseScale} min={0.3} max={3} step={0.1} onChange={(v) => set("noiseScale", v)} />
      </Section>

      <Section title="Border">
        <Slider label="Glow" value={tweaks.borderGlow} min={0} max={1} step={0.01} onChange={(v) => set("borderGlow", v)} />
        <Slider label="Width" value={tweaks.borderWidth} min={0.5} max={4} step={0.5} onChange={(v) => set("borderWidth", v)} unit="px" />
      </Section>

      <Section title="Card Face">
        <Slider label="Pip Size" value={tweaks.pipSize} min={0.8} max={3} step={0.1} onChange={(v) => set("pipSize", v)} unit="rem" />
        <Slider label="Rank Size" value={tweaks.cornerRankSize} min={0.6} max={2} step={0.1} onChange={(v) => set("cornerRankSize", v)} unit="rem" />
        <Slider label="Back Pattern" value={tweaks.backPatternOpacity} min={0} max={0.5} step={0.01} onChange={(v) => set("backPatternOpacity", v)} />
      </Section>

      <Section title="Animation">
        <Slider label="Release Time" value={tweaks.transitionMs} min={100} max={1000} step={50} onChange={(v) => set("transitionMs", v)} unit="ms" />
      </Section>
    </div>
  );
}
