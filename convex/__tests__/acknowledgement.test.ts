/**
 * Acknowledgement gate — tests.
 *
 * Two distinct behaviours, deliberately different:
 *
 *   Arithmetic that does not reconcile → refused, no override available.
 *   A contestable tax position         → permitted, but must be acknowledged
 *                                        by typing "understand" at filing or
 *                                        CPA handoff.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ACKNOWLEDGEMENT_PHRASE,
  AcknowledgementRequiredError,
  isAcknowledged,
  requireAcknowledgement,
  gatherBlockingWarnings,
} from "../lib/acknowledgement";
import { assertAllocationIntegrity, collectAllocationWarnings } from "../allocationEngine";

/* ─── Arithmetic is never overridable ────────────────────────────────────── */

describe("assertAllocationIntegrity — no override", () => {
  it("accepts an allocation that reconciles", () => {
    assert.doesNotThrow(() => assertAllocationIntegrity(1000, 300, 700));
  });

  it("tolerates a cent of rounding drift on repeating decimals", () => {
    assert.doesNotThrow(() => assertAllocationIntegrity(1000, 333.33, 666.67));
  });

  it("refuses an allocation that does not sum to the cost", () => {
    assert.throws(
      () => assertAllocationIntegrity(1000, 300, 500),
      /does not reconcile/
    );
  });

  it("refuses negative amounts", () => {
    assert.throws(() => assertAllocationIntegrity(1000, -100, 1100), /negative/);
  });

  it("refuses non-finite amounts", () => {
    assert.throws(
      () => assertAllocationIntegrity(1000, Number.NaN, 1000),
      /non-finite/
    );
    assert.throws(
      () => assertAllocationIntegrity(1000, Number.POSITIVE_INFINITY, 0),
      /non-finite/
    );
  });

  it("there is no acknowledgement path around broken arithmetic", () => {
    // The gate takes warnings, not integrity failures. Bad maths cannot be
    // typed past — by design.
    assert.throws(() => assertAllocationIntegrity(1000, 900, 900), /does not reconcile/);
  });
});

/* ─── Warning collection ─────────────────────────────────────────────────── */

describe("collectAllocationWarnings", () => {
  it("flags a reseller using a production basis", () => {
    const w = collectAllocationWarnings({
      method: "square_footage",
      inventoryRole: "reseller",
      confidence: 85,
    });
    assert.ok(w.some((x) => x.code === "reseller_production_basis"));
  });

  it("does not flag a producer using a production basis", () => {
    const w = collectAllocationWarnings({
      method: "square_footage",
      inventoryRole: "producer",
      confidence: 85,
    });
    assert.equal(w.length, 0, "the expected case should be silent");
  });

  it("flags a missing IRC 471 classification", () => {
    const w = collectAllocationWarnings({ method: "custom", confidence: 85 });
    assert.ok(w.some((x) => x.code === "inventory_role_unset"));
  });

  it("flags flat methods as unmeasured regardless of classification", () => {
    for (const method of ["flat_percentage", "flat_amount"] as const) {
      const w = collectAllocationWarnings({
        method,
        inventoryRole: "producer",
        confidence: 40,
      });
      assert.ok(
        w.some((x) => x.code === "unmeasured_basis"),
        `${method} should warn that the basis is unmeasured`
      );
    }
  });

  it("flags low confidence", () => {
    const w = collectAllocationWarnings({
      method: "custom",
      inventoryRole: "producer",
      confidence: 55,
    });
    assert.ok(w.some((x) => x.code === "low_confidence"));
  });
});

/* ─── The gate ───────────────────────────────────────────────────────────── */

const WARN = [{ code: "reseller_production_basis", message: "contestable" }];

describe("requireAcknowledgement", () => {
  it("passes straight through when there is nothing to acknowledge", () => {
    const r = requireAcknowledgement({ warnings: [], actor: "user_1" });
    assert.equal(r.acknowledged, false);
  });

  it("blocks when warnings exist and nothing was typed", () => {
    assert.throws(
      () => requireAcknowledgement({ warnings: WARN, actor: "user_1" }),
      AcknowledgementRequiredError
    );
  });

  it("blocks when the wrong word was typed", () => {
    for (const bad of ["ok", "yes", "understood", "I understand", "", "  "]) {
      assert.throws(
        () =>
          requireAcknowledgement({
            warnings: WARN,
            acknowledgement: bad,
            actor: "user_1",
          }),
        AcknowledgementRequiredError,
        `"${bad}" must not be accepted`
      );
    }
  });

  it("accepts the exact phrase, case-insensitively and trimmed", () => {
    for (const good of ["understand", "UNDERSTAND", " Understand "]) {
      const r = requireAcknowledgement({
        warnings: WARN,
        acknowledgement: good,
        actor: "user_1",
      });
      assert.equal(r.acknowledged, true, `"${good}" should be accepted`);
    }
  });

  it("records who acknowledged, when, and exactly what", () => {
    const r = requireAcknowledgement({
      warnings: WARN,
      acknowledgement: ACKNOWLEDGEMENT_PHRASE,
      actor: "user_42",
    });
    assert.equal(r.acknowledgedBy, "user_42");
    assert.ok(typeof r.acknowledgedAt === "number");
    assert.deepEqual(
      r.acknowledgedWarnings,
      WARN,
      "the specific positions accepted must be recorded, not just a flag"
    );
  });

  it("surfaces the warnings and the required phrase on the error", () => {
    try {
      requireAcknowledgement({ warnings: WARN, actor: "user_1" });
      assert.fail("should have thrown");
    } catch (e: any) {
      assert.equal(e.requiredPhrase, ACKNOWLEDGEMENT_PHRASE);
      assert.deepEqual(e.warnings, WARN);
      assert.match(e.message, /understand/);
    }
  });

  it("isAcknowledged rejects non-strings", () => {
    for (const bad of [null, undefined, 1, true, {}]) {
      assert.equal(isAcknowledged(bad), false);
    }
  });
});

/* ─── Gathering across a filing ──────────────────────────────────────────── */

describe("gatherBlockingWarnings", () => {
  it("collects unacknowledged warnings across allocations", () => {
    const blocking = gatherBlockingWarnings([
      {
        _id: "alloc_1",
        requiresAcknowledgement: true,
        warnings: [{ code: "unmeasured_basis", message: "flat" }],
      },
      {
        _id: "alloc_2",
        requiresAcknowledgement: true,
        warnings: [{ code: "reseller_production_basis", message: "reseller" }],
      },
    ]);
    assert.equal(blocking.length, 2);
    assert.deepEqual(
      blocking.map((b) => b.sourceId),
      ["alloc_1", "alloc_2"],
      "each warning must be traceable to its allocation"
    );
  });

  it("skips allocations already acknowledged", () => {
    const blocking = gatherBlockingWarnings([
      {
        _id: "alloc_1",
        requiresAcknowledgement: true,
        acknowledgedAt: Date.now(),
        warnings: [{ code: "unmeasured_basis", message: "flat" }],
      },
    ]);
    assert.equal(blocking.length, 0);
  });

  it("skips allocations that raised no warnings", () => {
    const blocking = gatherBlockingWarnings([
      { _id: "alloc_1", requiresAcknowledgement: false, warnings: [] },
    ]);
    assert.equal(blocking.length, 0);
  });

  it("a filing with any unacknowledged position is blocked", () => {
    const allocations = [
      { _id: "a1", requiresAcknowledgement: false, warnings: [] },
      {
        _id: "a2",
        requiresAcknowledgement: true,
        warnings: [{ code: "reseller_production_basis", message: "x" }],
      },
    ];
    const blocking = gatherBlockingWarnings(allocations);
    assert.throws(
      () => requireAcknowledgement({ warnings: blocking, actor: "u" }),
      AcknowledgementRequiredError
    );
  });
});
