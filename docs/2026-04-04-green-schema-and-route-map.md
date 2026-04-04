# Tranquillo Green Schema and Route Map

Goal: define the exact Phase 1 domain model and route structure for the California-first accounting/compliance MVP.

Architecture choice:
- Separate repo: `tranquillo-green`
- Keep Tranquillo Labs as the home-services product
- Reuse visual patterns and future shared packages later if monorepo consolidation becomes useful

## Phase 1 MVP modules
1. company setup
2. accounting core
3. 280E allocations
4. inventory reconciliation
5. compliance calendar
6. exports and close workflow

## Convex tables
Core tenancy:
- cannabisCompanies
- cannabisLocations
- cannabisLicenses

Accounting:
- chartOfAccounts
- counterparties
- reportingPeriods
- transactions
- transactionLines

280E engine:
- allocationPolicies
- cogsAllocations

Inventory/reconciliation:
- products
- inventoryBatches
- inventoryMovements
- cashAccounts
- cashReconciliations

Compliance:
- taxProfiles
- taxFilings
- complianceAlerts
- complianceDocuments

## Route map
Public:
- `/` landing page
- `/docs` docs index

Authenticated app shell:
- `/dashboard`
- `/dashboard/accounting`
- `/dashboard/allocations`
- `/dashboard/inventory`
- `/dashboard/compliance`
- `/dashboard/reconciliations`
- `/dashboard/exports`
- `/dashboard/settings`

Phase 1.1 detail routes to add next:
- `/dashboard/accounting/accounts`
- `/dashboard/accounting/transactions`
- `/dashboard/accounting/periods`
- `/dashboard/allocations/policies`
- `/dashboard/allocations/review`
- `/dashboard/inventory/products`
- `/dashboard/inventory/batches`
- `/dashboard/compliance/licenses`
- `/dashboard/compliance/filings`
- `/dashboard/reconciliations/cash`
- `/dashboard/reconciliations/inventory`
- `/dashboard/exports/qbo`
- `/dashboard/exports/audit-pack`

## Phase 1 page responsibilities
`/dashboard`
- close status cards
- critical alerts
- reconciliations snapshot
- filings due snapshot

`/dashboard/accounting`
- chart of accounts summary
- recent transactions
- period status
- financial statements entry points

`/dashboard/allocations`
- active allocation policies
- pending reviews
- 280E support summary

`/dashboard/inventory`
- imported packages and products
- inventory drift metrics
- import jobs summary

`/dashboard/compliance`
- licenses and deadlines
- filing queue
- alert center

`/dashboard/reconciliations`
- cash variance list
- inventory variance list
- period close signoff

`/dashboard/exports`
- QuickBooks export jobs
- audit support package generation
- CPA handoff files

`/dashboard/settings`
- operator profile
- locations
- licenses
- future integrations

## Data model notes
- transactions and transactionLines are normalized so reports can be built cleanly
- cogsAllocations stores the system-applied split plus review status for defensibility
- inventoryBatches and inventoryMovements let us reconcile package-level movement to accounting entries before full live Metrc integration
- complianceDocuments is the audit artifact registry for generated support packs

## What is intentionally deferred
- two-way Metrc writes
- delivery tables and driver flows
- POS replacement
- multi-state complexity beyond CA-first baseline
