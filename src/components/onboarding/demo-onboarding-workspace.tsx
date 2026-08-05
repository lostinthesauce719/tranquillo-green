"use client";

import Link from "next/link";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { useTenantMaybe } from "@/lib/auth/tenant-context";
import {
  firstWinChecklist,
  onboardingMilestones,
  roleQuickstarts,
  workflowJourney,
  type FirstWinChecklistItem,
  type OnboardingMilestoneStatus,
} from "@/lib/demo/onboarding";

function statusClasses(status: OnboardingMilestoneStatus) {
  if (status === "complete") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "active") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-border bg-surface text-text-muted";
}

function statusLabel(status: OnboardingMilestoneStatus) {
  if (status === "complete") return "Complete";
  if (status === "active") return "In progress";
  return "Up next";
}

function ChecklistItem({ item }: { item: FirstWinChecklistItem }) {
  return (
    <Link
      href={item.href}
      className="rounded-2xl border border-border bg-surface p-4 transition hover:border-amber-500/30 hover:bg-surface/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-text-primary">{item.title}</div>
          <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusClasses(item.status)}`}>
          {statusLabel(item.status)}
        </span>
      </div>
      <div className="mt-3 text-xs uppercase tracking-[0.2em] text-accent">First win</div>
      <div className="mt-1 text-sm text-text-muted">{item.outcome}</div>
    </Link>
  );
}

export function DashboardWelcomePanel() {
  const tenant = useTenantMaybe();
  const activeRole = tenant?.role ?? "owner";
  const primaryQuickstart = roleQuickstarts.find((item) => item.role === activeRole) ?? roleQuickstarts[0];
  const checklistProgress = `${firstWinChecklist.filter((item) => item.status === "complete").length}/${firstWinChecklist.length}`;

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-brand/20 via-surface-mid to-surface p-6 shadow-2xl shadow-black/20">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-200">Guided certainty</div>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold">Welcome to the first-run path for a defensible cannabis close.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200/85">
            This demo-safe workspace is built to make Tranquillo Green understandable fast: start with intake,
            clear review blockers, confirm 280E logic, reconcile cash, and finish with a CPA-ready packet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/onboarding" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90">
              Open onboarding workspace
            </Link>
            <Link href="/dashboard/accounting/imports" className="rounded-xl border border-border bg-surface/70 px-5 py-3 text-sm font-semibold text-text-primary transition hover:bg-surface">
              Start with imports
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Milestones</div>
              <div className="mt-2 text-2xl font-semibold">{onboardingMilestones.length}</div>
              <div className="mt-1 text-sm text-slate-300/80">Structured from intake through handoff</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">First-win checklist</div>
              <div className="mt-2 text-2xl font-semibold">{checklistProgress}</div>
              <div className="mt-1 text-sm text-slate-300/80">Demo-ready tasks that explain the product quickly</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Current lens</div>
              <div className="mt-2 text-2xl font-semibold">{ROLE_LABELS[activeRole]}</div>
              <div className="mt-1 text-sm text-slate-300/80">Role-aware quickstart guidance is ready below</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-5">
          <div className="text-xs uppercase tracking-[0.25em] text-emerald-200">Recommended for {ROLE_LABELS[activeRole]}</div>
          <div className="mt-3 text-xl font-semibold">{primaryQuickstart.title}</div>
          <p className="mt-3 text-sm leading-6 text-slate-200/85">{primaryQuickstart.summary}</p>
          <ol className="mt-5 space-y-3 text-sm text-slate-100/90">
            <li>1. {primaryQuickstart.firstAction}</li>
            <li>2. {primaryQuickstart.secondAction}</li>
          </ol>
          <Link href={primaryQuickstart.href} className="mt-5 inline-flex rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20">
            Open role-based quickstart
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DemoOnboardingWorkspace() {
  const tenant = useTenantMaybe();
  const activeRole = tenant?.role ?? "owner";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-brand/15 via-surface-mid to-surface p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-amber-200">First-run workspace</div>
            <h2 className="mt-3 text-3xl font-semibold">A polished demo path from messy books to trusted handoff.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-text-muted">
              Use this sequence to orient a new customer, a founder, or an external accountant in under ten minutes.
              Every card links into a real workspace so the product story moves from certainty to proof.
            </p>
          </div>
          <Link href="/dashboard/accounting/imports" className="inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90">
            Begin the workflow
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Milestone tracker</div>
              <div className="mt-2 text-xl font-semibold">Close readiness in four deliberate moves</div>
            </div>
            <div className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">Demo-safe sequence</div>
          </div>
          <div className="mt-5 space-y-3">
            {onboardingMilestones.map((item, index) => (
              <Link key={item.title} href={item.href} className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-amber-500/30 hover:bg-surface/80">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-emerald-100">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusClasses(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    <div className="text-xs text-text-muted">{item.owner} • {item.eta}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Role-based quickstarts</div>
          <div className="mt-2 text-xl font-semibold">Pick the fastest path for each stakeholder</div>
          <div className="mt-4 space-y-3">
            {roleQuickstarts.map((item) => {
              const isActive = item.role === activeRole;
              return (
                <Link
                  key={item.role}
                  href={item.href}
                  className={`block rounded-2xl border p-4 transition ${isActive ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-surface hover:border-emerald-500/20 hover:bg-surface/80"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-text-primary">{item.title}</div>
                    {isActive ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                        Active role
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm text-text-muted">{item.summary}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.2em] text-accent">Start here</div>
                  <div className="mt-1 text-sm text-text-muted">{item.firstAction}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">First-win checklist</div>
            <div className="mt-2 text-xl font-semibold">Show one controlled victory in each critical workflow layer</div>
          </div>
          <div className="text-sm text-text-muted">Designed for a founder-demo-ready walkthrough</div>
        </div>
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {firstWinChecklist.map((item) => (
            <ChecklistItem key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Workflow map</div>
        <div className="mt-2 text-xl font-semibold">Import → review → allocate → reconcile → export</div>
        <div className="mt-5 grid gap-3 xl:grid-cols-5">
          {workflowJourney.map((step) => (
            <Link key={step.title} href={step.href} className="rounded-2xl border border-border bg-surface p-4 transition hover:border-violet-500/20 hover:bg-surface/80">
              <div className="text-xs uppercase tracking-[0.2em] text-violet-200">{step.eyebrow}</div>
              <div className="mt-2 text-lg font-semibold text-text-primary">{step.title}</div>
              <div className="mt-2 text-sm text-text-muted">{step.detail}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
