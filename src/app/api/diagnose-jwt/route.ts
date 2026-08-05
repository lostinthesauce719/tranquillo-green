import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/diagnose-jwt
 *
 * Tests whether the Clerk JWT template "convex" is configured correctly.
 * Requires sign-in. Returns diagnostic info about the token flow.
 */
export async function GET() {
  const authState = auth();

  if (!authState.userId) {
    return NextResponse.json({
      signedIn: false,
      message: "Not signed in. Sign in at /sign-in first.",
    });
  }

  const templateName = process.env.CLERK_CONVEX_JWT_TEMPLATE?.trim() || "convex";
  let token: string | null = null;
  let tokenError: string | null = null;

  try {
    token = (await authState.getToken({ template: templateName })) ?? null;
  } catch (err) {
    tokenError = err instanceof Error ? err.message : "Unknown error getting token";
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

  return NextResponse.json({
    signedIn: true,
    userId: authState.userId,
    templateName,
    tokenReceived: Boolean(token),
    tokenLength: token?.length ?? 0,
    tokenError,
    convexUrlConfigured: Boolean(convexUrl),
    convexUrl,
    diagnosis: token
      ? "JWT token is flowing. If Convex still rejects, check the Convex environment variable CLERK_JWT_ISSUER_DOMAIN matches your Clerk issuer."
      : `No JWT token received for template "${templateName}". Go to Clerk Dashboard > JWT Templates and create a template named "${templateName}". Audience/Application ID should be "convex".`,
  });
}
