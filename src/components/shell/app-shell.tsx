"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { moduleLinks, filterLinksByOperator, type NavLink } from "@/lib/navigation";
import { useTenantMaybe } from "@/lib/auth/tenant-context";
import { ROLE_LABELS, canAccess, type TenantRole } from "@/lib/auth/roles";
import { OperatorBanner } from "@/components/shell/operator-banner";

/* ── role badge tokens ─────────────────────────────────────────────── */

const roleBadgeColor: Record<TenantRole, string> = {
  owner: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  controller: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  accountant: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  viewer: "bg-neutral-500/15 text-neutral-300 border border-neutral-500/20",
};

/* ── section helpers ───────────────────────────────────────────────── */

const SECTION_ORDER = ["Core", "Workflows", "Operations", "Handoff", "System"];

function groupBySection(links: NavLink[]): { section: string; links: NavLink[] }[] {
  const map = Map.groupBy(links, (l) => l.section);
  return SECTION_ORDER.filter((s) => map.has(s)).map((s) => ({
    section: s,
    links: map.get(s)!,
  }));
}

/* ── SVG brand leaf icon ───────────────────────────────────────────── */

function BrandLeaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 28C8 28 6 18 14 12C22 6 28 4 28 4C28 4 26 14 18 20C10 26 8 28 8 28Z"
        fill="var(--brand)"
        fillOpacity="0.25"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 28C14 22 20 16 28 4"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── hamburger icon ────────────────────────────────────────────────── */

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

/* ── sidebar content (shared between desktop + mobile) ─────────────── */

function SidebarNav({
  sections,
  pathname,
}: {
  sections: { section: string; links: NavLink[] }[];
  pathname: string;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      {sections.map((section) => (
        <div key={section.section} className="mb-5">
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-faint">
            {section.section}
          </div>
          <div className="space-y-0.5">
            {section.links.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative block rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] ${
                    active
                      ? "bg-brand-soft text-text-primary"
                      : "text-text-muted hover:bg-surface-overlay/60 hover:text-text-secondary"
                  }`}
                >
                  {/* active left accent bar */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-brand transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] ${
                      active
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-50 group-hover:opacity-40 group-hover:scale-75"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/* ── main component ────────────────────────────────────────────────── */

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = tenant
    ? filterLinksByOperator(moduleLinks, tenant.operatorType).filter((l) => canAccess(role, l.href))
    : moduleLinks;

  const sections = groupBySection(visibleLinks);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex max-w-[1440px] gap-0 lg:gap-6 lg:px-6 lg:py-6">
        {/* ── desktop sidebar ─────────────────────────────────── */}
        <aside
          className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col rounded-2xl border border-border-subtle overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, var(--surface) 0%, var(--surface-raised) 100%)",
          }}
        >
          {/* brand header */}
          <div className="flex items-center gap-3 px-5 pt-6 pb-2">
            <BrandLeaf className="h-8 w-8 shrink-0" />
            <div>
              <div className="text-lg font-semibold leading-tight tracking-tight text-text-primary">
                Tranquillo
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand">
                Green
              </div>
            </div>
          </div>

          {/* separator */}
          <div className="mx-5 my-3 h-px bg-border-subtle" />

          {/* nav links */}
          <SidebarNav sections={sections} pathname={pathname} />

          {/* separator */}
          <div className="mx-5 h-px bg-border-subtle" />

          {/* user area */}
          <div className="flex items-center gap-3 px-5 py-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "h-9 w-9" },
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-secondary">
                {tenant?.companyName ?? "Workspace"}
              </div>
              <span
                className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor[role]}`}
              >
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
        </aside>

        {/* ── mobile top bar ──────────────────────────────────── */}
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border-subtle bg-surface/80 px-4 py-3 backdrop-blur-lg lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors duration-[var(--duration-fast)] hover:bg-surface-overlay hover:text-text-primary"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BrandLeaf className="h-6 w-6" />
            <span className="text-sm font-semibold text-text-primary">
              Tranquillo Green
            </span>
          </div>
        </div>

        {/* ── mobile overlay sidebar ──────────────────────────── */}
        {/* backdrop */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-[var(--duration-normal)] ease-[var(--ease-out)] lg:hidden ${
            mobileOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMobile}
          aria-hidden
        />

        {/* sliding panel */}
        <div
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border-subtle transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] lg:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            background:
              "linear-gradient(180deg, var(--surface) 0%, var(--surface-raised) 100%)",
          }}
        >
          {/* mobile header with close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-3">
              <BrandLeaf className="h-8 w-8 shrink-0" />
              <div>
                <div className="text-lg font-semibold leading-tight tracking-tight text-text-primary">
                  Tranquillo
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand">
                  Green
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closeMobile}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors duration-[var(--duration-fast)] hover:bg-surface-overlay hover:text-text-primary"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-5 my-3 h-px bg-border-subtle" />

          {/* nav */}
          <SidebarNav sections={sections} pathname={pathname} />

          <div className="mx-5 h-px bg-border-subtle" />

          {/* user area */}
          <div className="flex items-center gap-3 px-5 py-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "h-9 w-9" },
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-secondary">
                {tenant?.companyName ?? "Workspace"}
              </div>
              <span
                className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor[role]}`}
              >
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
        </div>

        {/* ── main content ────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 py-6 lg:rounded-2xl lg:border lg:border-border-subtle lg:bg-surface-raised lg:p-8 lg:shadow-lg lg:shadow-black/15">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              {description}
            </p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
