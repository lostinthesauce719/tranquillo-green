"use client";

import { useState } from "react";
import { Download, FileText, Table, Receipt, CreditCard, Banknote } from "lucide-react";

type Template = {
  id: string;
  name: string;
  description: string;
  fileType: string;
  maxSize: string;
  icon: React.ElementType;
  sampleColumns: string[];
};

const IMPORT_TEMPLATES: Template[] = [
  {
    id: "bank-statement",
    name: "Bank Statement",
    description: "Import transactions from your bank export. Supports CSV and OFX formats.",
    fileType: "CSV, OFX, QFX",
    maxSize: "10 MB",
    icon: Banknote,
    sampleColumns: ["Date", "Description", "Amount", "Balance", "Reference"],
  },
  {
    id: "pos-sales",
    name: "POS Sales Export",
    description: "Daily or batch sales export from your POS system (Square, Treez, Flowhub, etc.).",
    fileType: "CSV, XLSX",
    maxSize: "25 MB",
    icon: Receipt,
    sampleColumns: ["Transaction ID", "Date", "SKU", "Product", "Quantity", "Unit Price", "Total", "Tax"],
  },
  {
    id: "payroll",
    name: "Payroll Register",
    description: "Employee labor allocation for 280E plant-touching vs non-plant-touching split.",
    fileType: "CSV, XLSX",
    maxSize: "5 MB",
    icon: CreditCard,
    sampleColumns: ["Employee", "Date", "Hours", "Pay Rate", "Department", "Activity Code", "Allocation %"],
  },
  {
    id: "metrc",
    name: "Metrc Export",
    description: "Package, harvest, or transfer data from Metrc seed-to-sale tracking.",
    fileType: "CSV",
    maxSize: "50 MB",
    icon: FileText,
    sampleColumns: ["Package Tag", "Product", "Quantity", "Unit", "Location", "Date", "Status"],
  },
  {
    id: "general-ledger",
    name: "General Ledger",
    description: "Chart of accounts and trial balance export from QuickBooks, Xero, or Sage.",
    fileType: "CSV, XLSX",
    maxSize: "10 MB",
    icon: Table,
    sampleColumns: ["Account Code", "Account Name", "Debit", "Credit", "Balance", "Period"],
  },
];

function generateSampleCSV(columns: string[]): string {
  const sampleRows = [
    columns.map((col) => {
      switch (col.toLowerCase()) {
        case "date": return "2026-04-15";
        case "description": return "Sample transaction";
        case "amount": return "1250.00";
        case "balance": return "48750.00";
        case "reference": return "REF-001";
        case "transaction id": return "TXN-20260415-001";
        case "sku": return "SKU-FLOWER-001";
        case "product": return "Premium Flower 3.5g";
        case "quantity": return "1";
        case "unit price": return "35.00";
        case "total": return "35.00";
        case "tax": return "3.15";
        case "employee": return "Jane Smith";
        case "hours": return "8.0";
        case "pay rate": return "25.00";
        case "department": return "Cultivation";
        case "activity code": return "PLANT-TOUCHING";
        case "allocation %": return "100";
        case "package tag": return "ABC1234567890";
        case "unit": return "g";
        case "location": return "Oakland Main";
        case "status": return "Active";
        case "account code": return "1200";
        case "account name": return "Inventory - Finished Goods";
        case "debit": return "5000.00";
        case "credit": return "0.00";
        case "period": return "Q1 2026";
        default: return "sample";
      }
    }),
  ];

  return [columns.join(","), ...sampleRows.map((row) => row.join(","))].join("\n");
}

export function ImportTemplates() {
  const [downloading, setDownloading] = useState<string | null>(null);

  function handleDownload(template: Template) {
    setDownloading(template.id);
    const csv = generateSampleCSV(template.sampleColumns);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(null), 1000);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Import Templates</div>
          <h2 className="mt-1 text-lg font-semibold">Accepted File Types & Templates</h2>
          <p className="mt-1 text-sm text-text-muted">
            Download sample templates to ensure your data maps correctly. All files are validated before import.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {IMPORT_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="rounded-xl border border-border bg-surface p-4 flex flex-col"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10">
                <template.icon className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{template.name}</div>
                <div className="text-xs text-text-muted">{template.fileType} • Max {template.maxSize}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-text-muted flex-1">{template.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {template.sampleColumns.slice(0, 4).map((col) => (
                <span key={col} className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text-muted">
                  {col}
                </span>
              ))}
              {template.sampleColumns.length > 4 && (
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text-muted">
                  +{template.sampleColumns.length - 4} more
                </span>
              )}
            </div>
            <button
              onClick={() => handleDownload(template)}
              disabled={downloading === template.id}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              {downloading === template.id ? "Downloading…" : "Download Template"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
        <strong>Tip:</strong> For bank statements, export as CSV with columns: Date, Description, Amount, Balance.
        For POS exports, include SKU and Tax columns for proper 280E categorization.
      </div>
    </section>
  );
}
