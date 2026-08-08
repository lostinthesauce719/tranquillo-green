# Data Migration Architecture
Tranquillo Green — Cannabis Accounting Platform
2026-04-11

## Overview

This document describes how Tranquillo Green migrates data from demo to production,
how new tenants are onboarded, and how historical data is imported.

---

## 1. Demo-to-Live Cutover Process

### Current State
The seed mutation (`convex/seed.ts :: seedCaliforniaOperator`) creates a complete
demo company with:
- Company record (californiaOperatorDemo)
- Locations and licenses
- Chart of accounts (280E-aware, with tax treatment)
- Reporting periods
- Import mapping profiles and staged import jobs
- Transactions with journal lines
- Cash accounts and reconciliations
- Audit trail events

### Cutover Steps

1. **Create production company record**
   - Use `cannabisCompanies` mutation with real company details
   - Set `status: "onboarding"` until all setup steps complete
   - Record actual license numbers, locations, operator type

2. **Seed chart of accounts from template**
   - Start from the California operator template in `src/lib/demo/accounting.ts`
   - Customize account codes, names, subcategories to match client's existing system
   - Set correct `taxTreatment` per account (deductible, cogs, nondeductible)
   - Set `isActive: false` for accounts the client does not use

3. **Create reporting periods**
   - Generate periods matching the client's fiscal calendar
   - Set current period to `status: "open"`
   - Leave future periods as `status: "open"`, historical periods as `status: "closed"`

4. **Import historical data via CSV pipeline**
   - See Section 3 below

5. **Verify and flip status**
   - Run reconciliation checks
   - Confirm chart of accounts balances tie
   - Set company `status: "active"`

6. **Clean up demo data**
   - Delete any records where `companyId` points to the demo company
   - Or: keep demo company for training/sandbox purposes with a `demo: true` flag (future enhancement)

---

## 2. Seed Strategy for New Tenant Onboarding

### What Gets Seeded Per Tenant

| Data Category | Source | Tables |
|---|---|---|
| Company profile | Onboarding wizard input | `cannabisCompanies` |
| Locations | Onboarding wizard input | `cannabisLocations` |
| Licenses | Onboarding wizard input | `cannabisLicenses` |
| Chart of accounts | Template + customization | `chartOfAccounts` |
| Reporting periods | Fiscal calendar config | `reportingPeriods` |
| Import mapping profiles | Template presets | `importMappingProfiles` |
| Cash accounts | Wizard or manual setup | `cashAccounts` |
| Tax profiles | State-specific defaults | `taxProfiles` |

### Seed Mutation Pattern (from `convex/seed.ts`)

The existing seed uses idempotent upserts keyed on natural identifiers:
- Company: `slug`
- Locations: `name` within company
- Licenses: `licenseNumber`
- Accounts: `code` within company
- Periods: `label` within company
- Import profiles: `profileKey` (format: `{sourceSystem}:{profileId}`)

This pattern should be preserved for the production onboarding flow. The seed
mutation checks for existing records before inserting and patches if found.

### Future: Multi-State Templates

When supporting states beyond California, create state-specific chart of accounts
templates:
- `src/lib/templates/california-chart.ts`
- `src/lib/templates/colorado-chart.ts`
- `src/lib/templates/oregon-chart.ts`

Each template should include state-specific tax treatment rules and
required compliance accounts.

---

## 3. CSV Import Pipeline (Historical Data)

### Architecture

The existing import pipeline in `convex/importJobs.ts` handles:

```
CSV Upload -> Column Detection -> Profile Mapping -> Row Validation -> Promotion
```

### Pipeline Stages

1. **Upload** — User uploads CSV file, system stores metadata in `importJobs`
   - `sourceFileName`, `sourceDelimiter`, `sourceFileSizeBytes`, `sourceChecksum`
   - Status: `uploaded`

2. **Column Mapping** — User maps CSV columns to target fields
   - Target fields: `date`, `postedDate`, `description`, `reference`, `amount`, `debit`, `credit`, `location`, `memo`, `ignore`
   - Stored in `importMappingProfiles` for reuse
   - Two amount strategies: `single_signed` or `split_debit_credit`
   - Status: `mapped`

3. **Row Validation** — Each row validated against mappings
   - Each `importJobRow` gets `status`: `ready`, `warning`, or `error`
   - Validation issues stored in `validationIssues` array
   - Account mapping: `suggestedDebitAccountCode`, `suggestedCreditAccountCode`, `confidence`
   - Job status: `validated` (if no errors) or `mapped` (if errors exist)

4. **Promotion** — Valid rows promoted to `transactions` + `transactionLines`
   - `promoteJobToTransactions()` mutation
   - Idempotent: rows with `promotedTransactionId` are skipped
   - External ref format: `import-row:{jobId}:{rowKey}` for deduplication
   - Creates counterparties on-the-fly if not found
   - Status: `promoted` or `partially_promoted`

### Import Data Flow

```
CSV File
  |
  v
importJobs (header: columns, metadata, status)
  |
  v
importJobRows (one row per CSV line)
  |                |
  v                v
[validate]     [account mapping]
  |                |
  v                v
status: ready   suggestedDebitAccountCode
status: warning suggestedCreditAccountCode
status: error   confidence
  |
  v
promoteJobToTransactions()
  |
  v
transactions + transactionLines
```

### Supported Source Systems

| Source | Format | Notes |
|---|---|---|
| Bank statements | CSV, single signed amount | Most common initial import |
| Payroll exports | CSV, split debit/credit | ADP, Gusto, etc. |
| POS exports | CSV | Dutchie, Treez, etc. |
| QuickBooks export | CSV, split debit/credit | For QBO migration |
| Metrc exports | CSV | Inventory/package data |

### Account Mapping Confidence Scores

- `0.9-1.0`: Exact match on source account name to chart of accounts
- `0.7-0.9`: Fuzzy match or pattern-based (e.g., "BANK" -> 1010)
- `0.5-0.7`: Partial match, needs human review
- `<0.5`: No reliable match, flagged as error

---

## 4. Data Backup and Restore Approach

### Convex as System of Record

Convex provides built-in durability and point-in-time recovery. For Tranquillo Green:

- **Primary backup**: Convex's managed storage (automatic, no action needed)
- **Export format**: CSV exports of all tables for a company, generated on-demand
- **Audit trail**: `auditTrailEvents` table captures all mutations with before/after state

### Export Strategy

For compliance and disaster recovery, implement periodic exports:

1. **Full company export** — Dump all tables filtered by `companyId`
   - Generate as CSV zip bundle
   - Include: chart of accounts, transactions, transaction lines, reconciliations, allocations
   - Store in Convex file storage or external S3

2. **Audit packet generation** — Already implemented via `packetGenerationRecords`
   - Bundles: journal entries, allocation schedules, reconciliation evidence
   - Export formats: PDF, Excel, CSV

3. **Incremental exports** — For integration sync
   - Track `lastSyncAt` per integration config
   - Export only records modified since last sync

### Restore Process

Since Convex does not expose raw restore to a specific point in time for application
code, the restore strategy is:

1. Use Convex dashboard for disaster recovery (admin-level)
2. For data-level restores, re-run seed + import from last known good CSV export
3. Use `externalRef` fields for idempotent re-import (deduplication)

---

## 5. Migration Checklist for New Tenants Going Live

### Pre-Migration

- [ ] Company record created with correct `operatorType` and `state`
- [ ] All locations entered with license numbers
- [ ] All licenses entered with correct status and expiration dates
- [ ] Chart of accounts reviewed and customized for client
- [ ] Tax profiles configured for client's state(s)
- [ ] Reporting periods generated for current fiscal year
- [ ] Cash accounts created for all physical locations

### Historical Data Import

- [ ] Identify data sources (bank, payroll, POS, prior accounting system)
- [ ] Export historical data as CSV from each source
- [ ] Create import mapping profiles for each source system
- [ ] Upload and validate each CSV import
- [ ] Resolve all validation errors
- [ ] Promote validated rows to transactions
- [ ] Verify trial balance matches prior system
- [ ] Verify transaction counts and totals by period

### Reconciliation Setup

- [ ] Enter opening balances for all cash accounts
- [ ] Reconcile opening inventory from Metrc or prior system
- [ ] Verify 280E allocation policies are configured
- [ ] Run test allocation on historical period

### Go-Live

- [ ] Set company `status` to `"active"`
- [ ] Lock historical reporting periods
- [ ] Verify compliance calendar is populated
- [ ] Confirm user access for all team members
- [ ] Run smoke test: create transaction, post, verify in reports

### Post-Migration

- [ ] Archive original CSV imports
- [ ] Document any data transformations applied
- [ ] Set up recurring import schedules (if applicable)
- [ ] Schedule first month-end close

---

## 6. Schema Considerations for Migration

### Key Indexes Used

- `cannabisCompanies.by_slug` — Idempotent company creation
- `chartOfAccounts.by_company_code` — Account lookup during import
- `transactions.by_company_external_ref` — Deduplication during promotion
- `importJobs.by_company_external_ref` — Idempotent import job creation
- `importJobRows.by_job_row_key` — Idempotent row tracking

### Idempotency Keys

| Entity | Key Pattern | Used By |
|---|---|---|
| Company | `slug` | `seedCaliforniaOperator` |
| Account | `companyId + code` | Import pipeline |
| Transaction | `externalRef` (e.g., `import-row:{jobId}:{rowKey}`) | Promotion |
| Import job | `externalRef` (e.g., `import-job:{datasetId}`) | Seed and staging |
| Counterparty | `externalRef` (e.g., `import-payee:{description}`) | Promotion |

These keys allow safe re-runs of seed and import operations without creating duplicates.
