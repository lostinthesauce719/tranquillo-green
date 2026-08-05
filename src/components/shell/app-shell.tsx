"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { moduleLinks, filterLinksByOperator, type NavLink } from "@/lib/navigation";
import { useTenantMaybe } from "@/lib/auth/tenant-context";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

const SECTION_ORDER = ["Core", "Workflows", "Operations", "Handoff", "System"];

function groupBySection(links: NavLink[]): { section: string; links: NavLink[] }[] {
  const map = new Map<string, NavLink[]>();
  for (const l of links) {
    const s = l.section || "Other";
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(l);
  }
  return SECTION_ORDER.filter((s) => map.has(s)).map((s) => ({
    section: s,
    links: map.get(s)!,
  }));
}

// Nav icons per route
const navIcons: Record<string, string> = {
  "/dashboard": "⌘",
  "/dashboard/accounting": "◫",
  "/dashboard/accounting/close": "◷",
  "/dashboard/accounting/reports": "⊡",
  "/dashboard/accounting/pipeline": "⟳",
  "/dashboard/accounting/transactions": "⇅",
  "/dashboard/accounting/imports": "⊕",
  "/dashboard/allocations": "⊗",
  "/dashboard/allocations/cogs-review": "⊙",
  "/dashboard/allocations/policies": "⌥",
  "/dashboard/allocations/history": "◎",
  "/dashboard/allocations/support-schedule": "⊘",
  "/dashboard/inventory": "⊟",
  "/dashboard/compliance": "⊛",
  "/dashboard/reconciliations": "⊜",
  "/dashboard/exports": "↗",
  "/dashboard/automation": "⚡",
  "/dashboard/settings": "⊙",
};

/*
 * Nav badges were hardcoded: a red "3" on Allocations, an amber "2" on
 * Compliance, a green "live" on Automation. They rendered on every page for
 * every operator regardless of state.
 *
 * A red count in navigation is a claim that three specific things need you. An
 * operator with an empty queue saw "3" and went looking; an operator with
 * fourteen items waiting also saw "3". Either way the number was noise dressed
 * as a signal, and "live" asserted a health status nothing was checking.
 *
 * Left empty rather than invented. Real counts need a per-tenant query in the
 * shell, which is worth doing — the allocation queue already exposes
 * needsReviewCount — but a wrong number is worse than none.
 */
const navBadges: Record<string, { text: string; variant: "r" | "g" | "a" } | null> = {};

function TileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="3" fill="var(--teal)" fillOpacity=".15" stroke="var(--teal)" strokeWidth="1.5" />
      <rect x="18" y="2" width="12" height="12" rx="3" fill="var(--gold)" fillOpacity=".15" stroke="var(--gold)" strokeWidth="1.5" />
      <rect x="2" y="18" width="12" height="12" rx="3" fill="var(--lav)" fillOpacity=".15" stroke="var(--lav)" strokeWidth="1.5" />
      <rect x="18" y="18" width="12" height="12" rx="3" fill="var(--sky)" fillOpacity=".15" stroke="var(--sky)" strokeWidth="1.5" />
    </svg>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ currentPath }: { currentPath: string }) {
  const tenant = useTenantMaybe();
  const visibleLinks = tenant
    ? filterLinksByOperator(moduleLinks, tenant.operatorType ?? "vertical")
    : moduleLinks;
  const sections = groupBySection(visibleLinks);
  const activeSection = sections.find((s) => s.links.some((l) => currentPath === l.href || currentPath.startsWith(l.href + "/")));

  return (
    <nav className="sb">
      <div className="sb-shimmer" />
      <div className="logo-wrap">
        <Link href="/dashboard" className="no-underline">
          <div className="logo-chip">
            <div className="logo-hex">T</div>
            <span className="logo-name">Tranquillo</span>
          </div>
        </Link>
        <div className="org-row">
          <div className="org-led" />
          <span className="org-name">{tenant?.operatorType ? `${tenant.operatorType.charAt(0).toUpperCase() + tenant.operatorType.slice(1)} · Seed-to-Sale` : "Vertical · Seed-to-Sale"}</span>
          <span className="org-chev">⌄</span>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.section} className="nav-block">
          <div className="nav-lbl">{section.section}</div>
          {section.links.map((item) => {
            const active = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(item.href));
            const icon = navIcons[item.href] || "·";
            const badge = navBadges[item.href];
            return (
              <Link key={item.href} href={item.href} className={`nav-item no-underline ${active ? "on" : ""}`}>
                <span className="ni-ico">{icon}</span>
                {item.label}
                {badge && <span className={`ni-pip ${badge.variant}`}>{badge.text}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <ActivePeriodChip />
    </nav>
  );
}

/**
 * The active period, read from the database.
 *
 * This was the string "March 2026" with a "REVIEW" badge, on every page, for
 * every operator, forever. Someone closing April would have had March pinned to
 * their sidebar telling them otherwise.
 */
function ActivePeriodChip() {
  const tenant = useTenantMaybe();
  const period = useQuery(
    api.reportingPeriods.getCurrentPeriod,
    tenant ? ({ companyId: tenant.companyId } as any) : "skip",
  );

  // Say nothing rather than guess. An empty footer is honest; a wrong period is
  // the kind of thing an operator files against.
  if (!tenant || period === undefined || period === null) return null;

  return (
    <div className="sb-foot">
      <div className="period-chip">
        <div>
          <div className="pc-label">Active Period</div>
          <div className="pc-value">{period.label}</div>
        </div>
        <div className="pc-badge">{String(period.status ?? "").toUpperCase()}</div>
      </div>
    </div>
  );
}

/**
 * Unresolved compliance alerts, or nothing.
 *
 * Replaces a static "All agents healthy" claim. This reports one specific thing
 * it can actually see — open alerts for this company — and stays silent
 * otherwise. Silence is not a claim; a green dot is.
 */
function StatusBar() {
  const tenant = useTenantMaybe();
  const alerts = useQuery(
    api.compliance.getUnresolvedAlerts,
    tenant ? ({ companyId: tenant.companyId } as any) : "skip",
  );

  if (!tenant || alerts === undefined || alerts === null) return null;

  const open = Array.isArray(alerts) ? alerts.filter((a: any) => !a.resolvedAt) : [];
  if (open.length === 0) return null;

  const critical = open.filter((a: any) => a.severity === "critical").length;

  return (
    <div className="status-bar">
      <div className="sb-dot" style={{ background: critical > 0 ? "var(--danger)" : "var(--warning)" }} />
      <span className="sb-txt">
        {open.length} open compliance {open.length === 1 ? "alert" : "alerts"}
      </span>
      {critical > 0 && <span className="sb-detail">— {critical} critical</span>}
      <Link href="/dashboard/compliance" className="sb-link">Review →</Link>
    </div>
  );
}

/* ─── Main Shell ─── */
export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tenant = useTenantMaybe();

  return (
    <div className="flex min-h-screen w-full dashboard-layout">
      <Sidebar currentPath={pathname} />

      <div className="main flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <div className="topbar">
          <div className="tb-bc">
            <span className="tb-page">{title}</span>
            <span className="tb-sep">/</span>
            {/* Was "Demo Dispensary, LLC" — a fallback that would appear as the
                operator's own company name if tenant context failed to load. */}
            {tenant?.companyName && <span className="tb-sub">{tenant.companyName}</span>}
          </div>
          {/*
            These three were <button> elements with no handler — rendered on
            every dashboard page and doing nothing on click. Every other button
            in the shell is wired; these were the only dead ones.

            They navigate, so they are links, not buttons. That also fixes the
            accessibility problem: a <button> with no handler is focusable and
            announced as a button to a screen reader, then does nothing. As
            links they support keyboard, middle-click, right-click and
            prefetching for free.

            "Start Close" navigates to the close workspace rather than firing an
            action, because no close mutation exists yet. Opening the page the
            operator works from is honest; a button that claims to start a close
            and silently doesn't is not.
          */}
          <div className="tb-actions">
            <Link href="/dashboard/exports" className="xbtn ghost">
              ↓ Export
            </Link>
            <Link href="/dashboard/accounting/transactions" className="xbtn ghost">
              + New
            </Link>
            <Link href="/dashboard/accounting/close" className="xbtn cta">
              ▶ Start Close
            </Link>
          </div>
        </div>

        {/*
          The status bar read "All agents healthy — no blockers detected" with a
          green dot, statically, on every page.

          That is a safety claim, and nothing anywhere was checking it. An
          operator with a failed sync, an unbalanced journal or an overdue filing
          saw a green light telling them everything was fine — and this bar sits
          above every screen in the product, so it was the most-seen sentence in
          the application and one of the few that could never be true or false
          for the right reasons.

          Removed rather than faked green. When there is a real health check to
          report, this is the place for it; until then the pages below say what
          they actually know.
        */}
        <StatusBar />

        {/* Content */}
        <div className="cnt">{children}</div>
      </div>
    </div>
  );
}