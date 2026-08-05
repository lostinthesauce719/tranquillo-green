"use client";

import { POSConnectPanel } from "@/components/integrations/pos-connect-panel";
import { Card } from "@/components/ui/card";

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Point of Sale Integrations</h1>
        <p className="text-muted-foreground">
          Connect your point-of-sale system to automatically import sales into your ledger.
        </p>
      </div>

      <div className="grid gap-6">
        <POSConnectPanel provider="square" />
        <POSConnectPanel provider="toast" />
        <POSConnectPanel provider="treez" />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Manual CSV Import</h3>
        <p className="text-sm text-muted-foreground">
          If your POS isn&apos;t listed or you prefer manual uploads, use the main Import tool to upload sales CSVs. Compatible with standard Point-of-Sale transaction exports.
        </p>
      </Card>
    </div>
  );
}
