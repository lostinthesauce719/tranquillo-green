import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAuthenticatedConvexClient } from "@/lib/data/convex-client";
import { anyApi } from "convex/server";

export async function POST(req: NextRequest) {
  const { userId, organizationId, businessType } = await req.json();

  // Must be authenticated
  const { userId: clerkUserId } = await getAuth(req);
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Call Convex mutation with authenticated client
  const client = await getAuthenticatedConvexClient();
  if (!client) {
    return NextResponse.json({ error: "Convex not available" }, { status: 503 });
  }

  const result = await client.mutation(
    (anyApi as any).sandbox.createSandboxTenant,
    {
      userId: clerkUserId,
      organizationId: organizationId || null,
      businessType: businessType || "dispensary",
    }
  );

  return NextResponse.json(result);
}

