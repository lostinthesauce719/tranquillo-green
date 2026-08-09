"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import { RefreshCw, AlertTriangle, FileBarChart } from "lucide-react";

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function firstOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Shared loader for the financial statement reports. Handles the fetch,
 * loading and error states, and the "no posted activity" empty state so each
 * statement only has to render its own numbers.
 */
export function useReport<T>(
  type: "trial-balance" | "income-statement" | "balance-sheet",
  params: Record<string, string | undefined>,
) {
  const tenant = useTenant();
  const [report, setReport] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams({ companyId: tenant.companyId, type });
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounting/reports?${queryString}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to build report");
      setReport(data.report as T);
    } catch (e: any) {
      setError(e.message || "Failed to build report");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  return { report, loading, error, reload: load, companyName: tenant.companyName };
}

export function ReportError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
      <span>{message}</span>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium hover:bg-red-500/10"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-16 animate-pulse rounded-xl border border-border/50 bg-surface-mid/50" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg border border-border/50 bg-surface/50" />
      ))}
    </div>
  );
}

export function ReportEmpty({ statement }: { statement: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid py-16 text-center">
      <FileBarChart className="mx-auto mb-3 h-10 w-10 text-text-faint" />
      <p className="text-sm text-text-muted">
        No posted transactions in this period, so the {statement} has nothing to report.
      </p>
      <p className="mt-1 text-xs text-text-faint">
        Import or record transactions and post them to see live figures here.
      </p>
    </div>
  );
}

export function UnpostedNotice({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {count} transaction{count === 1 ? " is" : "s are"} not posted and{" "}
        {count === 1 ? "is" : "are"} excluded from this statement. Post them to include their
        activity.
      </span>
    </div>
  );
}

export function PeriodPicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onRefresh,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-text-muted">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-muted">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </button>
    </div>
  );
}

export function AsOfPicker({
  asOfDate,
  onChange,
  onRefresh,
}: {
  asOfDate: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-text-muted">As of</label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </button>
    </div>
  );
}

export function exportCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
