import { redirect } from "next/navigation";

/**
 * Legacy redirect: /dashboard/onboarding -> /onboarding
 * The onboarding page now lives outside the /dashboard/ layout to avoid
 * redirect loops (the dashboard layout redirects to onboarding when no
 * tenant is found).
 */
export default function DashboardOnboardingRedirect() {
  redirect("/onboarding");
}
