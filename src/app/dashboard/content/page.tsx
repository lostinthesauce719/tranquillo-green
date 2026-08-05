"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { useTenant } from "@/lib/auth/tenant-context";
import {
  FileText,
  CalendarClock,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  PenSquare,
} from "lucide-react";

type ContentStatus = "draft" | "scheduled" | "published";

interface ContentItem {
  _id: string;
  title: string;
  channel: string;
  status: ContentStatus;
  scheduledFor?: string;
  body?: string;
}

const CHANNELS = [
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "reddit", label: "Reddit" },
  { value: "email", label: "Email" },
  { value: "blog", label: "Blog" },
  { value: "other", label: "Other" },
];

const STATUS_META: Record<ContentStatus, { label: string; icon: React.ElementType; badge: string }> = {
  draft: { label: "Drafts", icon: FileText, badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  scheduled: { label: "Scheduled", icon: CalendarClock, badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  published: { label: "Published", icon: Send, badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

function channelLabel(value: string) {
  return CHANNELS.find((c) => c.value === value)?.label ?? value;
}

export default function ContentPage() {
  const tenant = useTenant();
  const companyId = tenant.companyId;

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newChannel, setNewChannel] = useState("twitter");
  const [newBody, setNewBody] = useState("");
  const [newScheduledFor, setNewScheduledFor] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/content?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load content");
      setItems(data.items ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({
    draft: items.filter((i) => i.status === "draft").length,
    scheduled: items.filter((i) => i.status === "scheduled").length,
    published: items.filter((i) => i.status === "published").length,
  }), [items]);

  async function postAction(payload: Record<string, unknown>): Promise<any> {
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await postAction({
        action: "create",
        companyId,
        title: newTitle.trim(),
        channel: newChannel,
        ...(newScheduledFor ? { status: "scheduled", scheduledFor: newScheduledFor } : {}),
        ...(newBody.trim() ? { body: newBody.trim() } : {}),
      });
      setNewTitle("");
      setNewBody("");
      setNewScheduledFor("");
      setShowAddForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to create content");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(item: ContentItem, status: ContentStatus) {
    const previous = items;
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, status } : i)));
    try {
      await postAction({ action: "update", itemId: item._id, status });
    } catch (e: any) {
      setItems(previous);
      setError(e.message || "Failed to update status");
    }
  }

  async function handleDelete(item: ContentItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const previous = items;
    setItems((prev) => prev.filter((i) => i._id !== item._id));
    try {
      await postAction({ action: "delete", itemId: item._id });
    } catch (e: any) {
      setItems(previous);
      setError(e.message || "Failed to delete content");
    }
  }

  const columns: ContentStatus[] = ["draft", "scheduled", "published"];

  return (
    <AppShell title="Content Engine" description="Plan, schedule, and track content across your channels.">
      <div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium hover:bg-red-500/10"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {/* Header + add */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {columns.map((status) => {
              const meta = STATUS_META[status];
              return (
                <div key={status} className="rounded-xl border border-border bg-surface-raised px-4 py-2">
                  <span className="text-xs text-text-muted">{meta.label}</span>
                  <span className="ml-2 text-lg font-bold text-text-primary">{counts[status]}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            New Content
          </button>
        </div>

        {showAddForm && (
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-text-muted">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="280E myths every operator believes"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Channel</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-text-muted">Body / notes (optional)</label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Schedule for (optional)</label>
                <input
                  type="date"
                  value={newScheduledFor}
                  onChange={(e) => setNewScheduledFor(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || saving}
              className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        )}

        {/* Columns */}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border/50 bg-surface-mid/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-mid py-16 text-center">
            <PenSquare className="mx-auto mb-3 h-10 w-10 text-text-faint" />
            <p className="text-sm text-text-muted">No content yet. Create your first piece to start planning.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((status) => {
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              const columnItems = items.filter((i) => i.status === status);
              return (
                <section key={status} className="rounded-2xl border border-border bg-surface-mid p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-text-muted" />
                    <h3 className="text-sm font-semibold text-text-primary">{meta.label}</h3>
                    <span className="text-xs text-text-faint">({columnItems.length})</span>
                  </div>
                  <div className="space-y-2">
                    {columnItems.map((item) => (
                      <div key={item._id} className="rounded-lg border border-border bg-surface p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-text-primary">{item.title}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                              <span className={"rounded-full border px-1.5 py-0.5 text-[10px] " + meta.badge}>
                                {channelLabel(item.channel)}
                              </span>
                              {item.scheduledFor && <span>{item.scheduledFor}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(item)}
                            className="shrink-0 rounded p-1 text-text-faint transition hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {item.body && (
                          <p className="mt-2 line-clamp-2 text-xs text-text-muted">{item.body}</p>
                        )}
                        <div className="mt-2 flex gap-1.5">
                          {status !== "draft" && (
                            <button
                              onClick={() => handleStatusChange(item, "draft")}
                              className="rounded border border-border px-2 py-0.5 text-[10px] text-text-muted transition hover:text-text-primary"
                            >
                              → Draft
                            </button>
                          )}
                          {status !== "scheduled" && (
                            <button
                              onClick={() => handleStatusChange(item, "scheduled")}
                              className="rounded border border-border px-2 py-0.5 text-[10px] text-amber-300 transition hover:bg-amber-500/10"
                            >
                              → Scheduled
                            </button>
                          )}
                          {status !== "published" && (
                            <button
                              onClick={() => handleStatusChange(item, "published")}
                              className="rounded border border-border px-2 py-0.5 text-[10px] text-emerald-300 transition hover:bg-emerald-500/10"
                            >
                              → Published
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {columnItems.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-text-faint">
                        Nothing here
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
