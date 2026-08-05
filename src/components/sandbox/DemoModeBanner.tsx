"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowUpRight, X, Clock, Shield, Zap } from "lucide-react";

interface DemoStatus {
  isDemo: boolean;
  daysRemaining: number | null;
  expiresAt: string | null;
}

interface DemoModeBannerProps {
  companyId: string;
}

/**
 * DemoModeBanner — prominent top-of-app banner for sandbox/demo users.
 * Shows:
 *   - Demo mode indicator with sparkle icon
 *   - Days remaining countdown
 *   - "What's in your demo" expandable section
 *   - Upgrade CTA button
 *   - Dismissible (but reappears on new session)
 */
export function DemoModeBanner({ companyId }: DemoModeBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    // Check session storage for dismissed state
    const isDismissed = sessionStorage.getItem("demo-banner-dismissed");
    if (isDismissed) setDismissed(true);

    fetch(`/api/sandbox/status/${companyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.isSandbox) {
          setStatus({ isDemo: true, daysRemaining: data.daysRemaining, expiresAt: data.expiresAt });
        }
      })
      .catch(console.error);
  }, [companyId]);

  if (!status?.isDemo || dismissed) return null;

  const isUrgent = status.daysRemaining !== null && status.daysRemaining <= 3;

  const handleDismiss = () => {
    sessionStorage.setItem("demo-banner-dismissed", "true");
    setDismissed(true);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/sandbox/upgrade/${companyId}`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className={`border-b ${isUrgent ? "bg-amber-900/20 border-amber-500/30" : "bg-emerald-900/20 border-emerald-500/30"}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Demo indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-300">Demo Mode</span>
                {status.daysRemaining !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isUrgent ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/10 text-emerald-400"}`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted truncate">
                Exploring with sample data from Green Cross Dispensary, Denver CO
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1"
            >
              {showDetails ? "Hide details" : "What's in my demo?"}
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowUpRight className="w-3 h-3" />
              {upgrading ? "Upgrading..." : "Upgrade to Production"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-text-muted hover:text-text-secondary transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-emerald-500/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, label: "100+ transactions", desc: "POS, bank, manual" },
                { icon: <Shield className="w-3.5 h-3.5" />, label: "3 locations", desc: "Multi-entity ready" },
                { icon: <Clock className="w-3.5 h-3.5" />, label: "6 months data", desc: "Jan–Jun 2025" },
                { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Full features", desc: "280E, Metrc, CPA export" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-emerald-500/5 rounded-lg px-3 py-2">
                  <span className="text-emerald-400">{item.icon}</span>
                  <div>
                    <div className="text-text-primary font-medium">{item.label}</div>
                    <div className="text-text-muted">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-text-muted bg-emerald-500/5 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                This is a fully functional sandbox. When you're ready to go live, click "Upgrade to Production" to import your own data. Your demo data can be preserved or cleared.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
