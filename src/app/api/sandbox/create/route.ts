import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function POST(req: NextRequest) {
  const {
    companyId,
    organizationId,
    businessType,
  }: {
    companyId?: string;
    organizationId?: string | null;
    businessType?: string;
  } = await req.json().catch(() => ({
    companyId: undefined,
    organizationId: null,
    businessType: undefined,
  }));

  const { userId } = await getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

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

  const result = await client.mutation(
    (anyApi as any).sandbox.createSandboxTenant,
    {
      userId,
      organizationId: organizationId ?? null,
      businessType: businessType ?? "dispensary",
    },
  );

  return NextResponse.json(result);
}
