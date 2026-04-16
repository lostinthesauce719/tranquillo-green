"use client";

import React, { useState } from 'react';

/**
 * TRANQUILLO GREEN: CONTROLLER COMMAND CENTER
 * Integrated UI/UX for Cannabis Accounting & 280E Compliance
 */

const TranquilloCommandCenter = () => {
  const [isCascaded, setIsCascaded] = useState(false);
  const [selectedBlocker, setSelectedBlocker] = useState<{ id: number; title: string; severity: string; area: string; desc: string } | null>(null);
  const [forecastActive, setForecastActive] = useState(false);

  // Mock Data for the Interface
  const blockers = [
    { id: 1, title: '280E Allocation Mismatch', severity: 'high', area: 'Inventory', desc: 'Oakland warehouse operating cash requires manual 280E mapping.' },
    { id: 2, title: 'Unmapped Payroll Tax', severity: 'high', area: 'Compliance', desc: 'New state-level tax code 26-117 detected in recent import.' },
    { id: 3, title: 'Inventory Valuation Gap', severity: 'medium', area: 'Cultivation', desc: 'Discrepancy between METRC and persisted Convex records.' },
  ];

  const pipelineStages = ['Imported', 'Mapped', '280E Review', 'Posted'];
  const liveTransactions = [
    { id: 'TX-901', amount: '$4,200', stage: '280E Review', warning: false },
    { id: 'TX-902', amount: '$12,850', stage: 'Imported', warning: true },
    { id: 'TX-903', amount: '$920', stage: 'Mapped', warning: false },
  ];

  return (
    <div className="min-h-screen bg-[#04160E] text-[#DFFFD6] font-sans p-6 overflow-hidden bg-gradient-to-br from-[#04160E] via-[#0A1F16] to-[#142D24]">

      {/* --- 1. GLOBAL HEADER --- */}
      <header className="flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#48C072] rounded-full blur-[2px] shadow-[0_0_15px_rgba(72,192,114,0.5)]" />
          <div>
            <h1 className="text-3xl font-serif tracking-wide">Tranquillo <span className="text-[#48C072] italic">Green</span></h1>
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Golden State Greens, LLC // Colorado Springs, CO</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-2xl text-right">
            <span className="block text-[9px] uppercase opacity-40 tracking-tighter">Reporting Period</span>
            <span className="font-bold text-[#48C072]">April 2026</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">

        {/* --- 2. LEFT NAVIGATION (THE RAIL) --- */}
        <nav className="col-span-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] flex flex-col items-center py-10 space-y-10">
          {['01', '02', '03', '04', '05'].map((num) => (
            <div key={num} className="text-xs font-mono opacity-30 hover:opacity-100 cursor-pointer transition-all hover:text-[#48C072]">
              {num}
            </div>
          ))}
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-40 italic">?</div>
        </nav>

        {/* --- 3. CENTER HUB: READINESS & BLOCKERS --- */}
        <div className="col-span-11 grid grid-cols-3 gap-6">

          {/* Close Readiness Orb */}
          <section className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center relative group">
            <span className="absolute top-6 left-8 text-[10px] font-mono opacity-40 uppercase">Close Readiness</span>
            <div className="relative flex items-center justify-center">
              {/* Simplified SVG Ring */}
              <svg className="w-48 h-48 -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                <circle cx="96" cy="96" r="88" stroke="#48C072" strokeWidth="12" fill="transparent" strokeDasharray="440, 552" strokeLinecap="round" className="drop-shadow-[0_0_10px_#48C072]" />
              </svg>
              <div className="absolute text-center">
                <span className="text-5xl font-serif">82%</span>
                <p className="text-[9px] uppercase opacity-40 tracking-widest mt-1">Aggregated</p>
              </div>
            </div>
          </section>

          {/* Critical Blockers Cascade */}
          <section className="col-span-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-mono opacity-40 uppercase">Critical Blockers</span>
              <button
                onClick={() => setIsCascaded(!isCascaded)}
                className="text-[9px] border border-[#48C072]/50 text-[#48C072] px-4 py-1 rounded-full hover:bg-[#48C072] hover:text-[#04160E] transition-all"
              >
                {isCascaded ? 'COLLAPSE DECK' : 'CASCADE FLOW'}
              </button>
            </div>

            <div className="relative h-64">
              {blockers.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlocker(b)}
                  style={{
                    top: isCascaded ? `${i * 90}px` : `${i * 12}px`,
                    zIndex: 10 - i,
                    transform: isCascaded ? 'scale(1)' : `scale(${1 - (i * 0.03)})`,
                    opacity: isCascaded ? 1 : 1 - (i * 0.2)
                  }}
                  className={`absolute w-full p-5 rounded-2xl cursor-pointer transition-all duration-500 border
                    ${b.severity === 'high' ? 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-white/10'}
                    bg-[#0D241B]/80 hover:bg-[#143327] hover:translate-x-2`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-[8px] font-bold uppercase tracking-widest ${b.severity === 'high' ? 'text-orange-400' : 'text-[#48C072]'}`}>
                        {b.severity} PRIORITY // {b.area}
                      </p>
                      <h4 className="text-lg font-medium tracking-tight mt-1">{b.title}</h4>
                    </div>
                    <span className="opacity-20">→</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Overview Checklist & Field Mapping Preview */}
          <section className="col-span-3 grid grid-cols-3 gap-6">
             <div className="col-span-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6">
                <span className="text-[9px] font-mono opacity-40 uppercase block mb-4">Teleport Checklist</span>
                <div className="space-y-4">
                  {['Inventory (4 Errors)', 'Payroll Tax', 'METRC Sync'].map((item, idx) => (
                    <div key={item} className="flex items-center gap-3 group cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${idx === 0 ? 'bg-[#48C072] border-[#48C072]' : 'border-white/20 group-hover:border-[#48C072]'}`}>
                        {idx === 0 && <span className="text-[10px] text-[#04160E] font-bold">✓</span>}
                      </div>
                      <span className={`text-xs ${idx === 0 ? 'opacity-40 line-through' : 'opacity-80'}`}>{item}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] p-6 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-serif">Controller Command</h4>
                  <p className="text-xs opacity-50 max-w-[200px] mt-2">Adjust dates for past confirmations or activate forecast logic.</p>
                </div>
                <button
                  onClick={() => setForecastActive(!forecastActive)}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all ${forecastActive ? 'bg-[#48C072] text-[#04160E] shadow-[0_0_20px_#48C072]' : 'bg-white/10 text-white'}`}
                >
                  {forecastActive ? 'FORECAST LIVE' : 'ACTIVATE FORECAST'}
                </button>
             </div>
          </section>
        </div>
      </main>

      {/* --- 4. THE TRANQUILLO RIVER (Bottom Pipeline) --- */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 pt-0 pointer-events-none">
        <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[40px] p-8 pointer-events-auto shadow-2xl">
          <div className="flex justify-between relative">
            {/* Stage Labels */}
            {pipelineStages.map((stage) => (
              <div key={stage} className="flex flex-col items-center space-y-3 z-10">
                <span className="text-[9px] font-mono uppercase opacity-30 tracking-[0.3em]">{stage}</span>
                <div className="w-3 h-3 rounded-full bg-[#142D24] border border-[#48C072]/40 shadow-[0_0_8px_rgba(72,192,114,0.2)]" />
              </div>
            ))}

            {/* The Floating River Line */}
            <div className="absolute top-9 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#48C072]/20 to-transparent" />

            {/* Transactions Bubbles */}
            <div className="absolute inset-x-10 top-5 h-12">
               {liveTransactions.map((tx, idx) => (
                 <div
                  key={tx.id}
                  style={{ left: `${(idx + 1) * 25}%` }}
                  className={`absolute -translate-x-1/2 p-2 px-4 rounded-xl border backdrop-blur-md flex items-center gap-3 transition-all cursor-pointer hover:scale-110
                    ${tx.warning ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-white/10 bg-white/5'}`}
                 >
                   <span className="text-[10px] font-bold text-[#48C072]">{tx.amount}</span>
                   <span className="text-[8px] opacity-30">{tx.id}</span>
                   {tx.warning && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                 </div>
               ))}
            </div>
          </div>

          {/* Controller Timeline Scrub */}
          <div className="mt-12 flex items-center gap-6">
            <span className="text-[9px] font-mono opacity-20">PAST</span>
            <div className="flex-1 h-[2px] bg-white/5 relative">
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-4 h-4 bg-[#48C072] rounded-full shadow-[0_0_10px_#48C072] cursor-pointer" />
            </div>
            <span className="text-[9px] font-mono opacity-20">FUTURE</span>
          </div>
        </div>
      </footer>

      {/* --- 5. SOLUTION MODAL (THEMED) --- */}
      {selectedBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04160E]/90 backdrop-blur-lg p-6">
          <div className="bg-[#0D241B] border border-[#48C072]/30 w-full max-w-md p-10 rounded-[40px] shadow-2xl">
            <h3 className="text-2xl font-serif mb-2">{selectedBlocker.title}</h3>
            <p className="text-xs opacity-50 mb-8 leading-relaxed">{selectedBlocker.desc}</p>

            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-mono uppercase opacity-40 mb-3 block tracking-widest">Target Mapping Entity</label>
                <select className="w-full bg-[#04160E] border border-white/10 text-[#DFFFD6] p-4 rounded-xl outline-none focus:border-[#48C072] transition-colors appearance-none">
                  <option>Select account...</option>
                  <option>1010 - Operating Cash (Oakland)</option>
                  <option>1125 - Inventory - Bulk Flower</option>
                  <option>4000 - Cost of Goods Sold</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setSelectedBlocker(null)}
                  className="flex-1 py-4 bg-[#48C072] text-[#04160E] font-bold rounded-2xl shadow-[0_0_20px_rgba(72,192,114,0.3)] hover:brightness-110 transition-all"
                >
                  RESOLVE & POST
                </button>
                <button
                  onClick={() => setSelectedBlocker(null)}
                  className="px-6 py-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-xs opacity-60"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for Glow and Fonts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #48C072;
          border-radius: 50%;
          box-shadow: 0 0 10px #48C072;
          cursor: pointer;
        }
      `}} />
    </div>
  );
};

export default TranquilloCommandCenter;
