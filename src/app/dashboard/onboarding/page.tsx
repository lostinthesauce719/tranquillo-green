import { DemoOnboardingWorkspace } from "@/components/onboarding/demo-onboarding-workspace";
import { AppShell } from "@/components/shell/app-shell";

export default function OnboardingPage() {
  return (
    <AppShell
      title="Onboarding"
      description="Certainty-first bootstrap path for Tranquillo Green. This guided workspace explains the product quickly, maps each stakeholder to a safe starting point, and links directly into the live demo flow from imports through CPA handoff."
    >
      <DemoOnboardingWorkspace />
    </AppShell>
  );
}
