"use client";

import { AppShell } from "@/components/shell/app-shell";
import ComplianceClient from "./compliance-client";

export default function CompliancePage() {
  return (
    <AppShell title="Compliance" description="Compliance alerts, license tracking, and audit readiness">
      <div className="space-y-6">
        {/* Breadcrumb / Back nav */}
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <a href="/dashboard" className="hover:text-text-secondary transition-colors">Dashboard</a>
          <span className="text-text-faint">/</span>
          <span className="text-text-primary font-medium">Compliance</span>
        </div>
        <ComplianceClient />
      </div>
    </AppShell>
  );
}
