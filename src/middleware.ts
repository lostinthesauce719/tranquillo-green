import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Dashboard is NOT protected here — the layout handles demo mode fallback.
// Only protect API routes that require auth.
const isProtectedRoute = createRouteMatcher([
  "/api/accounting(.*)",
  "/api/audit-trail(.*)",
  "/api/settings(.*)",
  "/api/onboarding(.*)",
  "/api/integrations(.*)",
  "/api/automation(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
