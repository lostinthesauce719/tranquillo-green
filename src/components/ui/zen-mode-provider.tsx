"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ─── Zen Mode Context ──────────────────────────────────────────── */

interface ZenModeContextValue {
  /** Whether kawaii zen mode is active */
  zen: boolean;
  /** Toggle zen mode on/off */
  toggleZen: () => void;
  /** Set zen mode explicitly */
  setZen: (on: boolean) => void;
}

const ZenModeContext = createContext<ZenModeContextValue>({
  zen: false,
  toggleZen: () => {},
  setZen: () => {},
});

export function useZenMode() {
  return useContext(ZenModeContext);
}

/* ─── Provider ──────────────────────────────────────────────────── */

const STORAGE_KEY = "tg-zen-mode";

export function ZenModeProvider({ children }: { children: ReactNode }) {
  const [zen, setZenState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setZenState(true);
      document.documentElement.classList.add("zen");
    }
  }, []);

  const setZen = useCallback((on: boolean) => {
    setZenState(on);
    localStorage.setItem(STORAGE_KEY, String(on));
    if (on) {
      document.documentElement.classList.add("zen");
    } else {
      document.documentElement.classList.remove("zen");
    }
  }, []);

  const toggleZen = useCallback(() => {
    setZen(!zen);
  }, [zen, setZen]);

  // Avoid hydration flash
  if (!mounted) {
    return (
      <ZenModeContext.Provider value={{ zen: false, toggleZen: () => {}, setZen: () => {} }}>
        {children}
      </ZenModeContext.Provider>
    );
  }

  return (
    <ZenModeContext.Provider value={{ zen, toggleZen, setZen }}>
      {children}
    </ZenModeContext.Provider>
  );
}
