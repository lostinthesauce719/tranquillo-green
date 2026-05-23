import { NextResponse } from "next/server";
import { withAuth, securityHeaders, rateLimit } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

const VALID_OPERATOR_TYPES = ["dispensary", "cultivator", "manufacturer", "distributor", "delivery", "vertical"];
const VALID_ACCOUNTING_METHODS = ["cash", "accrual"];
const VALID_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function sanitizeString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return undefined;
  return trimmed;
}

export const POST = withAuth(async (request, auth) => {
  try {
    // Rate limit: 30 requests per minute per user
    const rl = rateLimit(auth.userId ?? "anonymous", 30, 60_000);
    if (!rl.allowed) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "Rate limit exceeded. Try again later." },
          { status: 429, headers: { "Retry-After": String((rl as { retryAfter: number }).retryAfter) } }
        )
      );
    }

    const body = await request.json();
    const { companyId: rawCompanyId, operatorType: rawOperatorType, accountingMethod: rawAccountingMethod, state: rawState } = body;

    // Validate companyId
    const companyId = sanitizeString(rawCompanyId, 128);
    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "companyId is required" }, { status: 400 })
      );
    }

    // Validate operatorType if provided
    const operatorType = sanitizeString(rawOperatorType, 32);
    if (operatorType !== undefined && !VALID_OPERATOR_TYPES.includes(operatorType)) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: `Invalid operatorType. Must be one of: ${VALID_OPERATOR_TYPES.join(", ")}` }, { status: 400 })
      );
    }

    // Validate accountingMethod if provided
    const accountingMethod = sanitizeString(rawAccountingMethod, 16);
    if (accountingMethod !== undefined && !VALID_ACCOUNTING_METHODS.includes(accountingMethod)) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: `Invalid accountingMethod. Must be one of: ${VALID_ACCOUNTING_METHODS.join(", ")}` }, { status: 400 })
      );
    }

    // Validate state if provided
    const state = sanitizeString(rawState, 2);
    if (state !== undefined) {
      const upperState = state.toUpperCase();
      if (!VALID_STATES.includes(upperState)) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Invalid state code" }, { status: 400 })
        );
      }
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 })
      );
    }

    // Verify user has access to the company via Convex query
    const access = await client.query((anyApi as any).companies.checkCompanyAccess, { companyId });
    if (!access?.hasAccess) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized: Not a member of this company" }, { status: 403 })
      );
    }

    const updated = await client.mutation((anyApi as any).companies.updateCompany, {
      companyId,
      ...(operatorType ? { operatorType } : {}),
      ...(accountingMethod ? { defaultAccountingMethod: accountingMethod } : {}),
      ...(state ? { state: state.toUpperCase() } : {}),
    });

    return securityHeaders(
      NextResponse.json({ ok: true, company: updated })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Update failed" },
        { status: 400 }
      )
    );
  }
});
