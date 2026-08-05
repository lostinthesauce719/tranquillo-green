# Tranquillo Green Project Overview

## 1. Project Vision & Purpose

Tranquillo Green is envisioned as a cutting-edge **280E Defensibility Operating System (OS) for the Cannabis Industry**. Its core purpose is to provide a robust, compliance-focused platform that helps cannabis businesses manage their operations while ensuring adherence to the strict tax code 280E, mitigating risks, and optimizing financial processes. The platform aims to bring tranquility and clarity to complex regulatory environments, moving beyond merely decorative dashboards to offer actionable, defensible AI-powered operational insights.

## 2. Current Development Status (as of August 5, 2026)

The project has achieved significant milestones:
*   **Core Feature Complete:** All P0, P1, and P2 features are implemented.
*   **Design Overhaul:** A complete design refresh has been executed (Folio design system: ink palette, teal/gold/lavender accents, Syne/DM Sans/DM Mono).
*   **Security Hardening:** All CRITICAL and HIGH findings from the 2026-04-14 security review are remediated — Convex functions are auth-wrapped, API routes verify company ownership, and the QBO OAuth callback validates session + state.
*   **Onboarding:** New signups are redirected to onboarding, which creates real Convex company records (company, user link, seeded chart of accounts).
*   **Operator Types:** Supports 6 distinct operator types, including "delivery."
*   **Demo Mode:** A fully functional sandbox demo mode with auto-provisioning and a guided product tour.
*   **Quality Gates:** Production build, ESLint, TypeScript typecheck, and smoke tests all pass clean.

## 3. Key Features & Functionality

*   **QuickBooks Online Integration:**
    *   Full OAuth 2.0 flow for secure connection.
    *   Robust token storage and refresh mechanism.
    *   Intuitive UI for connecting and disconnecting QuickBooks accounts.
    *   Operates in QuickBooks Sandbox mode for development and testing.
*   **Dashboard Metrics:**
    *   Wired directly to Convex for real-time data.
    *   Includes a fallback mechanism for demo data if Convex is unavailable.
    *   Utilizes a dedicated `dashboardMetrics` Convex query.
*   **Role-Based Access Control:** Supports various operator types and roles for granular permissions.

## 4. Technology Stack

*   **Frontend:** Next.js 14
*   **Backend/Database:** Convex (instance: `hardy-mastiff-303.convex.cloud`)
*   **Authentication:** Clerk
*   **Styling:** Tailwind CSS, `class-variance-authority`, `clsx`, `tailwind-merge`
*   **Deployment/CI:** GitHub Actions (`.github/workflows/ci.yml`)

## 5. Design System Highlights

The UI/UX is crafted to embody "tranquility," providing a calm and intuitive user experience.

*   **Typography:** Primary font is **Inter**.
*   **Color Palette:**
    *   **Background:** Deep Navy (`#0B1020`)
    *   **Brand Green:** (`#22855A`)
    *   **Accent Amber:** (`#D4922A`)
*   **Component Library (`src/components/ui/`):**
    *   Button
    *   Badge
    *   Card
    *   Input
    *   Select
    *   StatusDot
    *   Spinner
    *   EmptyState
*   **App Shell Redesign:**
    *   Features a visually appealing gradient sidebar.
    *   Animated active route indicators for enhanced navigation feedback.
    *   Mobile slide-in menu for responsive design.

## 6. Development Environment Notes

*   **Repository:** `lostinthesauce719/tranquillo-green`
*   **Convex Functions:** Primarily uses `mutationGeneric` and `queryGeneric` from `"convex/server"`.
*   **Data Loaders:** Authentication handled via `getAuthenticatedConvexClient()`.
*   **GitHub Token Limitation:** The current GitHub token for CI/CD lacks `workflow` scope, which may impact workflows that attempt to push via the CLI.
*   **WSL Project Path:** `/home/justa/tranquillo-green` (maps to `C:\Users\justa\Desktop\tranquillo-green` on Windows).
*   **`eslint-config-next`:** Pinned to `v14` for stability.
