/** User roles within a cannabis company tenant */
export type TenantRole = "owner" | "controller" | "accountant" | "viewer";

export const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Owner",
  controller: "Controller",
  accountant: "Accountant",
  viewer: "Viewer",
};

/** Which nav sections each role can access */
export const ROLE_PERMISSIONS: Record<TenantRole, readonly string[]> = {
  owner: [
    "overview", "accounting", "allocations", "inventory",
    "compliance", "reconciliations", "exports", "automation", "settings",
  ],
  controller: [
    "overview", "accounting", "allocations", "inventory",
    "compliance", "reconciliations", "exports", "automation",
  ],
  accountant: [
    "overview", "accounting", "allocations",
    "reconciliations", "exports",
  ],
  viewer: ["overview", "accounting"],
};

/** Map a nav href to its section key for role gating */
export function navSection(href: string): string {
  const segment = href.replace("/dashboard", "").split("/").filter(Boolean)[0];
  return segment || "overview";
}

export function canAccess(role: TenantRole, href: string): boolean {
  return ROLE_PERMISSIONS[role].includes(navSection(href));
}
