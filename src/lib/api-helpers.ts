import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Handler function type that receives the authenticated request and Clerk auth info.
 */
type AuthenticatedHandler = (
  request: Request,
  authResult: Awaited<ReturnType<typeof auth>>,
) => Promise<NextResponse>;

/**
 * Wrapper that enforces Clerk authentication before running the handler.
 * Returns 401 if the user is not authenticated.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request): Promise<NextResponse> => {
    const authResult = auth();
    if (!authResult.userId) {
      return securityHeaders(
        NextResponse.json(
          { ok: false, message: "Unauthenticated." },
          { status: 401 },
        ),
      );
    }
    return handler(request, authResult);
  };
}

/**
 * Adds standard security headers to a NextResponse.
 */
export function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.*.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://clerk.*.accounts.dev",
      "frame-src https://clerk.*.accounts.dev",
    ].join("; "),
  );
  return response;
}

/**
 * Adds CORS headers to a NextResponse.
 * Defaults to allowing the request Origin if provided, otherwise uses wildcard.
 */
export function corsHeaders(
  response: NextResponse,
  origin?: string,
): NextResponse {
  response.headers.set(
    "Access-Control-Allow-Origin",
    origin ?? "*",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return response;
}

// ---------------------------------------------------------------------------
// In-memory rate limiter (suitable for development / single-instance deploys)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 *
 * @param identifier  Unique key for the caller (e.g. userId or IP).
 * @param maxRequests Maximum number of requests allowed in the window.
 * @param windowMs    Duration of the rate-limit window in milliseconds.
 * @returns           `{ allowed: true }` when within limits, or
 *                    `{ allowed: false, retryAfter }` (seconds) when exceeded.
 */
export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now >= entry.resetAt) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}
