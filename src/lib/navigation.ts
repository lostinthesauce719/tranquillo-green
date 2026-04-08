export type NavLink = {
  href: string;
  label: string;
  section: string;
};

export const moduleLinks: NavLink[] = [
  { href: "/dashboard", label: "Overview", section: "Core" },
  { href: "/dashboard/onboarding", label: "Onboarding", section: "Core" },
  { href: "/dashboard/accounting", label: "Accounting", section: "Core" },
  { href: "/dashboard/accounting/close", label: "Month-End Close", section: "Core" },
  { href: "/dashboard/accounting/periods", label: "Reporting Periods", section: "Core" },
  { href: "/dashboard/accounting/pipeline", label: "Transaction Pipeline", section: "Workflows" },
  { href: "/dashboard/accounting/transactions", label: "Transactions", section: "Workflows" },
  { href: "/dashboard/accounting/imports", label: "Imports", section: "Workflows" },
  { href: "/dashboard/allocations", label: "280E Allocations", section: "Workflows" },
  { href: "/dashboard/allocations/history", label: "Allocation History", section: "Workflows" },
  { href: "/dashboard/allocations/support-schedule", label: "280E Support Schedule", section: "Workflows" },
  { href: "/dashboard/inventory", label: "Inventory", section: "Operations" },
  { href: "/dashboard/compliance", label: "Compliance", section: "Operations" },
  { href: "/dashboard/reconciliations", label: "Reconciliations", section: "Operations" },
  { href: "/dashboard/exports", label: "CPA Export Center", section: "Handoff" },
  { href: "/dashboard/automation", label: "Automation", section: "Handoff" },
  { href: "/dashboard/settings", label: "Settings", section: "System" },
];
