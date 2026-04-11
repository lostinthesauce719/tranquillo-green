"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { TenantRole } from "./roles";

export interface TenantInfo {
  companyId: string;
  companySlug: string;
  companyName: string;
  role: TenantRole;
}

const TenantContext = createContext<TenantInfo | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantInfo;
  children: ReactNode;
}) {
  const value = useMemo(() => tenant, [tenant]);
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantInfo {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within <TenantProvider>");
  return ctx;
}

export function useTenantMaybe(): TenantInfo | null {
  return useContext(TenantContext);
}
