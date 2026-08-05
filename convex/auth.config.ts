/**
 * Clerk JWT provider configuration for Convex.
 *
 * This previously fell back to a hardcoded development issuer:
 *
 *   process.env.CLERK_JWT_ISSUER_DOMAIN?.trim() ||
 *     "https://grand-wallaby-27.clerk.accounts.dev";
 *
 * That fallback made a missing environment variable invisible. A production
 * deployment without CLERK_JWT_ISSUER_DOMAIN would not error — it would
 * silently validate production user tokens against the *development* Clerk
 * instance, and appear to work until it didn't.
 *
 * Failing at push time is the whole point: a misconfigured auth provider on an
 * accounting product is not something to discover from user reports.
 *
 * Set this per Convex deployment:
 *   npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>          # current
 *   npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer> --prod   # production
 *
 * The value is the Issuer field of the "convex" JWT template in the Clerk
 * dashboard, for the matching Clerk instance:
 *   development  https://<verb-noun-00>.clerk.accounts.dev
 *   production   https://clerk.<your-domain>.com
 */
const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!clerkIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN is not set on this Convex deployment.\n" +
      "Set it with:  npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer>\n" +
      "Find the value in the Clerk dashboard under JWT Templates -> convex -> Issuer.\n" +
      "Use the issuer for THIS deployment's Clerk instance — a production " +
      "deployment must not use a development issuer."
  );
}

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
};
