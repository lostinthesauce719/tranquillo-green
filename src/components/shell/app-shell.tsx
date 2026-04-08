"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { moduleLinks, type NavLink } from "@/lib/navigation";
import { useTenantMaybe } from "@/lib/auth/tenant-context";
import { ROLE_LABELS, canAccess, type TenantRole } from "@/lib/auth/roles";

const roleBadgeColor: Record<TenantRole, string> = {
  owner: "bg-amber-500/20 text-amber-300",
  controller: "bg-blue-500/20 text-blue-300",
  accountant: "bg-emerald-500/20 text-emerald-300",
  viewer: "bg-neutral-500/20 text-neutral-300",
};

const SECTION_ORDER = ["Core", "Workflows", "Operations", "Handoff", "System"];

function groupBySection(links: NavLink[]): { section: string; links: NavLink[] }[] {
  const map = new Map<string, NavLink[]>();
  for (const link of links) {
    const arr = map.get(link.section) ?? [];
    arr.push(link);
    map.set(link.section, arr);
  }
  return SECTION_ORDER
    .filter((s) => map.has(s))
    .map((s) => ({ section: s, links: map.get(s)! }));
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const tenant = useTenantMaybe();
  const pathname = usePathname();
  const role: TenantRole = tenant?.role ?? "owner";
  const visibleLinks = tenant
    ? moduleLinks.filter((l) => canAccess(role, l.href))
    : moduleLinks;

  const sections = groupBySection(visibleLinks);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-border bg-surface p-5 lg:block">
          <div className="mb-6 flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "h-9 w-9" },
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {tenant?.companyName ?? "Tranquillo Green"}
              </div>
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor[role]}`}
              >
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.3em] text-accent">
              Tranquillo Labs
            </div>
            <div className="mt-2 text-2xl font-semibold">Green</div>
            <p className="mt-2 text-sm text-text-muted">
              CA-first accounting and compliance OS for cannabis operators.
            </p>
          </div>
          <nav>
            {sections.map((group) => (
              <div key={group.section}>
                <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted/50 mt-4 mb-1 px-3">
                  {group.section}
                </div>
                <div className="space-y-0.5">
                  {group.links.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl border px-3 py-2 text-sm transition ${isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-transparent text-text-muted hover:border-border hover:bg-surface-mid hover:text-text-primary"}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="flex-1 rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl shadow-black/20">
          <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted/60">Where you are</div>
                <div className="mt-1 text-sm text-text-muted">{title} in {tenant?.companyName ?? "Tranquillo Green"}</div>
              </div>
              {tenant && (
                <div className="text-xs text-text-muted">
                  {tenant.companyName} &middot; <span className="capitalize">{tenant.role}</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="max-w-3xl text-sm text-text-muted">{description}</p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
