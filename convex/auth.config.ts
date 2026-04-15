const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!clerkIssuerDomain) {
  throw new Error(
    "Missing required environment variable: CLERK_JWT_ISSUER_DOMAIN. " +
      "Set this to your Clerk JWT issuer domain (e.g. https://<your-clerk-domain>.clerk.accounts.dev)."
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
