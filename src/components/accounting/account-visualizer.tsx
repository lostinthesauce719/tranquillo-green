"use client";

import { useMemo } from "react";
import { type DemoChartOfAccount } from "@/lib/demo/accounting";
import { TrendingUp } from "lucide-react";

export function AccountVisualizer({ accounts }: { accounts: DemoChartOfAccount[] }) {
  const categories = useMemo(() => {
    const assets = accounts.filter(a => a.category === "asset");
    const liabilities = accounts.filter(a => a.category === "liability");
    const equity = accounts.filter(a => a.category === "equity");
    const opex = accounts.filter(a => a.category === "opex");
    return { assets, liabilities, equity, opex };
  }, [accounts]);

  const totalRevenueMock = 1245000;

  return (
    <div className="w-full flex-col flex items-center justify-center p-4">
      {/* Total Revenue Central Bubble */}
      <div className="relative mb-8 flex flex-col items-center justify-center">
        <div className="absolute -inset-8 animate-[pulse-ring_3s_cubic-bezier(0.24,0,0.38,1)_infinite] rounded-full border border-emerald-500/20" />
        <div className="absolute -inset-4 animate-[pulse-ring_3s_cubic-bezier(0.24,0,0.38,1)_infinite_1s] rounded-full border border-emerald-500/10" />
        
        <div className="relative flex size-48 flex-col items-center justify-center rounded-full bg-gradient-to-tr from-emerald-900/60 to-emerald-600/60 shadow-[0_0_30px_rgba(167,243,208,0.2)] backdrop-blur-md border border-emerald-400/30">
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">Total Revenue</span>
          <span className="mt-1 text-3xl font-serif text-white glowing-mint-text drop-shadow-md">
            ${(totalRevenueMock / 1000000).toFixed(2)}M
          </span>
          <div className="mt-2 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
            <TrendingUp className="size-3" />
            <span>+14.2%</span>
          </div>
        </div>
      </div>

      {/* Account Cluster */}
      <div className="w-full">
        <div className="text-center text-[10px] uppercase tracking-[0.2em] text-text-muted mt-2 mb-6">
          Account Distribution & Tax Admissibility
        </div>
        
        <div className="flex flex-wrap items-center justify-center mt-4 gap-6">
          {/* Asset Bubbles */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-800/40 text-center shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <div className="text-sm font-semibold text-emerald-100">{categories.assets.length}</div>
            </div>
            <span className="text-xs text-text-faint">Assets</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-800/40 text-center shadow-[0_0_15px_rgba(251,191,36,0.1)]">
              <div className="text-sm font-semibold text-amber-100">{categories.liabilities.length}</div>
            </div>
            <span className="text-xs text-text-faint">Liabilities</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex size-24 items-center justify-center rounded-full border border-teal-400/30 bg-teal-800/40 text-center shadow-[0_0_15px_rgba(45,212,191,0.1)]">
              <div className="relative">
                <div className="text-xl font-semibold text-teal-100">{categories.opex.length}</div>
                <div className="text-[10px] text-teal-200/50 -mt-1">OpEx</div>
              </div>
            </div>
            <span className="text-xs text-text-faint">280E Tracker</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full border border-blue-400/30 bg-blue-800/40 text-center shadow-[0_0_15px_rgba(96,165,250,0.1)]">
              <div className="text-sm font-semibold text-blue-100">{categories.equity.length}</div>
            </div>
            <span className="text-xs text-text-faint">Equity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
