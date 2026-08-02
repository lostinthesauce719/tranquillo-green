import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Dashboard is NOT protected here — the layout handles demo mode fallback
// (src/app/dashboard/layout.tsx calls currentUser() and redirects).
//
// API routes are DENY-BY-DEFAULT. The previous allow-list only covered
// /api/accounting, /api/audit-trail and /api/settings, which left
// /api/metrc, /api/pos/*, /api/automation/run, /api/emails/sequence and
// /api/backend-status callable with no authentication at all.
//
// Anything genuinely public must be added to isPublicApiRoute below, with a
// comment explaining why it is safe.
const isPublicApiRoute = createRouteMatcher([
  // Stripe verifies authenticity via webhook signature, not a session.
  "/api/stripe/webhook",
  // Unauthenticated marketing/contact capture (rate-limit these separately).
  "/api/leads/capture",
  "/api/contact/submit",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isApiRoute(req) && !isPublicApiRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
