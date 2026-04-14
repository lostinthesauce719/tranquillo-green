import { currentUser } from "@clerk/nextjs/server";
import { anyApi } from "convex/server";
import { redirect } from "next/navigation";
import { TenantShell } from "@/components/shell/tenant-shell";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";

export const dynamic = "force-dynamic";

// Demo tenant for unauthenticated access
const DEMO_TENANT = {
  companyId: "demo",
  companySlug: "demo-dispensary",
  companyName: "Demo Dispensary",
  role: "owner" as const,
  operatorType: "vertical" as const,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // If no user, use demo mode instead of redirecting
  if (!user) {
    return (
      <TenantShell tenant={DEMO_TENANT}>
        {children}
      </TenantShell>
    );
  }

  let persistedTenant:
    | {
        companyId: string;
        companySlug: string;
        companyName: string;
        role: "owner" | "controller" | "accountant" | "viewer";
        operatorType: "dispensary" | "cultivator" | "manufacturer" | "distributor" | "delivery" | "vertical";
      }
    | null = null;

  try {
    const client = await getAuthenticatedConvexClient();
    if (client) {
      await client.mutation((anyApi as any).users.getOrCreateUser, {});
      const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
      if (tenant?.company?._id) {
        persistedTenant = {
          companyId: tenant.company._id,
          companySlug: tenant.company.slug,
          companyName: tenant.company.name,
          role: (tenant.user?.role ?? "viewer") as "owner" | "controller" | "accountant" | "viewer",
          operatorType: (tenant.company?.operatorType ?? "vertical") as "dispensary" | "cultivator" | "manufacturer" | "distributor" | "delivery" | "vertical",
        };
      }
    }
  } catch {
    // User sync is best-effort; the dashboard should still render.
  }

  // If authenticated user has no company, redirect to onboarding
  if (!persistedTenant) {
    redirect("/onboarding");
  }

  const companySlug = persistedTenant.companySlug;
  const companyName = persistedTenant.companyName;
  const companyId = persistedTenant.companyId;
  const role = persistedTenant.role;
  const operatorType = persistedTenant.operatorType;

  return (
    <TenantShell
      tenant={{
        companyId,
        companySlug,
        companyName,
        role,
        operatorType,
      }}
    >
      {children}
    </TenantShell>
  );
}
