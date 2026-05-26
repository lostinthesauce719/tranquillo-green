"use client";

import { AppShell } from "@/components/shell/app-shell";
import BatchClient from "./batch-client";

export default function BatchesPage() {
  return (
    <AppShell title="Batches" description="Inventory batch management, merge, and tracking">
      <div className="space-y-6">
        {/* Breadcrumb / Back nav */}
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <a href="/dashboard" className="hover:text-text-secondary transition-colors">Dashboard</a>
          <span className="text-text-faint">/</span>
          <a href="/dashboard/inventory" className="hover:text-text-secondary transition-colors">Inventory</a>
          <span className="text-text-faint">/</span>
          <span className="text-text-primary font-medium">Batches</span>
        </div>
        <BatchClient />
      </div>
    </AppShell>
  );
}
