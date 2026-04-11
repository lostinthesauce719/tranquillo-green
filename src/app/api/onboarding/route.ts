import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { anyApi } from "convex/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Unauthenticated." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, state, operatorType, accountingMethod } = body as {
      name?: string;
      state?: string;
      operatorType?: string;
      accountingMethod?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, message: "Company name is required." },
        { status: 400 },
      );
    }

    const validOperatorTypes = [
      "dispensary",
      "cultivator",
      "manufacturer",
      "distributor",
      "vertical",
    ];
    const validAccountingMethods = ["cash", "accrual"];

    const resolvedOperatorType = validOperatorTypes.includes(
      operatorType ?? "",
    )
      ? (operatorType as
          | "dispensary"
          | "cultivator"
          | "manufacturer"
          | "distributor"
          | "vertical")
      : "dispensary";

    const resolvedAccountingMethod = validAccountingMethods.includes(
      accountingMethod ?? "",
    )
      ? (accountingMethod as "cash" | "accrual")
      : "cash";

    const resolvedState = state?.trim() || "CA";
    const slug = slugify(name.trim());

    if (!slug) {
      return NextResponse.json(
        { ok: false, message: "Company name must contain alphanumeric characters." },
        { status: 400 },
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return NextResponse.json(
        { ok: false, message: "Convex client unavailable." },
        { status: 500 },
      );
    }

    // Ensure the user record exists in Convex.
    await client.mutation((anyApi as any).users.getOrCreateUser, {});

    // Create the cannabis company.
    const companyId = await client.mutation(
      (anyApi as any).cannabisCompanies.create,
      {
        name: name.trim(),
        slug,
        timezone: "America/Los_Angeles",
        state: resolvedState,
        operatorType: resolvedOperatorType,
        defaultAccountingMethod: resolvedAccountingMethod,
        status: "onboarding",
      },
    );

    // Link the authenticated user to the new company as owner.
    await client.mutation((anyApi as any).users.linkToCompany, {
      companyId,
      role: "owner",
    });

    // Seed the default chart of accounts.
    await client.mutation((anyApi as any).chartOfAccounts.seedDefaults, {
      companyId,
    });

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    console.error("[onboarding]", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Onboarding failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
