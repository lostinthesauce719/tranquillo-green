import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, iconLeft, iconRight, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={errorId || hintId}
            className={cn(
              "flex h-10 w-full rounded-md border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint transition-tranquil",
              "border-border hover:border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              iconLeft && "pl-10",
              iconRight && "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
              {iconRight}
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
