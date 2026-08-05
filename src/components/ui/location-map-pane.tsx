"use client";

import { MapPin } from "lucide-react";

export function LocationMapPane({ companyName, state }: { companyName: string, state: string }) {
  return (
    <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/20 bg-white/5 p-6 backdrop-blur-md min-h-[160px]">
      {/* Abstract Map Background Overlay */}
      <div className="absolute top-0 right-0 h-full w-2/3 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-400" fill="currentColor">
          {/* Extremely abstraction of California shape mapping */}
          <path d="M20,10 L40,15 L45,40 L60,60 L75,80 L70,85 L50,65 L35,45 L15,20 Z" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-900/40 px-3 py-1 shadow-glow backdrop-blur-sm">
          <MapPin className="size-3 text-emerald-300" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
            {state} Operations
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <h3 className="font-serif text-lg tracking-wide text-white glowing-mint-text">{companyName}</h3>
        <p className="text-xs text-text-faint mt-1">Primary corporate ledger & real estate</p>
      </div>
    </section>
  );
}
