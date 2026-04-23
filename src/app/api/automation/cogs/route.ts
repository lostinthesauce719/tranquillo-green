import { NextResponse } from "next/server";
import { anyApi } from "convex/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";

const DEMO_COMPANY_ID = "demo";

// POST /api/automation/cogs — Run COGS automation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, confidenceThreshold, allocationIds, reason } = body;

    // Try authenticated client first, fall back to demo
    const client = await getAuthenticatedConvexClient();

    if (client) {
      // Get company ID
      const companySlug = body.companySlug ?? "california-operator-demo";
      const company = await client.query(
        (anyApi as any).cannabisCompanies.getBySlug,
        { slug: companySlug }
      );
      if (!company?._id) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }

      switch (action) {
        case "auto_approve": {
          const result = await client.mutation(
            (anyApi as any).automation.autoApproveAllocations,
            {
              companyId: company._id,
              confidenceThreshold: confidenceThreshold ?? 0.9,
            }
          );
          return NextResponse.json({
            success: true,
            source: "convex",
            ...result,
          });
        }

        case "batch_approve": {
          if (!allocationIds || !Array.isArray(allocationIds)) {
            return NextResponse.json(
              { error: "allocationIds required for batch_approve" },
              { status: 400 }
            );
          }
          const result = await client.mutation(
            (anyApi as any).automation.batchApproveAllocations,
            {
              companyId: company._id,
              allocationIds,
              actor: "controller",
              reason,
            }
          );
          return NextResponse.json({
            success: true,
            source: "convex",
            ...result,
          });
        }

        case "calculate_cogs": {
          const result = await client.mutation(
            (anyApi as any).automation.calculateCogsFromInventory,
            {
              companyId: company._id,
              periodLabel: body.periodLabel ?? "April 2026",
            }
          );
          return NextResponse.json({
            success: true,
            source: "convex",
            ...result,
          });
        }

        case "run_all": {
          const result = await client.mutation(
            (anyApi as any).automation.runFullAutomation,
            {
              companyId: company._id,
              autoApproveThreshold: confidenceThreshold ?? 0.9,
            }
          );
          return NextResponse.json({
            success: true,
            source: "convex",
            ...result,
          });
        }

        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    }

    // Demo fallback — simulate the response
    const now = Date.now();
    switch (action) {
      case "auto_approve":
        return NextResponse.json({
          success: true,
          source: "demo",
          agentId: "agent_auto_approve",
          agentName: "COGS auto-approval engine",
          completedAt: now,
          approvedCount: 2,
          details: [
            `Auto-approved 2 allocations with >= ${Math.round((confidenceThreshold ?? 0.9) * 100)}% confidence.`,
            "6310 · Security Services — 91% confidence (square footage)",
            "6415 · Professional Fees — 97% confidence (custom policy)",
          ],
          status: "success",
        });

      case "batch_approve":
        return NextResponse.json({
          success: true,
          source: "demo",
          approvedCount: allocationIds?.length ?? 0,
          details: [
            `Demo: would approve ${(allocationIds ?? []).length} allocation(s).`,
          ],
          completedAt: now,
        });

      case "calculate_cogs":
        return NextResponse.json({
          success: true,
          source: "demo",
          totalCogs: 24781.19,
          movementCount: 156,
          cogsByCategory: {
            flower: 14250.0,
            "vape cartridges": 6420.75,
            "pre-rolls": 2890.44,
            edibles: 1220.0,
          },
          details: [
            "Processed 156 inventory movements (sales + waste).",
            "Total COGS: $24,781.19",
            "  flower: $14,250.00",
            "  vape cartridges: $6,420.75",
            "  pre-rolls: $2,890.44",
            "  edibles: $1,220.00",
          ],
          completedAt: now,
        });

      case "run_all":
        return NextResponse.json({
          success: true,
          source: "demo",
          completedAt: now,
          agentsRun: 3,
          totalAlerts: 1,
          results: [
            {
              agentId: "agent_auto_approve",
              agentName: "COGS auto-approval",
              alertCount: 0,
              details: ["Auto-approved 2 allocations (>= 90% confidence)."],
              status: "success",
            },
            {
              agentId: "agent_alloc_monitor",
              agentName: "Allocation monitor",
              alertCount: 1,
              details: [
                "2 allocations pending, 0 low confidence.",
                "Alert created for remaining items.",
              ],
              status: "success",
            },
            {
              agentId: "agent_close_monitor",
              agentName: "Close blocker monitor",
              alertCount: 0,
              details: ["1 period(s) in review.", "No close blockers."],
              status: "success",
            },
          ],
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("COGS automation error:", error);
    return NextResponse.json(
      { error: "Automation failed", details: String(error) },
      { status: 500 }
    );
  }
}
