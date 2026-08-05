import { NextResponse } from "next/server";
import { withAuth, securityHeaders } from "@/lib/api-helpers";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return securityHeaders(
        NextResponse.json({ ok: false, message: "Missing companyId" }, { status: 400 })
      );
    }

    const client = await getAuthenticatedConvexClient();
    if (!client) {
      return securityHeaders(NextResponse.json({ ok: false, message: "Convex not available" }, { status: 503 }));
    }

    const packages = await client.query((anyApi as any).metrcReconciliation.listByCompany, { companyId });
    return securityHeaders(NextResponse.json({ ok: true, packages }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to load packages" },
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

    if (action === "upsert") {
      const { companyId, packageLabel, product, uom, metrcQty, bookQty } = body;
      if (!companyId || !packageLabel?.trim() || typeof metrcQty !== "number" || typeof bookQty !== "number") {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing companyId, packageLabel, metrcQty, or bookQty" }, { status: 400 })
        );
      }
      const packageId = await client.mutation((anyApi as any).metrcReconciliation.upsertPackage, {
        companyId,
        packageLabel,
        product: product ?? "",
        uom: uom ?? "g",
        metrcQty,
        bookQty,
        source: "manual",
      });
      return securityHeaders(NextResponse.json({ ok: true, packageId }));
    }

    if (action === "updateBookQty") {
      const { packageId, bookQty } = body;
      if (!packageId || typeof bookQty !== "number") {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing packageId or bookQty" }, { status: 400 })
        );
      }
      const pkg = await client.mutation((anyApi as any).metrcReconciliation.updateBookQty, {
        packageId,
        bookQty,
      });
      return securityHeaders(NextResponse.json({ ok: true, package: pkg }));
    }

    if (action === "resolve") {
      const { packageId, resolutionNote } = body;
      if (!packageId || !resolutionNote?.trim()) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing packageId or resolutionNote" }, { status: 400 })
        );
      }
      const pkg = await client.mutation((anyApi as any).metrcReconciliation.resolvePackage, {
        packageId,
        resolutionNote,
      });
      return securityHeaders(NextResponse.json({ ok: true, package: pkg }));
    }

    if (action === "delete") {
      const { packageId } = body;
      if (!packageId) {
        return securityHeaders(
          NextResponse.json({ ok: false, message: "Missing packageId" }, { status: 400 })
        );
      }
      await client.mutation((anyApi as any).metrcReconciliation.deletePackage, { packageId });
      return securityHeaders(NextResponse.json({ ok: true }));
    }

    return securityHeaders(
      NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 })
    );
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Failed to update packages" },
        { status: 500 }
      )
    );
  }
});
