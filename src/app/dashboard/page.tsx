"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/* ─── Stat data ─── */
const stats = [
  {
    label: "Ledger Accounts",
    value: "18",
    sub: "17 active · 1 dormant",
    pct: 94,
    color: "var(--teal)",
    glow: "var(--teal)",
  },
  {
    label: "Periods in Motion",
    value: "3",
    sub: "1 closed · 2 open · 0 blocked",
    pct: 60,
    color: "var(--gold)",
    glow: "var(--gold)",
  },
  {
    label: "Current Period",
    value: "March 2026",
    sub: "REVIEW · Golden State Greens, LLC",
    pct: 66,
    color: "var(--lav)",
    glow: "var(--lav)",
    small: true,
  },
];

/* ─── Revenue waterfall data ─── */
const waterfall = [
  { label: "Gross Sales", amount: 1252000, color: "var(--teal)", ded: true },
  { label: "COGS Deduct.", amount: 204000, color: "var(--lav)", ded: true },
  { label: "Gross Profit", amount: 1048000, color: "#0bbf90", ded: true },
  { label: "Non-Ded OpEx", amount: 176000, color: "var(--blush)", ded: false },
  { label: "Net Operating", amount: 872000, color: "var(--gold)", ded: false },
  { label: "280E Savings", amount: 35000, color: "var(--sky)", ded: true },
];

const maxAmount = Math.max(...waterfall.map((w) => w.amount));
const chartH = 260;

/* ─── Account data ─── */
const accountSections = [
  {
    name: "Revenue",
    color: "var(--teal)",
    accounts: [
      { name: "Gross Sales", code: "4010", val: "$1252k", ded: true, color: "var(--teal)" },
    ],
    total: "$1252k",
    totalColor: "var(--teal)",
  },
  {
    name: "Assets",
    color: "#09a47c",
    accounts: [
      { name: "Checking — Chase", code: "1010", val: "$312k", ded: true, color: "var(--teal)" },
      { name: "Petty Cash / Vault", code: "1050", val: "$19k", ded: true, color: "#0bbf90" },
      { name: "AR — Dispensary", code: "1200", val: "$87k", ded: true, color: "#09a47c" },
      { name: "Inventory — Raw", code: "1500", val: "$204k", ded: true, color: "#078a68" },
      { name: "Inventory — WIP", code: "1510", val: "$97k", ded: true, color: "#057054" },
    ],
    total: "$719k",
    totalColor: "var(--teal)",
  },
  {
    name: "Liabilities",
    color: "var(--gold)",
    accounts: [
      { name: "AP — Trade", code: "2010", val: "$63k", ded: true, color: "var(--gold)" },
      { name: "Sales Tax Payable", code: "2020", val: "$12k", ded: true, color: "#d49420" },
      { name: "Accrued Expenses", code: "2030", val: "$28k", ded: true, color: "#bf8018" },
    ],
    total: "$103k",
    totalColor: "var(--gold)",
  },
];

/* ─── Workspace cards ─── */
const workspaces = [
  { icon: "⊗", title: "280E Allocations", desc: "Review splits, overrides, and policy trail. 1 escalated.", href: "/dashboard/allocations" },
  { icon: "⊜", title: "Cash Reconciliation", desc: "Source breakdown, variance drivers, and investigation notes.", href: "/dashboard/reconciliations" },
  { icon: "↗", title: "CPA Handoff", desc: "Build close packets, 280E support schedules, and handoff checklists.", href: "/dashboard/exports" },
];

export default function DashboardPage() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  return (
    <AppShell
      title="Accounting"
      description="Chart of Accounts · Golden State Greens, LLC"
    >
      {/* Stats Row */}
      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <div className="stat-glow" style={{ background: s.glow }} />
            <div className="stat-lbl">{s.label}</div>
            <div className={`stat-num ${s.small ? "v" : s.color === "var(--gold)" ? "g" : "t"}`}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${s.pct}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Viz Card */}
      <div className="viz-card">
        <div className="viz-head">
          <div className="vh-left">
            <div className="vh-eyebrow">Chart of Accounts</div>
            <div className="vh-title">Ledger Visualizer</div>
            <div className="vh-sub">Real-time financial flow · 280E admissibility · March 2026</div>
          </div>
          <div className="vh-right">
            <span className="vtag">VERTICAL · ACCRUAL</span>
            <span className="vpill on">Flow</span>
            <span className="vpill">Waterfall</span>
            <span className="vpill">Donut</span>
          </div>
        </div>
        <div className="viz-body">
          <div className="vz-left">
            {/* SVG Waterfall Chart */}
            <svg viewBox="0 0 846 280" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
              <defs>
                {waterfall.map((w, i) => (
                  <g key={i}>
                    <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={w.color} stopOpacity=".95" />
                      <stop offset="100%" stopColor={w.color} stopOpacity=".08" />
                    </linearGradient>
                    <filter id={`gw${i}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </g>
                ))}
              </defs>
              {/* Bars */}
              {waterfall.map((w, i) => {
                const barH = (w.amount / maxAmount) * (chartH - 60);
                const y = chartH - 40 - barH;
                const x = 52 + i * 140;
                return (
                  <g key={i}>
                    <rect x={x} y={y - 2} width="62" height={barH + 4} rx="9" fill={`${w.color}10`} filter={`url(#gw${i})`} />
                    <rect x={x + 2} y={y} width="58" height={barH} rx="7" fill={`url(#g${i})`} />
                    <text x={x + 31} y={y - 11} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="10.5" fontWeight="500" fill={w.color}>
                      {currency.format(w.amount)}
                    </text>
                    <text x={x + 31} y={chartH - 18} textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fontWeight="600" fill="#7a829e" transform={`rotate(-20,${x + 31},${chartH - 18})`}>
                      {w.label}
                    </text>
                  </g>
                );
              })}
              {/* Total Revenue */}
              <text x="83" y="30" textAnchor="middle" fontFamily="'Syne',sans-serif" fontSize="20" fontWeight="800" fill="var(--teal)">
                {currency.format(1252000)}
              </text>
              <text x="83" y="46" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="8" fontWeight="600" fill="#7a829e" letterSpacing="1.2">
                TOTAL REVENUE
              </text>
              {/* Baseline */}
              <line x1="32" y1={chartH - 38} x2="824" y2={chartH - 38} stroke="rgba(255,255,255,.04)" strokeWidth="1" />
            </svg>

            {/* KPI Chips */}
            <div className="kpi-row">
              <div className="kpi-chip" style={{ background: `${waterfall[0].color}10`, borderColor: `${waterfall[0].color}35` }}>
                <span className="kc-l" style={{ color: waterfall[0].color }}>Gross Margin</span>
                <span className="kc-v" style={{ color: waterfall[0].color }}>83.4%</span>
              </div>
              <div className="kpi-chip" style={{ background: `${waterfall[5].color}10`, borderColor: `${waterfall[5].color}35` }}>
                <span className="kc-l" style={{ color: waterfall[5].color }}>280E Savings</span>
                <span className="kc-v" style={{ color: waterfall[5].color }}>$34,969</span>
              </div>
              <div className="kpi-chip" style={{ background: `${waterfall[1].color}10`, borderColor: `${waterfall[1].color}35` }}>
                <span className="kc-l" style={{ color: waterfall[1].color }}>COGS Ratio</span>
                <span className="kc-v" style={{ color: waterfall[1].color }}>16.3%</span>
              </div>
              <div className="kpi-chip" style={{ background: `${waterfall[3].color}10`, borderColor: `${waterfall[3].color}35` }}>
                <span className="kc-l" style={{ color: waterfall[3].color }}>Non-Deductible</span>
                <span className="kc-v" style={{ color: waterfall[3].color }}>$175.6k</span>
              </div>
            </div>
          </div>

          {/* Right Panel — Account List */}
          <div className="vz-right">
            {accountSections.map((section) => (
              <div key={section.name}>
                <div className="ac-section" style={{ color: section.color }}>{section.name}</div>
                {section.accounts.map((acct) => (
                  <div
                    key={acct.code}
                    className={`ac-row ${selectedAccount === acct.code ? "on" : ""}`}
                    onClick={() => setSelectedAccount(selectedAccount === acct.code ? null : acct.code)}
                  >
                    <div className="ac-led" style={{ background: acct.color, boxShadow: `0 0 5px ${acct.color}88` }} />
                    <span className="ac-name">{acct.name}</span>
                    <span className="ac-code">{acct.code}</span>
                    <span className="ac-val" style={{ color: acct.color }}>{acct.val}</span>
                    <span className={`ac-tag ${acct.ded ? "d" : "n"}`}>{acct.ded ? "DED" : "NON-DED"}</span>
                  </div>
                ))}
                <div className="ac-sub">
                  <span>Total</span>
                  <span style={{ color: section.totalColor }}>{section.total}</span>
                </div>
              </div>
            ))}

            {/* Selected Account Detail */}
            {selectedAccount && (
              <div className="sel-box">
                <div className="sel-title">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--teal)", display: "inline-block" }} />
                  Account {selectedAccount}
                </div>
                <div className="sel-sub">Gross Sales · 4010</div>
                <div className="kv"><span className="kv-k">Period Balance</span><span className="kv-v" style={{ color: "var(--teal)" }}>$1,252,000</span></div>
                <div className="kv"><span className="kv-k">Budget</span><span className="kv-v">$1,180,000</span></div>
                <div className="kv"><span className="kv-k">Variance</span><span className="kv-v" style={{ color: "var(--gold)" }}>+$72,000 (6.1%)</span></div>
                <div className="kv"><span className="kv-k">280E Status</span><span className="ac-tag d" style={{ fontSize: 10 }}>DEDUCTIBLE</span></div>
                <div className="kv-bar"><div className="kv-fill" style={{ width: "106%", background: "var(--teal)" }} /></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workspaces */}
      <div>
        <div className="ws-label">Quick Access</div>
        <div className="ws-grid">
          {workspaces.map((ws) => (
            <Link key={ws.href} href={ws.href} className="ws-card no-underline block">
              <div className="ws-ico">{ws.icon}</div>
              <div className="ws-title">{ws.title}</div>
              <div className="ws-desc">{ws.desc}</div>
              <div className="ws-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}