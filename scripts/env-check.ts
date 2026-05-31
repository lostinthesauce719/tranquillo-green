import { getEnvVar, validateEnv } from "@/lib/env";

validateEnv();

const missing = [
  !process.env.NEXT_PUBLIC_CONVEX_URL && "NEXT_PUBLIC_CONVEX_URL",
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  !process.env.CLERK_SECRET_KEY && "CLERK_SECRET_KEY",
  !getEnvVar("CLERK_JWT_ISSUER_DOMAIN") && "CLERK_JWT_ISSUER_DOMAIN",
].filter(Boolean);

if (missing.length) {
  console.log(`Env check: OK`);
} else {
  console.log(`Env check: present`, {
    convex: process.env.NEXT_PUBLIC_CONVEX_URL,
    clerkPublishable: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    clerkSecret: Boolean(process.env.CLERK_SECRET_KEY),
    issuer: Boolean(getEnvVar("CLERK_JWT_ISSUER_DOMAIN")),
  });
}
