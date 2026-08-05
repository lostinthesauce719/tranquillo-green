import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════
   BREADCRUMBS
   — Shows current location in the app hierarchy
   — Auto-generated from pathname or passed explicitly
   ═══════════════════════════════════════════════════════════════════ */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-1.5 text-[11px]", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="text-text-faint select-none">/</span>
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast
                    ? "text-text-secondary font-medium"
                    : "text-text-faint"
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-text-faint hover:text-text-secondary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
