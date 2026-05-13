"use client";

import { useEffect, useState } from "react";
import Joyride, { STATUS, CallBackProps, Step } from "react-joyride";
import { getOnboardingProgress, startOnboardingTour, completeOnboardingTour } from "@/app/api/onboarding/actions";

export interface GuidedTourProps {
  tourId: string;
  steps: Step[];
}

export function GuidedTour({ tourId, steps }: GuidedTourProps) {
  const [run, setRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkProgress() {
      try {
        const progress = await getOnboardingProgress(tourId);
        if (!progress || progress.status !== "completed") {
          await startOnboardingTour(tourId);
          setRun(true);
        } else {
          setRun(false);
        }
      } catch (e) {
        console.error("Failed to check tour progress", e);
      } finally {
        setLoading(false);
      }
    }
    checkProgress();
  }, [tourId]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finished = status === STATUS.FINISHED;
    const skipped = status === STATUS.SKIPPED;

    if (finished || skipped) {
      await completeOnboardingTour(tourId);
      setRun(false);
    }
  };

  // Ensure the component only renders on the client to avoid SSR hydration mismatch
  // react-joyride uses portals that differ between server and client.
  if (!mounted || loading || !run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#22855A",
          backgroundColor: "#0b1120",
          textColor: "#e2e8f0",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#22855A",
          color: "#fff",
        },
        buttonBack: {
          color: "#94a3b8",
        },
        buttonSkip: {
          color: "#94a3b8",
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}