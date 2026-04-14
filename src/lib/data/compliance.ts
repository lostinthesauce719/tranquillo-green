import "server-only";

import { anyApi } from "convex/server";
import { californiaOperatorDemo } from "@/lib/demo/accounting";
import { getAuthenticatedConvexClient, getConvexClient, withTimeout } from "@/lib/data/convex-client";

export const DEMO_COMPANY_SLUG = californiaOperatorDemo.company.slug;

type WorkspaceSource = "demo" | "convex";

export type ComplianceLicense = {
  licenseType: string;
  licenseNumber: string;
  state: string;
  status: "active" | "pending" | "expired";
  issuedAt: number;
  expiresAt: number;
  locationName?: string;
};

export type ComplianceTaxFiling = {
  filingType: string;
  periodLabel: string;
  dueDate: string;
  status: "pending" | "ready" | "filed" | "late";
  state: string;
};

export type ComplianceAlert = {
  id: string;
  category: "license" | "tax" | "reconciliation" | "allocation";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  createdAt: string;
};

export type ComplianceWorkspace = {
  source: WorkspaceSource;
  licenses: ComplianceLicense[];
  taxFilings: ComplianceTaxFiling[];
  alerts: ComplianceAlert[];
  alertsSummary: {
    total: number;
    unresolved: number;
    critical: number;
    warning: number;
  };
};

const demoTaxFilings: ComplianceTaxFiling[] = [
  {
    filingType: "CA Cannabis Excise Tax",
    periodLabel: "Q1 2026",
    dueDate: "2026-04-30",
    status: "ready",
    state: "CA",
  },
  {
    filingType: "CA Sales & Use Tax",
    periodLabel: "March 2026",
    dueDate: "2026-04-30",
    status: "pending",
    state: "CA",
  },
  {
    filingType: "CA Cannabis Cultivation Tax Report",
    periodLabel: "Q1 2026",
    dueDate: "2026-04-30",
    status: "filed",
    state: "CA",
  },
];

const demoAlerts: ComplianceAlert[] = [
  {
    id: "alert_001",
    category: "license",
    severity: "warning",
    title: "Distribution license expiring in 10 months",
    body: "C11-0009822-LIC (Distribution) expires on 2026-02-28. Begin renewal preparation 90 days before expiry.",
    createdAt: "2026-04-01",
  },
  {
    id: "alert_002",
    category: "tax",
    severity: "critical",
    title: "Excise tax return due in 19 days",
    body: "Q1 2026 California cannabis excise tax return is due April 30. Ensure METRC sales data reconciles to filed amount.",
    createdAt: "2026-04-11",
  },
  {
    id: "alert_003",
    category: "reconciliation",
    severity: "info",
    title: "METRC manifest variance detected",
    body: "Three incoming transfer manifests show weight discrepancies between METRC recorded quantities and received quantities. Investigate before next reconciliation cycle.",
    createdAt: "2026-04-10",
  },
];

function buildDemoWorkspace(): ComplianceWorkspace {
  const licenses: ComplianceLicense[] = californiaOperatorDemo.licenses.map((lic) => ({
    licenseType: lic.licenseType,
    licenseNumber: lic.licenseNumber,
    state: lic.state,
    status: lic.status as ComplianceLicense["status"],
    issuedAt: lic.issuedAt,
    expiresAt: lic.expiresAt,
    locationName: (lic as any).locationName,
  }));

  return {
    source: "demo",
    licenses,
    taxFilings: demoTaxFilings,
    alerts: demoAlerts,
    alertsSummary: {
      total: demoAlerts.length,
      unresolved: demoAlerts.length,
      critical: demoAlerts.filter((a) => a.severity === "critical").length,
      warning: demoAlerts.filter((a) => a.severity === "warning").length,
    },
  };
}

function toComplianceLicense(lic: any): ComplianceLicense {
  return {
    licenseType: lic.licenseType,
    licenseNumber: lic.licenseNumber,
    state: lic.state,
    status: lic.status,
    issuedAt: lic.issuedAt ?? 0,
    expiresAt: lic.expiresAt ?? 0,
    locationName: lic.locationName,
  };
}

function toComplianceFiling(filing: any): ComplianceTaxFiling {
  return {
    filingType: filing.filingType,
    periodLabel: filing.periodLabel,
    dueDate: filing.dueDate,
    status: filing.status,
    state: filing.state ?? "CA",
  };
}

function toComplianceAlert(alert: any): ComplianceAlert {
  const createdAt = alert.timestamp
    ? new Date(alert.timestamp).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    id: alert._id ?? `alert_${alert.title?.slice(0, 20)}`,
    category: alert.category,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    createdAt,
  };
}

export async function loadComplianceWorkspace(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<ComplianceWorkspace> {
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return buildDemoWorkspace();
  }

  try {
    const company = await withTimeout(
      client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }),
    );
    if (!company?._id) {
      return buildDemoWorkspace();
    }

    const companyId = company._id;

    // Load all compliance data in parallel
    const [licenses, taxFilings, alerts] = await Promise.allSettled([
      withTimeout(
        client.query((anyApi as any).compliance.getLicenses, { companyId }),
      ),
      withTimeout(
        client.query((anyApi as any).compliance.getTaxFilings, { companyId }),
      ),
      withTimeout(
        client.query((anyApi as any).compliance.getAlerts, { companyId }),
      ),
    ]);

    const convexLicenses = licenses.status === "fulfilled" && licenses.value?.length > 0
      ? licenses.value.map(toComplianceLicense)
      : null;

    const convexFilings = taxFilings.status === "fulfilled" && taxFilings.value?.length > 0
      ? taxFilings.value.map(toComplianceFiling)
      : null;

    const convexAlerts = alerts.status === "fulfilled" && alerts.value?.length > 0
      ? alerts.value.map(toComplianceAlert)
      : null;

    // If we got at least one real data source, use Convex; otherwise demo
    if (convexLicenses || convexFilings || convexAlerts) {
      const resolvedAlerts = convexAlerts ?? demoAlerts;
      return {
        source: "convex",
        licenses: convexLicenses ?? buildDemoWorkspace().licenses,
        taxFilings: convexFilings ?? demoTaxFilings,
        alerts: resolvedAlerts,
        alertsSummary: {
          total: resolvedAlerts.length,
          unresolved: resolvedAlerts.length,
          critical: resolvedAlerts.filter((a) => a.severity === "critical").length,
          warning: resolvedAlerts.filter((a) => a.severity === "warning").length,
        },
      };
    }

    return buildDemoWorkspace();
  } catch {
    return buildDemoWorkspace();
  }
}
