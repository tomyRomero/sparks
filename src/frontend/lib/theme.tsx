"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { THEME_COOKIE, savePreference, type Theme } from "./preferences";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

export function ThemeProvider({ initial, children }: { initial: Theme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState(initial);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    savePreference(THEME_COOKIE, next);
    const root = document.documentElement;
    if (next === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = next;
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme needs a ThemeProvider.");
  return context;
}
