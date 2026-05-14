"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import {
  Shield,
  CreditCard,
  Trash2,
  Key,
  User,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";

/* ── Shared UI ────────────────────────────────────────────────── */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-mid">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-text-muted/60">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-text-primary">{value}</dd>
    </div>
  );
}

function ActionRow({
  label,
  description,
  onClick,
  variant = "default",
  icon: Icon,
}: {
  label: string;
  description: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  icon?: React.ElementType;
}) {
  const isDanger = variant === "danger";
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
        isDanger
          ? "border-danger/20 bg-danger-soft hover:bg-danger/15"
          : "border-border/50 bg-surface hover:bg-surface-overlay"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            className={`h-4 w-4 ${isDanger ? "text-danger" : "text-text-muted"}`}
          />
        )}
        <div>
          <div
            className={`text-sm font-medium ${isDanger ? "text-danger" : "text-text-primary"}`}
          >
            {label}
          </div>
          <div className="text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <ChevronRight
        className={`h-4 w-4 ${isDanger ? "text-danger/50" : "text-text-faint"}`}
      />
    </button>
  );
}

/* ── Profile Section ──────────────────────────────────────────── */

function ProfileSection() {
  const { user } = useUser();

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "—"
    : "—";
  const primaryEmail =
    user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? "—";

  return (
    <Section title="Profile" icon={User}>
      <dl className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Full Name" value={fullName} />
        <Field label="Email" value={primaryEmail} />
        <Field
          label="Member Since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
        />
      </dl>
      <div className="mt-5">
        <p className="text-xs text-text-muted">
          To edit your name or email, open the{" "}
          <span className="font-medium text-text-secondary">
            Manage Profile
          </span>{" "}
          panel below.
        </p>
      </div>
    </Section>
  );
}

/* ── Security Section ─────────────────────────────────────────── */

function SecuritySection() {
  const { user } = useUser();

  const hasTOTP = user?.totpEnabled ?? false;
  const hasPassword = user?.passwordEnabled ?? false;

  return (
    <Section title="Security" icon={Shield}>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <Key className="h-4 w-4 text-text-muted" />
            <div>
              <div className="text-sm font-medium">Password</div>
              <div className="text-xs text-text-muted">
                {hasPassword
                  ? "Password is set"
                  : "No password — using social sign-in only"}
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              hasPassword
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-neutral-500/20 text-neutral-400"
            }`}
          >
            {hasPassword ? "Active" : "None"}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-text-muted" />
            <div>
              <div className="text-sm font-medium">
                Two-Factor Authentication (TOTP)
              </div>
              <div className="text-xs text-text-muted">
                {hasTOTP
                  ? "Authenticator app is configured"
                  : "Add extra security with an authenticator app"}
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              hasTOTP
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-300"
            }`}
          >
            {hasTOTP ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs text-text-muted">
          Change your password or manage two-factor authentication using the{" "}
          <span className="font-medium text-text-secondary">
            Manage Profile
          </span>{" "}
          panel below.
        </p>
      </div>
    </Section>
  );
}

/* ── Account Section ──────────────────────────────────────────── */

function AccountSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <Section title="Account" icon={CreditCard}>
      <div className="space-y-3">
        {/* Plan status */}
        <div className="rounded-xl border border-border/50 bg-surface px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current Plan</div>
              <div className="text-xs text-text-muted">
                Your subscription and billing details
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Active
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Plan" value="Professional" />
            <Field label="Billing Cycle" value="Monthly" />
            <Field label="Next Billing" value="May 15, 2026" />
          </div>
        </div>

        {/* Billing link */}
        <ActionRow
          label="Manage Billing"
          description="View invoices, update payment method, or change plan"
          icon={CreditCard}
          onClick={() => {
            /* billing portal link would go here */
          }}
        />

        {/* Danger zone */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3 text-[11px] uppercase tracking-wider text-danger/70">
            Danger Zone
          </div>

          {!showDeleteConfirm ? (
            <ActionRow
              label="Delete Account"
              description="Permanently delete your account and all associated data"
              icon={Trash2}
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            />
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger-soft p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <div className="text-sm font-semibold text-danger">
                    Are you sure?
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    This action cannot be undone. All your data, transactions,
                    and configurations will be permanently deleted.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-overlay"
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-danger/90"
                      onClick={() => {
                        /* delete account mutation would go here */
                      }}
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ── Clerk UserProfile Panel ──────────────────────────────────── */

function ClerkProfileManager() {
  return (
    <Section title="Manage Profile" icon={User}>
      <p className="mb-4 text-xs text-text-muted">
        Use the panel below to update your name, email, password, and
        two-factor authentication settings. Changes are saved to your Clerk
        account directly.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <UserProfile
          path="/dashboard/settings/account"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none border-0 rounded-none",
              navbar: "hidden",
              pageScrollBox: "px-0",
            },
            variables: {
              colorPrimary: "#22855a",
              colorBackground: "#0e1526",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94A3B8",
              colorInputText: "#f1f5f9",
              colorInputBackground: "#141d33",
              borderRadius: "12px",
            },
          }}
        />
      </div>
    </Section>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function AccountSettingsPage() {
  return (
    <AppShell
      title="Account Settings"
      description="Manage your personal profile, security settings, and account preferences."
    >
      <div className="space-y-6">
        <ProfileSection />
        <SecuritySection />
        <AccountSection />
        <ClerkProfileManager />
      </div>
    </AppShell>
  );
}
