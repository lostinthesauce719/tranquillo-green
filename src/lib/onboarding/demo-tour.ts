import { Step } from "react-joyride";

/**
 * Full product demo tour — walks new sandbox users through every major feature.
 * Designed to be auto-started on first dashboard visit for sandbox users.
 *
 * Each step targets a data-tour attribute on the corresponding element.
 * Add data-tour="..." attributes to components you want to highlight.
 */
export const demoProductTourSteps: Step[] = [
  // ─── Welcome ──────────────────────────────────────────────────────────
  {
    target: "body",
    content: "Welcome to your demo sandbox! This is a fully-loaded demo with pre-populated data for Green Cross Dispensary — a 3-location cannabis retailer in Colorado. We'll walk you through every feature. You can skip anytime.",
    title: "Demo Sandbox",
    placement: "center",
    disableBeacon: true,
  },

  // ─── Sidebar Navigation ───────────────────────────────────────────────
  {
    target: '[data-tour="nav-dashboard"]',
    content: "Start here. The dashboard gives you a real-time overview of your operation — revenue, COGS, tax exposure, and close status.",
    title: "Dashboard Overview",
  },
  {
    target: '[data-tour="nav-transactions"]',
    content: "All your transactions live here. In the demo, we've pre-loaded 100+ transactions from POS, bank feeds, and manual entries — all categorized under 280E rules.",
    title: "Transactions",
  },
  {
    target: '[data-tour="nav-allocations"]',
    content: "This is the heart of Tranquillo Green. The 280E allocation engine automatically calculates COGS across facility rent, labor, shipping, and more. Click here to see it in action.",
    title: "280E Allocations",
  },
  {
    target: '[data-tour="nav-reconciliations"]',
    content: "Bank rec, Metrc reconciliation, and cash reconciliation — all automated. The demo shows a live Metrc variance detection.",
    title: "Reconciliations",
  },
  {
    target: '[data-tour="nav-inventory"]',
    content: "Inventory management with Metrc integration. See package-level tracking, variance alerts, and COGS impact.",
    title: "Inventory",
  },
  {
    target: '[data-tour="nav-periods"]',
    content: "Reporting periods and month-end close workflow. The demo has Q1 2025 in review status — walk through the close process.",
    title: "Periods & Close",
  },
  {
    target: '[data-tour="nav-exports"]',
    content: "Generate CPA-ready workpapers, financial statements, and audit packages in one click. This is what your CPA will love.",
    title: "CPA Exports",
  },
  {
    target: '[data-tour="nav-compliance"]',
    content: "Compliance dashboard showing 280E exposure, 471(c) election status, and audit readiness score.",
    title: "Compliance",
  },
  {
    target: '[data-tour="nav-automation"]',
    content: "Automation agents that monitor your 280E allocations, close blockers, and reconciliation exceptions — so you don't have to.",
    title: "Automation",
  },

  // ─── Dashboard Key Metrics ────────────────────────────────────────────
  {
    target: '[data-tour="metric-revenue"]',
    content: "Annual revenue across all entities. In the demo: $2.4M across 3 locations.",
    title: "Revenue",
  },
  {
    target: '[data-tour="metric-cogs"]',
    content: "Your COGS after 280E allocation. The demo shows 41% COGS — well above the 28% industry average because we're capturing all legitimate deductions.",
    title: "COGS (280E)",
  },
  {
    target: '[data-tour="metric-tax-exposure"]',
    content: "Estimated federal tax exposure under 280E. Proper COGS allocation saves the demo company $127K/year vs. basic product-cost-only claims.",
    title: "Tax Exposure",
  },
  {
    target: '[data-tour="metric-close-status"]',
    content: "Month-end close progress. The demo has Q1 in review — click to see the close checklist.",
    title: "Close Status",
  },

  // ─── Allocation Detail ────────────────────────────────────────────────
  {
    target: '[data-tour="allocation-breakdown"]',
    content: "Here's the magic. The allocation engine breaks down COGS by category: facility rent (45%), inventory labor (55%), shipping, packaging, and more. Every dollar is documented.",
    title: "Allocation Breakdown",
  },
  {
    target: '[data-tour="allocation-471c"]',
    content: "The 471(c) election is active in this demo. It capitalizes additional costs into inventory, increasing COGS by $238K/year. Check if you qualify.",
    title: "471(c) Election",
  },

  // ─── Upgrade CTA ──────────────────────────────────────────────────────
  {
    target: '[data-tour="upgrade-cta"]',
    content: "Ready to go live? When you're done exploring, click here to upgrade to production. Import your own data from QuickBooks or CSV and you're off and running. Your demo data stays intact during the transition.",
    title: "Go Production",
    placement: "bottom",
  },
];

/**
 * Quick tour — just the highlights. Used for returning users who want a refresher.
 */
export const demoQuickTourSteps: Step[] = [
  {
    target: "body",
    content: "Quick tour of the key features. Let's go!",
    title: "Quick Tour",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-allocations"]',
    content: "The 280E allocation engine — the core of Tranquillo Green. Automated COGS calculation across all categories.",
    title: "280E Allocations",
  },
  {
    target: '[data-tour="nav-reconciliations"]',
    content: "Automated reconciliation — bank, Metrc, and cash. Catch variances before auditors do.",
    title: "Reconciliations",
  },
  {
    target: '[data-tour="nav-exports"]',
    content: "One-click CPA workpapers. Your tax preparer will thank you.",
    title: "CPA Exports",
  },
  {
    target: '[data-tour="upgrade-cta"]',
    content: "Ready to go live? Upgrade anytime — your demo data imports seamlessly.",
    title: "Go Production",
    placement: "bottom",
  },
];
