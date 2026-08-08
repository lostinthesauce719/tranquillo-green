"use client";

/**
 * Acknowledgement gate — the point at which a contestable tax position leaves
 * the building.
 *
 * Shown before a filing or CPA handoff when the packet contains positions the
 * engine has flagged: a reseller using a production basis, a flat figure with no
 * measured basis, or an entity with no IRC 471 classification.
 *
 * Deliberately NOT a checkbox. Typing the word is a small amount of friction
 * that makes the affirmation conscious, and what gets recorded is who typed it,
 * when, and exactly which positions were shown at the time.
 *
 * Arithmetic that does not reconcile never reaches this component — the engine
 * refuses it outright and there is no override.
 */

import { useState } from "react";

export const ACKNOWLEDGEMENT_PHRASE = "understand";

export interface GateWarning {
  code: string;
  message: string;
  sourceId?: string;
}

/** Operator-facing titles. The engine's codes are not shown to users. */
const WARNING_TITLES: Record<string, string> = {
  reseller_production_basis: "You buy finished product, but costs are being spread like a producer",
  inventory_role_unset: "We don't know yet whether you make your product or buy it",
  unmeasured_basis: "A percentage was entered by hand rather than measured",
  low_confidence: "This allocation is a judgement call",
  section_471c_position: "This return relies on a contested reading of the rules",
};

export function AcknowledgementGate({
  warnings,
  onConfirm,
  onCancel,
  busy = false,
  actionLabel = "Generate CPA packet",
}: {
  warnings: GateWarning[];
  onConfirm: (phrase: string) => void;
  onCancel: () => void;
  busy?: boolean;
  actionLabel?: string;
}) {
  const [phrase, setPhrase] = useState("");
  const isValid = phrase.trim().toLowerCase() === ACKNOWLEDGEMENT_PHRASE;

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm text-amber-200"
        >
          !
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text-primary">
            Before this goes out, please read {warnings.length === 1 ? "this" : "these"}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {warnings.length === 1
              ? "This packet takes a position that the IRS may disagree with."
              : `This packet takes ${warnings.length} positions that the IRS may disagree with.`}{" "}
            They&apos;re allowed, and plenty of operators take them — but you should
            know you&apos;re taking them.
          </p>

          <ul className="mt-4 space-y-3">
            {warnings.map((w, i) => (
              <li
                key={`${w.code}-${w.sourceId ?? i}`}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="text-sm font-medium text-text-primary">
                  {WARNING_TITLES[w.code] ?? "Review this position"}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {w.message}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-border bg-surface-mid p-4">
            <label
              htmlFor="acknowledgement"
              className="block text-sm font-medium text-text-primary"
            >
              Type <span className="font-mono text-accent">understand</span> to
              confirm you accept responsibility for
              {warnings.length === 1 ? " this position" : " these positions"}
            </label>
            <input
              id="acknowledgement"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="understand"
              aria-describedby="acknowledgement-help"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <p id="acknowledgement-help" className="mt-2 text-xs text-text-faint">
              We record who confirmed this, when, and exactly what was shown here —
              so if it&apos;s ever questioned, the record exists.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-border bg-surface-mid px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-surface disabled:opacity-50"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => onConfirm(phrase)}
              disabled={!isValid || busy}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working…" : actionLabel}
            </button>
          </div>

          {phrase.length > 0 && !isValid && (
            <p className="mt-2 text-xs text-amber-200">
              Type the word exactly: <span className="font-mono">understand</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The one genuinely contested choice in the product, in plain language.
 * Mirrors SECTION_471C_POSITION_EXPLAINER on the server so the operator sees
 * the same account of it wherever it appears.
 */
export function Section471cExplainer() {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid p-5">
      <h4 className="text-sm font-semibold text-text-primary">
        Why this might be questioned
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        Electing 471(c) lets a smaller business follow its own books for
        inventory, and many cannabis operators use it to treat more costs as
        inventory — which lowers tax, because cost of goods sold isn&apos;t a
        deduction that 280E can disallow. The IRS disagrees with this reading. In
        a 2015 memo (CCA 201504011) it said businesses in your position must use
        the inventory rules as they stood in 1982, long before 471(c) existed.
        Accountants still take this position and courts haven&apos;t settled it.
        Taking it is reasonable and common; it isn&apos;t risk-free.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-text-muted">
        If you proceed, keep the measurements behind every allocation, apply the
        same method each year, and expect to explain it. Tranquillo Green saves
        the basis and the numbers behind each one, so that record exists.
      </p>
      <a
        href="https://www.irs.gov/pub/irs-wd/201504011.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-accent hover:text-accent/80"
      >
        Read the IRS memo →
      </a>
    </div>
  );
}
