"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id?: string | number;
  time: string;
  action: string;
  actor: string;
  color?: string;
}

export interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ActivityItem[];
  maxItems?: number;
}

const ActivityFeed = React.forwardRef<HTMLDivElement, ActivityFeedProps>(
  ({ className, items, maxItems = 10, ...props }, ref) => {
    const [prevFirstId, setPrevFirstId] = React.useState<string | number | null>(null);
    const [flashIndex, setFlashIndex] = React.useState<number | null>(null);

    const visibleItems = items.slice(0, maxItems);

    React.useEffect(() => {
      const firstId = visibleItems[0]?.id ?? (visibleItems[0] ? 0 : null);
      if (firstId !== null && firstId !== prevFirstId && prevFirstId !== null) {
        setFlashIndex(0);
        const timer = setTimeout(() => setFlashIndex(null), 1500);
        return () => clearTimeout(timer);
      }
      if (firstId !== null) {
        setPrevFirstId(firstId);
      }
    }, [visibleItems]);

    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {visibleItems.map((item, index) => {
          const dotColor = item.color ?? "var(--brand)";

          return (
            <div
              key={item.id ?? index}
              className={cn(
                "relative flex gap-3 py-3 px-3 rounded-lg",
                "transition-all duration-300",
                flashIndex === index && "animate-[highlight-flash_1.5s_ease-out]"
              )}
              style={{
                animation: `slide-in-up var(--duration-slow) var(--ease-out) ${index * 60}ms both`,
              }}
            >
              {/* Timeline line */}
              {index < visibleItems.length - 1 && (
                <div className="absolute left-[19px] top-[36px] bottom-0 w-px bg-border-subtle" />
              )}

              {/* Dot */}
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium text-text-primary">
                    {item.actor}
                  </span>{" "}
                  <span className="text-text-muted">{item.action}</span>
                </div>
                <span className="text-xs text-text-faint">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

ActivityFeed.displayName = "ActivityFeed";

export { ActivityFeed };
