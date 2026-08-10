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
