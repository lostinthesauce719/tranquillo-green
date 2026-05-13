export type OperatorType = "dispensary" | "cultivator" | "manufacturer" | "distributor" | "vertical" | "delivery";

export type NavLink = {
  href: string;
  label: string;
  section: string;
  /** If set, only show for these operator types. Undefined = show for all. */
  operators?: OperatorType[];
};

export const moduleLinks: NavLink[] = [
  // Core — everyone sees these
  { href: "/dashboard", label: "Overview", section: "Core" },
  { href: "/dashboard/accounting", label: "Accounting", section: "Core" },
  { href: "/pricing", label: "Pricing", section: "Core" },
  { href: "/dashboard/accounting/close", label: "Month-End Close", section: "Core" },
  { href: "/dashboard/accounting/periods", label: "Reporting Periods", section: "Core" },

  // Workflows
  { href: "/dashboard/accounting/pipeline", label: "Transaction Pipeline", section: "Workflows" },
  { href: "/dashboard/accounting/transactions", label: "Transactions", section: "Workflows" },
  { href: "/dashboard/accounting/imports", label: "Imports", section: "Workflows" },
  { href: "/dashboard/allocations", label: "280E Allocations", section: "Workflows" },
  { href: "/dashboard/allocations/history", label: "Allocation History", section: "Workflows" },
  { href: "/dashboard/allocations/support-schedule", label: "280E Support Schedule", section: "Workflows" },

  // Operations — some are operator-specific
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    section: "Operations",
    operators: ["cultivator", "manufacturer", "vertical", "distributor", "delivery"],
  },
  {
    href: "/dashboard/batches",
    label: "Batches",
    section: "Operations",
    operators: ["cultivator", "manufacturer", "vertical", "distributor", "delivery"],
  },
  { href: "/dashboard/compliance", label: "Compliance", section: "Operations" },
  { href: "/dashboard/reconciliations", label: "Cash Reconciliation", section: "Operations" },

  { href: "/dashboard/pos", label: "Point of Sale", section: "Operations", operators: ["dispensary", "delivery", "vertical"] },

  // Reporting
  { href: "/dashboard/reports", label: "Financial Reports", section: "Reporting" },
  { href: "/dashboard/business/metrics", label: "Business Metrics", section: "Reporting" },

  // Handoff
  { href: "/dashboard/exports", label: "CPA Export Center", section: "Handoff" },
  { href: "/dashboard/automation", label: "Automation", section: "Handoff" },

  // System
  { href: "/dashboard/settings", label: "Settings", section: "System" },
  { href: "/dashboard/notifications", label: "Notifications", section: "System" },
  { href: "/dashboard/billing", label: "Billing & Plans", section: "System" },
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
