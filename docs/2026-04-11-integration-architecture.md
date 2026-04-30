# Integration Architecture
Tranquillo Green — Cannabis Accounting Platform
2026-04-11

## Overview

This document describes integration patterns for external systems that connect
to Tranquillo Green. It covers accounting systems, cannabis track-and-trace,
POS systems, and the data flow between them.

---

## 1. Integration Patterns

### Pattern A: CSV Import (Already Built)
The existing import pipeline handles CSV uploads from any source system.
This is the primary integration method today.

**Flow:**
External System -> CSV Export -> Upload to TG -> Import Pipeline -> Transactions

**Used for:** Bank statements, payroll, POS exports, QuickBooks exports, Metrc exports

### Pattern B: API Pull (Planned)
TG calls external APIs on a schedule to pull data.

**Flow:**
TG Scheduler -> External API -> Transform -> TG Transactions/Inventory

**Used for:** QuickBooks Online, Metrc, Sage Intacct

### Pattern C: Webhook Push (Future)
External systems push data to TG via webhooks.

**Flow:**
External System -> Webhook -> TG Endpoint -> Validate -> Store

**Used for:** Real-time POS transactions, Metrc package updates

---

## 2. QuickBooks Online Integration

### OAuth2 Flow
1. User initiates QBO connection from Settings -> Integrations
2. Redirect to Intuit authorization URL with scopes
3. User authorizes TG app
4. Intuit redirects back with authorization code
5. TG exchanges code for access token + refresh token
6. Store tokens in integration config (encrypted)
7. Refresh token before expiry (tokens last 1 hour)

**Required Scopes:**
- `com.intuit.quickbooks.accounting` — Chart of accounts, transactions
- `com.intuit.quickbooks.payment` — Payments and deposits

**OAuth Endpoints:**
- Authorize: `https://appcenter.intuit.com/connect/oauth2`
- Token: `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer`
- Discovery: `https://appcenter.intuit.com/api/v1/connection/discovery`

### API Endpoints for Sync

| Data Type | QBO Endpoint | TG Table |
---|---|---|
Chart of Accounts | `GET /v3/company/{companyId}/accounts` | `chartOfAccounts` |
Journal Entries | `GET /v3/company/{companyId}/journalentry` | `transactions` |
Vendors | `GET /v3/company/{companyId}/vendor` | `counterparties` |
Customers | `GET /v3/company/{companyId}/customer` | `counterparties` |
Classes (Locations) | `GET /v3/company/{companyId}/class` | `cannabisLocations` |

### Sync Strategy
1. **Initial sync**: Pull full chart of accounts, map to TG codes
2. **Incremental sync**: Pull journal entries since `lastSyncAt`
3. **Deduplication**: Use QBO `Id` stored in `externalRef`
4. **Conflict resolution**: QBO is source of truth for imported data

### QBO Data Flow
```
QuickBooks Online
    |
    v
[OAuth2 Auth] -> Access Token
    |
    v
[API Pull] -> JSON Response
    |
    v
[Transform] -> TG Transaction Format
    |
    v
[Account Mapping] -> Match QBO accounts to TG chart
    |
    v
[Dedup Check] -> Skip if externalRef exists
    |
    v
transactions + transactionLines
```

---

## 3. Sage Intacct Integration

### API Pattern
Sage Intacct uses XML-based API (also called REST API v2).

**Authentication:** Session-based via `signIn` request
**Endpoint:** `https://api.intacct.com/ia/api/v2/`

### Key Objects

| Intacct Object | TG Equivalent | Notes |
---|---|---|
GLACCOUNT | chartOfAccounts | Map account numbers |
GLBATCH | transactions | Journal entry batches |
GLENTRY | transactionLines | Individual journal lines |
LOCATION | cannabisLocations | Department/location mapping |
CLASS | (future) | Cost center dimension |

### Dimension Mapping
Sage Intacct uses dimensions (location, department, class, project).
TG needs to map these to:
- `locationId` -> cannabisLocations
- Activity dimension -> `activity` field on transactions
- Custom dimensions -> metadata on transaction

### Sync Flow
```
Sage Intacct
    |
    v
[XML API Auth] -> Session ID
    |
    v
[Query GLBATCH] -> XML Response
    |
    v
[Parse XML] -> Normalize to TG format
    |
    v
[Dimension Mapping] -> locationId, activity
    |
    v
[Dedup Check] -> externalRef = intacct:{key}
    |
    v
transactions + transactionLines
```

---

## 4. Metrc Integration (Cannabis Track-and-Trace)

### API Pattern
Metrc uses REST API with API key authentication.
**Endpoint:** `https://api-{state}.metrc.com/`

### Key Endpoints

| Metrc Endpoint | TG Table | Data |
---|---|---|
`/packages/v1/active` | `inventoryBatches` | Active packages |
`/packages/v1/{id}` | `inventoryBatches` | Package details |
`/packages/v1/adjustments` | `inventoryMovements` | Quantity adjustments |
`/transfers/v1/incoming` | `inventoryMovements` | Received inventory |
`/transfers/v1/outgoing` | `inventoryMovements` | Shipped inventory |
`/sales/v1/receipts` | `transactions` | POS sales data |
`/plants/v1/vegetative` | `products` | Plant inventory |
`/harvests/v1/active` | `inventoryBatches` | Harvest batches |

### Data Flow
```
Metrc API
    |
    v
[API Key Auth] -> No OAuth needed
    |
    v
[Poll Packages] -> Active packages list
    |
    v
[Compare to TG] -> New/changed packages
    |
    v
[Map to TG]
    |-- packageTag -> inventoryBatches.packageTag
    |-- product name -> products.name
    |-- quantity -> inventoryBatches.quantityOnHand
    |-- location -> cannabisLocations (by Metrc room)
    |
    v
inventoryBatches + inventoryMovements
```

### Package Tag as Dedup Key
Metrc package tags (e.g., `1A406030000XXXX00000001`) are unique identifiers.
Store in `inventoryBatches.packageTag` with index `by_packageTag`.

### Metrc Sync Strategy
1. **Full sync**: Pull all active packages, reconcile with TG inventory
2. **Incremental sync**: Pull packages modified since last sync
3. **Reconciliation**: Generate `inventoryMovements` for quantity changes
4. **Alert**: Generate `complianceAlerts` for Metrc discrepancies

---

## 5. POS Systems Integration

### Generic Pattern
Most cannabis POS systems (Dutchie, Treez, Blaze, etc.) support CSV export.
Use the existing CSV import pipeline.

### POS Data Mapping

| POS Field | TG Field | Notes |
---|---|---|
Transaction Date | `transactionDate` | Required |
Transaction ID | `externalRef` | Dedup key |
Product Name | (match to `products`) | Fuzzy match |
Quantity | `inventoryMovements.quantity` | For inventory |
Total Amount | `transactions.amount` | Gross sale |
Tax Amount | Separate line | Sales tax payable |
Location | `locationId` | Match to locations |
Package Tag | `packageTag` | Link to Metrc |

### POS Import Flow
```
POS System (Dutchie/Treez/Blaze)
    |
    v
[CSV Export] -> Daily or on-demand
    |
    v
[TG Import Pipeline] -> importJobs
    |
    v
[Column Mapping] -> saved as importMappingProfile
    |
    v
[Row Validation] -> importJobRows
    |
    v
[Promotion] -> transactions + inventoryMovements
```

### Future: POS API Integration
For real-time sync, implement webhooks:
1. POS sends transaction to TG webhook endpoint
2. TG validates payload and signature
3. TG creates transaction + inventory movement
4. TG returns 200 OK or error details

---

## 6. Integration Status Matrix

| Integration | Status | Method | Priority |
---|---|---|---|
CSV Import (any source) | **Built** | CSV Pipeline | P0 |
QuickBooks Online CSV | **Built** | CSV Pipeline | P0 |
QuickBooks Online API | **Planned** | API Pull | P1 |
Metrc CSV Export | **Built** | CSV Pipeline | P0 |
Metrc API | **Planned** | API Pull | P1 |
Sage Intacct CSV | **Built** | CSV Pipeline | P1 |
Sage Intacct API | **Deferred** | API Pull | P2 |
Dutchie POS CSV | **Built** | CSV Pipeline | P0 |
Dutchie POS API | **Deferred** | Webhook | P2 |
Treez POS CSV | **Built** | CSV Pipeline | P1 |
Generic POS API | **Deferred** | Webhook | P3 |

---

## 7. Proposed Schema Additions

### integrationConfigs Table
Store per-company integration settings.

```typescript
integrationConfigs: defineTable({
  companyId: v.id("cannabisCompanies"),
  integrationType: v.union(
    v.literal("quickbooks_online"),
    v.literal("sage_intacct"),
    v.literal("metrc"),
    v.literal("dutchie"),
    v.literal("treez"),
    v.literal("custom_csv")
  ),
  status: v.union(
    v.literal("connected"),
    v.literal("disconnected"),
    v.literal("error"),
    v.literal("pending_auth")
  ),
  // Auth credentials (encrypted)
  credentials: v.optional(v.object({
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    companyId: v.optional(v.string()), // QBO company ID
    expiresAt: v.optional(v.number()),
  })),
  // Sync configuration
  syncConfig: v.object({
    syncFrequency: v.union(
      v.literal("manual"),
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    lastSyncAt: v.optional(v.number()),
    nextSyncAt: v.optional(v.number()),
    syncDirection: v.union(
      v.literal("pull"),    // TG pulls from external
      v.literal("push"),    // TG pushes to external
      v.literal("bidirectional")
    ),
  }),
  // Error tracking
  lastError: v.optional(v.string()),
  errorCount: v.optional(v.number()),
  // Metadata
  connectedAt: v.number(),
  connectedBy: v.string(),
  updatedAt: v.number(),
})
  .index("by_company", ["companyId"])
  .index("by_company_type", ["companyId", "integrationType"])
```

### syncJobs Table
Track individual sync operations.

```typescript
syncJobs: defineTable({
  companyId: v.id("cannabisCompanies"),
  integrationConfigId: v.id("integrationConfigs"),
  syncType: v.union(
    v.literal("full"),
    v.literal("incremental"),
    v.literal("reconciliation")
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  // Scope
  dataType: v.union(
    v.literal("chart_of_accounts"),
    v.literal("transactions"),
    v.literal("inventory"),
    v.literal("counterparties")
  ),
  dateRange: v.optional(v.object({
    start: v.string(),
    end: v.string(),
  })),
  // Results
  recordsFetched: v.number(),
  recordsCreated: v.number(),
  recordsUpdated: v.number(),
  recordsSkipped: v.number(),
  recordsErrored: v.number(),
  // Timing
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  durationMs: v.optional(v.number()),
  // Error handling
  errors: v.array(v.object({
    recordId: v.optional(v.string()),
    message: v.string(),
    retryable: v.boolean(),
  })),
  // Metadata
  triggeredBy: v.union(
    v.literal("schedule"),
    v.literal("manual"),
    v.literal("webhook")
  ),
  triggeredByUser: v.optional(v.string()),
})
  .index("by_company", ["companyId"])
  .index("by_integration", ["integrationConfigId"])
  .index("by_company_status", ["companyId", "status"])
  .index("by_started_at", ["startedAt"])
```

### Schema Migration Notes
Add these tables to `convex/schema.ts` in Phase 2 when API integrations begin.
The CSV import pipeline uses existing `importJobs` / `importJobRows` tables.

---

## 8. Rate Limiting and Retry Strategy

### External API Rate Limits

| Service | Rate Limit | Strategy |
---|---|---|
QuickBooks Online | 450 requests/min | Token bucket, 7 req/sec sustained |
Metrc | Varies by state (typically 1-5 req/sec) | Fixed delay between requests |
Sage Intacct | 25 requests/min per company | Queue with rate limiter |
Dutchie API | Unknown (assume conservative) | Exponential backoff |

### Retry Policy
```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 4 seconds
Attempt 4: Wait 16 seconds
Attempt 5: Wait 60 seconds (max)

After 5 attempts: Log error, mark sync job as failed
Retryable errors: 429 (rate limit), 500-503 (server errors), network timeouts
Non-retryable errors: 400 (bad request), 401 (auth failed), 403 (forbidden)
```

### Implementation
Use a retry wrapper around all API calls:
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; onRetry?: (attempt: number, error: Error) => void }
): Promise<T>
```

---

## 9. Error Handling and Conflict Resolution

### Idempotent Writes
All integrations must be idempotent. Use these dedup keys:

| Source | Dedup Key | Storage |
---|---|---|
QuickBooks | `qbo:{CompanyId}:{TxnId}` | `transactions.externalRef` |
Metrc | Package tag directly | `inventoryBatches.packageTag` |
Sage Intacct | `intacct:{RECORDNO}` | `transactions.externalRef` |
CSV Import | `import-row:{jobId}:{rowKey}` | `transactions.externalRef` |

### Conflict Resolution Rules

1. **First write wins for new records** — If externalRef does not exist, create.
2. **External system is source of truth** — If record exists with matching externalRef, update from external.
3. **Manual edits take precedence** — If record was manually edited after import, do not overwrite (flag for review).
4. **Merge strategy for bidirectional** — Compare `updatedAt` timestamps, most recent wins.

### Sync Conflict Flow
```
Incoming record from external system
    |
    v
externalRef exists in TG?
    |-- No: Create new record
    |-- Yes: Compare data
        |
        v
    Record was manually modified?
        |-- No: Update from external
        |-- Yes: Create conflict alert
            |
            v
        complianceAlert (category: "integration")
        with before/after values
```

### Error Logging
All sync errors stored in:
- `syncJobs.errors` array — Per-sync error list
- `integrationConfigs.lastError` — Most recent error
- `integrationConfigs.errorCount` — Running count
- `auditTrailEvents` — Full audit log with `entityType: "system"`

---

## 10. Data Flow Diagrams

### Complete System Integration Map
```
                    +------------------+
                    |  QuickBooks      |
                    |  Online          |
                    +--------+---------+
                             |
                      OAuth2 + API Pull
                             |
                             v
+--------+    CSV    +------+--------+    API    +-------+
| Bank   |---------->|               |<----------| Metrc |
|Export  |           | TRANQUILLO    |           | API   |
+--------+           |    GREEN      |           +-------+
                     |               |
+--------+    CSV    |    (Convex)   |    API    +-------+
| POS    |---------->|               |<----------| Sage  |
|Export  |           |               |           |Intacct|
+--------+           +-------+-------+           +-------+
                             |
                             v
                     +-------+--------+
                     |  Transactions  |
                     |  Inventory     |
                     |  Allocations   |
                     |  Reconciliations|
                     +----------------+
```

### CSV Import Data Flow (Current)
```
User uploads CSV
    |
    v
createImportJob() mutation
    |-- Saves to importJobs table
    |-- Auto-detects columns
    |
    v
User maps columns to target fields
    |
    v
stageDemoImportJob() / updateMapping()
    |-- Saves to importMappingProfiles
    |-- Creates importJobRows
    |-- Validates each row
    |
    v
User reviews row statuses
    |-- ready: can promote
    |-- warning: can promote with caution
    |-- error: must fix before promote
    |
    v
promoteJobToTransactions()
    |-- Creates transactions
    |-- Creates transactionLines
    |-- Creates counterparties as needed
    |-- Updates importJobRows with promotedTransactionId
    |
    v
Transactions in TG database
```

### API Sync Flow (Planned)
```
Scheduler triggers sync (or manual trigger)
    |
    v
createSyncJob() mutation
    |
    v
syncRunner() action
    |-- Reads integrationConfig credentials
    |-- Calls external API with retry
    |-- Receives data batch
    |
    v
Transform to TG format
    |-- Map external fields to TG schema
    |-- Generate externalRef dedup keys
    |
    v
Dedup and conflict check
    |-- Check existing records by externalRef
    |-- Apply conflict resolution rules
    |
    v
Write to TG
    |-- Insert/update transactions
    |-- Insert/update inventory
    |-- Log errors for failed records
    |
    v
Update syncJob results
    |-- recordsCreated, recordsUpdated, etc.
    |-- Mark status completed/failed
    |-- Update integrationConfig.lastSyncAt
```