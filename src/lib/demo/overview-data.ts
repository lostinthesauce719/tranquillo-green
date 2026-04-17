// Demo data for the Overview page — distilled from design prototype data.jsx

export const fmtUSD = (n: number, dec = 0): string => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

export const fmtK = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return fmtUSD(n);
};

export const fmtPct = (n: number, dec = 0): string => (n * 100).toFixed(dec) + "%";

// ── Close period ────────────────────────────────────────────────────────────

export type MilestoneStatus = "complete" | "active" | "pending";

export type Milestone = {
  label: string;
  status: MilestoneStatus;
  pct: number;
};

export type CloseData = {
  period: string;
  dayOfClose: number;
  totalCloseDays: number;
  percentComplete: number;
  cpaHandoffTarget: string;
  daysToHandoff: number;
  milestones: Milestone[];
};

export const CLOSE_DATA: CloseData = {
  period: "April 2026",
  dayOfClose: 1,
  totalCloseDays: 5,
  percentComplete: 0.38,
  cpaHandoffTarget: "May 6",
  daysToHandoff: 5,
  milestones: [
    { label: "Intake",         status: "complete", pct: 1.0 },
    { label: "Bank feeds",     status: "complete", pct: 1.0 },
    { label: "Allocations",    status: "active",   pct: 0.5 },
    { label: "Reconciliations",status: "active",   pct: 0.5 },
    { label: "Review",         status: "pending",  pct: 0   },
    { label: "CPA packet",     status: "pending",  pct: 0   },
  ],
};

// ── Allocations ─────────────────────────────────────────────────────────────

export type AllocationTrendPoint = { m: string; ded: number; non: number };

export type AllocationsData = {
  total: number;
  ready: number;
  needsSupport: number;
  pendingController: number;
  approved: number;
  deductible: number;
  nondeductible: number;
  trend: AllocationTrendPoint[];
};

export const ALLOCATIONS: AllocationsData = {
  total: 47,
  ready: 18,
  needsSupport: 9,
  pendingController: 6,
  approved: 14,
  deductible: 284_614.03,
  nondeductible: 118_470.41,
  trend: [
    { m: "Nov", ded: 242_100, non: 96_400  },
    { m: "Dec", ded: 268_900, non: 102_100 },
    { m: "Jan", ded: 251_200, non: 118_300 },
    { m: "Feb", ded: 274_500, non: 104_200 },
    { m: "Mar", ded: 262_800, non: 112_600 },
    { m: "Apr", ded: 284_614, non: 118_470 },
  ],
};

// ── Cash reconciliations ─────────────────────────────────────────────────────

export type RecStatus = "balanced" | "investigating" | "exception" | "ready_to_post";
export type RecAccountType = "drawer" | "vault" | "bank_clearing" | "bank";

export type CashRec = {
  id: string;
  loc: string;
  type: RecAccountType;
  expected: number;
  actual: number;
  variance: number;
  status: RecStatus;
  owner: string;
};

export const CASH_RECS: CashRec[] = [
  { id: "rec_001", loc: "Oakland — Front Drawer 1",    type: "drawer",        expected: 3_250.00,    actual: 3_184.00,    variance: -66,  status: "investigating",  owner: "Closing Manager"      },
  { id: "rec_002", loc: "Oakland — Vault Cash",         type: "vault",         expected: 42_180.52,   actual: 42_180.52,   variance: 0,    status: "balanced",       owner: "General Manager"       },
  { id: "rec_003", loc: "Oakland — Armored Clearing",   type: "bank_clearing", expected: 12_840.52,   actual: 12_760.52,   variance: -80,  status: "exception",      owner: "Staff Accountant"      },
  { id: "rec_004", loc: "Oakland — Operating (SVB)",    type: "bank",          expected: 90_655.14,   actual: 90_655.14,   variance: 0,    status: "ready_to_post",  owner: "Assistant Controller"  },
];

// ── Action queue ─────────────────────────────────────────────────────────────

export type ActionSeverity = "critical" | "high" | "normal";
export type ActionKind = "Allocation" | "Rec" | "Filing";

export type ActionItem = {
  id: string;
  severity: ActionSeverity;
  kind: ActionKind;
  title: string;
  detail: string;
  owner: string;
  due: string;
  amount: number;
};

export const ACTION_QUEUE: ActionItem[] = [
  { id: "a1", severity: "critical", kind: "Allocation", title: "Route payroll labor variance to controller",         detail: "Richmond · $13.8k deductible · direct labor ratio moved +9 pts",        owner: "M. Chen",  due: "Today",  amount: 18_620 },
  { id: "a2", severity: "critical", kind: "Rec",        title: "Missing armored receipt image blocks clearing",      detail: "Oakland · Armored Clearing · $80 carrier fee reclass drafted",           owner: "R. Soto",  due: "Today",  amount: -80    },
  { id: "a3", severity: "high",     kind: "Allocation", title: "Event SKU recap missing — fallback below threshold", detail: "Community Wellness Expo · confidence 42% · $2.3k at stake",              owner: "R. Soto",  due: "May 2",  amount: 2_300  },
  { id: "a4", severity: "high",     kind: "Filing",     title: "CA excise tax return — Q1 2026",                    detail: "CDTFA-501-CA · 9 days · $48.2k staged liability",                        owner: "A. Pierce",due: "Apr 30", amount: 48_220 },
  { id: "a5", severity: "high",     kind: "Rec",        title: "Drawer variance — unsigned payout slip",            detail: "Oakland · Front Drawer 1 · customer return not tagged",                  owner: "J. Ramos", due: "Today",  amount: -66    },
  { id: "a6", severity: "normal",   kind: "Filing",     title: "CA sales & use tax — April",                        detail: "CDTFA-401 · 12 days · $21.4k staged",                                    owner: "A. Pierce",due: "May 2",  amount: 21_400 },
  { id: "a7", severity: "normal",   kind: "Allocation", title: "Approve security split — Oakland",                  detail: "Bay Alarm · 28.1% support footage · confidence 91%",                     owner: "N. Vega",  due: "May 2",  amount: 614    },
];

// ── Variance trend ────────────────────────────────────────────────────────────

export type VariancePoint = { m: string; v: number };

export const VARIANCE_TREND: VariancePoint[] = [
  { m: "Nov", v: -340 },
  { m: "Dec", v: -180 },
  { m: "Jan", v: -420 },
  { m: "Feb", v: -95  },
  { m: "Mar", v: -220 },
  { m: "Apr", v: -146 },
];

// ── Transaction pipeline ──────────────────────────────────────────────────────

export type PipelineStage = { stage: string; count: number; amount: number };

export const PIPELINE: PipelineStage[] = [
  { stage: "Imported",    count: 842, amount: 312_400 },
  { stage: "Categorized", count: 798, amount: 302_100 },
  { stage: "Allocated",   count: 681, amount: 261_800 },
  { stage: "Reviewed",    count: 544, amount: 214_300 },
  { stage: "Posted",      count: 488, amount: 198_700 },
];

// ── Upcoming filings ──────────────────────────────────────────────────────────

export type Filing = {
  name: string;
  form: string;
  due: string;
  daysLeft: number;
  amount: number | null;
  status: "staged" | "pending";
};

export const FILINGS: Filing[] = [
  { name: "CA excise tax return",        form: "CDTFA-501-CA", due: "Apr 30", daysLeft: 9,  amount: 48_220, status: "staged"  },
  { name: "CA sales & use tax",          form: "CDTFA-401",    due: "May 2",  daysLeft: 12, amount: 21_400, status: "staged"  },
  { name: "Metrc monthly reconciliation",form: "METRC-MON",    due: "May 10", daysLeft: 20, amount: null,   status: "pending" },
];

// ── Activity feed ─────────────────────────────────────────────────────────────

export type ActivityTag = "approve" | "alert" | "import" | "evidence" | "lock" | "filing";

export type ActivityEvent = {
  t: string;
  who: string;
  what: string;
  tag: ActivityTag;
};

export const ACTIVITY: ActivityEvent[] = [
  { t: "2 min",   who: "Controller", what: "approved allocation override · Cost of Goods — Cultivation",  tag: "approve"  },
  { t: "8 min",   who: "System",     what: "flagged cash vault variance ($1,240) — Oakland",               tag: "alert"    },
  { t: "15 min",  who: "Reviewer",   what: "signed off on Sacramento drawer reconciliation",               tag: "approve"  },
  { t: "23 min",  who: "System",     what: "imported 842 transactions from Mercury bank feed",             tag: "import"   },
  { t: "41 min",  who: "N. Vega",    what: "attached floorplan evidence · Oakland security split",         tag: "evidence" },
  { t: "1h",      who: "Controller", what: "locked reporting period for March 2026",                       tag: "lock"     },
  { t: "1h 12m",  who: "A. Pierce",  what: "staged CA excise liability at $48.2k",                         tag: "filing"   },
];
