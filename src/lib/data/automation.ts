import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { DEMO_COMPANY_SLUG } from "@/lib/data/accounting-core";
import {
  demoAutomationAgents,
  type DemoAutomationAgent,
} from "@/lib/demo/accounting-handoff";
import { getAuthenticatedConvexClient, withTimeout } from "@/lib/data/convex-client";

// ─── Types ───────────────────────────────────────────────────────────

export type AutomationAgentRunResult = {
  agentId: string;
  agentName: string;
  completedAt: number;
  alertCount: number;
  details: string[];
  status: "success" | "error";
};

export type AutomationAgentStatus = DemoAutomationAgent & {
  source: "convex" | "demo";
  unresolvedAlerts: number;
  lastRunResult?: AutomationAgentRunResult;
};

export type AutomationWorkspace = {
  source: "convex" | "demo";
  agents: AutomationAgentStatus[];
  alertSummary: {
    totalUnresolvedAlerts: number;
    allocationAlerts: number;
    reconciliationAlerts: number;
  };
};

// ─── Convex helpers ──────────────────────────────────────────────────

function getConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return null;
  }
  return url;
}

function getUnauthenticatedClient(): ConvexHttpClient | null {
  const url = getConvexUrl();
  if (!url) return null;
  return new ConvexHttpClient(url);
}

async function getCompanyId(client: ConvexHttpClient, companySlug: string) {
  try {
    const company = await withTimeout(
      client.query((anyApi as any).cannabisCompanies.getBySlug, { slug: companySlug }),
    );
    return company?._id ?? null;
  } catch {
    return null;
  }
}

// ─── Agent mapping ───────────────────────────────────────────────────

const AGENT_MUTATION_MAP: Record<string, string> = {
  agent_alloc_monitor: "automation.checkAllocationAlerts",
  agent_close_monitor: "automation.checkCloseBlockers",
  agent_rec_followup: "automation.checkReconciliationVariances",
};

// ─── Loader: automation workspace ────────────────────────────────────

export async function loadAutomationWorkspace(
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<AutomationWorkspace> {
  const client = getUnauthenticatedClient();

  if (client) {
    const companyId = await getCompanyId(client, companySlug);
    if (companyId) {
      try {
        const statusResult = await withTimeout(
          client.query((anyApi as any).automation.getAgentStatuses, {
            companyId,
          }),
        );

        if (statusResult) {
          const agents: AutomationAgentStatus[] = demoAutomationAgents.map(
            (agent) => {
              const isAllocation = agent.id === "agent_alloc_monitor";
              const isReconciliation = agent.id === "agent_rec_followup";

              let unresolvedAlerts = 0;
              if (isAllocation) {
                unresolvedAlerts = statusResult.allocationAlerts;
              } else if (isReconciliation) {
                unresolvedAlerts = statusResult.reconciliationAlerts;
              } else {
                // Close blocker monitor watches both categories
                unresolvedAlerts =
                  statusResult.allocationAlerts +
                  statusResult.reconciliationAlerts;
              }

              return {
                ...agent,
                source: "convex" as const,
                unresolvedAlerts,
              };
            },
          );

          return {
            source: "convex",
            agents,
            alertSummary: {
              totalUnresolvedAlerts: statusResult.totalUnresolvedAlerts,
              allocationAlerts: statusResult.allocationAlerts,
              reconciliationAlerts: statusResult.reconciliationAlerts,
            },
          };
        }
      } catch {
        // fall through to demo
      }
    }
  }

  // Demo fallback
  const agents: AutomationAgentStatus[] = demoAutomationAgents.map(
    (agent) => ({
      ...agent,
      source: "demo" as const,
      unresolvedAlerts: 0,
    }),
  );

  return {
    source: "demo",
    agents,
    alertSummary: {
      totalUnresolvedAlerts: 0,
      allocationAlerts: 0,
      reconciliationAlerts: 0,
    },
  };
}

// ─── Write action: run an automation agent ───────────────────────────

export async function runAutomationAgent(
  agentId: string,
  companySlug: string = DEMO_COMPANY_SLUG,
): Promise<{ ok: boolean; mode: "convex" | "demo"; result: AutomationAgentRunResult }> {
  const mutationPath = AGENT_MUTATION_MAP[agentId];
  if (!mutationPath) {
    return {
      ok: false,
      mode: "demo",
      result: {
        agentId,
        agentName: "Unknown",
        completedAt: Date.now(),
        alertCount: 0,
        details: [`Unknown agent: ${agentId}`],
        status: "error",
      },
    };
  }

  const client = getUnauthenticatedClient();

  if (client) {
    const companyId = await getCompanyId(client, companySlug);
    if (companyId) {
      try {
        const [module, fn] = mutationPath.split(".");
        const apiRef = (anyApi as any)[module]?.[fn];
        if (apiRef) {
          const result = await withTimeout(
            client.mutation(apiRef, { companyId }),
          );
          return {
            ok: true,
            mode: "convex",
            result: result as AutomationAgentRunResult,
          };
        }
      } catch (error) {
        return {
          ok: false,
          mode: "convex",
          result: {
            agentId,
            agentName: agentId,
            completedAt: Date.now(),
            alertCount: 0,
            details: [
              `Convex mutation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            ],
            status: "error",
          },
        };
      }
    }
  }

  // Demo mode: simulate a run
  const agentName =
    demoAutomationAgents.find((a) => a.id === agentId)?.name ?? agentId;

  return {
    ok: true,
    mode: "demo",
    result: {
      agentId,
      agentName,
      completedAt: Date.now(),
      alertCount: 0,
      details: [
        "Running in demo mode — no Convex connection available.",
        "Connect Convex to scan real data and produce alerts.",
      ],
      status: "success",
    },
  };
}
