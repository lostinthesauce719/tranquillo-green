import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } },
) {
  const { userId } = await getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not available" }, { status: 503 });
  }

  const companyId = params.companyId;

  const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
  if (!tenant) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }
  if (tenant.company?._id !== companyId) {
    return NextResponse.json({ error: "Unrelated company" }, { status: 403 });
  }

  const result = await client.query(
    (anyApi as any).sandbox.getSandboxStatus,
    { companyId },
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    companyId?: string;
  };

  const { userId } = await getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const companyId = body.companyId;
  if (!companyId || typeof companyId !== "string") {
    return NextResponse.json(
      { error: "companyId is required" },
      { status: 400 },
    );
  }

  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not available" }, { status: 503 });
  }

  const tenant = await client.query((anyApi as any).users.getCurrentTenant, {});
  if (!tenant) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }
  if (tenant.company?._id !== companyId) {
    return NextResponse.json({ error: "Unrelated company" }, { status: 403 });
  }
  if (tenant.user?.role !== "owner" && tenant.user?.role !== "controller") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const result = await client.mutation(
    (anyApi as any).sandbox.createSandboxTenant,
    {
      userId,
      organizationId: companyId,
      businessType: "dispensary",
    },
  );

  return NextResponse.json(result);
}
