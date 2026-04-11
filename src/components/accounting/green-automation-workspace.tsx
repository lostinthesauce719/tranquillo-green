"use client";

import { useState, useCallback } from "react";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoAutomationAgent } from "@/lib/demo/accounting-handoff";

type AgentStatus = DemoAutomationAgent & {
  source?: "convex" | "demo";
  unresolvedAlerts?: number;
};

type RunResult = {
  agentId: string;
  agentName: string;
  completedAt: number;
  alertCount: number;
  details: string[];
  status: "success" | "error";
};

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

function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function GreenAutomationWorkspace({ agents }: { agents: AgentStatus[] }) {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});

  const handleRun = useCallback(
    async (agentId: string) => {
      setRunningId(agentId);
      setRunErrors((prev) => {
        const next = { ...prev };
        delete next[agentId];
        return next;
      });

      try {
        const response = await fetch("/api/automation/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || data.result?.details?.join("; ") || "Run failed");
        }

        setRunResults((prev) => ({
          ...prev,
          [agentId]: data.result,
        }));
      } catch (error) {
        setRunErrors((prev) => ({
          ...prev,
          [agentId]:
            error instanceof Error ? error.message : "Failed to run agent",
        }));
      } finally {
        setRunningId(null);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      {agents.map((agent) => {
        const isRunning = runningId === agent.id;
        const lastRun = runResults[agent.id];
        const runError = runErrors[agent.id];

        return (
          <section
            key={agent.id}
            className="rounded-2xl border border-border bg-surface-mid p-5"
          >
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">
                  {agent.workflow}
                </div>
                <h2 className="mt-2 text-xl font-semibold">{agent.name}</h2>
                <p className="mt-2 text-sm text-text-muted">{agent.purpose}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AccountingStatusBadge
                  label={agent.status}
                  tone={agentTone(agent.status)}
                  className="capitalize"
                />
                <AccountingStatusBadge label={agent.cadence} tone="slate" />
                {agent.unresolvedAlerts != null && agent.unresolvedAlerts > 0 && (
                  <AccountingStatusBadge
                    label={`${agent.unresolvedAlerts} alert${agent.unresolvedAlerts !== 1 ? "s" : ""}`}
                    tone="rose"
                  />
                )}
                {agent.source === "convex" && (
                  <AccountingStatusBadge label="Live" tone="emerald" />
                )}
                {agent.source === "demo" && (
                  <AccountingStatusBadge label="Demo" tone="slate" />
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
                  Owner: {agent.owner}
                  <div className="mt-1">Last run: {agent.lastRun}</div>
                </div>

                {/* Run Now button */}
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <button
                    onClick={() => handleRun(agent.id)}
                    disabled={isRunning}
                    className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? "Running..." : "Run Now"}
                  </button>

                  {/* Run result */}
                  {lastRun && (
                    <div className="mt-3 rounded-lg border border-border bg-surface-mid p-3">
                      <div className="flex items-center gap-2 text-xs">
                        <AccountingStatusBadge
                          label={lastRun.status}
                          tone={lastRun.status === "success" ? "emerald" : "rose"}
                          className="capitalize"
                        />
                        <span className="text-text-muted">
                          {formatTimestamp(lastRun.completedAt)}
                        </span>
                        <span className="text-text-muted">
                          — {lastRun.alertCount} alert
                          {lastRun.alertCount !== 1 ? "s" : ""} created
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-text-muted">
                        {lastRun.details.map((detail, i) => (
                          <li key={i}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Run error */}
                  {runError && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {runError}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Triggers
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {agent.triggers.map((trigger) => (
                      <li key={trigger}>• {trigger}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Outputs
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {agent.outputs.map((output) => (
                      <li key={output}>• {output}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted">
                    Guardrails
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-text-muted">
                    {agent.guardrails.map((guardrail) => (
                      <li key={guardrail}>• {guardrail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
