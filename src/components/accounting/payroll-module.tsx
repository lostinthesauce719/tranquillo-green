"use client";

import { useState, useMemo } from "react";
import {
  Users,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Employee = {
  id: string;
  name: string;
  role: string;
  payRate: number; // hourly rate
  hoursPerPeriod: number;
  allocation: number; // % plant-touching (0-100)
};

type PayrollSummary = {
  totalLaborCost: number;
  plantTouchingCost: number;
  nonPlantTouchingCost: number;
  plantTouchingPercent: number;
  employeeCount: number;
};

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Maria Garcia", role: "Budtender", payRate: 22, hoursPerPeriod: 160, allocation: 100 },
  { id: "e2", name: "James Chen", role: "Trimmer", payRate: 20, hoursPerPeriod: 160, allocation: 100 },
  { id: "e3", name: "Sarah Johnson", role: "Store Manager", payRate: 28, hoursPerPeriod: 160, allocation: 40 },
  { id: "e4", name: "Mike Williams", role: "Security", payRate: 18, hoursPerPeriod: 120, allocation: 0 },
  { id: "e5", name: "Lisa Park", role: "Cashier", payRate: 19, hoursPerPeriod: 140, allocation: 100 },
  { id: "e6", name: "David Brown", role: "Assistant Manager", payRate: 25, hoursPerPeriod: 160, allocation: 30 },
];

const ROLE_SUGGESTIONS = [
  { role: "Budtender", defaultAllocation: 100 },
  { role: "Trimmer", defaultAllocation: 100 },
  { role: "Cultivator", defaultAllocation: 100 },
  { role: "Harvester", defaultAllocation: 100 },
  { role: "Packager", defaultAllocation: 100 },
  { role: "Store Manager", defaultAllocation: 40 },
  { role: "Assistant Manager", defaultAllocation: 30 },
  { role: "Cashier", defaultAllocation: 100 },
  { role: "Security", defaultAllocation: 0 },
  { role: "Receptionist", defaultAllocation: 0 },
  { role: "Bookkeeper", defaultAllocation: 0 },
  { role: "Marketing", defaultAllocation: 0 },
  { role: "Delivery Driver", defaultAllocation: 50 },
];

// ─── Currency Formatter ─────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ─── Main Component ─────────────────────────────────────────────────────────

export function PayrollModule() {
  const [employees, setEmployees] = useState<Employee[]>(DEMO_EMPLOYEES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newHours, setNewHours] = useState("160");
  const [newAllocation, setNewAllocation] = useState(100);
  const [activeStep, setActiveStep] = useState(1);

  const summary: PayrollSummary = useMemo(() => {
    const totalLaborCost = employees.reduce((sum, e) => sum + e.payRate * e.hoursPerPeriod, 0);
    const plantTouchingCost = employees.reduce(
      (sum, e) => sum + e.payRate * e.hoursPerPeriod * (e.allocation / 100),
      0
    );
    const nonPlantTouchingCost = totalLaborCost - plantTouchingCost;
    const plantTouchingPercent = totalLaborCost > 0 ? (plantTouchingCost / totalLaborCost) * 100 : 0;
    return {
      totalLaborCost,
      plantTouchingCost,
      nonPlantTouchingCost,
      plantTouchingPercent,
      employeeCount: employees.length,
    };
  }, [employees]);

  function handleAddEmployee() {
    if (!newName.trim() || !newRole.trim() || !newRate) return;
    const emp: Employee = {
      id: `e_${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim(),
      payRate: parseFloat(newRate) || 0,
      hoursPerPeriod: parseFloat(newHours) || 160,
      allocation: newAllocation,
    };
    setEmployees((prev) => [...prev, emp]);
    setNewName("");
    setNewRole("");
    setNewRate("");
    setNewHours("160");
    setNewAllocation(100);
    setShowAddForm(false);
  }

  function handleRemoveEmployee(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  function handleUpdateAllocation(id: string, allocation: number) {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, allocation } : e))
    );
  }

  function handleExportPayroll() {
    const lines = [
      "Employee,Role,Pay Rate,Hours,Total Cost,Plant-Touching %,Plant-Touching Cost,Non-Plant Cost",
    ];
    employees.forEach((e) => {
      const total = e.payRate * e.hoursPerPeriod;
      const plant = total * (e.allocation / 100);
      const nonPlant = total - plant;
      lines.push(
        `${e.name},${e.role},${e.payRate},${e.hoursPerPeriod},${total},${e.allocation}%,${plant},${nonPlant}`
      );
    });
    lines.push("");
    lines.push(`Total Labor Cost,${summary.totalLaborCost}`);
    lines.push(`Plant-Touching (COGS),${summary.plantTouchingCost}`);
    lines.push(`Non-Plant (OpEx),${summary.nonPlantTouchingCost}`);
    lines.push(`Plant-Touching %,${summary.plantTouchingPercent.toFixed(1)}%`);

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-allocation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Premium badge */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
          ⭐ PREMIUM
        </div>
        <span className="text-xs text-text-muted">Cultivator plan and above</span>
      </div>

      {/* Demo mode banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong>Demo mode</strong> — Showing sample payroll data. Connect your live payroll system for automated 280E labor allocation.
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            onClick={() => setActiveStep(step)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeStep === step
                ? "bg-brand text-white"
                : "border border-border bg-surface text-text-muted hover:text-text-primary"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {step}
            </span>
            {step === 1 && "Add Employees"}
            {step === 2 && "Set Allocation"}
            {step === 3 && "Review & Export"}
          </button>
        ))}
      </div>

      {/* Step 1: Employee List */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Employees</h3>
              <p className="text-sm text-text-muted">
                Add your team members. Plant-touching employees count toward COGS under 280E.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-3">
              <div className="text-sm font-medium text-text-primary">New Employee</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      setNewRole(e.target.value);
                      const suggestion = ROLE_SUGGESTIONS.find((r) => r.role === e.target.value);
                      if (suggestion) setNewAllocation(suggestion.defaultAllocation);
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  >
                    <option value="">Select role…</option>
                    {ROLE_SUGGESTIONS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.role} ({r.defaultAllocation}% plant)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="22.00"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Hours / Period</label>
                  <input
                    type="number"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-text-muted">
                    Plant-Touching Allocation: {newAllocation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={newAllocation}
                    onChange={(e) => setNewAllocation(parseInt(e.target.value))}
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-[10px] text-text-faint">
                    <span>0% (Admin)</span>
                    <span>50% (Split)</span>
                    <span>100% (Plant)</span>
                  </div>
                </div>
                <button
                  onClick={handleAddEmployee}
                  disabled={!newName.trim() || !newRole.trim() || !newRate}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Employee table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted">Employee</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-muted">Role</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Rate</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Hours</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Total Cost</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Plant %</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const total = emp.payRate * emp.hoursPerPeriod;
                  return (
                    <tr key={emp.id} className="border-b border-border/50 hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium text-text-primary">{emp.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{emp.role}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">${emp.payRate.toFixed(2)}/hr</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{emp.hoursPerPeriod}</td>
                      <td className="px-4 py-3 text-right text-text-primary">{fmt.format(total)}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            emp.allocation === 100
                              ? "bg-emerald-500/15 text-emerald-300"
                              : emp.allocation === 0
                              ? "bg-blue-500/15 text-blue-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {emp.allocation}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="rounded p-1 text-text-faint transition hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setActiveStep(2)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              Next: Set Allocation →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Allocation */}
      {activeStep === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Plant-Touching Allocation</h3>
            <p className="text-sm text-text-muted">
              For each employee, set what percentage of their time is spent on plant-touching activities (COGS) vs non-plant-touching (OpEx).
              Under 280E, only plant-touching labor is deductible as COGS.
            </p>
          </div>

          {/* Quick info */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>What counts as plant-touching?</strong> Direct work with the plant: trimming, harvesting, packaging, curing, quality control.
                Non-plant-touching: management, security, marketing, bookkeeping, reception.
              </div>
            </div>
          </div>

          {/* Allocation sliders */}
          <div className="space-y-3">
            {employees.map((emp) => {
              const total = emp.payRate * emp.hoursPerPeriod;
              const plantCost = total * (emp.allocation / 100);
              const nonPlantCost = total - plantCost;
              return (
                <div key={emp.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-text-primary">{emp.name}</div>
                      <div className="text-xs text-text-muted">{emp.role} • {fmt.format(total)} total</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-brand">{emp.allocation}% plant</div>
                      <div className="text-xs text-text-muted">{100 - emp.allocation}% non-plant</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={emp.allocation}
                    onChange={(e) => handleUpdateAllocation(emp.id, parseInt(e.target.value))}
                    className="w-full accent-brand"
                  />
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-emerald-300">COGS: {fmt.format(plantCost)}</span>
                    <span className="text-blue-300">OpEx: {fmt.format(nonPlantCost)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setActiveStep(1)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
            >
              ← Back
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              Next: Review & Export →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Export */}
      {activeStep === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Payroll Allocation Summary</h3>
            <p className="text-sm text-text-muted">
              Review your 280E labor allocation before exporting.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-xs text-text-muted">Total Labor Cost</div>
              <div className="mt-1 text-2xl font-bold text-text-primary">{fmt.format(summary.totalLaborCost)}</div>
              <div className="mt-1 text-xs text-text-muted">{summary.employeeCount} employees</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-xs text-emerald-300">Plant-Touching (COGS)</div>
              <div className="mt-1 text-2xl font-bold text-emerald-300">{fmt.format(summary.plantTouchingCost)}</div>
              <div className="mt-1 text-xs text-emerald-300/70">{summary.plantTouchingPercent.toFixed(1)}% of total labor</div>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="text-xs text-blue-300">Non-Plant-Touching (OpEx)</div>
              <div className="mt-1 text-2xl font-bold text-blue-300">{fmt.format(summary.nonPlantTouchingCost)}</div>
              <div className="mt-1 text-xs text-blue-300/70">{(100 - summary.plantTouchingPercent).toFixed(1)}% of total labor</div>
            </div>
          </div>

          {/* 280E Impact */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
            <h4 className="font-semibold text-brand">280E Impact</h4>
            <p className="mt-1 text-sm text-text-muted">
              By allocating {fmt.format(summary.plantTouchingCost)} to plant-touching labor (COGS), you reduce your taxable income by this amount.
              At a 21% federal tax rate, this saves approximately{" "}
              <span className="font-medium text-brand">
                {fmt.format(summary.plantTouchingCost * 0.21)}
              </span>{" "}
              in federal taxes per period.
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPayroll}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              <Download className="h-4 w-4" />
              Export Payroll Allocation
            </button>
            <button
              onClick={() => setActiveStep(1)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted transition hover:text-text-primary"
            >
              ← Edit Employees
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
