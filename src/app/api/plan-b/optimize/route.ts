import { NextRequest, NextResponse } from "next/server";
import { evaluateStructures, type OptimizationInput, type StructureRecommendation } from "@/lib/plan-b/entity-optimizer";

/**
 * POST /api/plan-b/optimize
 *
 * Evaluate entity structuring options. Requires authentication in production,
 * but allows demo mode unauthenticated for internal exploration.
 */

export async function POST(req: NextRequest) {
  try {
    const body: OptimizationInput = await req.json();

    // Basic validation
    if (!body.currentRevenue || body.currentRevenue <= 0) {
      return NextResponse.json(
        { error: "Invalid revenue" },
        { status: 400 }
      );
    }

    const recommendations = evaluateStructures(body);

    return NextResponse.json({
      ok: true,
      input: body,
      recommendations,
      summary: {
        bestStructure: recommendations[0]?.structure,
        bestScore: recommendations[0]?.score,
        projectedTaxSavings: recommendations[0]?.annualTaxSavings,
      },
    });
  } catch (error) {
    console.error("Plan B optimization error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate structures" },
      { status: 500 }
    );
  }
}
