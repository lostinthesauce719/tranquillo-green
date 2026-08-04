import { NextResponse } from "next/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

function sanitizeString(value: unknown, maxLen: number = 256): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return undefined;
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      states,
      operatorTypes,
      accountingMethods,
      inventoryRole,
      productionSqFt,
      totalSqFt,
      productionHours,
      totalHours,
    } = body;

    // Name the missing fields. The previous generic "Missing required fields."
    // gave the user no way to tell which step to go back to — and the UI let
    // them reach this point with empty selections, so it fired routinely.
    const missing = [
      !name && "business name",
      !states?.length && "operating state(s)",
      !operatorTypes?.length && "operator type(s)",
      !accountingMethods?.length && "accounting method(s)",
    ].filter(Boolean) as string[];

    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Missing required ${
            missing.length === 1 ? "field" : "fields"
          }: ${missing.join(", ")}.`,
          missing,
        },
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
        // IRC 471 classification and the measured allocation bases. Without
        // these the reclassification engine refuses to reclassify anything,
        // which is correct but leaves the operator with no 280E benefit.
        ...(inventoryRole ? { inventoryRole } : {}),
        ...(sanitizeNumber(productionSqFt) !== undefined
          ? { productionSqFt: sanitizeNumber(productionSqFt) }
          : {}),
        ...(sanitizeNumber(totalSqFt) !== undefined
          ? { totalSqFt: sanitizeNumber(totalSqFt) }
          : {}),
        ...(sanitizeNumber(productionHours) !== undefined
          ? { productionHours: sanitizeNumber(productionHours) }
          : {}),
        ...(sanitizeNumber(totalHours) !== undefined
          ? { totalHours: sanitizeNumber(totalHours) }
          : {}),
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
