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

  try {
    const client = await getAuthenticatedConvexClient();
    if (client) {
      await client.mutation((anyApi as any).users.getOrCreateUser, {});
    }
  } catch {
    // User sync is best-effort; the dashboard should still render.
  }

  const companySlug =
    (user.publicMetadata?.companySlug as string) || DEMO_COMPANY_SLUG;
  const companyName =
    (user.publicMetadata?.companyName as string) || "Golden State Greens, LLC";
  const companyId =
    (user.publicMetadata?.companyId as string) || DEMO_COMPANY_SLUG;
  const role =
    (user.publicMetadata?.role as string) || "owner";

  return (
    <TenantShell
      tenant={{
        companyId,
        companySlug,
        companyName,
        role: role as "owner" | "controller" | "accountant" | "viewer",
      }}
    >
      {children}
    </TenantShell>
  );
}
