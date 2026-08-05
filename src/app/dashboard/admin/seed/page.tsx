"use client";

import { useState } from "react";

export default function SeedPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      // Call local API route that proxies to Convex
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-type": "application/json" },
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 text-text-primary">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="font-semibold text-amber-200">Dev Tool: Seed Demo Data</div>
          <div className="mt-1 text-sm text-amber-100/80">
            This seeds the &quot;Golden State Greens, LLC&quot; demo org with all sample data.
            Use this once to populate Convex, then navigate to the dashboard.
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent/80 disabled:opacity-50"
        >
          {loading ? "Seeding..." : "Seed California Operator Demo"}
        </button>

        {result && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 font-semibold">{result.error ? "Error" : "Success"}</div>
            <pre className="overflow-auto rounded-lg bg-black/50 p-4 text-sm text-text-muted">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 space-y-2 text-sm text-text-muted">
          <div>After seeding, visit:</div>
          <a href="/dashboard" className="block text-accent hover:underline">→ Dashboard Overview</a>
        </div>
      </div>
    </div>
  );
}
