// Load .env.local before anything reads process.env.
//
// Next.js loads .env files automatically, but this script runs standalone under
// tsx, which does not. Without this, env:check reported every variable as
// missing even when .env.local was correct — and validateEnv() below threw
// before the check could report anything useful.
//
// @next/env is the loader Next itself uses, so precedence matches the real app
// (.env.local overrides .env, etc.).
// Named import doesn't work here: @next/env's CJS bundle exposes
// loadEnvConfig via a dynamic Object.defineProperty helper that Node's
// cjs-module-lexer can't statically detect under plain ESM (tsx), so
// `import { loadEnvConfig }` throws even though it exists on the module.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import { getEnvVar, validateEnv } from "@/lib/env";

// Required: the app cannot function without these.
const missing = [
  !process.env.NEXT_PUBLIC_CONVEX_URL && "NEXT_PUBLIC_CONVEX_URL",
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  !process.env.CLERK_SECRET_KEY && "CLERK_SECRET_KEY",
].filter(Boolean);

// Recommended: convex/auth.config.ts has a hardcoded fallback, so an unset
// value works locally but silently pins one Clerk instance. Warn rather than
// fail — a check that reports a working environment as broken gets ignored,
// which is how the inverted branches below went unnoticed for so long.
const recommended = [
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

for (const key of recommended) {
  console.warn(`Env check: warning — ${key} is not set (using fallback).`);
}

// Authoritative gate — shares its required-key list with the running app, so
// this script cannot drift from what the app actually enforces at startup.
validateEnv();

console.log("Env check: OK", {
  convex: process.env.NEXT_PUBLIC_CONVEX_URL,
  clerkPublishable: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  clerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
  issuer: Boolean(getEnvVar("CLERK_JWT_ISSUER_DOMAIN")),
});
