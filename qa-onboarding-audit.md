# Tranquillo Green Onboarding Flow Audit Report

**Date:** April 14, 2026  
**Purpose:** Audit the onboarding flow for live demo users  
**Stack:** Next.js 14, Convex, Clerk, Tailwind  
**Project Path:** `/home/justa/tranquillo-green`

## Executive Summary

The onboarding flow has a **critical disconnect** that prevents new users from being automatically guided through company creation. While the individual components work correctly, the end-to-end flow is broken, causing new signups to see demo data instead of creating their own company.

## Detailed Findings

### 1. Can a new user sign up via Clerk? ✅ WORKING

**File:** `/src/app/sign-up/[[...sign-up]]/page.tsx`

- Clerk's `SignUp` component is properly implemented
- Styling matches the application theme
- Cross-links to sign-in and demo mode are present
- Users can create accounts via email/password or social providers

### 2. After signup, where do they go? ❌ BROKEN

**File:** `/src/app/dashboard/layout.tsx`

**Critical Issue:** The dashboard layout no longer redirects users to onboarding when no tenant is found. Instead, it shows demo mode:

```typescript
// Lines 63-69 in dashboard/layout.tsx
if (!persistedTenant) {
  return (
    <TenantShell tenant={DEMO_TENANT}>
      {children}
    </TenantShell>
  );
}
```

**Previous Behavior:** The layout used to redirect to `/onboarding` when no tenant was found.  
**Current Behavior:** Shows demo data, leaving users stuck without creating their company.

**Impact:** New users who sign up are immediately placed in demo mode with no prompt to create their company.

### 3. Can they create a company, set operator type, state, etc.? ✅ WORKING (if reached)

**File:** `/src/app/onboarding/page.tsx`

The onboarding page exists and works correctly:
- Collects company name, state, operator type, and accounting method
- Form validation is implemented
- Submits to `/api/onboarding` endpoint
- Provides clear UI with proper styling

**Operator Types Available:**
- Dispensary
- Cultivator
- Manufacturer
- Distributor
- Delivery
- Vertical (Integrated)

**States:** All 50 US states

### 4. Does onboarding create real Convex records or just demo data? ✅ REAL DATA

**File:** `/src/app/api/onboarding/route.ts`

The API route creates **real Convex records**:

1. **User Record:** `users.getOrCreateUser` - ensures user exists in Convex
2. **Company Record:** `cannabisCompanies.create` - creates cannabis company with:
   - Name, slug, timezone, state
   - Operator type, accounting method
   - Status: "onboarding"
3. **User-Company Link:** `users.linkToCompany` - links user as "owner"
4. **Chart of Accounts:** `chartOfAccounts.seedDefaults` - seeds 18 default accounts

**Validation:**
- Company name required
- Alphanumeric validation for slug generation
- Operator type validation
- Accounting method validation

### 5. Any broken flows, missing redirects, or dead ends? ❌ MULTIPLE ISSUES

**Broken Flow 1: No Automatic Onboarding Redirect**
- New users are shown demo data instead of being redirected to onboarding
- The onboarding page is effectively orphaned

**Broken Flow 2: Legacy Redirect Loop**
- File: `/src/app/dashboard/onboarding/page.tsx`
- Contains a redirect to `/onboarding` but this path is never reached
- The dashboard layout doesn't redirect to this legacy path

**Potential Issue: Operator Type Mismatch**
- Onboarding page includes "delivery" as an operator type
- API route `validOperatorTypes` does not include "delivery"
- If "delivery" is selected, it defaults to "dispensary"

### 6. What's the minimum path from signup → seeing dashboard with data? ❌ BROKEN

**Current Flow:**
1. User signs up at `/sign-up`
2. Redirected to `/dashboard`
3. Sees demo data (no tenant found)
4. **No prompt to create company**
5. **Stuck in demo mode**

**Intended Flow (based on code structure):**
1. User signs up at `/sign-up`
2. Redirected to `/dashboard`
3. Layout detects no tenant → redirect to `/onboarding`
4. User creates company
5. API creates Convex records
6. Redirect to `/dashboard` with real tenant

**Actual Minimum Path (manual):**
1. User signs up at `/sign-up`
2. Manually navigate to `/onboarding`
3. Fill out company form
4. Submit → creates real Convex records
5. Redirect to `/dashboard` with real tenant

## Component Analysis

### Clerk Integration
- **Status:** ✅ Working
- **Configuration:** Properly configured in root layout
- **Auth Flow:** Sign-in/sign-up pages functional

### Convex Integration
- **Status:** ✅ Working
- **Authentication:** Clerk JWT tokens used for Convex auth
- **Data Creation:** Real records created during onboarding

### Tenant Context
- **File:** `/src/lib/auth/tenant-context.tsx`
- **Status:** ✅ Working (context provider functional)
- **Issue:** Not properly integrated with onboarding flow

### Dashboard Layout
- **File:** `/src/app/dashboard/layout.tsx`
- **Status:** ❌ Broken redirect logic
- **Demo Mode:** Always shows when no tenant (should redirect to onboarding for new users)

## Recommendations

### Immediate Fixes Required

1. **Restore Onboarding Redirect**
   ```typescript
   // In dashboard/layout.tsx
   if (!persistedTenant) {
     // Check if user is authenticated
     if (user) {
       redirect("/onboarding");
     }
     // Show demo for unauthenticated users
     return (
       <TenantShell tenant={DEMO_TENANT}>
         {children}
       </TenantShell>
     );
   }
   ```

2. **Fix Operator Type Mismatch**
   - Add "delivery" to `validOperatorTypes` in `/src/app/api/onboarding/route.ts`

3. **Add Onboarding Entry Points**
   - Add "Create Company" button in demo mode for authenticated users
   - Consider adding banner/notification for users without a company

### Long-term Improvements

1. **Onboarding Completion Status**
   - Track onboarding completion in user record
   - Show different UI based on onboarding status

2. **Progressive Onboarding**
   - Allow users to skip certain steps
   - Provide guided setup wizard

3. **Demo Mode Separation**
   - Clearly distinguish demo mode from real data
   - Add visual indicators when in demo mode

## Environment Requirements

**Required Environment Variables:**
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_JWT_ISSUER_DOMAIN` - Optional Clerk JWT issuer domain
- `CLERK_CONVEX_JWT_TEMPLATE` - Optional Clerk JWT template name

## Test Cases for Verification

1. **New User Flow**
   - Sign up with new email
   - Verify redirect to onboarding (currently broken)
   - Complete company creation
   - Verify dashboard shows real data

2. **Existing User Flow**
   - Sign in with existing account
   - Verify dashboard shows correct tenant data

3. **Demo Mode Flow**
   - Access `/dashboard` without authentication
   - Verify demo data is shown

4. **Manual Onboarding**
   - Navigate to `/onboarding` manually
   - Complete company creation
   - Verify Convex records are created

## Conclusion

The onboarding infrastructure is well-built but disconnected from the user journey. The primary issue is the removal of the automatic redirect to onboarding when no tenant is found. This causes new users to be stuck in demo mode without the ability to create their company.

**Priority Fix:** Restore the onboarding redirect logic in the dashboard layout to ensure new users are guided through company creation.

**Files Modified During Audit:** None (read-only audit)

**Files Requiring Changes:**
1. `/src/app/dashboard/layout.tsx` - Restore onboarding redirect
2. `/src/app/api/onboarding/route.ts` - Add "delivery" to valid operator types
3. Potentially add UI components for better onboarding discovery