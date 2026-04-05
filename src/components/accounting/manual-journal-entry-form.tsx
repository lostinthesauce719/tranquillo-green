"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import { DemoChartOfAccount, DemoReportingPeriod } from "@/lib/demo/accounting";

type JournalLine = {
  id: string;
  accountCode: string;
  direction: "debit" | "credit";
  amount: string;
  memo: string;
};

type ManualJournalDraftPayload = {
  entryDate: string;
  periodLabel: string;
  reference: string;
  description: string;
  lines: JournalLine[];
};

type SavedManualJournalDraft = ManualJournalDraftPayload & {
  id: string;
  title: string;
  savedAt: string;
};

const RECENT_DRAFTS_STORAGE_KEY = "tranquillo.accounting.manualJournalDrafts";
const WORKING_DRAFT_STORAGE_KEY = "tranquillo.accounting.manualJournalWorkingDraft";

const defaultDraft = {
  entryDate: "2026-04-15",
  reference: "JE-DRAFT-LOCAL",
  description: "April close adjustment",
  lines: [
    { id: "line_1", accountCode: "6415", direction: "debit", amount: "4500", memo: "Monthly advisory support" },
    { id: "line_2", accountCode: "1010", direction: "credit", amount: "4500", memo: "Cash disbursement" },
  ] satisfies JournalLine[],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildDraftTitle(reference: string, description: string) {
  return reference.trim() || description.trim() || "Untitled journal draft";
}

export function ManualJournalEntryForm({
  accounts,
  periods,
}: {
  accounts: DemoChartOfAccount[];
  periods: DemoReportingPeriod[];
}) {
  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);
  const editablePeriods = useMemo(() => periods.filter((period) => period.status !== "closed"), [periods]);
  const defaultPeriodLabel = editablePeriods[0]?.label ?? periods[0]?.label ?? "";
  const hasLoadedStorage = useRef(false);

  const [entryDate, setEntryDate] = useState(defaultDraft.entryDate);
  const [periodLabel, setPeriodLabel] = useState(defaultPeriodLabel);
  const [reference, setReference] = useState(defaultDraft.reference);
  const [description, setDescription] = useState(defaultDraft.description);
  const [lines, setLines] = useState<JournalLine[]>(defaultDraft.lines);
  const [message, setMessage] = useState<string | null>(null);
  const [recentDrafts, setRecentDrafts] = useState<SavedManualJournalDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const draftPayload = useMemo<ManualJournalDraftPayload>(
    () => ({
      entryDate,
      periodLabel,
      reference,
      description,
      lines,
    }),
    [description, entryDate, lines, periodLabel, reference],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedRecentDrafts = window.localStorage.getItem(RECENT_DRAFTS_STORAGE_KEY);
      if (storedRecentDrafts) {
        setRecentDrafts(JSON.parse(storedRecentDrafts) as SavedManualJournalDraft[]);
      }

      const storedWorkingDraft = window.localStorage.getItem(WORKING_DRAFT_STORAGE_KEY);
      if (storedWorkingDraft) {
        const parsedDraft = JSON.parse(storedWorkingDraft) as ManualJournalDraftPayload;
        setEntryDate(parsedDraft.entryDate || defaultDraft.entryDate);
        setPeriodLabel(parsedDraft.periodLabel || defaultPeriodLabel);
        setReference(parsedDraft.reference || defaultDraft.reference);
        setDescription(parsedDraft.description || defaultDraft.description);
        setLines(parsedDraft.lines?.length ? parsedDraft.lines : defaultDraft.lines);
        setMessage("Restored your working draft from local storage.");
      }
    } catch {
      setMessage("Could not restore local drafts. You can continue with a fresh manual entry.");
    } finally {
      hasLoadedStorage.current = true;
    }
  }, [defaultPeriodLabel]);

  useEffect(() => {
    if (!hasLoadedStorage.current || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(WORKING_DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
  }, [draftPayload]);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const amount = Number(line.amount || 0);
        if (Number.isNaN(amount)) {
          return acc;
        }

        if (line.direction === "debit") {
          acc.debits += amount;
        } else {
          acc.credits += amount;
        }

        return acc;
      },
      { debits: 0, credits: 0 },
    );
  }, [lines]);

  const difference = Number((totals.debits - totals.credits).toFixed(2));
  const populatedLines = lines.filter((line) => line.accountCode && Number(line.amount) > 0);
  const validationErrors = [
    ...(description.trim() ? [] : ["Description is required"]),
    ...(periodLabel ? [] : ["Select an editable reporting period"]),
    ...(populatedLines.length >= 2 ? [] : ["At least two lines with account and amount are required"]),
    ...lines.flatMap((line, index) => {
      const errors: string[] = [];
      if (line.amount && Number.isNaN(Number(line.amount))) {
        errors.push(`Line ${index + 1} amount must be numeric`);
      }
      if (Number(line.amount || 0) < 0) {
        errors.push(`Line ${index + 1} amount must be positive`);
      }
      if (Number(line.amount || 0) > 0 && !line.accountCode) {
        errors.push(`Line ${index + 1} needs an account`);
      }
      return errors;
    }),
    ...(difference === 0 ? [] : ["Journal must balance before save"]),
  ];
  const isBalanced = difference === 0 && populatedLines.length >= 2 && validationErrors.length === 0;

  function applyDraft(payload: ManualJournalDraftPayload, draftId?: string | null) {
    setEntryDate(payload.entryDate || defaultDraft.entryDate);
    setPeriodLabel(payload.periodLabel || defaultPeriodLabel);
    setReference(payload.reference || defaultDraft.reference);
    setDescription(payload.description || defaultDraft.description);
    setLines(payload.lines?.length ? payload.lines : defaultDraft.lines);
    setActiveDraftId(draftId ?? null);
  }

  function resetToDefault() {
    applyDraft({ ...defaultDraft, periodLabel: defaultPeriodLabel });
    setMessage("Started a fresh local journal draft.");
  }

  function persistRecentDrafts(nextDrafts: SavedManualJournalDraft[]) {
    setRecentDrafts(nextDrafts);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RECENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts));
    }
  }

  function updateLine(id: string, patch: Partial<JournalLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    setMessage(null);
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        id: `line_${current.length + 1}`,
        accountCode: "",
        direction: current.length % 2 === 0 ? "debit" : "credit",
        amount: "",
        memo: "",
      },
    ]);
    setMessage(null);
  }

  function removeLine(id: string) {
    setLines((current) => (current.length <= 2 ? current : current.filter((line) => line.id !== id)));
    setMessage(null);
  }

  function loadExpensePreset() {
    applyDraft(
      {
        entryDate: "2026-04-15",
        periodLabel: defaultPeriodLabel,
        description: "Professional fees cash disbursement",
        reference: "JE-PRESET-FEES",
        lines: [
          { id: "line_1", accountCode: "6415", direction: "debit", amount: "4500", memo: "Monthly advisory retainer" },
          { id: "line_2", accountCode: "1010", direction: "credit", amount: "4500", memo: "Bank cash payment" },
        ],
      },
      null,
    );
    setMessage("Loaded a realistic local preset. Review and save it into recent drafts if you want to keep a checkpoint.");
  }

  function saveDraft() {
    const savedAt = new Date().toISOString();
    const draftId = activeDraftId ?? `draft_${savedAt}`;
    const nextDraft: SavedManualJournalDraft = {
      id: draftId,
      savedAt,
      title: buildDraftTitle(reference, description),
      ...draftPayload,
    };

    const nextDrafts = [nextDraft, ...recentDrafts.filter((draft) => draft.id !== draftId)].slice(0, 5);
    persistRecentDrafts(nextDrafts);
    setActiveDraftId(draftId);
    setMessage(`Saved local draft ${nextDraft.title}. Recent drafts stay on this browser only.`);
  }

  function loadRecentDraft(draft: SavedManualJournalDraft) {
    applyDraft(draft, draft.id);
    setMessage(`Loaded recent draft ${draft.title} saved ${formatSavedAt(draft.savedAt)}.`);
  }

  function deleteRecentDraft(draftId: string) {
    const draftToDelete = recentDrafts.find((draft) => draft.id === draftId);
    const nextDrafts = recentDrafts.filter((draft) => draft.id !== draftId);
    persistRecentDrafts(nextDrafts);
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
    setMessage(`Deleted local draft ${draftToDelete?.title ?? draftId}.`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isBalanced) {
      setMessage("Draft not saved. Resolve validation issues and make sure debits equal credits.");
      return;
    }

    setMessage(`Balanced local draft ready: ${reference} on ${entryDate} for ${formatCurrency(totals.debits)}. No backend call was made.`);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Static-safe first flow</div>
          <h2 className="mt-2 text-xl font-semibold">Manual journal entry draft</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Client-side journal prep with local draft persistence, recent draft recall, balance validation, and zero dependency on Convex during static generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadExpensePreset} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
            Load sample preset
          </button>
          <button type="button" onClick={resetToDefault} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
            New draft
          </button>
        </div>
      </div>

      <form className="mt-6 grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm">
            <span className="text-text-muted">Entry date</span>
            <input value={entryDate} onChange={(event) => setEntryDate(event.target.value)} type="date" className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-text-muted">Period</span>
            <select value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none">
              {editablePeriods.map((period) => (
                <option key={period.label} value={period.label}>
                  {period.label} ({period.status})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-text-muted">Reference</span>
            <input value={reference} onChange={(event) => setReference(event.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-text-muted">Description</span>
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-text-primary outline-none" />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-surface-mid text-xs uppercase tracking-[0.2em] text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Direction</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Line memo</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => (
                  <tr key={line.id} className="align-top">
                    <td className="px-4 py-3">
                      <select value={line.accountCode} onChange={(event) => updateLine(line.id, { accountCode: event.target.value })} className="w-full rounded-xl border border-border bg-surface-mid px-3 py-2 text-text-primary outline-none">
                        <option value="">Select account</option>
                        {activeAccounts.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.code} — {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={line.direction} onChange={(event) => updateLine(line.id, { direction: event.target.value as JournalLine["direction"] })} className="w-full rounded-xl border border-border bg-surface-mid px-3 py-2 text-text-primary outline-none">
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input value={line.amount} onChange={(event) => updateLine(line.id, { amount: event.target.value })} inputMode="decimal" placeholder="0.00" className="w-full rounded-xl border border-border bg-surface-mid px-3 py-2 text-text-primary outline-none" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={line.memo} onChange={(event) => updateLine(line.id, { memo: event.target.value })} className="w-full rounded-xl border border-border bg-surface-mid px-3 py-2 text-text-primary outline-none" />
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => removeLine(line.id)} className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition hover:text-text-primary">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <button type="button" onClick={addLine} className="rounded-xl border border-border bg-surface-mid px-4 py-2 text-sm text-text-primary transition hover:bg-surface/70">
              Add line
            </button>
            <div className="flex flex-wrap gap-2">
              <AccountingStatusBadge label={`Debits ${formatCurrency(totals.debits)}`} tone="blue" />
              <AccountingStatusBadge label={`Credits ${formatCurrency(totals.credits)}`} tone="violet" />
              <AccountingStatusBadge label={isBalanced ? "Balanced draft" : `Out of balance ${formatCurrency(Math.abs(difference))}`} tone={isBalanced ? "emerald" : "rose"} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Validation</div>
            {validationErrors.length === 0 ? (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Entry is balanced and ready to save as a local draft.
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {validationErrors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            )}
            {message ? <div className="mt-4 text-sm text-text-muted">{message}</div> : null}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Draft controls</div>
              {activeDraftId ? <AccountingStatusBadge label="recent draft linked" tone="blue" /> : null}
            </div>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={saveDraft} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15">
                Save to recent drafts
              </button>
              <div className="rounded-xl border border-border bg-background px-3 py-3 text-xs text-text-muted">
                Working changes auto-save in local storage as you type. Recent drafts keep the last five named checkpoints on this browser.
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {recentDrafts.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-mid px-3 py-3 text-sm text-text-muted">
                  No recent drafts yet. Save your first checkpoint to build a reusable local draft list.
                </div>
              ) : (
                recentDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-xl border border-border bg-surface-mid px-3 py-3 text-sm text-text-muted">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-text-primary">{draft.title}</div>
                        <div className="mt-1 text-xs">{draft.reference} • {draft.periodLabel} • Saved {formatSavedAt(draft.savedAt)}</div>
                      </div>
                      <AccountingStatusBadge label={draft.id === activeDraftId ? "active" : "saved"} tone={draft.id === activeDraftId ? "blue" : "slate"} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => loadRecentDraft(draft)} className="rounded-lg border border-border px-3 py-2 text-xs text-text-primary transition hover:bg-surface">
                        Load
                      </button>
                      <button type="button" onClick={() => deleteRecentDraft(draft.id)} className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition hover:text-text-primary">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Preview</div>
            <div className="mt-3 space-y-3 text-sm text-text-muted">
              <div>
                <div className="font-medium text-text-primary">{description || "Untitled journal entry"}</div>
                <div className="mt-1">{reference} • {entryDate} • {periodLabel || "No period selected"}</div>
              </div>
              <div className="space-y-2">
                {populatedLines.map((line) => {
                  const account = activeAccounts.find((item) => item.code === line.accountCode);
                  return (
                    <div key={line.id} className="rounded-xl border border-border bg-surface-mid px-3 py-2">
                      <div className="font-medium text-text-primary">{line.direction.toUpperCase()} {formatCurrency(Number(line.amount || 0))}</div>
                      <div className="mt-1 text-xs">{account ? `${account.code} — ${account.name}` : "Account pending"}</div>
                      {line.memo ? <div className="mt-1 text-xs">{line.memo}</div> : null}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-3 text-xs">
                Local-only prototype: submit keeps the workflow static-build-safe and does not persist to Convex yet.
              </div>
            </div>
            <button type="submit" className="mt-4 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15">
              Validate local draft
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
