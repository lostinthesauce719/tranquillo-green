import { loadComplianceWorkspace } from "@/lib/data/compliance";
import ComplianceClient from "./compliance-client";

export default async function CompliancePage() {
  const workspace = await loadComplianceWorkspace();

  return (
    <ComplianceClient
      source={workspace.source}
      licenses={workspace.licenses}
      taxFilings={workspace.taxFilings}
      alerts={workspace.alerts}
      alertsSummary={workspace.alertsSummary}
    />
  );
}
