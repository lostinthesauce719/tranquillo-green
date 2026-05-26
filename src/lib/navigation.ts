export type OperatorType = "dispensary" | "cultivator" | "manufacturer" | "distributor" | "vertical" | "delivery";

export type NavLink = {
  href: string;
  label: string;
  section: string;
  /** If set, only show for these operator types. Undefined = show for all. */
  operators?: OperatorType[];
  /** If set, adds a data-tour attribute for the guided demo tour. */
  tourId?: string;
};

export const moduleLinks: NavLink[] = [
  // Core — everyone sees these
  { href: "/dashboard", label: "Overview", section: "Core", tourId: "nav-dashboard" },
  { href: "/dashboard/accounting", label: "Accounting", section: "Core", tourId: "nav-accounting" },
  { href: "/dashboard/accounting/close", label: "Month-End Close", section: "Core", tourId: "nav-periods" },
  { href: "/dashboard/accounting/periods", label: "Reporting Periods", section: "Core" },

  // Workflows
  { href: "/dashboard/accounting/pipeline", label: "Transaction Pipeline", section: "Workflows" },
  { href: "/dashboard/accounting/transactions", label: "Transactions", section: "Workflows", tourId: "nav-transactions" },
  { href: "/dashboard/accounting/imports", label: "Imports", section: "Workflows" },
  { href: "/dashboard/allocations", label: "280E Allocations", section: "Workflows", tourId: "nav-allocations" },
  { href: "/dashboard/allocations/history", label: "Allocation History", section: "Workflows" },
  { href: "/dashboard/allocations/support-schedule", label: "280E Support Schedule", section: "Workflows" },

  // Operations — some are operator-specific
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    section: "Operations",
    operators: ["cultivator", "manufacturer", "vertical", "distributor", "delivery"],
    tourId: "nav-inventory",
  },
  {
    href: "/dashboard/batches",
    label: "Batches",
    section: "Operations",
    operators: ["cultivator", "manufacturer", "vertical", "distributor", "delivery"],
  },
  { href: "/dashboard/compliance", label: "Compliance", section: "Operations", tourId: "nav-compliance" },
  { href: "/dashboard/reconciliations", label: "Cash Reconciliation", section: "Operations", tourId: "nav-reconciliations" },

  { href: "/dashboard/pos", label: "Point of Sale", section: "Operations", operators: ["dispensary", "delivery", "vertical"] },

  // Reporting
  { href: "/dashboard/reports", label: "Financial Reports", section: "Reporting" },
  { href: "/dashboard/business/metrics", label: "Business Metrics", section: "Reporting" },

  // Handoff
  { href: "/dashboard/exports", label: "CPA Export Center", section: "Handoff", tourId: "nav-exports" },
  { href: "/dashboard/automation", label: "Automation", section: "Handoff", tourId: "nav-automation" },

  // System
  { href: "/dashboard/settings", label: "Settings", section: "System" },
  { href: "/dashboard/notifications", label: "Notifications", section: "System" },
  { href: "/dashboard/billing", label: "Billing & Plans", section: "System", tourId: "upgrade-cta" },
];

// Premium features — only visible for Cultivator+ tiers
export const premiumLinks: NavLink[] = [
  {
    href: "/dashboard/payroll",
    label: "Payroll & Labor",
    section: "Operations",
    operators: ["cultivator", "manufacturer", "vertical"],
  },
];

/** Filter links by operator type. */
export function filterLinksByOperator(links: NavLink[], operatorType: OperatorType): NavLink[] {
  return links.filter((link) => {
    if (!link.operators) return true; // no restriction = show for all
    return link.operators.includes(operatorType);
  });
}
