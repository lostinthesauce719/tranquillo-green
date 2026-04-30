# Tranquillo Green — Operator Walkthrough

A scripted demo walkthrough for operator, controller, and CPA audiences.

---

## For Operators (Dispensary/Cultivation Owners)

**Opening:** "Tranquillo Green is an accounting and compliance OS built specifically for cannabis operators. Let me walk you through how a typical month flows."

### 1. Data Entry (2 min)
- Go to **Accounting > Imports**
- Show the CSV import workflow: upload, map columns, validate rows
- "Your staff uploads bank statements or POS exports. The system maps columns automatically, validates each row, and flags errors before anything hits your books."
- Promote a batch of rows to transactions

### 2. Transaction Review (2 min)
- Go to **Accounting > Transactions**
- Show the pipeline: needs review → ready to post → posted
- Drill into a transaction detail
- "Every transaction has a full audit trail. Who reviewed it, when it was posted, what journal entry it produced."

### 3. Month-End Close (3 min)
- Go to **Accounting > Month-End Close**
- Walk through the close dashboard areas: imports, transactions, reconciliations, allocations
- "This is your close command center. It tells you exactly what's ready, what's blocked, and what needs attention. No more guessing if you're ready to close."

### 4. Cash Reconciliation (2 min)
- Go to **Reconciliations**
- Open a reconciliation detail
- Show variance drivers, source breakdown, investigation notes
- "Every dollar is traced. If there's a variance, we show you what caused it and what to do about it."

---

## For Controllers

**Opening:** "You care about defensibility and audit readiness. Let me show you the 280E workflow."

### 1. Allocation Queue (3 min)
- Go to **280E Allocations**
- Walk through the allocation review queue
- Show system-recommended allocations with confidence scores
- Override an allocation and fill in a reason + evidence
- "Every override is recorded with actor, reason, evidence, and the original vs. revised amounts. This is your audit trail."

### 2. Override History (2 min)
- Go to **Allocation History**
- Show the audit log: original recommendation, override decision, resulting policy trail
- "A CPA reviewing this sees exactly what happened and why. No black boxes."

### 3. Support Schedule (2 min)
- Go to **280E Support Schedule**
- Walk through the deductible vs. nondeductible breakdown
- "This is the document that goes into your 280E workpaper binder. It's ready to export."

### 4. Close Readiness (2 min)
- Go to **Month-End Close**
- Show the readiness score and blockers
- "You can see at a glance whether the team is ready to close. Blockers are owned and tracked."

---

## For CPAs

**Opening:** "You need to review, not rebuild. Let me show you the handoff workflow."

### 1. CPA Export Center (3 min)
- Go to **CPA Export Center**
- Walk through the packet builder: choose bundle, select sections, attach checklist items
- Assemble a demo packet
- Show generation history
- "Every packet build is recorded. You see who assembled it, what was included, and when."

### 2. 280E Review (3 min)
- Go to **Allocation History**
- Walk through 3-4 override decisions
- Show: original recommendation, revised amounts, evidence, policy trail
- "This reads like a review binder, not a workflow log. Actor, role, reason, evidence, before/after."

### 3. Reconciliation Tie-Out (2 min)
- Go to **Reconciliations**
- Open a resolved reconciliation
- Show source breakdown and variance drivers
- "You can trace every variance to its source. No manual tie-out required."

### 4. Close Dashboard (2 min)
- Go to **Month-End Close**
- Show the data-derived readiness posture
- "This isn't a checklist someone filled in. It's computed from the actual workflow state."

---

## Demo Seed Story

**Company:** Golden State Greens, LLC
- California vertical operator (dispensary + cultivation + manufacturing)
- Two locations: Oakland Flagship Retail, Richmond Manufacturing Hub
- Three active licenses: Storefront Retailer, Type N Infusion, Distribution

**Demo Scenario:** April 2026 month-end close
- 8 transactions across retail, manufacturing, payroll, and inventory
- 3 open reconciliations (operating cash, clearing, armored receipt)
- 3 allocation decisions (square footage override, labor approval, event sponsorship exception)
- 2 import jobs (bank CSV, payroll CSV)
- 3 export bundles (280E binder, close packet, tax planning)
- 7 audit trail events showing the full decision history

**Narrative Arc:**
1. Month starts — imports come in, transactions are reviewed
2. Allocations are recommended, one is overridden with evidence
3. Reconciliations are worked — one variance is traced to a misapplied deposit
4. Close dashboard shows readiness — blockers are tracked to resolution
5. CPA packet is assembled with full audit trail and support schedule
6. Handoff happens — CPA can review every decision with actor/reason/evidence

---

## Key Talking Points

- **"Obvious, trustworthy, defensible, fast to learn, hard to leave."**
- Every override has actor, reason, evidence, and before/after amounts
- Every packet build is recorded with generation history
- Close readiness is computed, not self-reported
- The system works even without Convex — demo fallback is always available
- Auth is real — Clerk integration with role-based access (owner/controller/accountant/viewer)
