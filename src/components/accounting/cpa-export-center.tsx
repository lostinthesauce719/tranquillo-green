import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type {
  DemoAutomationAgent,
  DemoExportBundle,
  DemoGenerationHistoryItem,
  DemoPacketChecklistItem,
} from "@/lib/demo/accounting-handoff";

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

export function CpaExportCenter({
  bundles,
  checklist,
  history,
  agents,
}: {
  bundles: DemoExportBundle[];
  checklist: DemoPacketChecklistItem[];
  history: DemoGenerationHistoryItem[];
  agents: DemoAutomationAgent[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Export bundles</div>
              <h2 className="mt-2 text-xl font-semibold">CPA handoff packet builder</h2>
              <p className="mt-2 text-sm text-text-muted">Static packet center connecting close posture, reconciliations, 280E support, and reviewer memos into exportable demo bundles.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              Demo-backed generation only
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{bundle.periodLabel}</div>
                    <div className="mt-2 font-medium text-text-primary">{bundle.name}</div>
                    <p className="mt-2 text-sm text-text-muted">{bundle.description}</p>
                  </div>
                  <AccountingStatusBadge label={bundle.status.replaceAll("_", " ")} tone={bundleTone(bundle.status)} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border bg-background p-3 text-sm text-text-muted">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Recipient</div>
                    <div className="mt-2 text-text-primary">{bundle.recipient}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-sm text-text-muted">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Owner</div>
                    <div className="mt-2 text-text-primary">{bundle.owner}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-sm text-text-muted">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Generated</div>
                    <div className="mt-2 text-text-primary">{bundle.generatedAt}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 text-sm text-text-muted">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Formats</div>
                    <div className="mt-2 text-text-primary">{bundle.exportFormats.join(" • ")}</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Included schedules / reports</div>
                    <ul className="mt-2 space-y-2 text-sm text-text-muted">
                      {bundle.includedSchedules.map((schedule) => (
                        <li key={schedule}>• {schedule}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Packet blockers</div>
                    {bundle.blockers.length === 0 ? (
                      <div className="mt-2 text-sm text-emerald-200">No blockers. Bundle is ready for handoff.</div>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm text-text-muted">
                        {bundle.blockers.map((blocker) => (
                          <li key={blocker}>• {blocker}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface-mid p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Packet checklist</div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 text-sm text-text-muted">Owner: {item.owner}</div>
                    </div>
                    <AccountingStatusBadge label={item.status} tone={checklistTone(item.status)} className="capitalize" />
                  </div>
                  <p className="mt-3 text-sm text-text-muted">{item.note}</p>
                </div>
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
              <Link href="/dashboard/reconciliations/rec_003" className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary transition hover:bg-surface/70">
                Open clearing exception detail
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Generation history</div>
          <div className="mt-4 space-y-3">
            {history.map((entry) => (
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
