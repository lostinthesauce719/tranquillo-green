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
          <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
                Owner: {agent.owner}
                <div className="mt-1">Last run: {agent.lastRun}</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Triggers</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {agent.triggers.map((trigger) => (
                    <li key={trigger}>• {trigger}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Outputs</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {agent.outputs.map((output) => (
                    <li key={output}>• {output}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Guardrails</div>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {agent.guardrails.map((guardrail) => (
                    <li key={guardrail}>• {guardrail}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
