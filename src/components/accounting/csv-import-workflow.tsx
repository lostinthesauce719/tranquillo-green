"use client";

import { useMemo, useState } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { DemoChartOfAccount } from "@/lib/demo/accounting";
import {
  DemoImportDataset,
  DemoImportRow,
  DemoImportTargetField,
  demoImportDatasets,
} from "@/lib/demo/accounting-workflows";

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

function getRowTone(status: DemoImportRow["status"]) {
  switch (status) {
    case "ready":
      return "emerald" as const;
    case "warning":
      return "amber" as const;
    case "error":
      return "rose" as const;
  }
}

function getAvailableTargetFields(dataset: DemoImportDataset): DemoImportTargetField[] {
  return dataset.profiles.some((profile) => profile.amountStrategy === "split_debit_credit")
    ? ["date", "postedDate", "description", "reference", "debit", "credit", "location", "memo", "ignore"]
    : ["date", "postedDate", "description", "reference", "amount", "location", "memo", "ignore"];
}

export function CsvImportWorkflow({ accounts }: { accounts: DemoChartOfAccount[] }) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(demoImportDatasets[0]?.id ?? "");
  const dataset = useMemo(
    () => demoImportDatasets.find((item) => item.id === selectedDatasetId) ?? demoImportDatasets[0],
    [selectedDatasetId],
  );
  const [selectedProfileId, setSelectedProfileId] = useState(dataset?.profiles[0]?.id ?? "");
  const [mappingOverrides, setMappingOverrides] = useState<Record<string, DemoImportTargetField>>(
    dataset?.profiles[0]?.fieldMappings ?? {},
  );
  const [selectedRowId, setSelectedRowId] = useState(dataset?.rows[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);

  if (!dataset || dataset.profiles.length === 0 || dataset.rows.length === 0) {
    return null;
  }

  const selectedProfile = dataset.profiles.find((profile) => profile.id === selectedProfileId) ?? dataset.profiles[0]!;
  const availableTargets = getAvailableTargetFields(dataset);
  const effectiveMappings = dataset.columns.reduce<Record<string, DemoImportTargetField>>((acc, column) => {
    acc[column.key] = mappingOverrides[column.key] ?? selectedProfile?.fieldMappings[column.key] ?? column.suggestedTarget;
    return acc;
  }, {});

  const requiredFieldIssues = requiredTargets.filter(
    (field) => !Object.values(effectiveMappings).includes(field),
  );
  const amountStrategyFieldIssues = selectedProfile?.amountStrategy === "split_debit_credit"
    ? ["debit", "credit"].filter((field) => !Object.values(effectiveMappings).includes(field as DemoImportTargetField))
    : Object.values(effectiveMappings).includes("amount")
      ? []
      : ["amount"];

  const previewStats = dataset.rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "ready") {
        acc.ready += 1;
      }
      if (row.status === "warning") {
        acc.warning += 1;
      }
      if (row.status === "error") {
        acc.error += 1;
      }
      return acc;
    },
    { total: 0, ready: 0, warning: 0, error: 0 },
  );

  const selectedRow = dataset.rows.find((row) => row.id === selectedRowId) ?? dataset.rows[0]!;

  function handleDatasetChange(nextDatasetId: string) {
    const nextDataset = demoImportDatasets.find((item) => item.id === nextDatasetId) ?? demoImportDatasets[0];
    setSelectedDatasetId(nextDataset.id);
    setSelectedProfileId(nextDataset.profiles[0]?.id ?? "");
    setMappingOverrides(nextDataset.profiles[0]?.fieldMappings ?? {});
    setSelectedRowId(nextDataset.rows[0]?.id ?? "");
    setMessage(`Loaded demo file ${nextDataset.fileName} with ${nextDataset.rows.length} rows for mapping review.`);
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

  function stageImport() {
    const issues = [...requiredFieldIssues, ...amountStrategyFieldIssues];
    if (issues.length > 0) {
      setMessage(`Import cannot be staged yet. Resolve mapping gaps for: ${issues.join(", ")}.`);
      return;
    }

    setMessage(
      `Demo import staged locally: ${previewStats.ready} ready, ${previewStats.warning} warning, ${previewStats.error} error rows. No backend job was created.`,
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Static-safe import flow</div>
            <h2 className="mt-2 text-xl font-semibold">CSV import mapping workspace</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              This demo workflow mimics a real accounting import: choose a staged file, apply a mapping profile,
              validate required fields, and inspect row-level posting suggestions before anything reaches the ledger.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-text-muted">Demo file</span>
              <select
                value={dataset.id}
                onChange={(event) => handleDatasetChange(event.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none"
              >
                {demoImportDatasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fileName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-text-muted">Mapping profile</span>
              <select
                value={selectedProfile?.id ?? ""}
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
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Source</div>
            <div className="mt-3 font-medium text-text-primary">{dataset.source}</div>
            <div className="mt-1">{dataset.fileName}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Rows staged</div>
            <div className="mt-3 font-medium text-text-primary">{dataset.rows.length}</div>
            <div className="mt-1">Uploaded {dataset.uploadedAt}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Amount strategy</div>
            <div className="mt-3 font-medium capitalize text-text-primary">
              {selectedProfile.amountStrategy.replaceAll("_", " ")}
            </div>
            <div className="mt-1">Period {dataset.periodLabel}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Validation summary</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <AccountingStatusBadge label={`${previewStats.ready} ready`} tone="emerald" />
              <AccountingStatusBadge label={`${previewStats.warning} warning`} tone="amber" />
              <AccountingStatusBadge label={`${previewStats.error} error`} tone="rose" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Field mapping</div>
            <p className="mt-2 text-sm text-text-muted">
              Map source columns into accounting fields. Required fields must be present before the file can move into review.
            </p>
          </div>
          <div className="text-sm text-text-muted">{selectedProfile?.description}</div>
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
            <AccountingStatusBadge label={`Missing: ${requiredFieldIssues.join(", ")}`} tone="rose" />
          )}
          {amountStrategyFieldIssues.length === 0 ? (
            <AccountingStatusBadge label="Amount columns valid" tone="emerald" />
          ) : (
            <AccountingStatusBadge label={`Amount issue: ${amountStrategyFieldIssues.join(", ")}`} tone="amber" />
          )}
          <AccountingStatusBadge label={`Delimiter ${dataset.delimiter}`} tone="slate" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Row validation preview</div>
              <p className="mt-2 text-sm text-text-muted">
                Review confidence, suggested posting accounts, and row issues before submitting for accounting review.
              </p>
            </div>
            <button
              type="button"
              onClick={stageImport}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
            >
              Stage demo import
            </button>
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
                      className={`cursor-pointer align-top transition hover:bg-surface/60 ${row.id === selectedRow?.id ? "bg-surface/70" : ""}`}
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
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Selected row detail</div>
            {selectedRow ? (
              <div className="mt-4 space-y-4 text-sm text-text-muted">
                <div>
                  <div className="font-medium text-text-primary">
                    {selectedRow.values.vendor_name ?? selectedRow.values.employee_group ?? "Selected import row"}
                  </div>
                  <div className="mt-1 font-mono text-xs">
                    {selectedRow.values.bank_reference ?? selectedRow.values.batch_reference ?? "No reference"}
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
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">Validation issues</div>
                  {selectedRow.validationIssues.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                      Row is ready to advance to accounting review.
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {selectedRow.validationIssues.map((issue) => (
                        <li key={issue}>• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Available account targets</div>
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
