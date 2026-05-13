"use client";

import { useState, useEffect } from "react";
import { connectMetrc, syncMetrc, getMetrcStatus } from "@/app/api/metrc/actions";
import type { MetrcSyncResult } from "@/lib/integrations/metrc-client";
import { MetrcCSVImport } from "@/components/metrc/metrc-csv-import";

const METRC_STATES = ["CA", "CO", "MI", "MA", "OR", "IL", "NV", "MD"];

type BadgeProps = { children: React.ReactNode; className?: string };

function Badge({ children, className }: BadgeProps) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function MetrcConnectPanel({ companyId }: { companyId: string }) {
  const [integratorKey, setIntegratorKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [state, setState] = useState("CO");
  const [sandbox, setSandbox] = useState(true);
  const [connected, setConnected] = useState(false);
  const [facilityName, setFacilityName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<MetrcSyncResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  async function handleConnect() {
    if (!integratorKey.trim() || !userKey.trim()) {
      setFeedback("Both API keys are required");
      return;
    }
    if (!licenseNumber.trim()) {
      setFeedback("License number is required");
      return;
    }
    setConnecting(true);
    setFeedback(null);
    try {
      const result = await connectMetrc({
        companyId,
        integratorKey: integratorKey.trim(),
        userKey: userKey.trim(),
        licenseNumber: licenseNumber.trim(),
        state,
        sandbox,
      });
      if (result.success) {
        setConnected(true);
        setFacilityName(result.facilityName ?? null);
        setFeedback("Connected successfully!");
      } else {
        setFeedback(result.error ?? "Connection failed");
      }
    } catch (e: any) {
      setFeedback(e.message);
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setFeedback(null);
    try {
      const result = await syncMetrc({
        companyId,
        state,
        sandbox,
        integratorKey: integratorKey.trim() || undefined,
        userKey: userKey.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
      });
      setSyncResult(result);
      if (result.success) {
        setFeedback(`Synced ${result.packages} packages — ${result.discrepancies.length} discrepancies found`);
      } else {
        setFeedback(result.error ?? "Sync failed");
      }
    } catch (e: any) {
      setFeedback(e.message);
    } finally {
      setSyncing(false);
    }
  }

  const feedbackColor = feedback
    ? feedback.includes("success") || feedback.includes("Synced")
      ? "bg-emerald-500/10 text-emerald-300"
      : feedback.includes("disconnected")
        ? "bg-amber-500/10 text-amber-300"
        : "bg-red-500/10 text-red-300"
    : "";

  // Load initial connection status
  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await getMetrcStatus({ companyId });
        setConnected(status.connected);
        setFacilityName(status.facilityName ?? null);
      } catch (e) {
        console.error("Failed to load Metrc status", e);
      }
    }
    loadStatus();
  }, [companyId]);

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-text-primary">Metrc</div>
          <div className="mt-1 text-xs text-text-muted">
            California seed-to-sale tracking — {connected ? (facilityName ?? "Connected") : "Accounting sync — connect your Metrc API keys"}
          </div>
        </div>
        {connected ? (
          <Badge className="bg-emerald-500/20 text-emerald-300">Connected</Badge>
        ) : (
          <Badge className="bg-neutral-500/20 text-neutral-300">Not Connected</Badge>
        )}
      </div>

      {/* Connection Form */}
      {!connected && (
        <div className="space-y-3">
          {/* Sandbox Toggle */}
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded border-border bg-surface-mid"
            />
            Sandbox mode (demo / test credentials)
          </label>

          {/* API Keys */}
          <div className="relative">
            <label className="mb-1 block text-xs text-text-muted">Integrator API Key</label>
            <input
              type={showKeys ? "text" : "password"}
              value={integratorKey}
              onChange={(e) => setIntegratorKey(e.target.value)}
              placeholder="VBHGlQlYwHMm0WSvI75bbXEHPCYJ3kjty..."
              className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
          </div>
          <div className="relative">
            <label className="mb-1 block text-xs text-text-muted">User API Key</label>
            <input
              type={showKeys ? "text" : "password"}
              value={userKey}
              onChange={(e) => setUserKey(e.target.value)}
              placeholder="Generate from Metrc sandbox user profile"
              className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">License Number</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. 402-00001"
              className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
          </div>

          {/* State selector */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
            >
              {METRC_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Show/Hide keys */}
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            {showKeys ? "Hide keys" : "Show keys"}
          </button>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green transition hover:bg-brand-green/20 disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect to Metrc"}
          </button>
        </div>
      )}

      {/* Connected State — Sync Controls */}
      {connected && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
            <button
              onClick={() => {
                setConnected(false);
                setFacilityName(null);
                setSyncResult(null);
                setFeedback("Disconnected");
              }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Disconnect
            </button>
          </div>

          {/* CSV Import — Manual data entry via CSV file */}
          <MetrcCSVImport />

          {/* Last Sync Info */}
          {syncResult && (
            <div className="rounded-lg border border-border bg-surface-mid p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-block h-2 w-2 rounded-full ${syncResult.success ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className="text-text-muted">
                  Source: {syncResult.source === "demo" ? "Sandbox" : "Metrc Live"} |
                  Packages: {syncResult.packages} |
                  Movements: {syncResult.movements}
                </span>
              </div>

              {/* Discrepancies */}
              {syncResult.discrepancies.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-accent">Discrepancies:</div>
                  {syncResult.discrepancies.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{d.type === "short" ? "⚠️" : "📦"}</span>
                      <span className="font-mono">{d.packageTag.slice(-8)}...</span>
                      <span>Metrc: {d.metrcQty} | Book: {d.bookQty}</span>
                      <span className={d.type === "short" ? "text-red-400" : "text-amber-400"}>
                        ({d.type === "short" ? "-" : "+"}{d.variance})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Detail Log */}
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {syncResult.details.map((line, i) => (
                  <div key={i} className="text-[10px] text-text-muted font-mono">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${feedbackColor}`}>
          {feedback}
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
