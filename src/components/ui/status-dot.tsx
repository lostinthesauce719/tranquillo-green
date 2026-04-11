import * as React from "react";
import { cn } from "@/lib/utils";

const statusColorMap = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
  gray: "bg-text-muted",
};

const statusPulseMap = {
  green: "animate-pulse",
  amber: "",
  red: "animate-pulse",
  gray: "",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "green" | "amber" | "red" | "gray";
  pulse?: boolean;
  size?: "sm" | "md";
}

const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, status, pulse, size = "md", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-block rounded-full",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          statusColorMap[status],
          pulse && statusPulseMap[status],
          className
        )}
        aria-label={`Status: ${status}`}
        {...props}
      />
    );
  }
);

StatusDot.displayName = "StatusDot";

export { StatusDot };
