"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoChartOfAccount } from "@/lib/demo/accounting";
import type {
  DemoImportTargetField,
} from "@/lib/demo/accounting-workflows";
import type { ImportWorkspace } from "@/lib/import-job-types";

const targetFieldLabels: Record<DemoImportTargetField, string> = {
  date: "Transaction date",
  postedDate: "Posted date",
  description: "Description",
  reference: "Reference",
  amount: "Signed amount",
  debit: "Debit amount",
  credit: "Credit amount",
  location: "Location",
  memo: "Memo",
  ignore: "Ignore column",
};

const requiredTargets: DemoImportTargetField[] = ["date", "description", "reference"];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatBytes(value?: number) {
  if (!value) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function humanizeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function humanizeTargetField(value: DemoImportTargetField) {
  return targetFieldLabels[value].toLowerCase();
}

function issueBucket(issue: string) {
  const lower = issue.toLowerCase();
  if (lower.includes("duplicate") || lower.includes("already imported")) return "duplicate risk";
  if (lower.includes("mapping") || lower.includes("account") || lower.includes("location")) return "mapping gap";
  if (lower.includes("support") || lower.includes("receipt") || lower.includes("document")) return "support gap";
  if (lower.includes("date") || lower.includes("amount") || lower.includes("debit") || lower.includes("credit")) return "source-data anomaly";
  return "review item";
}

function rowDispositionLabel(status: "ready" | "warning" | "error") {
  switch (status) {
    case "ready":
      return "Can move into accounting review";
    case "warning":
      return "Needs human judgment before posting";
    case "error":
      return "Blocked until repaired";
  }
}

function getRowTone(status: "ready" | "warning" | "error") {
  switch (status) {
    case "ready":
      return "emerald" as const;
    case "warning":
      return "amber" as const;
    case "error":
      return "rose" as const;
  }
}

function getAvailableTargetFields(amountStrategy: "single_signed" | "split_debit_credit") {
  return amountStrategy === "split_debit_credit"
    ? ["date", "postedDate", "description", "reference", "debit", "credit", "location", "memo", "ignore"]
    : ["date", "postedDate", "description", "reference", "amount", "location", "memo", "ignore"];
}

function profilePersistenceMeta(mode: ImportWorkspace["datasets"][number]["profilePersistence"]) {
  switch (mode) {
    case "demo_only":
      return { label: "Demo-only profile", tone: "slate" as const };
    case "saved":
      return { label: "Saved profile", tone: "emerald" as const };
    case "snapshot_only":
      return { label: "Snapshot only", tone: "amber" as const };
    case "saved_with_overrides":
      return { label: "Saved + overridden", tone: "violet" as const };
  }
}

function backendModeMeta(mode: ImportWorkspace["datasets"][number]["backendMode"]) {
  switch (mode) {
    case "demo":
      return { label: "Demo-only dataset", tone: "slate" as const };
    case "persisted":
      return { label: "Persisted job", tone: "violet" as const };
  }
}

function persistedStatusMeta(status: ImportWorkspace["datasets"][number]["persistedStatus"]) {
  switch (status) {
    case "uploaded":
      return { label: "Uploaded", tone: "blue" as const };
    case "mapped":
      return { label: "Mapped", tone: "amber" as const };
    case "validated":
      return { label: "Validated", tone: "emerald" as const };
    case "partially_promoted":
      return { label: "Partially promoted", tone: "violet" as const };
    case "promoted":
      return { label: "Promoted", tone: "emerald" as const };
    case "failed":
      return { label: "Needs attention", tone: "rose" as const };
  }
}

export function CsvImportWorkflow({
  accounts,
  companySlug,
  workspace,
}: {
  accounts: DemoChartOfAccount[];
  companySlug: string;
  workspace: ImportWorkspace;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDatasetId, setSelectedDatasetId] = useState(workspace.datasets[0]?.id ?? "");
  const dataset = useMemo(
    () => workspace.datasets.find((item) => item.id === selectedDatasetId) ?? workspace.datasets[0],
    [selectedDatasetId, workspace.datasets],
  );
  const [selectedProfileId, setSelectedProfileId] = useState(dataset?.appliedProfileId || dataset?.profiles[0]?.id || "");
  const [mappingOverrides, setMappingOverrides] = useState<Record<string, DemoImportTargetField>>(
    dataset?.profiles.find((profile) => profile.id === (dataset.appliedProfileId || dataset.profiles[0]?.id))?.fieldMappings ?? {},
  );
  const [selectedRowId, setSelectedRowId] = useState(dataset?.rows[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);

  useEffect(() => {
    if (!dataset) {
      return;
    }
    const nextProfileId = dataset.appliedProfileId || dataset.profiles[0]?.id || "";
    const nextProfile = dataset.profiles.find((profile) => profile.id === nextProfileId) ?? dataset.profiles[0];
    setSelectedProfileId(nextProfileId);
    setMappingOverrides(nextProfile?.fieldMappings ?? {});
    setSelectedRowId(dataset.rows[0]?.id ?? "");
  }, [dataset]);

  if (workspace.datasets.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface-mid p-6 text-sm text-text-muted">
        No import files are available yet. Upload or seed a dataset before using the mapping workspace.
      </section>
    );
  }

  if (!dataset) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface-mid p-6 text-sm text-text-muted">
        The selected import dataset could not be loaded. Try refreshing the workspace.
      </section>
    );
  }

  if (dataset.profiles.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface-mid p-6 text-sm text-text-muted">
        {dataset.fileName} does not have any mapping profiles yet, so the import cannot be staged from this demo workspace.
      </section>
    );
  }

  if (dataset.rows.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface-mid p-6 text-sm text-text-muted">
        {dataset.fileName} loaded successfully, but no preview rows are available to validate or promote.
      </section>
    );
  }

  const selectedProfile = dataset.profiles.find((profile) => profile.id === selectedProfileId) ?? dataset.profiles[0]!;
  const profileMeta = profilePersistenceMeta(dataset.profilePersistence);
  const backendMeta = backendModeMeta(dataset.backendMode);
  const persistedMeta = persistedStatusMeta(dataset.persistedStatus);
  const availableTargets = getAvailableTargetFields(selectedProfile.amountStrategy);
  const effectiveMappings = dataset.columns.reduce<Record<string, DemoImportTargetField>>((acc, column) => {
    acc[column.key] = mappingOverrides[column.key] ?? selectedProfile.fieldMappings[column.key] ?? column.suggestedTarget;
    return acc;
  }, {});

  const requiredFieldIssues = requiredTargets.filter((field) => !Object.values(effectiveMappings).includes(field));
  const amountStrategyFieldIssues = selectedProfile.amountStrategy === "split_debit_credit"
    ? ["debit", "credit"].filter((field) => !Object.values(effectiveMappings).includes(field as DemoImportTargetField))
    : Object.values(effectiveMappings).includes("amount")
      ? []
      : ["amount"];

  const previewStats = dataset.rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "ready") acc.ready += 1;
      if (row.status === "warning") acc.warning += 1;
      if (row.status === "error") acc.error += 1;
      if (row.promotedTransactionId) acc.promoted += 1;
      return acc;
    },
    { total: 0, ready: 0, warning: 0, error: 0, promoted: 0 },
  );

  const selectedRow = dataset.rows.find((row) => row.id === selectedRowId) ?? dataset.rows[0]!;
  const selectedRowIssueBuckets = Array.from(new Set(selectedRow.validationIssues.map(issueBucket)));
  const mappingCoverageCount = dataset.columns.filter((column) => {
    const mappedField = effectiveMappings[column.key] ?? column.suggestedTarget;
    return mappedField !== "ignore";
  }).length;
  const stageButtonLabel = workspace.source === "convex"
    ? dataset.backendMode === "persisted"
      ? "Save mapping changes"
      : "Persist import job"
    : "Stage demo import";
  const stageButtonDetail = workspace.source === "convex"
    ? dataset.backendMode === "persisted"
      ? "Updates the persisted job snapshot and refreshes validation state."
      : "Creates a persisted import job from the staged demo file."
    : "Runs the stage action in demo-safe mode with no persisted writes.";
  const promoteHelpText = dataset.backendMode === "persisted"
    ? dataset.promotionReadyCount > 0
      ? `${dataset.promotionReadyCount} eligible row${dataset.promotionReadyCount === 1 ? " is" : "s are"} ready to enter the transaction queue.`
      : "No rows are currently eligible for promotion. Clear blockers or save mapping fixes first."
    : "Promotion is only available once the dataset exists as a persisted import job.";
  const sourceFileSizeLabel = formatBytes(dataset.sourceFileSizeBytes);

  function handleDatasetChange(nextDatasetId: string) {
    const nextDataset = workspace.datasets.find((item) => item.id === nextDatasetId) ?? workspace.datasets[0];
    setSelectedDatasetId(nextDataset.id);
    setMessage(
      nextDataset.backendMode === "persisted"
        ? `Loaded persisted import job ${nextDataset.fileName} with ${nextDataset.rows.length} rows.`
        : `Loaded demo file ${nextDataset.fileName} with ${nextDataset.rows.length} rows for mapping review.`,
    );
  }

  function handleProfileChange(nextProfileId: string) {
    const nextProfile = dataset.profiles.find((profile) => profile.id === nextProfileId) ?? dataset.profiles[0];
    setSelectedProfileId(nextProfile.id);
    setMappingOverrides(nextProfile.fieldMappings);
    setMessage(`Applied mapping profile ${nextProfile.name}. Review any overridden columns before staging.`);
  }

  function updateMapping(columnKey: string, target: DemoImportTargetField) {
    setMappingOverrides((current) => ({ ...current, [columnKey]: target }));
    setMessage(null);
  }

  async function submitImportJob() {
    const issues = [...requiredFieldIssues, ...amountStrategyFieldIssues];
    if (issues.length > 0) {
      setMessage(`Import cannot be staged yet. Resolve mapping gaps for: ${issues.map((issue) => humanizeTargetField(issue as DemoImportTargetField)).join(", ")}.`);
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/accounting/import-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stage",
          companySlug,
          dataset: {
            id: dataset.id,
            fileName: dataset.fileName,
            source: dataset.source,
            periodLabel: dataset.periodLabel,
            uploadedAt: dataset.uploadedAt,
            delimiter: dataset.delimiter,
            columns: dataset.columns,
            rows: dataset.rows.map((row) => ({
              id: row.id,
              values: row.values,
              sourceAccountName: row.sourceAccountName,
              suggestedDebitAccountCode: row.suggestedDebitAccountCode,
              suggestedCreditAccountCode: row.suggestedCreditAccountCode,
              confidence: row.confidence,
              status: row.status,
              validationIssues: row.validationIssues,
            })),
            selectedProfile: {
              id: selectedProfile.id,
              name: selectedProfile.name,
              description: selectedProfile.description,
              amountStrategy: selectedProfile.amountStrategy,
              fieldMappings: selectedProfile.fieldMappings,
            },
            effectiveMappings,
          },
        }),
      });
      const result = await response.json();
      setMessage(result.message ?? "Import job request completed.");
      if (result.ok) {
        router.refresh();
      }
    });
  }

  async function promoteDataset() {
    if (!dataset.jobId) {
      setMessage("Only persisted import jobs can be promoted into transactions.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/accounting/import-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "promote",
          companySlug,
          jobId: dataset.jobId,
        }),
      });
      const result = await response.json();
      setMessage(result.message ?? "Promotion request completed.");
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">{workspace.sourceLabel}</div>
            <h2 className="mt-1.5 text-lg font-semibold">CSV import mapping</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              {workspace.sourceDetail}
            </p>
            {workspace.fallbackReason ? <div className="mt-2 text-xs text-amber-200">Fallback reason: {workspace.fallbackReason}</div> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-text-muted">Import file / job</span>
              <select
                value={dataset.id}
                onChange={(event) => handleDatasetChange(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none"
              >
                {workspace.datasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fileName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-text-muted">Mapping profile</span>
              <select
                value={selectedProfile.id}
                onChange={(event) => handleProfileChange(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none"
              >
                {dataset.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted/60">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Source</div>
            <div className="mt-2 font-medium text-text-primary">{dataset.source}</div>
            <div className="mt-0.5">{dataset.fileName}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted/60">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Rows</div>
            <div className="mt-2 font-medium text-text-primary">{dataset.rows.length}</div>
            <div className="mt-0.5">{dataset.uploadedAt}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted/60">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Lifecycle</div>
            <div className="mt-2 font-medium text-text-primary">
              {dataset.promotedRowCount} / {dataset.rows.length} promoted
            </div>
            <div className="mt-0.5">{dataset.promotionReadyCount} ready next</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted/60">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Validation</div>
            <div className="mt-2 font-medium text-text-primary">
              {previewStats.ready} ready
            </div>
            <div className="mt-0.5">{dataset.blockedRowCount} blocked</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-mid p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Field mapping</div>
            <p className="mt-2 text-sm text-text-muted">
              Map source columns into accounting fields. Required fields must be present before the file can move into review or promotion.
            </p>
          </div>
          <div className="text-sm text-text-muted">{selectedProfile.description}</div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-surface-mid text-xs uppercase tracking-[0.2em] text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Source column</th>
                  <th className="px-4 py-3 font-medium">Sample values</th>
                  <th className="px-4 py-3 font-medium">Mapped field</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dataset.columns.map((column) => {
                  const mappedField = effectiveMappings[column.key] ?? column.suggestedTarget;
                  const isRequired = requiredTargets.includes(mappedField);
                  const isAmountField = mappedField === "amount" || mappedField === "debit" || mappedField === "credit";
                  const tone = mappedField === "ignore" ? "slate" : column.required || isRequired || isAmountField ? "blue" : "violet";

                  return (
                    <tr key={column.key} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">{column.label}</div>
                        <div className="mt-1 font-mono text-xs text-text-muted">{column.key}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-text-muted">
                        {column.sampleValues.map((sample, index) => (
                          <div key={sample || `${column.key}-empty-${index}`} className="mb-2 rounded-lg bg-surface-mid px-2 py-1 last:mb-0">
                            {sample || "(blank)"}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={mappedField}
                          onChange={(event) => updateMapping(column.key, event.target.value as DemoImportTargetField)}
                          className="w-full rounded-xl border border-border bg-surface-mid px-3 py-2 text-text-primary outline-none"
                        >
                          {availableTargets.map((target) => (
                            <option key={target} value={target}>
                              {targetFieldLabels[target]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <AccountingStatusBadge
                          label={column.required || isRequired ? "required" : mappedField === "ignore" ? "ignored" : "optional"}
                          tone={tone}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {requiredFieldIssues.length === 0 ? (
            <AccountingStatusBadge label="Core fields mapped" tone="emerald" />
          ) : (
            <AccountingStatusBadge label={`Missing: ${requiredFieldIssues.map(humanizeTargetField).join(", ")}`} tone="rose" />
          )}
          {amountStrategyFieldIssues.length === 0 ? (
            <AccountingStatusBadge label="Amounts valid" tone="emerald" />
          ) : (
            <AccountingStatusBadge label={`Amount issue: ${amountStrategyFieldIssues.map((field) => humanizeTargetField(field as DemoImportTargetField)).join(", ")}`} tone="amber" />
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Row preview</div>
              <p className="mt-2 text-sm text-text-muted">
                Review confidence, suggested posting accounts, and row issues before submitting for accounting review.
              </p>
              <div className="mt-2 text-sm text-text-muted/50">
                {previewStats.promoted} promoted · {dataset.promotionReadyCount} ready · {dataset.blockedRowCount} blocked
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={submitImportJob}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {stageButtonLabel}
                </button>
                <div className="text-xs text-text-muted">{stageButtonDetail}</div>
              </div>
              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={isPending || dataset.backendMode !== "persisted" || !dataset.jobId || dataset.promotionReadyCount === 0}
                  onClick={promoteDataset}
                  className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Promote to transactions
                </button>
                <div className="max-w-xs text-xs text-text-muted">{promoteHelpText}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-surface-mid text-xs uppercase tracking-[0.2em] text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Suggested entry</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dataset.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`cursor-pointer align-top transition hover:bg-surface/60 ${row.id === selectedRow.id ? "bg-surface/70" : ""}`}
                      onClick={() => setSelectedRowId(row.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">{row.values.vendor_name ?? row.values.employee_group ?? row.values.memo_text ?? "Unmapped row"}</div>
                        <div className="mt-1 text-xs text-text-muted">{row.values.booking_date ?? row.values.check_date ?? "No date"}</div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-text-muted">
                        {row.values.bank_reference ?? row.values.batch_reference ?? "Pending"}
                      </td>
                      <td className="px-4 py-4 text-xs text-text-muted">
                        <div>Dr {row.suggestedDebitAccountCode}</div>
                        <div className="mt-1">Cr {row.suggestedCreditAccountCode}</div>
                        {row.promotedTransactionId ? <div className="mt-1 text-emerald-200">Promoted</div> : null}
                      </td>
                      <td className="px-4 py-4 text-text-primary">{formatPercent(row.confidence)}</td>
                      <td className="px-4 py-4">
                        <AccountingStatusBadge label={row.status} tone={getRowTone(row.status)} className="capitalize" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {message ? <div className="mt-4 text-sm text-text-muted">{message}</div> : null}
        </div>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Row detail</div>
            <div className="mt-4 space-y-4 text-sm text-text-muted">
              <div>
                <div className="font-medium text-text-primary">
                  {selectedRow.values.vendor_name ?? selectedRow.values.employee_group ?? "Selected import row"}
                </div>
                <div className="mt-1 font-mono text-xs">
                  {selectedRow.values.bank_reference ?? selectedRow.values.batch_reference ?? "No reference"}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <AccountingStatusBadge label={humanizeLabel(selectedRow.status)} tone={getRowTone(selectedRow.status)} className="capitalize" />
                </div>
              </div>
              <div className="grid gap-2">
                {Object.entries(selectedRow.values).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface px-3 py-2">
                    <span className="font-mono text-xs text-text-muted">{key}</span>
                    <span className="text-right text-text-primary">{value || "(blank)"}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Suggested posting</div>
                <div className="mt-2 text-text-primary">Debit {selectedRow.suggestedDebitAccountCode} / Credit {selectedRow.suggestedCreditAccountCode}</div>
                <div className="mt-1 text-xs">Source account: {selectedRow.sourceAccountName}</div>
                {selectedRow.promotedAt ? <div className="mt-1 text-xs text-emerald-200">Promoted {selectedRow.promotedAt}</div> : null}
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">Validation issues</div>
                {selectedRow.validationIssues.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                    Row is ready to advance to accounting review.
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-xs text-text-muted">
                      These issues explain why the row is blocked, needs human judgment, or cannot yet move into the transaction review queue.
                    </div>
                    <ul className="mt-3 space-y-2">
                      {selectedRow.validationIssues.map((issue) => (
                        <li key={issue}>• {issue}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-accent/70">Account targets</div>
            <div className="mt-4 space-y-2 text-sm text-text-muted">
              {activeAccounts.slice(0, 6).map((account) => (
                <div key={account.code} className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="font-medium text-text-primary">{account.code} — {account.name}</div>
                  <div className="mt-1 text-xs capitalize">{account.category} • {account.taxTreatment}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
