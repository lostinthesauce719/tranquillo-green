// CLERK_JWT_ISSUER_DOMAIN must be set on every Convex deployment (dashboard →
// Settings → Environment Variables, or `npx convex env set`). Convex requires
// any env var referenced here to be set before it will deploy, so there is
// deliberately no fallback value: a stale hardcoded issuer would silently
// validate tokens against the wrong Clerk instance.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
