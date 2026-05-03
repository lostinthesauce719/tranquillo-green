"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, ArrowUpRight } from "lucide-react";

interface SandboxStatus {
  isSandbox: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  expiresAt: string | null;
}

interface SandboxBannerProps {
  companyId: string;
}

/**
 * SandboxBanner — top-of-app notice showing sandbox status and upgrade CTA.
 * Shows:
 *   - "Sandbox Mode" badge (amber)
 *   - Days remaining countdown (if not expired)
 *   - Upgrade button (links to billing)
 *   - Warning message if <3 days remaining
 */
export function SandboxBanner({ companyId }: SandboxBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SandboxStatus | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch(`/api/sandbox/status/${companyId}`)
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error);
  }, [companyId]);

  if (!status?.isSandbox) return null;

  if (status.isExpired) {
    return (
      <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-red-300">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Sandbox expired</span>
            <span>— Your 14-day trial has ended.&nbsp;</span>
            <Link href="/pricing" className="text-accent hover:text-accent/80 underline">
              Upgrade to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = status.daysRemaining !== null && status.daysRemaining <= 3;

  return (
    <div className={`${isUrgent ? "bg-amber-900/20 border-amber-500/30" : "bg-accent/10 border-accent/30"} border-b px-4 py-2`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Badge variant="neutral" className="border-amber-500/50 bg-amber-900/30 text-amber-200">
            Sandbox Mode
          </Badge>
          <span className="text-text-muted">
            {status.daysRemaining !== null
              ? `${status.daysRemaining} day${status.daysRemaining === 1 ? "" : "s"} remaining`
              : "Active sandbox"}
            {status.expiresAt && (
              <span className="text-text-faint ml-1">
                (expires {new Date(status.expiresAt).toLocaleDateString()})
              </span>
            )}
          </span>
        </div>

        <Button
          size="sm"
          onClick={async () => {
            setUpgrading(true);
            try {
              const res = await fetch(`/api/sandbox/upgrade/${companyId}`, { method: "POST" });
              if (res.ok) {
                router.refresh(); // Refresh to clear banner
              }
            } catch (e) {
              console.error(e);
            } finally {
              setUpgrading(false);
            }
          }}
          disabled={upgrading}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          <ArrowUpRight className="w-3 h-3 mr-1.5" />
          {upgrading ? "Upgrading…" : "Upgrade to Production"}
        </Button>
      </div>
    </div>
  );
}

