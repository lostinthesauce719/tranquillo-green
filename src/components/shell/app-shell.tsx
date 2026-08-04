"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { moduleLinks, filterLinksByOperator, type NavLink } from "@/lib/navigation";
import { useTenantMaybe } from "@/lib/auth/tenant-context";

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
  "/dashboard/allocations/history": "◎",
  "/dashboard/allocations/support-schedule": "⊘",
  "/dashboard/inventory": "⊟",
  "/dashboard/compliance": "⊛",
  "/dashboard/reconciliations": "⊜",
  "/dashboard/exports": "↗",
  "/dashboard/automation": "⚡",
  "/dashboard/settings": "⊙",
};

// Badge data for nav items (counts)
const navBadges: Record<string, { text: string; variant: "r" | "g" | "a" } | null> = {
  "/dashboard/allocations": { text: "3", variant: "r" },
  "/dashboard/compliance": { text: "2", variant: "a" },
  "/dashboard/automation": { text: "live", variant: "g" },
};

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

      <div className="sb-foot">
        <div className="period-chip">
          <div>
            <div className="pc-label">Active Period</div>
            <div className="pc-value">March 2026</div>
          </div>
          <div className="pc-badge">REVIEW</div>
        </div>
      </div>
    </nav>
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
            <span className="tb-sub">{tenant?.companyName ?? "Demo Dispensary, LLC"}</span>
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

        {/* Status Bar */}
        <div className="status-bar">
          <div className="sb-dot" />
          <span className="sb-txt">All agents healthy</span>
          <span className="sb-detail">— no blockers detected</span>
          <Link href="/dashboard/automation" className="sb-link">View agents →</Link>
        </div>

        {/* Content */}
        <div className="cnt">{children}</div>
      </div>
    </div>
  );
}