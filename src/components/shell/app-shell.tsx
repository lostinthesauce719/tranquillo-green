import Link from "next/link";
import { moduleLinks } from "@/lib/navigation";

export function AppShell({ title, description, children }: { title: string; description: string; children: React.ReactNode; }) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-border bg-surface p-5 lg:block">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.3em] text-accent">Tranquillo Labs</div>
            <div className="mt-2 text-2xl font-semibold">Green</div>
            <p className="mt-2 text-sm text-text-muted">CA-first accounting and compliance OS for cannabis operators.</p>
          </div>
          <nav className="space-y-2">
            {moduleLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl border border-transparent px-3 py-2 text-sm text-text-muted transition hover:border-border hover:bg-surface-mid hover:text-text-primary">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl shadow-black/20">
          <header className="mb-8 flex flex-col gap-3 border-b border-border pb-6">
            <div className="text-xs uppercase tracking-[0.3em] text-accent">Phase 1 Scaffold</div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="max-w-3xl text-sm text-text-muted">{description}</p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
