import "server-only";

/**
 * Environment variable validation module.
 * Validates required env vars at startup and exports typed getters.
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]?.trim();
  if (value && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  return "";
}

function requireEnvVar(key: string): string {
  const value = process.env[key]?.trim();
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Check your .env.local file.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Exported getters
// ---------------------------------------------------------------------------

/** Convex deployment URL (required, public) */
export function getConvexUrl(): string {
  return requireEnvVar("NEXT_PUBLIC_CONVEX_URL");
}

/** Clerk publishable key (required, public) */
export function getClerkPublishableKey(): string {
  return requireEnvVar("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

/** Clerk secret key (required, server-only) */
export function getClerkSecretKey(): string {
  return requireEnvVar("CLERK_SECRET_KEY");
}

/**
 * Clerk JWT issuer domain (optional).
 * Falls back to the standard Clerk issuer if not set.
 */
export function getClerkJwtIssuerDomain(): string {
  return getEnvVar("CLERK_JWT_ISSUER_DOMAIN", "");
}

/**
 * Clerk JWT template name used for Convex (optional, defaults to "convex").
 */
export function getClerkConvexJwtTemplate(): string {
  return getEnvVar("CLERK_CONVEX_JWT_TEMPLATE", "convex");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate all required environment variables.
 * Call this early at startup (e.g. in a script or the root layout) so that
 * missing vars surface immediately with a clear message.
 */
export function validateEnv(): void {
  const errors: string[] = [];

  for (const key of [
    "NEXT_PUBLIC_CONVEX_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ] as const) {
    if (!process.env[key]?.trim()) {
      errors.push(`  - ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      "Missing required environment variables:\n" +
        errors.join("\n") +
        "\n\nCreate or update your .env.local file. " +
        "See .env.local.example for reference."
    );
  }
}

export { getEnvVar, requireEnvVar };
