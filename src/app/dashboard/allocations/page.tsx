"use client";

/**
 * 280E Allocations — live.
 *
 * The page previously described itself, accurately: "All decisions are
 * demo-data-backed so operators can walk a real review workflow without live
 * backend dependencies." The backend dependencies exist and work.
 *
 * The queue was the least of it. Two things on this page were fabricated in a
 * way that could change what an operator files:
 *
 *   grossRevenue={25000000} and three years of invented gross receipts
 *   ($8.5M, $9.2M, $10.1M) were fed into the 471(c) eligibility test. That test
 *   is a legal determination — whether a business may elect out of the normal
 *   inventory rules under IRC 448(c). Every operator saw the same answer,
 *   computed from someone else's revenue, and it always came back eligible
 *   because $9.27M sits comfortably under the $32M threshold. An operator over
 *   the threshold was told they qualified when they do not, on the page that
 *   introduces the whole 471(c) position.
 *
 *   costDataFor471c invented $50k / $80k / $120k per cost category and showed
 *   the resulting "reclassification opportunity" as though it were theirs.
 *
 * Eligibility is now read from the company's recorded election. Where no
 * election exists, the page says so and links to where the real figures are
 * entered, rather than computing an answer from numbers nobody supplied.
 */

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AppShell } from "@/components/shell/app-shell";
import { LiveAllocationQueue } from "@/components/accounting/live-allocation-queue";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  getOperatorProfile,
  getCogsCategories,
  getNondeductibleCategories,
  getDefaultAllocationMethod,
} from "@/lib/operator-profiles";

const usd = (n: number) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * 471(c) status, from the company's own election record.
 *
 * Three honest states: no election on file, elected, or tested and ineligible.
 * None of them is computed from placeholder revenue.
 */
function Section471cStatus({ companyId }: { companyId: any }) {
  const election = useQuery(api.section471c.getElection, { companyId });

  if (election === undefined) {
    return <div className="h-32 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (election === null) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-300">IRC 471(c)</div>
        <h3 className="mt-2 text-lg font-semibold text-amber-100">No election on file</h3>
        <p className="mt-2 max-w-2xl text-sm text-amber-200/80">
          Whether this business can elect out of the normal inventory rules
          depends on its average gross receipts for the three prior tax years
          against the IRC 448(c) threshold. Nobody has entered those figures, so
          there is no eligibility answer to give — and until an election is
          recorded, the engine will not reclassify indirect costs into COGS.
        </p>
        <Link
          href="/dashboard/onboarding"
          className="mt-4 inline-block rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100 transition hover:bg-amber-500/20"
        >
          Enter gross receipts and test eligibility →
        </Link>
      </section>
    );
  }

  const eligible = election.eligible;
  const elected = election.elected;

  return (
    <section
      className={`rounded-2xl border p-5 ${
        elected && eligible
          ? "border-violet-500/20 bg-violet-500/5"
          : "border-rose-500/25 bg-rose-500/5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-violet-300">IRC 471(c)</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            elected ? "bg-violet-500/10 text-violet-300" : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {elected ? "Elected" : "Not elected"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            eligible ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {eligible ? "Eligible" : "Not eligible"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Average gross receipts
          </div>
          <div className="mt-1 text-lg font-semibold text-text-primary">
            {usd(election.averageGrossReceipts)}
          </div>
          <div className="text-xs text-text-muted">
            {election.priorYear3}–{election.priorYear1}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Election date</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">
            {election.electionDate ?? "—"}
          </div>
          <div className="text-xs text-text-muted">Tax year {election.taxYear ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Recorded by</div>
          <div className="mt-1 truncate text-sm text-text-primary">
            {election.electedBy ?? "—"}
          </div>
        </div>
      </div>

      {!eligible && (
        <p className="mt-3 text-sm text-rose-200/90">
          Average gross receipts exceed the IRC 448(c) threshold for this
          election year, so the small-business inventory method is not available.
          Indirect costs cannot be reclassified into COGS on this basis.
        </p>
      )}

      {elected && eligible && (
        <p className="mt-3 text-xs text-violet-200/80">
          Reclassifying indirect costs under 471(c) is a contested position. The
          IRS view in CCA 201504011 is that a 280E taxpayer must apply the
          1.471 regulations as they stood in 1982. Allocations taken on this
          basis carry that warning and require acknowledgement before a CPA
          handoff.
        </p>
      )}
    </section>
  );
}

export default function AllocationsPage() {
  const tenant = useTenant();
  const companyId = tenant.companyId as any;
  const operatorType = tenant.operatorType ?? "vertical";

  const profile = getOperatorProfile(operatorType);
  const cogsCategories = getCogsCategories(operatorType);
  const nondeductibleCategories = getNondeductibleCategories(operatorType);
  const defaultMethod = getDefaultAllocationMethod(operatorType);

  return (
    <AppShell
      title="280E Allocations"
      description="Every cost split between COGS and nondeductible, the measurement behind each split, and what still needs a decision. Built from your posted transactions."
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Section471cStatus companyId={companyId} />

        {/* Reference material for this operator type. Guidance, not figures. */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profile.icon}</span>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {profile.label} — allocation profile
              </div>
              <div className="text-xs text-text-muted">{profile.tagline}</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-surface p-3">
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Typical method for this operator type
            </div>
            <div className="mt-1 font-medium text-text-primary">{defaultMethod.name}</div>
            <div className="text-xs text-text-muted">{defaultMethod.description}</div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-xs uppercase tracking-wider text-emerald-400">
                Usually COGS ({cogsCategories.length})
              </div>
              <ul className="mt-1 space-y-0.5">
                {cogsCategories.map((c) => (
                  <li key={c.code} className="text-xs text-text-muted">
                    <span className="font-mono text-accent">{c.code}</span> {c.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-xs uppercase tracking-wider text-rose-400">
                Usually nondeductible ({nondeductibleCategories.length})
              </div>
              <ul className="mt-1 space-y-0.5">
                {nondeductibleCategories.map((c) => (
                  <li key={c.code} className="text-xs text-text-muted">
                    <span className="font-mono text-accent">{c.code}</span> {c.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Orientation for a typical {profile.label.toLowerCase()}, not a
            classification of your accounts. What actually happened to each cost
            is in the queue below.
          </p>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/allocations/policies"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Allocation policies
        </Link>
        <Link
          href="/dashboard/allocations/support-schedule"
          className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-100 transition hover:bg-violet-500/20"
        >
          280E support schedule
        </Link>
        <Link
          href="/dashboard/allocations/history"
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition hover:bg-surface/70"
        >
          Override history
        </Link>
      </div>

      {/*
        The "COGS Automation" panel is gone. Its two buttons posted to
        /api/automation/cogs, which falls back to a demo company slug and
        returns source: "demo" — so "Auto-approve ≥90%" reported approving
        allocations that were not the operator's own, and nothing in their books
        changed. Bulk-approving 280E positions is a reasonable feature and worth
        building against the real queue; a button that says it approved things
        and did not is not a feature.
      */}

      <div className="mt-6">
        <LiveAllocationQueue />
      </div>
    </AppShell>
  );
}
