/**
 * Acknowledgement gate for contestable tax positions.
 *
 * Design intent
 * -------------
 * Two different failures are handled two different ways:
 *
 *   Arithmetic that does not reconcile  → refused outright, no override.
 *     An allocation that creates or destroys value is a bug. There is no
 *     circumstance in which a user should be able to push past it.
 *     See assertAllocationIntegrity() in allocationEngine.ts.
 *
 *   A position that is permitted but contestable → allowed, but must be
 *     acknowledged by typing "understand" before it leaves the building.
 *     Examples: a reseller using a production basis (Reg. 1.471-3(b),
 *     Harborside), a flat percentage with no measured basis, an entity with no
 *     IRC 471 classification.
 *
 * The gate applies at FILING and CPA HANDOFF only — not while categorising
 * costs day to day. The point is that a person consciously affirms a position
 * at the moment it becomes an external assertion.
 *
 * This mirrors the Product Doctrine: automation prepares and packages, humans
 * approve material decisions, and every override is recorded with an actor,
 * a timestamp and a reason.
 */

/** The exact word an operator must type. Compared case-insensitively, trimmed. */
export const ACKNOWLEDGEMENT_PHRASE = "understand";

export interface BlockingWarning {
  code: string;
  message: string;
  /** Where the warning came from, e.g. an allocation id. */
  sourceId?: string;
}

export class AcknowledgementRequiredError extends Error {
  readonly warnings: BlockingWarning[];
  readonly requiredPhrase = ACKNOWLEDGEMENT_PHRASE;

  constructor(warnings: BlockingWarning[]) {
    super(
      `This submission asserts ${warnings.length} contestable tax ` +
        `position${warnings.length === 1 ? "" : "s"}. Review ${
          warnings.length === 1 ? "it" : "them"
        }, then type "${ACKNOWLEDGEMENT_PHRASE}" to confirm you accept ` +
        `responsibility for ${warnings.length === 1 ? "it" : "them"}.`
    );
    this.name = "AcknowledgementRequiredError";
    this.warnings = warnings;
  }
}

/** True when the supplied text is a valid acknowledgement. */
export function isAcknowledged(input: unknown): boolean {
  return (
    typeof input === "string" &&
    input.trim().toLowerCase() === ACKNOWLEDGEMENT_PHRASE
  );
}

/**
 * Gate a filing or handoff.
 *
 * Throws AcknowledgementRequiredError when there are contestable positions and
 * the operator has not typed the phrase. Returns an audit record to persist
 * when they have.
 */
export function requireAcknowledgement(params: {
  warnings: BlockingWarning[];
  acknowledgement?: unknown;
  actor: string;
}): {
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  acknowledgedWarnings?: BlockingWarning[];
} {
  const { warnings, acknowledgement, actor } = params;

  if (warnings.length === 0) {
    return { acknowledged: false };
  }

  if (!isAcknowledged(acknowledgement)) {
    throw new AcknowledgementRequiredError(warnings);
  }

  return {
    acknowledged: true,
    acknowledgedAt: Date.now(),
    acknowledgedBy: actor,
    // Record exactly what was acknowledged. An acknowledgement of one set of
    // warnings must not silently cover a different set later.
    acknowledgedWarnings: warnings,
  };
}

/**
 * Collect unacknowledged warnings across a set of allocation records.
 * Used by export/filing paths to decide whether the gate applies.
 */
export function gatherBlockingWarnings(
  allocations: Array<{
    _id?: string;
    warnings?: Array<{ code: string; message: string }>;
    requiresAcknowledgement?: boolean;
    acknowledgedAt?: number;
  }>
): BlockingWarning[] {
  const out: BlockingWarning[] = [];
  for (const a of allocations) {
    if (!a?.requiresAcknowledgement) continue;
    if (a.acknowledgedAt) continue; // already affirmed
    for (const w of a.warnings ?? []) {
      out.push({ code: w.code, message: w.message, sourceId: a._id });
    }
  }
  return out;
}
