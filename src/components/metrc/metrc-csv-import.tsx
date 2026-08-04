"use client";

import { useState } from "react";

export function MetrcCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      setResult(`Loaded ${lines.length} rows from ${file.name}. CSV import processing coming soon.`);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-mid p-3 space-y-2">
      <div className="text-xs font-medium text-text-primary">CSV Import (Manual Fallback)</div>
      <div className="text-[10px] text-text-muted">
        Upload a METRC export CSV to sync inventory data without API access.
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-xs text-text-muted"
      />
      <button
        onClick={handleImport}
        disabled={!file || importing}
        className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-medium text-brand-green transition hover:bg-brand-green/20 disabled:opacity-50"
      >
        {importing ? "Importing..." : "Import CSV"}
      </button>
      {result && (
        <div className="text-[10px] text-text-muted">{result}</div>
      )}
    </div>
  );
}
