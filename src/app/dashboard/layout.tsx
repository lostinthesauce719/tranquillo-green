import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TenantShell } from "@/components/shell/tenant-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Extract tenant info from Clerk metadata
  // In production: user.publicMetadata.companyId, user.publicMetadata.role
  // For now: use demo defaults so the app works without Clerk being configured
  const companySlug =
    (user.publicMetadata?.companySlug as string) || "demo-dispensary";
  const companyName =
    (user.publicMetadata?.companyName as string) || "Demo Dispensary";
  const companyId =
    (user.publicMetadata?.companyId as string) || "demo";
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
