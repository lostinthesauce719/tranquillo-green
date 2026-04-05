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
  return (
    <div className="space-y-4">
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
