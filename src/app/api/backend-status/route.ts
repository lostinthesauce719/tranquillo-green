import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";

export const GET = withAuth(async (req, auth) => {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERSION || "dev",
    environment: process.env.NODE_ENV,
    user: auth.userId,
  });
});
