import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";
import { loadAuditTrailWorkspace } from "@/lib/data/audit-trail";
import AuditTrailViewer from "@/components/admin/audit-trail-viewer";

export const dynamic = "force-dynamic";

export default async function AdminAuditTrailPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    redirect("/sign-in");
  }

  // Get current tenant (company and user role)
  const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});

  if (!tenant?.company) {
    redirect("/onboarding");
  }

  const role = tenant.user?.role;
  if (role !== "owner" && role !== "controller") {
    // Not authorized
    return (
      <div className="min-h-screen bg-background p-8 text-text-primary">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-danger">Unauthorized</h1>
          <p className="mt-2 text-text-muted">
            You do not have permission to access the audit trail.
          </p>
        </div>
      </div>
    );
  }

  // Load audit events
  const { events } = await loadAuditTrailWorkspace(tenant.company.slug);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Audit Trail</h1>
          <p className="text-text-muted">
            Review system events, changes, and decisions.
          </p>
        </div>
        <AuditTrailViewer initialEvents={events} />
      </div>
    </div>
  );
}
