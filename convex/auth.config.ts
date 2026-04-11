const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN?.trim() ||
  "https://grand-wallaby-27.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
};