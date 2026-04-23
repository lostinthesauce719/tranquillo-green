"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════
   AI INSIGHTS PANEL
   — Contextual "why" explanations for any entity in the system
   — Drop into transaction detail, allocation queue, reconciliation, etc.
   — Shows confidence, reasoning chain, related entities, suggested actions
   ═══════════════════════════════════════════════════════════════════ */

export interface InsightItem {
  id: string;
  type: "explanation" | "alert" | "recommendation" | "context";
  title: string;
  body: string;
  confidence?: number;
  evidence?: string[];
  relatedEntities?: Array<{
    type: string;
    label: string;
    href?: string;
  }>;
  suggestedAction?: {
    label: string;
    onClick?: () => void;
  };
  timestamp?: string;
  actor?: string;
}

export interface AiInsightsPanelProps {
  title?: string;
  subtitle?: string;
  insights: InsightItem[];
  loading?: boolean;
  maxVisible?: number;
  className?: string;
  compact?: boolean;
}

const typeConfig = {
  explanation: {
    icon: "💡",
    color: "info" as const,
    label: "Explanation",
  },
  alert: {
    icon: "⚠️",
    color: "warning" as const,
    label: "Alert",
  },
  recommendation: {
    icon: "🎯",
    color: "success" as const,
    label: "Recommendation",
  },
  context: {
    icon: "🔗",
    color: "neutral" as const,
    label: "Context",
  },
};

function ConfidenceMeter({ value }: { value: number }) {
  const color =
    value >= 85
      ? "bg-success"
      : value >= 60
        ? "bg-warning"
        : "bg-danger";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-surface-overlay overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-text-faint tabular-nums">{value}%</span>
    </div>
  );
}

export function AiInsightsPanel({
  title = "Insights",
  subtitle,
  insights,
  loading = false,
  maxVisible = 5,
  className,
  compact = false,
}: AiInsightsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const visible = expanded ? insights : insights.slice(0, maxVisible);
  const hasMore = insights.length > maxVisible;

  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-surface p-5", className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded bg-surface-raised animate-pulse" />
          <div className="h-4 w-24 rounded bg-surface-raised animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="h-3 w-3/4 rounded bg-surface-raised animate-pulse mb-2" />
            <div className="h-3 w-1/2 rounded bg-surface-raised animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-surface p-5",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-medium text-text-secondary">{title}</span>
        </div>
        <p className="text-xs text-text-faint">
          No insights yet. The system will surface explanations as data flows through the
          system.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface",
        compact ? "p-3" : "p-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-medium text-text-secondary">
            {title}
          </span>
          <Badge variant="info" size="sm">
            {insights.length}
          </Badge>
        </div>
        {subtitle && (
          <span className="text-[10px] text-text-faint">{subtitle}</span>
        )}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {visible.map((insight) => {
          const config = typeConfig[insight.type];
          const isExpanded = expandedItems.has(insight.id);

          return (
            <div
              key={insight.id}
              className={cn(
                "rounded-xl border transition-all duration-200",
                isExpanded
                  ? "border-border bg-surface-raised"
                  : "border-border-subtle bg-surface-mid/50 hover:bg-surface-raised hover:border-border cursor-pointer"
              )}
              onClick={() => toggleItem(insight.id)}
            >
              {/* Row */}
              <div className="flex items-start gap-3 p-3">
                <span className="text-sm mt-0.5 shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-text-primary truncate">
                      {insight.title}
                    </span>
                    <Badge variant={config.color} size="sm">
                      {config.label}
                    </Badge>
                    {insight.confidence !== undefined && (
                      <ConfidenceMeter value={insight.confidence} />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11px] text-text-muted leading-relaxed",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {insight.body}
                  </p>
                </div>
                <span className="text-[10px] text-text-faint shrink-0 mt-0.5">
                  {isExpanded ? "▾" : "▸"}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-border-subtle pt-2.5 ml-8">
                  {/* Evidence */}
                  {insight.evidence && insight.evidence.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-text-faint uppercase tracking-wider">
                        Evidence
                      </span>
                      <ul className="mt-1 space-y-1">
                        {insight.evidence.map((e, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-text-muted flex items-start gap-1.5"
                          >
                            <span className="text-text-faint mt-0.5">•</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related entities */}
                  {insight.relatedEntities &&
                    insight.relatedEntities.length > 0 && (
                      <div>
                        <span className="text-[10px] font-medium text-text-faint uppercase tracking-wider">
                          Related
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {insight.relatedEntities.map((entity, i) => (
                            <Badge key={i} variant="neutral" size="sm">
                              <span className="text-text-faint mr-1">
                                {entity.type}
                              </span>
                              {entity.href ? (
                                <a
                                  href={entity.href}
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {entity.label}
                                </a>
                              ) : (
                                entity.label
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Suggested action */}
                  {insight.suggestedAction && (
                    <button
                      className="text-[11px] font-medium text-brand hover:text-brand/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        insight.suggestedAction?.onClick?.();
                      }}
                    >
                      → {insight.suggestedAction.label}
                    </button>
                  )}

                  {/* Meta */}
                  {(insight.actor || insight.timestamp) && (
                    <div className="flex items-center gap-2 text-[10px] text-text-faint">
                      {insight.actor && <span>by {insight.actor}</span>}
                      {insight.timestamp && <span>{insight.timestamp}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          className="mt-3 text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors w-full text-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show less"
            : `Show ${insights.length - maxVisible} more insights`}
        </button>
      )}
    </div>
  );
}

export default AiInsightsPanel;
