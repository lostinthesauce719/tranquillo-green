"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Table, Loader2, AlertCircle, CheckCircle2, Download, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DemoImportTargetField, DemoImportAmountStrategy, DemoImportColumn, DemoImportRow } from "@/lib/demo/accounting-workflows";

type CsvUploadFormProps = {
  companySlug: string;
  chartOfAccounts: { code: string; name: string; isActive?: boolean }[];
  periods: { label: string; startDate: string; endDate: string; status?: string }[];
  onSuccess?: () => void;
};

type ParsedDataset = {
  headers: string[];
  rows: Record<string, string>[];
  delimiter: string;
};

type UploadStatus = "idle" | "dragging" | "parsing" | "mapping" | "submitting" | "success" | "error";

const TARGET_FIELD_OPTIONS: { value: DemoImportTargetField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "postedDate", label: "Posted Date" },
  { value: "description", label: "Description" },
  { value: "reference", label: "Reference" },
  { value: "amount", label: "Amount (signed)" },
  { value: "debit", label: "Debit amount" },
  { value: "credit", label: "Credit amount" },
  { value: "location", label: "Location" },
  { value: "memo", label: "Memo" },
  { value: "ignore", label: "Ignore column" },
];

export function CsvUploadForm({ companySlug, chartOfAccounts, periods, onSuccess }: CsvUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedDataset | null>(null);
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState<string>(periods[0]?.label || "");
  const [amountStrategy, setAmountStrategy] = useState<DemoImportAmountStrategy>("single_signed");
  const [columnMappings, setColumnMappings] = useState<Record<string, DemoImportTargetField>>({});
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);

  function detectDelimiter(text: string): string {
    const commaCount = (text.match(/,/g) || []).length;
    const tabCount = (text.match(/	/g) || []).length;
    return tabCount > commaCount ? "	" : ",";
  }

  function parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  }

  function parseCSV(text: string, delimiter: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = parseCSVLine(lines[0], delimiter).map((h) => h.trim());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      rows.push(row);
    }
    return { headers, rows };
  }

  function normalizeKey(header: string): string {
    return header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  function inferColumnTargets(headers: string[]): Record<string, DemoImportTargetField> {
    const mapping: Record<string, DemoImportTargetField> = {};
    headers.forEach((h) => {
      const key = normalizeKey(h);
      const lh = h.toLowerCase();
      if (lh.includes("date")) mapping[key] = "date";
      else if (lh.includes("post") || lh.includes("posted")) mapping[key] = "postedDate";
      else if (lh.includes("desc")) mapping[key] = "description";
      else if (lh.includes("ref") || lh.includes("num") || lh.includes("check")) mapping[key] = "reference";
      else if (lh.includes("amount")) mapping[key] = "amount";
      else if (lh.includes("debit")) mapping[key] = "debit";
      else if (lh.includes("credit")) mapping[key] = "credit";
      else if (lh.includes("loc")) mapping[key] = "location";
      else if (lh.includes("memo")) mapping[key] = "memo";
      else mapping[key] = "ignore";
    });
    return mapping;
  }

  function getSampleValue(rows: Record<string, string>[], key: string): string {
    for (const row of rows) {
      const val = row[key];
      if (val && val.trim()) return val.trim();
    }
    return "-";
  }

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus("parsing");
    setError(null);
    setParsed(null);
    setColumnMappings({});
    setSubmitResult(null);

    try {
      const text = await selectedFile.text();
      const delimiter = detectDelimiter(text);
      const { headers, rows } = parseCSV(text, delimiter);
      if (headers.length === 0) throw new Error("No headers found in CSV");
      if (rows.length === 0) throw new Error("CSV contains no data rows");

      const inferred = inferColumnTargets(headers);
      setColumnMappings(inferred);

      setParsed({
        headers,
        rows: rows.slice(0, 5000),
        delimiter,
      });

      setStatus("mapping");
    } catch (e: any) {
      setError(e.message || "Failed to parse CSV");
      setStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus("dragging");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus("idle");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileChange(selected);
  };

  const handleSubmit = async () => {
    if (!parsed || !file || !selectedPeriodLabel) return;
    setStatus("submitting");
    setError(null);
    setSubmitResult(null);

    try {
      const columns: DemoImportColumn[] = parsed.headers.map((h) => ({
        key: normalizeKey(h),
        label: h,
        suggestedTarget: columnMappings[normalizeKey(h)] || "ignore",
        required: false,
        sampleValues: parsed.rows.slice(0, 3).map((r) => r[h] ?? ""),
      }));

      const demoRows: DemoImportRow[] = parsed.rows.map((rowValues, idx) => ({
        id: `row_${idx + 1}`,
        values: Object.fromEntries(
          parsed.headers.map((h) => [normalizeKey(h), rowValues[h] ?? ""])
        ),
        sourceAccountName: "",
        suggestedDebitAccountCode: "",
        suggestedCreditAccountCode: "",
        confidence: 0.5,
        status: "ready",
        validationIssues: [],
      }));

      const profileId = `profile-${Date.now()}`;
      const selectedProfile = {
        id: profileId,
        name: `Import: ${file.name}`,
        description: "Auto-generated mapping from CSV headers",
        amountStrategy,
        fieldMappings: columnMappings,
      };

      const effectiveMappings = columnMappings;

      const payload = {
        action: "stage" as const,
        companySlug,
        dataset: {
          id: `dataset-${Date.now()}`,
          fileName: file.name,
          source: "CSV Upload",
          periodLabel: selectedPeriodLabel,
          uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
          delimiter: parsed.delimiter,
          columns,
          rows: demoRows,
          selectedProfile,
          effectiveMappings,
        },
      };

      const res = await fetch("/api/accounting/import-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Staging failed");
      }

      setSubmitResult({ ok: true, message: data.message || "Import staged successfully" });
      setStatus("success");

      // Trigger page refresh to load new job
      router.refresh();
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
      setStatus("error");
    }
  };

  const needsRequiredMapping = useMemo(() => {
    if (!parsed) return false;
    const targets = new Set(Object.values(columnMappings));
    const required: DemoImportTargetField[] = amountStrategy === "split_debit_credit"
      ? ["date", "description", "reference", "debit", "credit"]
      : ["date", "description", "reference", "amount"];
    return required.some((r) => !targets.has(r));
  }, [parsed, columnMappings, amountStrategy]);

  return (
    <div className="space-y-6">
      {status === "idle" || status === "dragging" || status === "error" ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
            status === "dragging"
              ? "border-accent bg-accent/5"
              : "border-border bg-surface-mid hover:border-accent/50 hover:bg-surface"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <UploadCloud size={32} className={status === "dragging" ? "text-accent" : "text-text-faint"} />
            <div>
              <span className="font-medium text-text-primary">Click to upload or drag and drop</span>
              <br />
              <span className="text-xs">CSV files only, up to 10 MB</span>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-rose-300">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>
      )  : status === "parsing" ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-accent" />
            <div>
              <div className="font-medium text-text-primary">Parsing CSV...</div>
              <div className="text-xs text-text-muted">
                {file?.name}
              </div>
            </div>
          </div>
        </div>
      ) : status === "mapping" && parsed ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="font-medium text-text-primary">Configure import</div>
            <div className="text-xs text-text-muted">
              {file?.name} • {parsed.rows.length.toLocaleString()} rows • {parsed.headers.length} columns
            </div>
          </div>

          {/* Period selector */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-primary">Accounting period</label>
            <select
              value={selectedPeriodLabel}
              onChange={(e) => setSelectedPeriodLabel(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                          data-tour="period-select"
>
              {periods.map((p) => (
                <option key={p.label} value={p.label} disabled={p.status === "closed"}>
                  {p.label} {p.status === "closed" ? "(Closed)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Amount strategy */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-primary">Amount format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="radio"
                  name="amountStrategy"
                  checked={amountStrategy === "single_signed"}
                  onChange={() => setAmountStrategy("single_signed")}
                  className="accent-accent"
                />
                Single signed amount (negative = outflow)
              </label>
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="radio"
                  name="amountStrategy"
                  checked={amountStrategy === "split_debit_credit"}
                  onChange={() => setAmountStrategy("split_debit_credit")}
                  className="accent-accent"
                />
                Split debit / credit columns
              </label>
            </div>
          </div>

          {/* Column mapping */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Column mapping</label>
              <div className="text-xs text-text-muted">Map each CSV column to a target field</div>
            </div>
            <div data-tour="column-mapping" className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-mid text-text-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">CSV column</th>
                    <th className="px-4 py-2 text-left">Map to</th>
                    <th className="px-4 py-2 text-left">Sample</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.headers.map((header) => {
                    const key = normalizeKey(header);
                    return (
                      <tr key={key} className="hover:bg-surface-mid/50">
                        <td className="px-4 py-2 font-mono text-xs text-text-primary">{header}</td>
                        <td className="px-4 py-2">
                          <select
                            value={columnMappings[key] || "ignore"}
                            onChange={(e) =>
                              setColumnMappings({ ...columnMappings, [key]: e.target.value as DemoImportTargetField })
                            }
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                          >
                            {TARGET_FIELD_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-text-faint font-mono text-xs max-w-[200px] truncate" title={parsed.rows[0]?.[header] ?? ""}>
                          {parsed.rows[0]?.[header] ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {needsRequiredMapping && (
              <div className="mt-2 flex items-center gap-2 text-amber-300 text-xs">
                <AlertCircle size={14} />
                Required fields (date, description, reference, {amountStrategy === "split_debit_credit" ? "debit & credit" : "amount"}) must be mapped.
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-primary">Data preview (first 5 rows)</label>
            <div data-tour="preview-table" className="rounded-xl border border-border overflow-auto max-h-[300px]">
              <table className="w-full text-sm">
                <thead className="bg-surface-mid sticky top-0">
                  <tr>
                    {parsed.headers.map((h) => (
                      <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-surface-mid/30">
                      {parsed.headers.map((h) => (
                        <td key={h} className="px-4 py-2 truncate max-w-[150px]" title={row[h]}>
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setParsed(null);
                setStatus("idle");
              }}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:bg-surface/70"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              data-tour="stage-button"
              disabled={(status as string) === "submitting" || needsRequiredMapping}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                needsRequiredMapping
                  ? "cursor-not-allowed bg-neutral-500/20 text-neutral-300"
                  : "bg-accent text-white hover:bg-accent/90"
              )}
            >
              {(status as string) === "submitting" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Staging...
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Stage Import
                </>
              )}
            </button>
          </div>

          {submitResult && (
            <div
              className={cn(
                "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                submitResult.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
              )}
            >
              {submitResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {submitResult.message}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
