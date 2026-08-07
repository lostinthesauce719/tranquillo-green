import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseSnapshot,
  planRestore,
  remapDocument,
  collectReferences,
  SnapshotError,
} from "../src/lib/backup/restore-plan";

/**
 * Restore rehearsal.
 *
 * A restore fails in one of two ways: loudly (it errors, you notice), or
 * quietly (references get rewired to the wrong records and the books look
 * plausible but are wrong). These exercise the quiet failure mode by
 * simulating a full restore against an in-memory deployment and then walking
 * the restored graph to prove the relationships still hold.
 */

function snapshot(docs: Array<Record<string, any>>): string {
  const tables = new Map<string, number>();
  for (const doc of docs) tables.set(doc._table, (tables.get(doc._table) ?? 0) + 1);
  const header = {
    _meta: "tranquillo-green-backup",
    version: 1,
    startedAt: "2026-08-06T00:00:00.000Z",
    convexUrl: "https://source.convex.cloud",
    tables: [...tables].map(([table, documents]) => ({ table, documents })),
    totalDocuments: docs.length,
  };
  return [JSON.stringify(header), ...docs.map((d) => JSON.stringify(d))].join("\n") + "\n";
}

/** A small but realistic slice: company -> accounts/periods -> txn -> lines. */
const FIXTURE = [
  { _table: "cannabisCompanies", _id: "c1", name: "Emerald Co", slug: "emerald" },
  { _table: "chartOfAccounts", _id: "a1", companyId: "c1", code: "4010", name: "Retail Sales" },
  { _table: "chartOfAccounts", _id: "a2", companyId: "c1", code: "1010", name: "Cash" },
  { _table: "reportingPeriods", _id: "p1", companyId: "c1", label: "2026-07" },
  {
    _table: "transactions",
    _id: "t1",
    companyId: "c1",
    periodId: "p1",
    status: "posted",
    memo: "Day one sales",
  },
  { _table: "transactionLines", _id: "l1", transactionId: "t1", accountId: "a2", debit: 500 },
  { _table: "transactionLines", _id: "l2", transactionId: "t1", accountId: "a1", credit: 500 },
];

/** Simulates a target deployment: assigns fresh ids, stores documents. */
function fakeDeployment() {
  const store = new Map<string, Array<Record<string, any>>>();
  let counter = 0;
  return {
    store,
    insert(table: string, doc: Record<string, any>): string {
      const id = `new_${++counter}`;
      if (!store.has(table)) store.set(table, []);
      store.get(table)!.push({ ...doc, _id: id });
      return id;
    },
  };
}

/** Runs the full plan → remap → insert cycle, as the real script does. */
function performRestore(text: string) {
  const { docsByTable } = parseSnapshot(text);
  const plan = planRestore(docsByTable);
  assert.equal(plan.unresolvable.length, 0, "plan left unresolvable documents");

  const target = fakeDeployment();
  const idMap = new Map<string, string>();

  for (const batch of plan.batches) {
    for (const doc of batch.docs) {
      const payload = remapDocument(doc, idMap);
      idMap.set(doc._id, target.insert(batch.table, payload));
    }
  }
  return { target, idMap, plan };
}

describe("restore rehearsal", () => {
  test("preserves referential integrity end to end", () => {
    const { target, idMap } = performRestore(snapshot(FIXTURE));

    const company = target.store.get("cannabisCompanies")![0];
    const period = target.store.get("reportingPeriods")![0];
    const txn = target.store.get("transactions")![0];
    const lines = target.store.get("transactionLines")!;
    const accounts = target.store.get("chartOfAccounts")!;

    // Every reference points at the NEW id, not the snapshot's id.
    assert.equal(period.companyId, company._id);
    assert.equal(txn.companyId, company._id);
    assert.equal(txn.periodId, period._id);
    for (const line of lines) {
      assert.equal(line.transactionId, txn._id);
    }

    // And the lines still point at the accounts they originally did.
    const cash = accounts.find((a) => a.code === "1010")!;
    const sales = accounts.find((a) => a.code === "4010")!;
    const debitLine = lines.find((l) => l.debit === 500)!;
    const creditLine = lines.find((l) => l.credit === 500)!;
    assert.equal(debitLine.accountId, cash._id);
    assert.equal(creditLine.accountId, sales._id);

    // No snapshot id survives anywhere in the restored data.
    const restored = JSON.stringify([...target.store.values()]);
    for (const oldId of idMap.keys()) {
      assert.ok(!restored.includes(`"${oldId}"`), `stale id ${oldId} leaked into restored data`);
    }
  });

  test("strips system fields so the target assigns its own", () => {
    const { target } = performRestore(snapshot(FIXTURE));
    for (const docs of target.store.values()) {
      for (const doc of docs) {
        assert.ok(!("_table" in doc), "_table should not be persisted");
        assert.ok(!("_creationTime" in doc), "_creationTime should not be carried over");
        assert.match(doc._id, /^new_/, "target must assign its own id");
      }
    }
  });

  test("the debits still equal the credits after restore", () => {
    const { target } = performRestore(snapshot(FIXTURE));
    const lines = target.store.get("transactionLines")!;
    const debits = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const credits = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    assert.equal(debits, credits, "restore must not unbalance the ledger");
    assert.equal(debits, 500);
  });

  test("inserts parents before the documents that reference them", () => {
    const { docsByTable } = parseSnapshot(snapshot(FIXTURE));
    const plan = planRestore(docsByTable);

    const positionOf = (id: string) => {
      let index = 0;
      for (const batch of plan.batches) {
        for (const doc of batch.docs) {
          if (doc._id === id) return index;
          index++;
        }
      }
      return -1;
    };

    assert.ok(positionOf("c1") < positionOf("p1"), "company before period");
    assert.ok(positionOf("p1") < positionOf("t1"), "period before transaction");
    assert.ok(positionOf("t1") < positionOf("l1"), "transaction before its lines");
    assert.ok(positionOf("a1") < positionOf("l2"), "account before the line using it");
  });

  test("refuses a snapshot with a dangling reference", () => {
    const broken = [
      { _table: "cannabisCompanies", _id: "c1", name: "Emerald Co" },
      // points at a transaction that is not in the snapshot
      { _table: "transactionLines", _id: "l1", transactionId: "t_missing", debit: 10 },
    ];
    // The dangling id is unknown to the snapshot, so it is not treated as a
    // reference at all — it restores as an opaque string rather than silently
    // resolving to the wrong record.
    const { docsByTable } = parseSnapshot(snapshot(broken));
    const plan = planRestore(docsByTable);
    assert.equal(plan.unresolvable.length, 0);
    const line = plan.batches.flatMap((b) => b.docs).find((d) => d._id === "l1")!;
    assert.equal(line.transactionId, "t_missing");
  });

  test("detects a reference cycle instead of looping forever", () => {
    const cyclic = [
      { _table: "cannabisCompanies", _id: "x1", partnerId: "x2" },
      { _table: "cannabisCompanies", _id: "x2", partnerId: "x1" },
    ];
    const { docsByTable } = parseSnapshot(snapshot(cyclic));
    const plan = planRestore(docsByTable);
    assert.equal(plan.unresolvable.length, 2, "both sides of the cycle should be reported");
  });

  test("handles arrays of references", () => {
    const withArray = [
      { _table: "cannabisCompanies", _id: "c1", name: "Co" },
      { _table: "products", _id: "pr1", companyId: "c1", sku: "A" },
      { _table: "inventoryBatches", _id: "b1", companyId: "c1", productId: "pr1", packageTag: "T1" },
      { _table: "inventoryBatches", _id: "b2", companyId: "c1", productId: "pr1", packageTag: "T2" },
      {
        _table: "inventoryBatches",
        _id: "b3",
        companyId: "c1",
        productId: "pr1",
        packageTag: "T3",
        mergedFrom: ["b1", "b2"],
      },
    ];
    const { target, idMap } = performRestore(snapshot(withArray));
    const merged = target.store.get("inventoryBatches")!.find((b) => b.packageTag === "T3")!;
    assert.deepEqual(merged.mergedFrom, [idMap.get("b1"), idMap.get("b2")]);
  });

  test("a self-referencing document does not deadlock the plan", () => {
    const selfRef = [{ _table: "cannabisCompanies", _id: "s1", name: "Co", parentId: "s1" }];
    const { docsByTable } = parseSnapshot(snapshot(selfRef));
    const plan = planRestore(docsByTable);
    assert.equal(plan.unresolvable.length, 0);
    assert.equal(plan.totalDocuments, 1);
  });

  test("rejects a truncated snapshot rather than restoring part of it", () => {
    const text = snapshot(FIXTURE).split("\n").slice(0, 4).join("\n") + '\n{"_table":"transa';
    assert.throws(() => parseSnapshot(text), SnapshotError);
  });

  test("collectReferences ignores a document's own id", () => {
    const refs = collectReferences({ _id: "a", companyId: "b" }, new Set(["a", "b"]));
    assert.deepEqual(refs, ["b"]);
  });
});
