import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async () => {
  try {
    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const operations = await client.query((anyApi as any).operations.listMyOperations, {});
    return securityHeaders(NextResponse.json({ ok: true, operations }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load operations" },
        { status: 500 }
      )
    );
  }
});

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { action } = body ?? {};

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    if (action === "create") {
      const { name, operatorType, state, accountingMethod } = body;
      if (!name?.trim() || !operatorType || !state || !accountingMethod) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing name, operatorType, state, or accountingMethod" }, { status: 400 })
        );
      }
      const result = await client.mutation((anyApi as any).operations.createOperation, {
        name,
        operatorType,
        state,
        accountingMethod,
      });
      return securityHeaders(NextResponse.json({ ok: true, ...result }));
    }

    if (action === "switch") {
      const { companyId } = body;
      if (!companyId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).operations.switchActiveCompany, { companyId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update operations" },
        { status: 500 }
      )
    );
  }
});
