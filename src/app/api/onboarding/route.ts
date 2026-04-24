import { NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, states, operatorTypes, accountingMethods } = body;

    // Basic validation
    if (!name || !states?.length || !operatorTypes?.length || !accountingMethods?.length) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Get authenticated Convex client
    const convex = await getAuthenticatedConvexClient();
    if (!convex) {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // Call the Convex mutation to create the company
    const result = await convex.mutation(
      // @ts-ignore — auto-generated api types may not include this yet
      (anyApi as any).onboarding.createCompany,
      {
        name,
        states,
        operatorTypes,
        accountingMethods,
      }
    );

    if (!result) {
      throw new Error("Mutation returned no result");
    }

    return NextResponse.json({
      ok: true,
      message: "Company created successfully.",
      companyId: result.companyId,
      slug: result.slug,
    });
  } catch (error: any) {
    console.error("Onboarding API error:", error);
    const message = error?.message ?? "Failed to create company.";
    return NextResponse.json(
      { ok: false, message },
      { status: 400 }
    );
  }
}
