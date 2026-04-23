import { AppShell } from "@/components/shell/app-shell";

const docs = [
  "docs/2026-04-04-green-schema-and-route-map.md",
  "docs/2026-04-04-green-phase-1-implementation-plan.md",
];

export default function DocsPage() {
  return (
    <AppShell title="Project documents" description="Source-of-truth docs for the MVP schema, routes, and implementation order.">
      <div className="space-y-4">
        {docs.map((doc) => (
          <div key={doc} className="rounded-2xl border border-border bg-surface-mid p-5 text-sm text-text-muted">
            {doc}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
