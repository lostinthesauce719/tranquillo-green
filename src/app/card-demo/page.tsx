"use client";

import { useState } from "react";
import {
  PlayingCard,
  DEFAULT_CARD_TWEAKS,
  type PlayingCardTweaks,
  type Suit,
} from "@/components/ui/playing-card";
import { CardControls } from "@/components/ui/card-controls";

const SHOWCASE: { rank: string; suit: Suit; faceUp?: boolean }[] = [
  { rank: "A", suit: "♠" },
  { rank: "K", suit: "♥" },
  { rank: "Q", suit: "♦" },
  { rank: "J", suit: "♣" },
  { rank: "10", suit: "♠" },
  { rank: "7", suit: "♥" },
];

export default function CardDemoPage() {
  const [tweaks, setTweaks] = useState<PlayingCardTweaks>({ ...DEFAULT_CARD_TWEAKS });

  return (
    <main className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-4">
        <div className="text-xs uppercase tracking-[0.35em] text-accent mb-2">
          Tranquillo Green
        </div>
        <h1 className="text-3xl font-semibold">Playing Card — Interactive Demo</h1>
        <p className="mt-2 text-sm text-text-muted max-w-xl">
          Hover over any card to see the 3D perspective, iridescent sheen, specular glow, and noise texture.
          Use the controls to tweak every parameter in real-time.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Controls sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <CardControls tweaks={tweaks} onChange={setTweaks} />
          </div>

          {/* Card showcase */}
          <div className="flex-1">
            {/* Hero card — large, isolated */}
            <div className="flex justify-center mb-16">
              <div className="flex flex-col items-center gap-4">
                <PlayingCard
                  rank="A"
                  suit="♠"
                  tweaks={tweaks}
                  faceUp
                />
                <span className="text-xs text-text-faint font-mono">Ace of Spades</span>
              </div>
            </div>

            {/* Grid of cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 justify-items-center">
              {SHOWCASE.map(({ rank, suit, faceUp }) => (
                <div key={`${rank}-${suit}`} className="flex flex-col items-center gap-2">
                  <PlayingCard
                    rank={rank}
                    suit={suit}
                    tweaks={tweaks}
                    faceUp={faceUp ?? true}
                  />
                  <span className="text-[10px] text-text-faint font-mono">
                    {rank}{suit}
                  </span>
                </div>
              ))}
            </div>

            {/* Face-down row */}
            <div className="mt-16 flex justify-center gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <PlayingCard
                    rank="A"
                    suit="♠"
                    tweaks={tweaks}
                    faceUp={false}
                  />
                  <span className="text-[10px] text-text-faint font-mono">Back {i + 1}</span>
                </div>
              ))}
            </div>

            {/* Code snippet */}
            <div className="mt-16 rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Usage</h3>
              <pre className="text-xs text-text-muted overflow-x-auto leading-relaxed">
{`import { PlayingCard } from "@/components/ui/playing-card";

<PlayingCard
  rank="A"
  suit="♠"
  faceUp
  tweaks={{
    tiltMaxDeg: 18,
    glowIntensity: 0.55,
    iridescenceStrength: 0.35,
    noiseOpacity: 0.06,
  }}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
