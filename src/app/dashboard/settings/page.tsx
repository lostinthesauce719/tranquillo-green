"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useTenant } from "@/lib/auth/tenant-context";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { AppShell } from "@/components/shell/app-shell";
import { californiaOperatorDemo } from "@/lib/demo/accounting";
import { LocationManager } from "@/components/shell/location-manager";

const OPERATOR_TYPES = [
  { value: "dispensary", label: "Dispensary" },
  { value: "cultivator", label: "Cultivator" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "delivery", label: "Delivery" },
  { value: "vertical", label: "Vertical (Integrated)" },
];

const ACCOUNTING_METHODS = [
  { value: "cash", label: "Cash Basis" },
  { value: "accrual", label: "Accrual Basis" },
];

const operatorTypeLabels: Record<string, string> = {
  dispensary: "Dispensary",
  cultivator: "Cultivator",
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  delivery: "Delivery",
  vertical: "Vertical Integration",
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const roleBadgeColor: Record<string, string> = {
  owner: "bg-amber-500/20 text-amber-300",
  controller: "bg-blue-500/20 text-blue-300",
  accountant: "bg-emerald-500/20 text-emerald-300",
  viewer: "bg-neutral-500/20 text-neutral-300",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}>
      {children}
    </span>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function StateSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand"
      >
        {US_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

const OPERATOR_ICONS: Record<string, string> = {
  dispensary: "🏪",
  cultivator: "🌱",
  manufacturer: "⚗️",
  distributor: "🚛",
  delivery: "🛵",
  vertical: "🌿",
};

type Operation = {
  id: string;
  name: string;
  operatorType: string;
  state: string;
  accountingMethod: string;
  isActive: boolean;
};

const DEMO_OPERATIONS: Operation[] = [
  { id: "op_1", name: "Demo Dispensary", operatorType: "dispensary", state: "CA", accountingMethod: "cash", isActive: true },
  { id: "op_2", name: "Emerald Cultivation", operatorType: "cultivator", state: "CA", accountingMethod: "accrual", isActive: false },
  { id: "op_3", name: "Green Rush Delivery", operatorType: "delivery", state: "CA", accountingMethod: "cash", isActive: false },
];

function OperationsPanel() {
  const [operations, setOperations] = useState<Operation[]>(DEMO_OPERATIONS);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // New operation form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("dispensary");
  const [newState, setNewState] = useState("CA");
  const [newMethod, setNewMethod] = useState("cash");

  function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    // Demo: add locally
    const newOp: Operation = {
      id: `op_${Date.now()}`,
      name: newName.trim(),
      operatorType: newType,
      state: newState,
      accountingMethod: newMethod,
      isActive: false,
    };
    setOperations((prev) => [...prev, newOp]);
    setNewName("");
    setNewType("dispensary");
    setNewState("CA");
    setNewMethod("cash");
    setShowAdd(false);
    setSaving(false);
  }

  function handleActivate(id: string) {
    setOperations((prev) =>
      prev.map((op) => ({ ...op, isActive: op.id === id }))
    );
  }

  function handleRemove(id: string) {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-mid p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Operations</div>
          <h2 className="mt-1 text-xl font-semibold">Your Profiles</h2>
          <p className="mt-1 text-sm text-text-muted">
            Manage multiple cannabis operations. Each profile has its own operator type, chart of accounts, and compliance settings.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {showAdd ? "Cancel" : "+ Add Operation"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="text-sm font-medium text-text-primary">New Operation</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Bay Area Delivery Co."
                className="w-full rounded-lg border border-border bg-surface-mid px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
              />
            </div>
            <SelectField label="Type" value={newType} options={OPERATOR_TYPES} onChange={(v) => setNewType(v)} />
            <StateSelect label="State" value={newState} onChange={setNewState} />
            <SelectField label="Accounting" value={newMethod} options={ACCOUNTING_METHODS} onChange={(v) => setNewMethod(v)} />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Operation"}
          </button>
        </div>
      )}

      {/* Operations list */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <div
            key={op.id}
            className={`rounded-xl border p-4 transition ${
              op.isActive
                ? "border-brand bg-brand/5"
                : "border-border bg-surface hover:border-brand/30"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{OPERATOR_ICONS[op.operatorType] ?? "🏢"}</span>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{op.name}</div>
                  <div className="text-xs text-text-muted">
                    {operatorTypeLabels[op.operatorType] ?? op.operatorType} · {op.state}
                  </div>
                </div>
              </div>
              {op.isActive && (
                <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  Active
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!op.isActive && (
                <button
                  onClick={() => handleActivate(op.id)}
                  className="rounded-lg border border-border bg-surface-mid px-2.5 py-1 text-xs text-text-muted transition hover:border-brand hover:text-text-primary"
                >
                  Activate
                </button>
              )}
              {!op.isActive && (
                <button
                  onClick={() => handleRemove(op.id)}
                  className="rounded-lg px-2.5 py-1 text-xs text-text-faint transition hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const tenant = useTenant();
  const { user } = useUser();

  const demo = californiaOperatorDemo;

  // QBO integration state
  const [qboStatus, setQboStatus] = useState<{
    connected: boolean;
    status: string;
    realmId?: string;
    connectedAt?: number;
  }>({ connected: false, status: "loading" });
  const [qboFeedback, setQboFeedback] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    // Check URL params for integration feedback
    const params = new URLSearchParams(window.location.search);
    const integration = params.get("integration");
    const status = params.get("status");
    if (integration === "quickbooks" && status) {
      if (status === "connected") setQboFeedback("QuickBooks connected successfully!");
      else if (status === "error") setQboFeedback("Failed to connect QuickBooks. Please try again.");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Fetch current QBO status
    fetch("/api/integrations/quickbooks/status")
      .then((r) => r.json())
      .then((data) => setQboStatus(data))
      .catch(() => setQboStatus({ connected: false, status: "error" }));
  }, []);

  async function handleDisconnectQBO() {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/quickbooks/disconnect", { method: "POST" });
      setQboStatus({ connected: false, status: "not_connected" });
      setQboFeedback("QuickBooks disconnected.");
    } catch {
      setQboFeedback("Failed to disconnect. Try again.");
    }
    setDisconnecting(false);
  }
  const company = demo.company;
  const locations = demo.locations;
  const role = tenant.role;
  const canEdit = role === "owner" || role === "controller";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable fields
  const [operatorType, setOperatorType] = useState(tenant.operatorType ?? company.operatorType);
  const [accountingMethod, setAccountingMethod] = useState(company.defaultAccountingMethod);
  const [state, setState] = useState(company.state);

  const accountingMethodLabels: Record<string, string> = {
    cash: "Cash Basis",
    accrual: "Accrual Basis",
  };

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: tenant.companyId,
          operatorType,
          accountingMethod,
          state,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "Settings saved. Refresh to see nav changes." });
        setEditing(false);
      } else {
        setMessage({ type: "error", text: data.message ?? "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Settings"
      description="Company profile, locations, integrations, and your account details."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Profile */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Company Profile</div>
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:border-brand hover:text-text-primary"
              >
                Edit
              </button>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold">{tenant.companyName}</h2>

          {editing ? (
            <div className="mt-5 space-y-4">
              <StateSelect label="State" value={state} onChange={setState} />
              <SelectField label="Operator Type" value={operatorType} options={OPERATOR_TYPES} onChange={(v) => setOperatorType(v as typeof operatorType)} />
              <SelectField label="Accounting Method" value={accountingMethod} options={ACCOUNTING_METHODS} onChange={(v) => setAccountingMethod(v as typeof accountingMethod)} />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setOperatorType(tenant.operatorType ?? company.operatorType);
                    setAccountingMethod(company.defaultAccountingMethod);
                    setState(company.state);
                  }}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <InfoRow label="State" value={state === "CA" ? "California" : state} />
              <InfoRow label="Operator Type" value={operatorTypeLabels[operatorType] ?? operatorType} />
              <InfoRow label="Accounting Method" value={accountingMethodLabels[accountingMethod] ?? accountingMethod} />
              <InfoRow label="Status" value="Active" />
            </div>
          )}

          {message && (
            <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${message.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
              {message.text}
            </div>
          )}
        </section>

        {/* Current User */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Current User</div>
          <h2 className="mt-2 text-xl font-semibold">{user?.fullName ?? user?.firstName ?? "Loading..."}</h2>
          <p className="mt-2 max-w-lg text-sm text-text-muted">
            Your account details and role within this tenant.
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Email</span>
              <span className="text-sm font-medium text-text-primary">
                {user?.primaryEmailAddress?.emailAddress ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Role</span>
              <Badge className={roleBadgeColor[role]}>
                {ROLE_LABELS[role]}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-text-muted">Tenant</span>
              <span className="text-sm font-medium text-text-primary">{tenant.companyName}</span>
            </div>
          </div>
        </section>

        {/* Locations — managed */}
        <LocationManager />

        {/* Operations — multi-profile */}
        <OperationsPanel />

        {/* Integration Status */}
        <section className="rounded-2xl border border-border bg-surface-mid p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Integrations</div>
          <h2 className="mt-2 text-xl font-semibold">Connection Status</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Clerk</div>
                  <div className="mt-1 text-xs text-text-muted">Authentication and user management</div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">Connected</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Convex</div>
                  <div className="mt-1 text-xs text-text-muted">Real-time database and backend</div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">Connected</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">Metrc</div>
                  <div className="mt-1 text-xs text-text-muted">Cannabis compliance tracking</div>
                </div>
                <Badge className="bg-neutral-500/20 text-neutral-300">Coming Soon</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text-primary">QuickBooks</div>
                  <div className="mt-1 text-xs text-text-muted">
                    {qboStatus.connected
                      ? `Connected (realm ${qboStatus.realmId})`
                      : "Accounting sync — connect your QBO account"}
                  </div>
                </div>
                {qboStatus.status === "loading" ? (
                  <Badge className="bg-neutral-500/20 text-neutral-300">Loading...</Badge>
                ) : qboStatus.connected ? (
                  <button
                    onClick={handleDisconnectQBO}
                    disabled={disconnecting}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <a
                    href="/api/integrations/quickbooks/connect"
                    className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-medium text-brand-green transition hover:bg-brand-green/20"
                  >
                    Connect
                  </a>
                )}
              </div>
              {qboFeedback && (
                <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${
                  qboFeedback.includes("success") || qboFeedback.includes("connected")
                    ? "bg-emerald-500/10 text-emerald-300"
                    : qboFeedback.includes("disconnected")
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-red-500/10 text-red-300"
                }`}>
                  {qboFeedback}
                  <button
                    onClick={() => setQboFeedback(null)}
                    className="ml-2 opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
