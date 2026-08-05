/* ------------------------------------------------------------------ */
/*  Demo compliance data – licenses, filings, alerts, documents       */
/*  green-harvest-ca  ·  California operator                          */
/* ------------------------------------------------------------------ */

// ── Types ──────────────────────────────────────────────────────────

export type LicenseStatus = "active" | "pending" | "expired" | "renewal";
export type FilingStatus = "pending" | "ready" | "filed" | "late";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory = "license" | "tax" | "reconciliation" | "allocation";
export type DocumentType = "license_copy" | "tax_return" | "audit_packet" | "sop";
export type DocumentStatus = "current" | "archived" | "draft";

export interface DemoLicense {
  id: string;
  licenseType: "Adult-Use Retail" | "Cultivation" | "Manufacturing" | "Distribution";
  state: string;
  licenseNumber: string;
  locationName: string;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

export interface DemoTaxFiling {
  id: string;
  filingType: "Excise Tax" | "Sales Tax" | "280E Federal" | "State Cannabis Tax";
  periodLabel: string;
  dueDate: string;
  status: FilingStatus;
  estimatedAmount: number;
  preparedBy: string;
}

export interface DemoComplianceAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  body: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DemoComplianceDocument {
  id: string;
  type: DocumentType;
  title: string;
  periodLabel?: string;
  generatedAt: string;
  status: DocumentStatus;
}

// ── Licenses ───────────────────────────────────────────────────────

export const DEMO_LICENSES: DemoLicense[] = [
  {
    id: "lic-001",
    licenseType: "Adult-Use Retail",
    state: "CA",
    licenseNumber: "C11-0000418",
    locationName: "Oakland Dispensary",
    status: "active",
    issuedAt: "2024-07-15",
    expiresAt: "2026-07-14",
    daysUntilExpiry: 99,
  },
  {
    id: "lic-002",
    licenseType: "Manufacturing",
    state: "CA",
    licenseNumber: "C11-0000293",
    locationName: "Richmond Manufacturing Hub",
    status: "active",
    issuedAt: "2024-03-01",
    expiresAt: "2026-05-22",
    daysUntilExpiry: 46,
  },
  {
    id: "lic-003",
    licenseType: "Distribution",
    state: "CA",
    licenseNumber: "C11-0000517",
    locationName: "Richmond Manufacturing Hub",
    status: "renewal",
    issuedAt: "2023-04-10",
    expiresAt: "2026-04-22",
    daysUntilExpiry: 16,
  },
  {
    id: "lic-004",
    licenseType: "Cultivation",
    state: "CA",
    licenseNumber: "C11-0000651",
    locationName: "Oakland Dispensary",
    status: "pending",
    issuedAt: "2026-03-28",
    expiresAt: "2027-03-27",
    daysUntilExpiry: 355,
  },
];

// ── Tax Filings ────────────────────────────────────────────────────

export const DEMO_TAX_FILINGS: DemoTaxFiling[] = [
  {
    id: "fil-001",
    filingType: "Excise Tax",
    periodLabel: "Mar 2026",
    dueDate: "2026-04-30",
    status: "ready",
    estimatedAmount: 34_820,
    preparedBy: "Maria Chen",
  },
  {
    id: "fil-002",
    filingType: "Sales Tax",
    periodLabel: "Mar 2026",
    dueDate: "2026-04-30",
    status: "pending",
    estimatedAmount: 12_415,
    preparedBy: "Maria Chen",
  },
  {
    id: "fil-003",
    filingType: "280E Federal",
    periodLabel: "Q1 2026",
    dueDate: "2026-04-15",
    status: "filed",
    estimatedAmount: 89_200,
    preparedBy: "David Park, CPA",
  },
  {
    id: "fil-004",
    filingType: "State Cannabis Tax",
    periodLabel: "Mar 2026",
    dueDate: "2026-04-30",
    status: "pending",
    estimatedAmount: 6_940,
    preparedBy: "Maria Chen",
  },
  {
    id: "fil-005",
    filingType: "Excise Tax",
    periodLabel: "Feb 2026",
    dueDate: "2026-03-31",
    status: "late",
    estimatedAmount: 31_770,
    preparedBy: "Maria Chen",
  },
  {
    id: "fil-006",
    filingType: "Sales Tax",
    periodLabel: "Feb 2026",
    dueDate: "2026-03-31",
    status: "filed",
    estimatedAmount: 11_350,
    preparedBy: "Maria Chen",
  },
];

// ── Compliance Alerts ──────────────────────────────────────────────

export const DEMO_COMPLIANCE_ALERTS: DemoComplianceAlert[] = [
  {
    id: "alt-001",
    category: "license",
    severity: "critical",
    title: "Distribution license expires in 16 days",
    body: "License C11-0000517 for Richmond Manufacturing Hub is in renewal status but has not yet been approved by DCC. Escalate immediately to avoid lapse in distribution authority.",
    createdAt: "2026-04-05T14:30:00Z",
  },
  {
    id: "alt-002",
    category: "tax",
    severity: "critical",
    title: "Feb 2026 Excise Tax filing is overdue",
    body: "The excise tax return for February 2026 ($31,770) was due Mar 31 and has not been filed. Penalties accrue at 10% plus interest. File or request abatement today.",
    createdAt: "2026-04-01T08:00:00Z",
  },
  {
    id: "alt-003",
    category: "reconciliation",
    severity: "warning",
    title: "Oakland cash drawer variance unresolved",
    body: "The Mar 29 cash drawer reconciliation shows a $342 variance that has been under investigation for 8 days. Review support documentation and post adjusting entry if appropriate.",
    createdAt: "2026-03-30T11:15:00Z",
  },
  {
    id: "alt-004",
    category: "allocation",
    severity: "warning",
    title: "280E cost allocation review needed",
    body: "Q1 2026 COGS-to-revenue ratio shifted to 68% from 62% in Q4 2025. Verify allocation methodology before the 280E federal filing is submitted to avoid audit exposure.",
    createdAt: "2026-04-03T09:45:00Z",
  },
  {
    id: "alt-005",
    category: "license",
    severity: "info",
    title: "Cultivation license application submitted",
    body: "New cultivation license C11-0000651 application was submitted to DCC on Mar 28. Expected processing time is 45–60 days. No action required at this time.",
    createdAt: "2026-03-28T16:00:00Z",
    resolvedAt: "2026-03-28T16:00:00Z",
  },
];

// ── Documents ──────────────────────────────────────────────────────

export const DEMO_COMPLIANCE_DOCUMENTS: DemoComplianceDocument[] = [
  {
    id: "doc-001",
    type: "license_copy",
    title: "Active License Bundle – All Locations",
    generatedAt: "2026-03-15T10:00:00Z",
    status: "current",
  },
  {
    id: "doc-002",
    type: "tax_return",
    title: "280E Federal Return – Q1 2026",
    periodLabel: "Q1 2026",
    generatedAt: "2026-04-04T14:20:00Z",
    status: "current",
  },
  {
    id: "doc-003",
    type: "audit_packet",
    title: "Year-End Audit Support Packet – FY 2025",
    periodLabel: "FY 2025",
    generatedAt: "2026-02-10T09:00:00Z",
    status: "archived",
  },
  {
    id: "doc-004",
    type: "sop",
    title: "Cash Handling & Reconciliation SOP v3.1",
    generatedAt: "2026-01-22T11:30:00Z",
    status: "current",
  },
];

// ── Summary helper ─────────────────────────────────────────────────

export interface ComplianceSummary {
  activeLicenses: number;
  expiringLicenses: number;
  pendingFilings: number;
  overdueFilings: number;
  criticalAlerts: number;
  totalAlerts: number;
  documentsOnFile: number;
}

export function summarizeCompliance(): ComplianceSummary {
  const activeLicenses = DEMO_LICENSES.filter(
    (l) => l.status === "active" || l.status === "renewal",
  ).length;

  const expiringLicenses = DEMO_LICENSES.filter(
    (l) => l.daysUntilExpiry <= 90 && l.status !== "expired",
  ).length;

  const pendingFilings = DEMO_TAX_FILINGS.filter(
    (f) => f.status === "pending" || f.status === "ready",
  ).length;

  const overdueFilings = DEMO_TAX_FILINGS.filter(
    (f) => f.status === "late",
  ).length;

  const unresolvedAlerts = DEMO_COMPLIANCE_ALERTS.filter((a) => !a.resolvedAt);
  const criticalAlerts = unresolvedAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  return {
    activeLicenses,
    expiringLicenses,
    pendingFilings,
    overdueFilings,
    criticalAlerts,
    totalAlerts: unresolvedAlerts.length,
    documentsOnFile: DEMO_COMPLIANCE_DOCUMENTS.filter(
      (d) => d.status === "current",
    ).length,
  };
}
