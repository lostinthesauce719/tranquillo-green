"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/auth/tenant-context";

type Location = {
  _id: string;
  name: string;
  licenseNumber: string;
  state: string;
  city: string;
  isPrimary: boolean;
  squareFootage?: number;
};

export function LocationManager() {
  const tenant = useTenant();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [isPrimary, setIsPrimary] = useState(false);
  const [sqft, setSqft] = useState("");

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const res = await fetch(`/api/settings/locations?companyId=${tenant.companyId}`);
      const data = await res.json();
      if (data.ok) setLocations(data.locations);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!name || !license || !city) return;
    setSaving(true);

    try {
      const res = await fetch("/api/settings/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: tenant.companyId,
          name,
          licenseNumber: license,
          state,
          city,
          isPrimary: isPrimary || locations.length === 0,
          squareFootage: sqft ? Number(sqft) : undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setLocations((prev) => [...prev, data.location]);
        setShowAdd(false);
        setName("");
        setLicense("");
        setCity("");
        setSqft("");
        setIsPrimary(false);
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(locationId: string) {
    try {
      await fetch(`/api/settings/locations?id=${locationId}`, { method: "DELETE" });
      setLocations((prev) => prev.filter((l) => l._id !== locationId));
    } catch {
      // silent fail
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-mid p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Locations</div>
          <h2 className="mt-1 text-lg font-semibold">
            {locations.length} {locations.length === 1 ? "Location" : "Locations"}
          </h2>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-muted transition hover:border-brand hover:text-text-primary"
        >
          {showAdd ? "Cancel" : "+ Add Location"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">Location Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Oakland Flagship"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">License Number</label>
              <input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="C10-0000123-LIC"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Oakland"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              >
                {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              Primary location
            </label>
            <div className="flex-1">
              <input
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="Square footage (optional)"
                type="number"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !name || !license || !city}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Location"}
          </button>
        </div>
      )}

      {/* Location list */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="text-sm text-text-muted">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="text-sm text-text-muted">No locations yet. Add your first location above.</div>
        ) : (
          locations.map((loc) => (
            <div key={loc._id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{loc.name}</span>
                  {loc.isPrimary && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                      Primary
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  {loc.city}, {loc.state} • {loc.licenseNumber}
                </div>
              </div>
              <button
                onClick={() => handleDelete(loc._id)}
                className="rounded-lg px-2 py-1 text-xs text-text-faint transition hover:bg-danger-soft hover:text-danger"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
