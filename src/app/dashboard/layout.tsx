import { currentUser } from "@clerk/nextjs/server";
import { anyApi } from "convex/server";
import { redirect } from "next/navigation";
import { TenantShell } from "@/components/shell/tenant-shell";
import { DashboardAiShell } from "@/components/shell/dashboard-ai-shell";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { SandboxBanner } from "@/components/sandbox/SandboxBanner";
import { DemoModeBanner } from "@/components/sandbox/DemoModeBanner";
import { DemoTour } from "@/components/onboarding/DemoTour";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser().catch(() => null);

  if (!user) {
    redirect("/auth?after_auth=/dashboard");
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    redirect("/auth?after_auth=/dashboard");
  }

  let persistedTenant: {
    companyId: string;
    companySlug: string;
    companyName: string;
    role: "owner" | "controller" | "accountant" | "viewer";
    operatorType:
      | "dispensary"
      | "cultivator"
      | "manufacturer"
      | "distributor"
      | "delivery"
      | "vertical";
  } | null = null;

  let isSandbox = false;

  try {
    await client.mutation((anyApi as any).users.getOrCreateUser, {});
    const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
    if (tenant?.company?._id) {
      persistedTenant = {
        companyId: tenant.company._id,
        companySlug: tenant.company.slug,
        companyName: tenant.company.name,
        role: (tenant.user?.role ?? "viewer") as typeof persistedTenant extends null
          ? never
          : "owner" | "controller" | "accountant" | "viewer",
        operatorType: (tenant.company?.operatorType ?? "vertical") as typeof persistedTenant extends null
          ? never
          : "dispensary" | "cultivator" | "manufacturer" | "distributor" | "delivery" | "vertical",
      };

      try {
        const sandboxStatus = await client.query((anyApi as any).sandbox.getSandboxStatus, {
          companyId: tenant.company._id,
        });
        isSandbox = sandboxStatus?.isSandbox === true;
      } catch {
        // Best-effort
      }
    }
  } catch {
    // User sync is best-effort.
  }

  if (!persistedTenant) {
    redirect("/onboarding");
  }

  const { companyId, companySlug, companyName, role, operatorType } = persistedTenant;

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
      {isSandbox ? (
        <DemoModeBanner companyId={companyId} />
      ) : (
        <Suspense fallback={null}>
          <SandboxBanner companyId={companyId} />
        </Suspense>
      )}
      <DemoTour isSandbox={isSandbox} />
      <DashboardAiShell>{children}</DashboardAiShell>
    </TenantShell>
  );
}
