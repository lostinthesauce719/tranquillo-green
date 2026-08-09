"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * OAuth (Google, etc.) return lands here at /auth/sso-callback. The combined
 * /auth page uses hash routing, so Clerk cannot handle the social-login
 * callback on that route — it needs a real path. This component completes the
 * sign-in/sign-up handshake and forwards to the dashboard.
 *
 * Without this route, "Sign up with Google" 404s at /auth/sso-callback.
 */
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
