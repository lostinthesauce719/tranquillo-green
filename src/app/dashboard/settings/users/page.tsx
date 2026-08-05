"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/lib/auth/tenant-context";
import { ROLE_LABELS, type TenantRole } from "@/lib/auth/roles";
import { AppShell } from "@/components/shell/app-shell";
import Link from "next/link";

/* ── role badge colors ─────────────────────────────────────────────── */

const roleBadgeColor: Record<TenantRole, string> = {
  owner: "bg-amber-500/20 text-amber-300",
  controller: "bg-blue-500/20 text-blue-300",
  accountant: "bg-emerald-500/20 text-emerald-300",
  viewer: "bg-neutral-500/20 text-neutral-300",
};

const roleBadgeBorder: Record<TenantRole, string> = {
  owner: "border border-amber-500/20",
  controller: "border border-blue-500/20",
  accountant: "border border-emerald-500/20",
  viewer: "border border-neutral-500/20",
};

/* ── types ─────────────────────────────────────────────────────────── */

type MemberStatus = "active" | "pending";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  status: MemberStatus;
  joinedAt: string; // ISO date string
  avatarInitials: string;
  isSelf?: boolean;
}


const INVITABLE_ROLES: { value: TenantRole; label: string }[] = [
  { value: "controller", label: "Controller" },
  { value: "accountant", label: "Accountant" },
  { value: "viewer", label: "Viewer" },
];

const ALL_ROLES: { value: TenantRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "controller", label: "Controller" },
  { value: "accountant", label: "Accountant" },
  { value: "viewer", label: "Viewer" },
];

/* ── helpers ────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── Badge component ───────────────────────────────────────────────── */

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/* ── Avatar component ──────────────────────────────────────────────── */

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand">
      {initials}
    </div>
  );
}

/* ── Invite Modal ──────────────────────────────────────────────────── */

function InviteModal({
  onClose,
  isOwner,
}: {
  onClose: () => void;
  isOwner: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantRole>("viewer");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setTimeout(() => {
      alert(
        `Email invitations are not available yet. Ask ${email.trim()} to sign up, then link them to your company from this page.`
      );
      setSent(false);
      setEmail("");
      setRole("viewer");
      onClose();
    }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-lg shadow-black/30">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-text-primary">
            Invite Team Member
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Send an invitation to join your organization.
          </p>
        </div>

        {isOwner ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary placeholder:text-text-faint outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TenantRole)}
                className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-text-faint">
                {role === "controller" &&
                  "Can manage settings, users, and all data. Cannot transfer ownership."}
                {role === "accountant" &&
                  "Can view and edit accounting data. Cannot manage users or settings."}
                {role === "viewer" &&
                  "Read-only access to accounting data and reports."}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={sent || !email.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
              >
                {sent ? "Sending..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              Only the <strong>Owner</strong> can invite new team members.
              Contact your organization owner to request an invitation.
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Role Change Dropdown ──────────────────────────────────────────── */

function RoleChangeDropdown({
  member,
  onRoleChange,
  isOwner,
  isSelf,
}: {
  member: TeamMember;
  onRoleChange: (userId: string, newRole: TenantRole) => void;
  isOwner: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isOwner || isSelf) {
    return (
      <Badge className={`${roleBadgeColor[member.role]} ${roleBadgeBorder[member.role]}`}>
        {ROLE_LABELS[member.role]}
      </Badge>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition hover:opacity-80 ${roleBadgeColor[member.role]} ${roleBadgeBorder[member.role]}`}
      >
        {ROLE_LABELS[member.role]}
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className="h-3 w-3"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg shadow-black/30">
            {ALL_ROLES.filter((r) => r.value !== "owner").map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  onRoleChange(member.id, r.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-xs transition hover:bg-surface-overlay ${
                  member.role === r.value
                    ? "font-semibold text-brand"
                    : "text-text-secondary"
                }`}
              >
                {r.label}
                {member.role === r.value && (
                  <span className="ml-auto text-brand">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Remove Confirmation Modal ─────────────────────────────────────── */

function RemoveModal({
  member,
  onConfirm,
  onCancel,
}: {
  member: TeamMember;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-6 shadow-lg shadow-black/30">
        <h3 className="text-lg font-semibold text-text-primary">
          Remove Team Member
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Are you sure you want to remove{" "}
          <strong className="text-text-primary">{member.name}</strong> from the
          organization? This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onConfirm}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-danger/90"
          >
            Remove
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────── */

export default function UsersSettingsPage() {
  const tenant = useTenant();
  const isOwner = tenant.role === "owner";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/team?companyId=${tenant.companyId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load team members");
      setMembers(
        (data.members ?? []).map((m: any) => ({
          ...m,
          avatarInitials: (m.name || m.email || "?")
            .split(/\s+/)
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }))
      );
    } catch (e: any) {
      setError(e.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [tenant.companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRoleChange(userId: string, newRole: TenantRole) {
    const previous = members;
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    );
    try {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateRole", companyId: tenant.companyId, userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to update role");
    } catch (e: any) {
      setMembers(previous);
      setError(e.message || "Failed to update role");
    }
  }

  async function handleRemove(userId: string) {
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== userId));
    setRemovingMember(null);
    try {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", companyId: tenant.companyId, userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to remove member");
    } catch (e: any) {
      setMembers(previous);
      setError(e.message || "Failed to remove member");
    }
  }

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <AppShell
      title="Team Members"
      description="Manage who has access to your organization and their permissions."
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Header */}
      <section className="rounded-2xl border border-border bg-surface-mid p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">
              Team Management
            </div>
            <h2 className="mt-1 text-xl font-semibold">Team Members</h2>
            <p className="mt-1 text-sm text-text-muted">
              {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
              {activeCount} active · {pendingCount} pending
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!isOwner}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
            title={!isOwner ? "Only the Owner can invite team members" : undefined}
          >
            + Invite User
          </button>
        </div>

        {!isOwner && (
          <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-text-muted">
            <span className="mr-1">🔒</span>
            Only the Owner can invite, change roles, or remove team members.
          </div>
        )}
      </section>

      {/* Members list */}
      <section className="mt-6 space-y-3">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border/50 bg-surface-mid/50" />
          ))}
        {!loading && members.length === 0 && (
          <div className="rounded-xl border border-border bg-surface-mid px-5 py-10 text-center text-sm text-text-muted">
            No team members found.
          </div>
        )}
        {!loading && members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-surface-mid px-5 py-4 transition hover:border-border-subtle"
          >
            {/* Avatar */}
            <Avatar initials={member.avatarInitials} />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-text-primary">
                  {member.name}
                </span>
                {member.isSelf && (
                  <span className="shrink-0 rounded-md bg-brand/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand">
                    You
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-text-muted">
                {member.email}
              </div>
            </div>

            {/* Role badge / dropdown */}
            <div className="hidden sm:block">
              <RoleChangeDropdown
                member={member}
                onRoleChange={handleRoleChange}
                isOwner={isOwner}
                isSelf={member.isSelf ?? false}
              />
            </div>

            {/* Status */}
            <div className="hidden sm:block">
              {member.status === "active" ? (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                  Pending
                </span>
              )}
            </div>

            {/* Join date */}
            <div className="hidden text-xs text-text-faint sm:block">
              {formatDate(member.joinedAt)}
            </div>

            {/* Remove button */}
            <div className="shrink-0">
              {isOwner && member.id !== "usr_1" ? (
                <button
                  onClick={() => setRemovingMember(member)}
                  className="rounded-lg px-2.5 py-1.5 text-xs text-text-faint transition hover:bg-danger/10 hover:text-danger"
                  title={`Remove ${member.name}`}
                >
                  Remove
                </button>
              ) : (
                <span
                  className="cursor-not-allowed px-2.5 py-1.5 text-xs text-text-faint/30"
                  title={
                    member.id === "usr_1"
                      ? "Cannot remove yourself"
                      : "Only the Owner can remove team members"
                  }
                >
                  Remove
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Role permissions reference */}
      <section className="mt-8 rounded-2xl border border-border bg-surface-mid p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">
          Role Permissions
        </div>
        <h3 className="mt-1 text-lg font-semibold">What each role can do</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
            <Badge className={`${roleBadgeColor["owner"]} ${roleBadgeBorder["owner"]}`}>
              Owner
            </Badge>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              <li>• Full access to all features and data</li>
              <li>• Invite, change roles, and remove members</li>
              <li>• Manage billing and subscription</li>
              <li>• Transfer or delete the organization</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
            <Badge className={`${roleBadgeColor["controller"]} ${roleBadgeBorder["controller"]}`}>
              Controller
            </Badge>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              <li>• Full access to accounting and compliance</li>
              <li>• Manage settings and configurations</li>
              <li>• View audit logs and reports</li>
              <li>• Cannot manage users or billing</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
            <Badge className={`${roleBadgeColor["accountant"]} ${roleBadgeBorder["accountant"]}`}>
              Accountant
            </Badge>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              <li>• View and edit accounting transactions</li>
              <li>• Create journal entries and allocations</li>
              <li>• Run reports and reconciliations</li>
              <li>• Cannot manage users or settings</li>
            </ul>
          </div>
          <div className="rounded-xl border border-neutral-500/10 bg-neutral-500/5 p-4">
            <Badge className={`${roleBadgeColor["viewer"]} ${roleBadgeBorder["viewer"]}`}>
              Viewer
            </Badge>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              <li>• Read-only access to dashboards</li>
              <li>• View reports and financial data</li>
              <li>• Export data for review</li>
              <li>• Cannot make any changes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/dashboard/settings"
          className="text-sm text-text-muted transition hover:text-text-primary"
        >
          ← Back to Settings
        </Link>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          isOwner={isOwner}
        />
      )}

      {removingMember && (
        <RemoveModal
          member={removingMember}
          onConfirm={() => handleRemove(removingMember.id)}
          onCancel={() => setRemovingMember(null)}
        />
      )}
    </AppShell>
  );
}
