'use client';

import { useState, useEffect } from 'react';
import { getOnboardingProgress } from '@/app/api/onboarding/actions';
import { startOnboardingTour } from '@/app/api/onboarding/actions';
import { tours } from '@/lib/onboarding/tours';

export default function GuideToggle() {
  const [open, setOpen] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const map: Record<string, boolean> = {};
      for (const tour of tours) {
        try {
          const p = await getOnboardingProgress(tour.id);
          map[tour.id] = p?.status === 'completed';
        } catch {
          // Convex unavailable or auth error — treat as not completed
          map[tour.id] = false;
        }
      }
      setProgressMap(map);
    }
    load();
  }, []);

  const handleStart = async (tourId: string) => {
    setLoadingMap((m) => ({ ...m, [tourId]: true }));
    try {
      await startOnboardingTour(tourId);
    } catch {
      // Demo mode — just close the menu
    }
    setProgressMap((m) => ({ ...m, [tourId]: false }));
    setLoadingMap((m) => ({ ...m, [tourId]: false }));
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22855A] text-white shadow-lg ring-1 ring-black/10 hover:bg-[#1a6b46] active:scale-95 transition-all"
        aria-label="Open guide menu"
        title="Guided tours"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* popover menu */}
      {open && (
        <div className="absolute bottom-16 right-0 w-72 rounded-2xl border border-border-subtle bg-[#0b1120] p-3 shadow-2xl ring-1 ring-black/20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-faint">
            Guided Tours
          </div>
          <div className="space-y-1">
            {tours.map((tour) => {
              const done = progressMap[tour.id];
              const loading = loadingMap[tour.id];
              return (
                <div
                  key={tour.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-surface-overlay/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {done ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-brand text-white">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <polyline points="3 8 7 12 13 4" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-text-faint/30 text-[10px] text-text-faint">
                        ?
                      </span>
                    )}
                    <span className="truncate text-sm text-text-secondary">{tour.name}</span>
                  </div>
                  {!done && (
                    <button
                      onClick={() => handleStart(tour.id)}
                      disabled={loading}
                      className="shrink-0 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/20 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Starting…' : 'Start'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 border-t border-border-subtle pt-2 text-[11px] text-text-faint text-center">
            Completed tours won&apos;t repeat automatically
          </div>
        </div>
      )}
    </div>
  );
}
