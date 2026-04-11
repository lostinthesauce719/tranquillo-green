import { currentUser } from "@clerk/nextjs/server";
import { anyApi } from "convex/server";
import { redirect } from "next/navigation";
import { TenantShell } from "@/components/shell/tenant-shell";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  let persistedTenant:
    | {
        companyId: string;
        companySlug: string;
        companyName: string;
        role: "owner" | "controller" | "accountant" | "viewer";
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
        };
      }
    }
  } catch {
    // User sync is best-effort; the dashboard should still render.
  }

  const companySlug =
    persistedTenant?.companySlug ||
    (user.publicMetadata?.companySlug as string) ||
    DEMO_COMPANY_SLUG;
  const companyName =
    persistedTenant?.companyName ||
    (user.publicMetadata?.companyName as string) ||
    "Golden State Greens, LLC";
  const companyId =
    persistedTenant?.companyId ||
    (user.publicMetadata?.companyId as string) ||
    DEMO_COMPANY_SLUG;
  const role =
    persistedTenant?.role ||
    (user.publicMetadata?.role as "owner" | "controller" | "accountant" | "viewer") ||
    "owner";

  return (
    <TenantShell
      tenant={{
        companyId,
        companySlug,
        companyName,
        role,
      }}
    >
      {children}
    </TenantShell>
  );
}
