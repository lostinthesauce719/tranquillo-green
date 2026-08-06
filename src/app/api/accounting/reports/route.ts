import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function readDate(value: string | null): string | undefined {
  return value && ISO_DATE.test(value) ? value : undefined;
}

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type") ?? "trial-balance";
    const startDate = readDate(searchParams.get("startDate"));
    const endDate = readDate(searchParams.get("endDate"));
    const asOfDate = readDate(searchParams.get("asOfDate"));

    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (type === "trial-balance") {
      const report = await client.query((anyApi as any).financialStatements.getTrialBalance, {
        companyId,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      return securityHeaders(NextResponse.json({ ok: true, report }));
    }

    if (type === "income-statement") {
      const report = await client.query((anyApi as any).financialStatements.getIncomeStatement, {
        companyId,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      return securityHeaders(NextResponse.json({ ok: true, report }));
    }

    if (type === "balance-sheet") {
      const report = await client.query((anyApi as any).financialStatements.getBalanceSheet, {
        companyId,
        ...(asOfDate ? { asOfDate } : {}),
      });
      return securityHeaders(NextResponse.json({ ok: true, report }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown report type" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to build report" },
        { status: 500 }
      )
    );
  }
});
