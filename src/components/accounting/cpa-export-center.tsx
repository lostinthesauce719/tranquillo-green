"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { ExportPacketMutation, WriteResult } from "@/lib/accounting-write-contracts";
import type {
  DemoAutomationAgent,
  DemoExportBundle,
  DemoGenerationHistoryItem,
  DemoPacketChecklistItem,
} from "@/lib/demo/accounting-handoff";

type BuilderState = {
  selectedBundleId: string;
  selectedFormats: string[];
  selectedSchedules: string[];
  selectedChecklistTitles: string[];
  coverMemoMode: "controller_summary" | "cpa_handoff" | "open_items";
  includeDeliveryNotes: boolean;
  buildCount: number;
};

function bundleTone(status: DemoExportBundle["status"]) {
  switch (status) {
    case "ready":
      return "emerald" as const;
    case "building":
      return "blue" as const;
    case "needs_support":
      return "amber" as const;
    case "sent":
      return "violet" as const;
  }
}

function checklistTone(status: DemoPacketChecklistItem["status"]) {
  switch (status) {
    case "done":
      return "emerald" as const;
    case "watch":
      return "amber" as const;
    case "missing":
      return "rose" as const;
  }
}

function agentTone(status: DemoAutomationAgent["status"]) {
  switch (status) {
    case "healthy":
      return "emerald" as const;
    case "watch":
      return "amber" as const;
    case "attention":
      return "rose" as const;
  }
}

function buildInitialState(bundle: DemoExportBundle, checklist: DemoPacketChecklistItem[]): BuilderState {
  return {
    selectedBundleId: bundle.id,
    selectedFormats: bundle.exportFormats,
    selectedSchedules: bundle.includedSchedules,
    selectedChecklistTitles: checklist.filter((item) => item.status !== "missing").map((item) => item.title),
    coverMemoMode: "controller_summary",
    includeDeliveryNotes: true,
    buildCount: 0,
  };
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CpaExportCenter({
  companySlug,
  historySource,
  bundles,
  checklist,
  history,
  auditTrail,
  agents,
  featuredReconciliationHref,
}: {
  companySlug: string;
  historySource: "demo" | "convex";
  bundles: DemoExportBundle[];
  checklist: DemoPacketChecklistItem[];
  history: DemoGenerationHistoryItem[];
  auditTrail: DemoGenerationHistoryItem[];
  agents: DemoAutomationAgent[];
  featuredReconciliationHref: string;
}) {
  const fallbackBundle = bundles[0];
  const [builderState, setBuilderState] = useState<BuilderState>(() => buildInitialState(fallbackBundle, checklist));
  const [demoHistory, setDemoHistory] = useState(history);
  const [buildMessage, setBuildMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBundle = bundles.find((bundle) => bundle.id === builderState.selectedBundleId) ?? fallbackBundle;
  const selectedChecklistItems = checklist.filter((item) => builderState.selectedChecklistTitles.includes(item.title));
  const selectedChecklistStatuses = new Set(selectedChecklistItems.map((item) => item.status));
  const packetReadinessLabel = selectedChecklistStatuses.has("missing")
    ? "Packet still has missing support selected"
    : selectedChecklistStatuses.has("watch")
      ? "Packet includes watch items for reviewer follow-up"
      : "Packet selection is ready for demo handoff";

  const packetSummary = useMemo(
    () => [
      `${builderState.selectedSchedules.length} sections selected`,
      `${builderState.selectedFormats.length} output format${builderState.selectedFormats.length === 1 ? "" : "s"}`,
      `${builderState.selectedChecklistTitles.length} checklist items attached`,
      builderState.includeDeliveryNotes ? "Recipient notes included" : "Recipient notes omitted",
    ],
    [builderState],
  );

  async function persistPacketBuild() {
    const action = selectedChecklistStatuses.has("missing") ? "Held export packet" : "Generated bundle";
    const detail = `Prepared ${selectedBundle.name} with ${builderState.selectedSchedules.length} sections in ${builderState.selectedFormats.length} output format${builderState.selectedFormats.length === 1 ? "" : "s"} using ${builderState.coverMemoMode.replaceAll("_", " ")} framing.`;
    const payload: ExportPacketMutation = {
      companySlug,
      bundleId: selectedBundle.id,
      bundleName: selectedBundle.name,
      periodLabel: selectedBundle.periodLabel,
      recipient: selectedBundle.recipient,
      owner: selectedBundle.owner,
      status: selectedChecklistStatuses.has("missing") ? "held" : "generated",
      selectedFormats: builderState.selectedFormats,
      selectedSchedules: builderState.selectedSchedules,
      selectedChecklistTitles: builderState.selectedChecklistTitles,
      coverMemoMode: builderState.coverMemoMode,
      includeDeliveryNotes: builderState.includeDeliveryNotes,
      detail,
      blockers: selectedBundle.blockers,
    };

    setIsSaving(true);
    try {
      const response = await fetch("/api/accounting/export-packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as WriteResult<DemoGenerationHistoryItem> & { message?: string };
      if (!response.ok || !result.item) {
        throw new Error(result.message ?? "Could not save export packet history.");
      }

      setBuilderState((current) => ({ ...current, buildCount: current.buildCount + 1 }));
      setDemoHistory((current) => [result.item!, ...current]);
      setBuildMessage(result.message ?? `${action} for ${selectedBundle.name}.`);
    } catch (error) {
      const fallbackEntry: DemoGenerationHistoryItem = {
        timestampLabel: `Demo build #${builderState.buildCount + 1}`,
        actor: selectedBundle.owner,
        action,
        detail,
      };
      setBuilderState((current) => ({ ...current, buildCount: current.buildCount + 1 }));
      setDemoHistory((current) => [fallbackEntry, ...current]);
      setBuildMessage(error instanceof Error ? error.message : "Could not save export packet history.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Packet builder</div>
              <h2 className="mt-2 text-xl font-semibold">CPA handoff packet assembly center</h2>
              <p className="mt-2 text-sm text-text-muted">Static packet builder with demo controls for selecting bundle sections, export formats, memo style, and readiness attachments before generating a mock handoff event.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              {historySource === "convex" ? "Persisted packet history enabled" : "Demo-backed generation only"}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">1. Choose packet</div>
              <div className="mt-3 space-y-3">
                {bundles.map((bundle) => {
                  const active = bundle.id === builderState.selectedBundleId;

                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => {
                        setBuilderState((current) => ({
                          ...current,
                          selectedBundleId: bundle.id,
                          selectedFormats: bundle.exportFormats,
                          selectedSchedules: bundle.includedSchedules,
                        }));
                      }}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${active ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-surface"}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{bundle.periodLabel}</div>
                          <div className="mt-2 font-medium text-text-primary">{bundle.name}</div>
                          <p className="mt-2 text-sm text-text-muted">{bundle.description}</p>
                        </div>
                        <AccountingStatusBadge label={bundle.status.replaceAll("_", " ")} tone={bundleTone(bundle.status)} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">2. Assemble sections</div>
                <div className="mt-2 text-sm text-text-muted">Select the output mix and schedule set to show what this demo packet would contain.</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Export formats</div>
                  <div className="mt-3 space-y-2">
                    {selectedBundle.exportFormats.map((format) => (
                      <label key={format} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">
                        <input
                          type="checkbox"
                          checked={builderState.selectedFormats.includes(format)}
                          onChange={() => {
                            setBuilderState((current) => ({
                              ...current,
                              selectedFormats: toggleValue(current.selectedFormats, format),
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Included schedules</div>
                  <div className="mt-3 space-y-2">
                    {selectedBundle.includedSchedules.map((schedule) => (
                      <label key={schedule} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">
                        <input
                          type="checkbox"
                          checked={builderState.selectedSchedules.includes(schedule)}
                          onChange={() => {
                            setBuilderState((current) => ({
                              ...current,
                              selectedSchedules: toggleValue(current.selectedSchedules, schedule),
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <span>{schedule}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Cover memo mode</div>
                  <div className="mt-3 space-y-2">
                    {[
                      ["controller_summary", "Controller summary"],
                      ["cpa_handoff", "CPA handoff memo"],
                      ["open_items", "Open items list"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">
                        <input
                          type="radio"
                          name="cover-memo-mode"
                          checked={builderState.coverMemoMode === value}
                          onChange={() => {
                            setBuilderState((current) => ({
                              ...current,
                              coverMemoMode: value as BuilderState["coverMemoMode"],
                            }));
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Recipient + build settings</div>
                  <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-3 text-sm text-text-muted">
                    <div>Recipient: <span className="text-text-primary">{selectedBundle.recipient}</span></div>
                    <div>Owner: <span className="text-text-primary">{selectedBundle.owner}</span></div>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={builderState.includeDeliveryNotes}
                        onChange={() => {
                          setBuilderState((current) => ({
                            ...current,
                            includeDeliveryNotes: !current.includeDeliveryNotes,
                          }));
                        }}
                        className="mt-0.5"
                      />
                      <span>Include delivery notes + release reminders in the demo packet cover page</span>
                    </label>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        void persistPacketBuild();
                      }}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? "Saving packet history..." : historySource === "convex" ? "Assemble + persist packet" : "Assemble demo packet"}
                    </button>
                  </div>
                  {buildMessage ? <div className="mt-4 text-sm text-text-muted">{buildMessage}</div> : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Assembly preview</div>
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Selected bundle</div>
                  <div className="mt-2 font-medium text-text-primary">{selectedBundle.name}</div>
                  <p className="mt-2 text-sm text-text-muted">{selectedBundle.description}</p>
                </div>
                <AccountingStatusBadge label={selectedBundle.status.replaceAll("_", " ")} tone={bundleTone(selectedBundle.status)} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {packetSummary.map((line) => (
                  <div key={line} className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-text-muted">
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Readiness framing</div>
                <div className="mt-2 text-sm text-text-primary">{packetReadinessLabel}</div>
                {selectedBundle.blockers.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {selectedBundle.blockers.map((blocker) => (
                      <li key={blocker}>• {blocker}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 text-sm text-emerald-200">No bundle-level blockers remain in the base demo data.</div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">3. Attach checklist items</div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <label key={item.title} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                  <input
                    type="checkbox"
                    checked={builderState.selectedChecklistTitles.includes(item.title)}
                    onChange={() => {
                      setBuilderState((current) => ({
                        ...current,
                        selectedChecklistTitles: toggleValue(current.selectedChecklistTitles, item.title),
                      }));
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-sm text-text-muted">Owner: {item.owner}</div>
                      </div>
                      <AccountingStatusBadge label={item.status} tone={checklistTone(item.status)} className="capitalize" />
                    </div>
                    <p className="mt-3 text-sm text-text-muted">{item.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Fast links</div>
            <div className="mt-4 grid gap-3">
              <Link href="/dashboard/allocations/support-schedule" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open 280E support schedule
              </Link>
              <Link href="/dashboard/allocations/history" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open allocation override history
              </Link>
              <Link href="/dashboard/accounting/close" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open close dashboard
              </Link>
              <Link href={featuredReconciliationHref} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open featured reconciliation detail
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Generation history</div>
              <AccountingStatusBadge label={historySource === "convex" ? "persisted" : "demo"} tone={historySource === "convex" ? "emerald" : "slate"} className="capitalize" />
            </div>
            <div className="mt-4 space-y-3">
              {demoHistory.map((entry) => (
                <div key={`${entry.timestampLabel}-${entry.action}`} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{entry.action}</div>
                      <div className="mt-1 text-sm text-text-muted">{entry.actor}</div>
                    </div>
                    <div className="text-sm text-text-muted">{entry.timestampLabel}</div>
                  </div>
                  <p className="mt-3 text-sm text-text-muted">{entry.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Accounting audit trail</div>
            <p className="mt-2 text-sm text-text-muted">Recent persisted close, reconciliation, and packet events surfaced alongside the export center when available.</p>
            <div className="mt-4 space-y-3">
              {auditTrail.length > 0 ? auditTrail.map((entry) => (
                <div key={`${entry.timestampLabel}-${entry.action}-${entry.actor}`} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{entry.action}</div>
                      <div className="mt-1 text-sm text-text-muted">{entry.actor}</div>
                    </div>
                    <div className="text-sm text-text-muted">{entry.timestampLabel}</div>
                  </div>
                  <p className="mt-3 text-sm text-text-muted">{entry.detail}</p>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-4 text-sm text-text-muted">No persisted accounting audit events have been recorded yet for this tenant.</div>}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Automation definitions</div>
          <p className="mt-2 text-sm text-text-muted">Optional static control surface for Green workflows. These are demo definitions only and do not run background jobs.</p>
          <div className="mt-4 space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-medium text-text-primary">{agent.name}</div>
                    <div className="mt-1 text-sm text-text-muted">{agent.workflow} • {agent.cadence}</div>
                  </div>
                  <AccountingStatusBadge label={agent.status} tone={agentTone(agent.status)} className="capitalize" />
                </div>
                <p className="mt-3 text-sm text-text-muted">{agent.purpose}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Triggers</div>
                    <ul className="mt-2 space-y-2 text-sm text-text-muted">
                      {agent.triggers.map((trigger) => (
                        <li key={trigger}>• {trigger}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Outputs</div>
                    <ul className="mt-2 space-y-2 text-sm text-text-muted">
                      {agent.outputs.map((output) => (
                        <li key={output}>• {output}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Guardrails</div>
                    <ul className="mt-2 space-y-2 text-sm text-text-muted">
                      {agent.guardrails.map((guardrail) => (
                        <li key={guardrail}>• {guardrail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-sm text-text-muted">Owner: {agent.owner} · Last run: {agent.lastRun}</div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
