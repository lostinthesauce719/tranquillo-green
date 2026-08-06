
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link2, Unlink, RefreshCw, CheckCircle, XCircle } from "lucide-react";

type Provider = "square" | "toast" | "treez";

interface POSConnectPanelProps {
  provider: Provider;
  onSuccess?: () => void;
  onDisconnect?: () => void;
}

export function POSConnectPanel({ provider, onSuccess, onDisconnect }: POSConnectPanelProps) {
  const tenant = useTenant();

  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Check connection status on mount
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/api/pos/${provider}`;
      const res = await fetch(`${endpoint}?companyId=${tenant.companyId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const status = await res.json();
      if (status.connected) setIsConnected(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [provider, tenant.companyId]);

  const showMessage = (text: string, isError = false) => {
    setMessage({ text, error: isError });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = `/api/pos/${provider}`;
      const body: Record<string, any> = { action: "connect", companyId: tenant.companyId, sandbox: true };

      if (provider === "square") {
        body.accessToken = form.accessToken || "demo_token";
        body.refreshToken = form.refreshToken || "";
        body.merchantId = form.merchantId || "";
        body.locationId = form.locationId || "";
        body.sandbox = true;
      } else if (provider === "toast") {
        body.accessToken = form.accessToken || "demo_token";
        body.refreshToken = form.refreshToken || "";
        body.restaurantId = form.restaurantId || "";
        body.sandbox = true;
      } else if (provider === "treez") {
        body.apiKey = form.apiKey || "demo_key";
        body.apiSecret = form.apiSecret || "";
        body.sandbox = true;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Connection failed");

      showMessage(`${provider} connected successfully!`);
      setIsConnected(true);
      onSuccess?.();
    } catch (e: any) {
      showMessage(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const endpoint = `/api/pos/${provider}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          companyId: tenant.companyId,
          sandbox: true,
        }),
      });

      if (!res.ok) throw new Error("Sync failed");

      const result = await res.json();
      showMessage(`Sync complete – ${result.transactionsCreated} transactions imported.`);
    } catch (e: any) {
      showMessage(e.message, true);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = `/api/pos/${provider}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", companyId: tenant.companyId }),
      });
      if (!res.ok) throw new Error("Disconnect failed");

      showMessage(`${provider} disconnected.`);
      setIsConnected(false);
      onDisconnect?.();
    } catch (e: any) {
      showMessage(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Load status on mount
  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Local form state
  const [form, setForm] = useState<Record<string, string>>({
    accessToken: "",
    refreshToken: "",
    merchantId: "",
    locationId: "",
    apiKey: "",
    apiSecret: "",
    restaurantId: "",
  });

  const updateForm = (field: string, value: string) => setForm({ ...form, [field]: value });

    return (
    <div className="rounded-lg border p-6 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold capitalize">{provider} POS</h3>
          {isConnected && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Connected
            </span>
          )}
        </div>
        {isConnected && (
          <Button variant="secondary" size="sm" onClick={handleDisconnect} disabled={loading}>
            <Unlink className="h-4 w-4 mr-1" /> Disconnect
          </Button>
        )}
      </div>

      {message && (
        <div className={`text-sm ${message.error ? "text-destructive" : "text-green-700"} flex items-center gap-2`}>
          {message.error ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-3">
          {provider === "square" && (
            <>
              <div>
                <label className="text-sm font-medium">Square Access Token (leave empty for demo mode)</label>
                <Input name="accessToken" placeholder="Demo mode auto-filled" value={form.accessToken} onChange={(e) => updateForm("accessToken", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Merchant ID</label>
                <Input name="merchantId" placeholder="Optional" value={form.merchantId} onChange={(e) => updateForm("merchantId", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Location ID</label>
                <Input name="locationId" placeholder="Store location ID" value={form.locationId} onChange={(e) => updateForm("locationId", e.target.value)} />
              </div>
            </>
          )}

          {provider === "toast" && (
            <>
              <div>
                <label className="text-sm font-medium">Toast Auth Token</label>
                <Input name="accessToken" placeholder="Demo mode auto-filled" value={form.accessToken} onChange={(e) => updateForm("accessToken", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Restaurant ID</label>
                <Input name="restaurantId" placeholder="e.g. rest_12345" value={form.restaurantId} onChange={(e) => updateForm("restaurantId", e.target.value)} />
              </div>
            </>
          )}

          {provider === "treez" && (
            <>
              <div>
                <label className="text-sm font-medium">Treez API Key</label>
                <Input name="apiKey" placeholder="demo_key for sandbox" value={form.apiKey} onChange={(e) => updateForm("apiKey", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">API Secret</label>
                <Input name="apiSecret" type="password" placeholder="Enter secret" value={form.apiSecret} onChange={(e) => updateForm("apiSecret", e.target.value)} />
              </div>
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect {provider} (Demo)
          </Button>
          <p className="text-xs text-muted-foreground">
            Clicking Connect runs in sandbox mode with demo data.
          </p>
        </form>
      ) : (
        <div className="space-y-3">
          <Button onClick={handleSync} disabled={syncing} className="w-full">
            {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Recent Transactions
          </Button>
          <p className="text-xs text-muted-foreground">
            Import your latest sales. Demo mode inserts mock transactions.
          </p>
        </div>
      )}
    </div>
  );
}
