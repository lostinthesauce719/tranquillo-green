"use client";

import { type ReactNode } from "react";
import { TenantProvider, type TenantInfo } from "@/lib/auth/tenant-context";

export function TenantShell({
  tenant,
  children,
}: {
  tenant: TenantInfo;
  children: ReactNode;
}) {
  return <TenantProvider tenant={tenant}>{children}</TenantProvider>;
}
