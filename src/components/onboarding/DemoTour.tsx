"use client";

import { useEffect, useState, useCallback } from "react";
import Joyride, { STATUS, CallBackProps, Step } from "react-joyride";
import { demoProductTourSteps, demoQuickTourSteps } from "@/lib/onboarding/demo-tour";
import { getOnboardingProgress, startOnboardingTour, completeOnboardingTour } from "@/app/api/onboarding/actions";

const TOUR_ID = "demo-product-tour";

interface DemoTourProps {
  isSandbox: boolean;
  quick?: boolean;
}

/**
 * DemoTour — auto-starts a guided walkthrough for sandbox/demo users.
 *
 * - Full tour: 16 steps covering every major feature
 * - Quick tour: 5 steps for returning users
 * - Only runs once per user (tracked via onboarding progress API)
 * - Can be re-triggered via the "Take a Tour" button in the guide toggle
 */
export function DemoTour({ isSandbox, quick = false }: DemoTourProps) {
  const [run, setRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isQuick, setIsQuick] = useState(quick);

  const steps: Step[] = isQuick ? demoQuickTourSteps : demoProductTourSteps;

  const startTour = useCallback(async () => {
    try {
      await startOnboardingTour(TOUR_ID);
    } catch {
      // Best-effort
    }
    setRun(true);
  }, []);

  useEffect(() => {
    setMounted(true);

    if (!isSandbox) {
      setLoading(false);
      return;
    }

    // Check if user has already completed the full tour
    async function checkProgress() {
      try {
        const progress = await getOnboardingProgress(TOUR_ID);
        if (!progress || progress.status !== "completed") {
          // Auto-start tour for new sandbox users
          await startTour();
        }
      } catch {
        // If API unavailable, start tour anyway
        setRun(true);
      } finally {
        setLoading(false);
      }
    }

    // Delay slightly to let the dashboard render first
    const timer = setTimeout(checkProgress, 1000);

    // Listen for restart events from guide toggle
    const handleRestart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsQuick(detail?.quick ?? false);
      setRun(false);
      setTimeout(() => setRun(true), 150);
    };
    window.addEventListener("__restartDemoTour", handleRestart);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("__restartDemoTour", handleRestart);
    };
  }, [isSandbox, startTour]);

  const handleCallback = async (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      try {
        await completeOnboardingTour(TOUR_ID);
      } catch {
        // Best-effort
      }
      setRun(false);
    }
  };

  // Expose a way to restart the tour
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__restartDemoTour = (quick?: boolean) => {
        setRun(false);
        // Small delay to allow state reset
        setTimeout(() => {
          const event = new CustomEvent("__restartDemoTour", { detail: { quick } });
          window.dispatchEvent(event);
        }, 100);
      };
    }
  }, []);

  if (!mounted || loading || !run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      disableCloseOnEsc={false}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#22855A",
          backgroundColor: "#0b1120",
          textColor: "#e2e8f0",
          overlayColor: "rgba(0, 0, 0, 0.5)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#22855A",
          color: "#fff",
          fontSize: "13px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#94a3b8",
          fontSize: "13px",
        },
        buttonSkip: {
          color: "#94a3b8",
          fontSize: "13px",
        },
        tooltipTitle: {
          fontSize: "15px",
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: "13px",
          lineHeight: "1.5",
        },
      }}
      callback={handleCallback}
    />
  );
}
