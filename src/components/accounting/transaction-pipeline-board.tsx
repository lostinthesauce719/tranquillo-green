import Link from "next/link";
import { AccountingStatusBadge } from "@/components/accounting/accounting-status-badge";
import type { DemoPipelineCard, DemoPipelinePriority, DemoPipelineStage } from "@/lib/demo/accounting-close";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function priorityTone(priority: DemoPipelinePriority) {
  switch (priority) {
    case "critical":
      return "rose" as const;
    case "high":
      return "amber" as const;
    case "normal":
      return "slate" as const;
  }
}

function stageToneClass(stage: DemoPipelineStage["tone"]) {
  switch (stage) {
    case "blue":
      return "border-blue-500/20 bg-blue-500/5";
    case "amber":
      return "border-amber-500/20 bg-amber-500/5";
    case "violet":
      return "border-violet-500/20 bg-violet-500/5";
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/5";
  }
}

function ownerCue(card: DemoPipelineCard) {
  return `${card.owner} → ${card.reviewer}`;
}

export function TransactionPipelineBoard({
  stages,
  source = "demo",
}: {
  stages: DemoPipelineStage[];
  source?: "demo" | "convex";
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface-mid px-4 py-3 text-sm text-text-muted">
        Pipeline source: {source === "convex" ? "persisted import jobs and transactions with live promotion state" : "demo-safe fallback data with no persisted writes"}. Use this board to explain what is still stuck in imports versus what is ready for accounting release.
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {stages.map((stage) => (
          <section key={stage.id} className={`rounded-2xl border p-5 ${stageToneClass(stage.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-accent">{stage.label}</div>
                <h2 className="mt-2 text-xl font-semibold">{stage.cards.length} items</h2>
                <p className="mt-2 text-sm text-text-muted">{stage.description}</p>
              </div>
              <AccountingStatusBadge label={stage.actionLabel} tone={stage.tone} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Amount</div>
                <div className="mt-2 text-lg font-semibold">{currencyFormatter.format(stage.totalAmount)}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Blockers</div>
                <div className="mt-2 text-lg font-semibold">{stage.blockerCount}</div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-4 xl:items-start">
        {stages.map((stage) => (
          <section key={`${stage.id}-cards`} className="rounded-2xl border border-border bg-surface-mid p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="font-medium text-text-primary">{stage.label}</div>
                <div className="mt-1 text-xs text-text-muted">{stage.actionLabel}</div>
              </div>
              <AccountingStatusBadge label={`${stage.cards.length} cards`} tone={stage.tone} />
            </div>
            <div className="mt-4 space-y-3">
              {stage.cards.map((card) => (
                <article key={card.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-text-primary">{card.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">{card.reference} • {card.source}</div>
                    </div>
                    <AccountingStatusBadge label={`${card.priority} priority`} tone={priorityTone(card.priority)} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-text-muted">
                    <div className="flex items-center justify-between gap-3">
                      <span>Amount</span>
                      <span className="font-medium text-text-primary">{currencyFormatter.format(card.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Owner / reviewer</span>
                      <span>{ownerCue(card)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Period / location</span>
                      <span>{card.periodLabel} • {card.location}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Queue age</span>
                      <span>{card.ageLabel}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-text-muted">Support cue</div>
                    <div className="mt-2 text-sm text-text-primary">{card.supportLabel}</div>
                    {card.blocker ? <div className="mt-2 text-sm text-amber-200">Blocker: {card.blocker}</div> : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 px-3 py-3 text-sm text-text-primary">
                    Next action: {card.nextAction}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={card.linkHref} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-primary transition hover:bg-surface-mid">
                      Open workspace
                    </Link>
                    <span className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
                      Owner: {card.owner}
                    </span>
                    <span className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-muted">
                      Reviewer: {card.reviewer}
                    </span>
                  </div>
                </article>
              ))}
              {stage.cards.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-text-muted">No cards in this stage for the current demo period. This is a healthy empty state rather than a loading failure.</div> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
