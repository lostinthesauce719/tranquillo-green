import { getEnvVar, validateEnv } from "@/lib/env";

validateEnv();

const missing = [
  !process.env.NEXT_PUBLIC_CONVEX_URL && "NEXT_PUBLIC_CONVEX_URL",
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  !process.env.CLERK_SECRET_KEY && "CLERK_SECRET_KEY",
  !getEnvVar("CLERK_JWT_ISSUER_DOMAIN") && "CLERK_JWT_ISSUER_DOMAIN",
].filter(Boolean);

// NOTE: the branches below were inverted — the script printed "Env check: OK"
// exactly when variables were MISSING, and only reported detail when the
// environment was complete. A broken env therefore looked healthy.
if (missing.length > 0) {
  console.error("Env check: FAILED — missing required variables:");
  for (const key of missing) console.error(`  - ${key}`);
  console.error("\nSee .env.local.example for reference.");
  process.exit(1);
}

console.log("Env check: OK", {
  convex: process.env.NEXT_PUBLIC_CONVEX_URL,
  clerkPublishable: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  clerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
  issuer: Boolean(getEnvVar("CLERK_JWT_ISSUER_DOMAIN")),
});
