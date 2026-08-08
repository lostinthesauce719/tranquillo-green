"use client";

/**
 * Sandbox entry point.
 *
 * The page existed with a "Start Free Demo" button linking to /auth and a "View
 * Public Demo" button linking to /dashboard. Neither created anything. The
 * backend to mint a sandbox tenant — createSandboxTenant, a 500-line seed, the
 * expiry banners, the upgrade path — was all present and nothing invoked it.
 *
 * (It also would not have worked: the seed had six schema violations and
 * referenced a company ID it had thrown away. Fixed alongside this.)
 *
 * Deliberately not linked from the landing page yet. The sandbox is a real
 * tenant reading live data, so it is only as honest as the pages it renders —
 * and several still show fixtures. This route works for anyone who knows it
 * exists; publishing the button is a separate decision for when those pages
 * are done.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

type BusinessType = "dispensary" | "cultivator" | "manufacturer";

const TYPES: { key: BusinessType; label: string; blurb: string }[] = [
  { key: "dispensary", label: "Dispensary", blurb: "Retail storefront, Denver CO" },
  { key: "cultivator", label: "Cultivation", blurb: "Grow operation, square-footage basis" },
  { key: "manufacturer", label: "Manufacturing", blurb: "Extraction and processing" },
];

export default function SandboxPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const createSandbox = useMutation(api.sandbox.createSandboxTenant);

  const [businessType, setBusinessType] = useState<BusinessType>("dispensary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setBusy(true);
    try {
      const res: any = await createSandbox({ businessType });
      if (res?.companyId) router.push("/dashboard");
      else setError("The sandbox was not created. Nothing has been changed.");
    } catch (e: any) {
      // Say what actually failed. A demo that silently does nothing is how the
      // rest of this feature stayed broken for so long.
      setError(e?.message ?? String(e));
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-text-primary">Tranquillo Green sandbox</h1>
          <p className="text-lg text-text-muted">
            A working company with six months of books, run through the real 280E
            engine. Nothing here is pre-computed — the allocations, the
            percentages and the support schedule are produced from the sample
            data when you create it.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setBusinessType(t.key)}
              className={`rounded-xl border p-4 text-left transition ${
                businessType === t.key
                  ? "border-accent/50 bg-accent/10"
                  : "border-border bg-surface hover:bg-surface/70"
              }`}
            >
              <div className="font-semibold text-text-primary">{t.label}</div>
              <div className="mt-1 text-xs text-text-muted">{t.blurb}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted">
          <div className="font-medium text-text-primary">What gets created</div>
          <ul className="mt-2 space-y-1">
            <li>· A company with measured bases — 5,200 of 8,000 sq ft in production</li>
            <li>· 18 accounts, 100 products, six months of sales and vendor invoices</li>
            <li>· A 471(c) election, tax profile and Colorado rates</li>
            <li>· The 280E engine run over the books, including the costs it refuses</li>
          </ul>
          <p className="mt-3 text-xs">
            Expires after 14 days. It is a normal tenant, isolated from every
            other company, and can be upgraded rather than recreated.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="text-sm font-semibold text-rose-200">Could not create the sandbox</div>
            <p className="mt-1 text-sm text-rose-200/80">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {!isLoaded ? (
            <div className="h-12 w-48 animate-pulse rounded-xl bg-white/5" />
          ) : isSignedIn ? (
            <button
              onClick={start}
              disabled={busy}
              className="rounded-xl bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {busy ? "Building your sandbox…" : "Create sandbox company"}
            </button>
          ) : (
            <Link
              href="/sign-in?redirect_url=/sandbox"
              className="rounded-xl bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand/90"
            >
              Sign in to create a sandbox
            </Link>
          )}
          <Link
            href="/"
            className="rounded-xl border border-border px-6 py-3 text-text-primary transition hover:bg-surface-raised"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
