import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-6 text-center",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised text-text-muted">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="mt-1.5 max-w-sm text-sm text-text-muted">
            {description}
          </p>
        )}
        {action && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
