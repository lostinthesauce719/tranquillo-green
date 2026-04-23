import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoAutomationAgent } from "@/lib/demo/accounting-handoff";

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

function outcomeDot(result: "pass" | "flag" | "hold") {
  switch (result) {
    case "pass":
      return "bg-emerald-400";
    case "flag":
      return "bg-amber-400";
    case "hold":
      return "bg-rose-400";
  }
}

function outcomeLabel(result: "pass" | "flag" | "hold") {
  switch (result) {
    case "pass":
      return "Passed";
    case "flag":
      return "Flagged";
    case "hold":
      return "Held";
  }
}

export function GreenAutomationWorkspace({ agents }: { agents: DemoAutomationAgent[] }) {
  const attentionCount = agents.filter((agent) => agent.status === "attention").length;
  const watchCount = agents.filter((agent) => agent.status === "watch").length;
  const healthyCount = agents.filter((agent) => agent.status === "healthy").length;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Automation posture</div>
            <h2 className="mt-2 text-xl font-semibold">What is automated versus what still needs a human</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              The current Green automation story is reviewer-first: agents summarize issues, package context, and propose follow-up, but they do not post entries, send external messages, or move workflow state on their own.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
            <div>Healthy definitions: <span className="text-text-primary">{healthyCount}</span></div>
            <div className="mt-1">Watch definitions: <span className="text-text-primary">{watchCount}</span></div>
            <div className="mt-1">Attention definitions: <span className="text-text-primary">{attentionCount}</span></div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">Good fit: monitoring close blockers, missing support, and reviewer queue conditions.</div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">Human-required: signoff, posting, recipient delivery, and anything that changes accounting state.</div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">Demo constraint: statuses and last-run values reflect seeded product narrative rather than live background execution.</div>
        </div>
      </section>

      {agents.map((agent) => (
        <section key={agent.id} className="rounded-2xl border border-border bg-surface-mid p-5">
          {/* Header row: workflow label, name, status */}
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">{agent.workflow}</div>
              <h2 className="mt-2 text-xl font-semibold">{agent.name}</h2>
              <p className="mt-2 text-sm text-text-muted">{agent.purpose}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AccountingStatusBadge label={agent.status} tone={agentTone(agent.status)} className="capitalize" />
              <AccountingStatusBadge label={agent.cadence} tone="slate" />
            </div>
          </div>

          {/* Run metrics strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Last run</div>
              <div className="mt-1 text-sm font-medium text-text-primary">{agent.lastRun}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Next run</div>
              <div className="mt-1 text-sm font-medium text-text-primary">{agent.nextRun}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Items reviewed</div>
              <div className="mt-1 text-sm font-medium text-text-primary">{agent.itemsReviewed}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Exceptions found</div>
              <div className="mt-1 text-sm font-medium text-text-primary">{agent.exceptionsFound}</div>
            </div>
          </div>

          {/* Historical outcomes row */}
          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Recent run history</div>
            <div className="mt-2 flex flex-wrap gap-3">
              {agent.historicalOutcomes.map((run) => (
                <div key={run.date} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className={`inline-block h-2 w-2 rounded-full ${outcomeDot(run.result)}`} />
                  <span>{run.date}</span>
                  <span className="text-text-primary">{outcomeLabel(run.result)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail grid: what it reviews, what it recommends, approval rules */}
          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              {/* What this agent reviews */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">What this agent reviews</div>
                <p className="mt-2 text-sm text-text-muted">{agent.reviewScope}</p>
              </div>

              {/* Triggers */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Trigger conditions</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {agent.triggers.map((trigger) => (
                    <li key={trigger}>• {trigger}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {/* Recommendations */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">What it recommends</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {agent.recommendationTypes.map((rec) => (
                    <li key={rec}>• {rec}</li>
                  ))}
                </ul>
              </div>

              {/* Approval rules + guardrails */}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Approval rules</div>
                <p className="mt-2 text-sm text-text-primary">{agent.approvalRules}</p>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Guardrails</div>
                  <ul className="mt-2 space-y-1.5 text-sm text-text-muted">
                    {agent.guardrails.map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Outputs produced for reviewer</div>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {agent.outputs.map((output) => (
                <li key={output}>• {output}</li>
              ))}
            </ul>
          </div>

          {/* Owner footer */}
          <div className="mt-3 text-xs text-text-muted">
            Owner: <span className="text-text-primary">{agent.owner}</span>
          </div>
        </section>
      ))}
    </div>
  );
}
