export type DemoExportBundleStatus = "ready" | "building" | "needs_support" | "sent";
export type DemoChecklistStatus = "done" | "watch" | "missing";
export type DemoAutomationStatus = "healthy" | "watch" | "attention";

export type DemoExportBundle = {
  id: string;
  name: string;
  periodLabel: string;
  description: string;
  status: DemoExportBundleStatus;
  recipient: string;
  owner: string;
  generatedAt: string;
  exportFormats: string[];
  includedSchedules: string[];
  blockers: string[];
};

export type DemoPacketChecklistItem = {
  title: string;
  owner: string;
  status: DemoChecklistStatus;
  note: string;
};

export type DemoGenerationHistoryItem = {
  timestampLabel: string;
  actor: string;
  action: string;
  detail: string;
};

export type DemoAutomationAgent = {
  id: string;
  name: string;
  workflow: string;
  status: DemoAutomationStatus;
  cadence: string;
  owner: string;
  lastRun: string;
  nextRun: string;
  purpose: string;
  /** What this agent reviews — the specific accounting surface it scans. */
  reviewScope: string;
  /** Concrete recommendation types the agent produces. */
  recommendationTypes: string[];
  /** Who must approve and under what conditions. */
  approvalRules: string;
  /** Items scanned in the most recent run. */
  itemsReviewed: number;
  /** Exceptions or flags raised in the most recent run. */
  exceptionsFound: number;
  /** Short labels for the last 4-6 runs showing pass/fail outcome. */
  historicalOutcomes: { date: string; result: "pass" | "flag" | "hold" }[];
  triggers: string[];
  outputs: string[];
  guardrails: string[];
};

export const demoExportBundles: DemoExportBundle[] = [
  {
    id: "bundle_280e",
    name: "280E support + override binder",
    periodLabel: "April 2026",
    description: "Includes support schedule, override history, memo references, and reviewer sign-off trail for deductible versus nondeductible treatment.",
    status: "ready",
    recipient: "Calyx CPA Group",
    owner: "Tax Manager",
    generatedAt: "May 1, 9:05 AM",
    exportFormats: ["PDF binder", "CSV line-item support", "ZIP evidence packet"],
    includedSchedules: [
      "280E support schedule",
      "Allocation override history workspace",
      "Policy memo index",
      "Reviewer sign-off summary",
    ],
    blockers: [],
  },
  {
    id: "bundle_close",
    name: "Month-end close handoff packet",
    periodLabel: "April 2026",
    description: "Controller-to-CPA packet aligning close dashboard posture, reconciliations, imports, posting roll-forward, and close sign-off notes.",
    status: "building",
    recipient: "Fractional Controller",
    owner: "Assistant Controller",
    generatedAt: "May 1, 8:48 AM",
    exportFormats: ["PDF close pack", "XLSX lead sheet export"],
    includedSchedules: [
      "Close dashboard summary",
      "Bank and cash reconciliation tie-outs",
      "Open blocker list",
      "Journal entry recap",
    ],
    blockers: ["Armored receipt image still missing from clearing exception packet"],
  },
  {
    id: "bundle_tax",
    name: "CPA estimated tax planning packet",
    periodLabel: "April 2026",
    description: "Handoff packet for external tax planning using current-period allocations, reconciliation status, and memo-backed deductible support narrative.",
    status: "needs_support",
    recipient: "External Tax Partner",
    owner: "Controller",
    generatedAt: "Apr 30, 6:30 PM",
    exportFormats: ["Secure portal upload", "Narrative memo PDF"],
    includedSchedules: [
      "Interim P&L with 280E overlay",
      "Support memo summary",
      "Variance commentary",
    ],
    blockers: ["Event sponsorship allocation still waiting on POS category recap"],
  },
];

export const demoPacketChecklist: DemoPacketChecklistItem[] = [
  {
    title: "Close dashboard readiness snapshot exported",
    owner: "Assistant Controller",
    status: "done",
    note: "Static snapshot reflects 73% readiness and current blockers list.",
  },
  {
    title: "Bank and cash reconciliation PDFs attached",
    owner: "Staff Accountant",
    status: "watch",
    note: "Operating cash is ready, but clearing packet still needs the armored receipt image.",
  },
  {
    title: "280E support schedule included",
    owner: "Tax Manager",
    status: "done",
    note: "Schedule ties to current demo allocation queue totals and memo references.",
  },
  {
    title: "Allocation override audit trail attached",
    owner: "Controller",
    status: "done",
    note: "Includes recommendation-to-override deltas, reasons, evidence, and policy trail.",
  },
  {
    title: "Open support requests called out in cover memo",
    owner: "Bookkeeper",
    status: "missing",
    note: "Event sponsorship backup request needs explicit mention in the CPA cover memo.",
  },
  {
    title: "Recipient delivery notes reviewed",
    owner: "Controller",
    status: "watch",
    note: "Close packet instructions drafted but pending final dependency closure.",
  },
];

export const demoGenerationHistory: DemoGenerationHistoryItem[] = [
  {
    timestampLabel: "May 1, 9:05 AM",
    actor: "Tax Manager",
    action: "Generated bundle",
    detail: "Published 280E support + override binder for CPA review with PDF, CSV, and evidence ZIP outputs.",
  },
  {
    timestampLabel: "May 1, 8:48 AM",
    actor: "Assistant Controller",
    action: "Refreshed close packet draft",
    detail: "Rebuilt close handoff packet after bank reconciliation tied, leaving clearing support as the remaining blocker.",
  },
  {
    timestampLabel: "Apr 30, 6:30 PM",
    actor: "Controller",
    action: "Queued estimated tax packet",
    detail: "Held delivery because marketing event support was incomplete and needed cover memo disclosure.",
  },
  {
    timestampLabel: "Apr 29, 5:12 PM",
    actor: "Automation surface",
    action: "Dry-run packet checklist",
    detail: "Validated packet sections against static workflow definitions without sending any live files.",
  },
];

export const demoAutomationAgents: DemoAutomationAgent[] = [
  {
    id: "agent_alloc_monitor",
    name: "280E allocation monitor",
    workflow: "Allocation review queue",
    status: "watch",
    cadence: "Every 4 hours during close week",
    owner: "Tax Manager",
    lastRun: "May 1, 8:55 AM",
    nextRun: "May 1, 12:55 PM",
    itemsReviewed: 47,
    exceptionsFound: 3,
    historicalOutcomes: [
      { date: "Apr 30", result: "flag" },
      { date: "Apr 29", result: "pass" },
      { date: "Apr 28", result: "pass" },
      { date: "Apr 27", result: "flag" },
      { date: "Apr 26", result: "pass" },
    ],
    purpose:
      "Flags overrides, low-confidence recommendations, and support gaps before the CPA packet is generated.",
    reviewScope:
      "Scans every 280E allocation recommendation and override in the current-period queue. Checks confidence scores, dollar-impact deltas, and open support requests.",
    recommendationTypes: [
      "Flag allocation with confidence below 80% for manual review",
      "Highlight override that shifted deductible treatment by more than $500",
      "Escalate support request open past close cutoff to controller queue",
    ],
    approvalRules:
      "Tax Manager reviews queue digest. Controller approves any hold or escalation before it blocks packet generation.",
    triggers: [
      "Any allocation confidence below 80%",
      "Manual override shifts deductible amount by more than $500",
      "Support request remains open past close cutoff",
    ],
    outputs: [
      "Queue digest card for controller",
      "Packet checklist reminder",
      "Audit trail spotlight for overrides",
    ],
    guardrails: [
      "Read-only static definition only",
      "No posting or live notifications",
      "Requires human reviewer sign-off before any packet state changes",
    ],
  },
  {
    id: "agent_close_monitor",
    name: "Close blocker monitor",
    workflow: "Month-end close dashboard",
    status: "attention",
    cadence: "Daily during open close",
    owner: "Assistant Controller",
    lastRun: "May 1, 8:48 AM",
    nextRun: "May 2, 8:00 AM",
    itemsReviewed: 12,
    exceptionsFound: 2,
    historicalOutcomes: [
      { date: "May 1", result: "flag" },
      { date: "Apr 30", result: "hold" },
      { date: "Apr 29", result: "flag" },
      { date: "Apr 28", result: "pass" },
      { date: "Apr 27", result: "pass" },
      { date: "Apr 26", result: "pass" },
    ],
    purpose:
      "Summarizes open blockers across imports, reconciliations, and allocation support before release to external reviewers.",
    reviewScope:
      "Checks all close-critical areas: bank imports, cash reconciliation tie-outs, journal entry readiness, allocation support requests, and checklist completion across 12 close tasks.",
    recommendationTypes: [
      "Suggest packet hold when critical blocker remains unresolved",
      "Generate owner follow-up matrix with due dates for each blocker",
      "Draft hold reason language for CPA cover memo",
    ],
    approvalRules:
      "Assistant Controller reviews blocker digest. Controller must approve any packet hold recommendation before delivery is paused.",
    triggers: [
      "Critical blocker count greater than zero",
      "Any ready-to-post area depends on an exception workspace",
      "Close readiness drops below 80% at lock minus one day",
    ],
    outputs: [
      "Blocker digest",
      "Owner follow-up matrix",
      "Suggested packet hold reasons",
    ],
    guardrails: [
      "Static demo workflow only",
      "No live polling or background jobs",
      "Recommendations stay informational until controller approves",
    ],
  },
  {
    id: "agent_rec_followup",
    name: "Reconciliation follow-up agent",
    workflow: "Cash reconciliation workspace",
    status: "healthy",
    cadence: "Each morning at 7:30 AM",
    owner: "Staff Accountant",
    lastRun: "May 1, 7:30 AM",
    nextRun: "May 2, 7:30 AM",
    itemsReviewed: 8,
    exceptionsFound: 0,
    historicalOutcomes: [
      { date: "May 1", result: "pass" },
      { date: "Apr 30", result: "pass" },
      { date: "Apr 29", result: "flag" },
      { date: "Apr 28", result: "pass" },
      { date: "Apr 27", result: "pass" },
    ],
    purpose:
      "Prepares owner follow-up prompts for unresolved variances, missing evidence, and pending action items in rec detail workspaces.",
    reviewScope:
      "Scans all active reconciliation workspaces for non-zero variances, outstanding action items, and missing receipt/support documents on bank packages flagged ready-to-post.",
    recommendationTypes: [
      "Draft owner-specific reminder for variance investigation",
      "Flag receipt gap blocking ready-to-post bank package",
      "Summarize variance drivers for CPA handoff dependency list",
    ],
    approvalRules:
      "Staff Accountant reviews generated reminders and decides which to action. No reminders leave the system without explicit staff accountant approval.",
    triggers: [
      "Variance amount not equal to zero",
      "Any action still todo after prior day",
      "Receipt/support gap on ready-to-post bank package",
    ],
    outputs: [
      "Owner reminder queue",
      "Variance driver summary",
      "CPA handoff dependency notes",
    ],
    guardrails: [
      "No emails or real messages sent",
      "All actions remain mock definitions",
      "Evidence status reflects local static demo data only",
    ],
  },
];

export function summarizeExportCenter() {
  return {
    totalBundles: demoExportBundles.length,
    readyBundles: demoExportBundles.filter((bundle) => bundle.status === "ready").length,
    blockedChecklistItems: demoPacketChecklist.filter((item) => item.status === "missing").length,
    watchChecklistItems: demoPacketChecklist.filter((item) => item.status === "watch").length,
    activeAgents: demoAutomationAgents.length,
  };
}
