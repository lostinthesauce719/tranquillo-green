import type { TenantRole } from "@/lib/auth/roles";

export type OnboardingMilestoneStatus = "complete" | "active" | "upcoming";

export type OnboardingMilestone = {
  title: string;
  owner: string;
  eta: string;
  status: OnboardingMilestoneStatus;
  detail: string;
  href: string;
};

export type FirstWinChecklistItem = {
  title: string;
  status: OnboardingMilestoneStatus;
  detail: string;
  outcome: string;
  href: string;
};

export type WorkflowStep = {
  title: string;
  eyebrow: string;
  detail: string;
  href: string;
};

export type RoleQuickstart = {
  role: TenantRole;
  title: string;
  summary: string;
  firstAction: string;
  secondAction: string;
  href: string;
};

export const onboardingMilestones: OnboardingMilestone[] = [
  {
    title: "Connect source files",
    owner: "Accounting lead",
    eta: "15 min",
    status: "active",
    detail: "Stage bank, POS, and payroll files so the import workspace can normalize the month without touching live books.",
    href: "/dashboard/accounting/imports",
  },
  {
    title: "Clear review blockers",
    owner: "Staff accountant",
    eta: "20 min",
    status: "upcoming",
    detail: "Work the transaction pipeline, repair warnings, and document exceptions before anything moves downstream.",
    href: "/dashboard/accounting/pipeline",
  },
  {
    title: "Approve 280E allocations",
    owner: "Controller",
    eta: "12 min",
    status: "upcoming",
    detail: "Review support gaps, policy variance, and recommendation confidence before accepting the tax posture.",
    href: "/dashboard/allocations",
  },
  {
    title: "Package the CPA handoff",
    owner: "Founder + CPA",
    eta: "10 min",
    status: "upcoming",
    detail: "Confirm reconciliations, attach support schedules, and generate a packet that tells the close story end to end.",
    href: "/dashboard/exports",
  },
];

export const firstWinChecklist: FirstWinChecklistItem[] = [
  {
    title: "Land one clean import",
    status: "active",
    detail: "Use the staged bank or payroll file to show mapping, validation, and row-level confidence in one place.",
    outcome: "Users see how messy data becomes reviewable accounting work.",
    href: "/dashboard/accounting/imports",
  },
  {
    title: "Resolve a visible exception",
    status: "upcoming",
    detail: "Open the pipeline and repair a warning so the product demonstrates controlled recovery instead of black-box automation.",
    outcome: "The product earns trust by showing the why, not just the result.",
    href: "/dashboard/accounting/pipeline",
  },
  {
    title: "Approve one allocation with evidence",
    status: "upcoming",
    detail: "Walk a reviewer through support links, policy basis, and expected tax impact before acceptance.",
    outcome: "Operators understand how 280E decisions become defensible.",
    href: "/dashboard/allocations",
  },
  {
    title: "Export a handoff packet",
    status: "upcoming",
    detail: "Finish by opening the export center and showing the CPA-ready narrative, checklist, and audit trail.",
    outcome: "The workflow ends in a downstream-ready packet, not another spreadsheet chase.",
    href: "/dashboard/exports",
  },
];

export const workflowJourney: WorkflowStep[] = [
  {
    eyebrow: "Step 1",
    title: "Import",
    detail: "Bring in source files, apply mappings, and validate rows before promotion.",
    href: "/dashboard/accounting/imports",
  },
  {
    eyebrow: "Step 2",
    title: "Review",
    detail: "Use the transaction pipeline to fix warnings and explain edge cases.",
    href: "/dashboard/accounting/pipeline",
  },
  {
    eyebrow: "Step 3",
    title: "Allocate",
    detail: "Route shared spend into 280E logic with support and override controls.",
    href: "/dashboard/allocations",
  },
  {
    eyebrow: "Step 4",
    title: "Reconcile",
    detail: "Tie cash back to source systems and surface variance drivers clearly.",
    href: "/dashboard/reconciliations",
  },
  {
    eyebrow: "Step 5",
    title: "Export",
    detail: "Package schedules, narrative, and evidence for the CPA handoff.",
    href: "/dashboard/exports",
  },
];

export const roleQuickstarts: RoleQuickstart[] = [
  {
    role: "owner",
    title: "Founder / owner quickstart",
    summary: "Understand whether the month is controllable fast: what is staged, what is risky, and what your CPA will receive.",
    firstAction: "Start in onboarding to see the guided close path and current blockers.",
    secondAction: "Jump to exports once you want the downstream handoff story.",
    href: "/dashboard/onboarding",
  },
  {
    role: "controller",
    title: "Controller quickstart",
    summary: "Verify that imports, allocations, and reconciliations are explainable before you sign off anything material.",
    firstAction: "Open the transaction pipeline to clear warnings and blocked promotions.",
    secondAction: "Review allocations once the source data is stable.",
    href: "/dashboard/accounting/pipeline",
  },
  {
    role: "accountant",
    title: "Staff accountant quickstart",
    summary: "Earn the first win by getting one dataset from intake to review-ready without introducing silent automation risk.",
    firstAction: "Open imports and show mapping plus row-level validation.",
    secondAction: "Promote ready rows and hand exceptions forward to controller review.",
    href: "/dashboard/accounting/imports",
  },
  {
    role: "viewer",
    title: "Viewer / advisor quickstart",
    summary: "Follow the narrative of the close without touching any posting logic: onboarding, evidence, and final handoff.",
    firstAction: "Read the onboarding workspace to understand the sequence and responsibilities.",
    secondAction: "Open the export center for the final packet view.",
    href: "/dashboard/onboarding",
  },
];
