import { type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readSettings, type Theme, writeTheme } from "../db/settings";
import { type ResolvedTheme, ThemeContext } from "./themeContext";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readSettings().theme);
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") return systemDark ? "dark" : "light";
    return theme;
  }, [theme, systemDark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    writeTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggle = useCallback(
    () =>
      setThemeState((prev) => {
        const current: ResolvedTheme =
          prev === "system" ? (systemPrefersDark() ? "dark" : "light") : prev;
        return current === "dark" ? "light" : "dark";
      }),
    [],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme muss innerhalb von <ThemeProvider> stehen");
  return ctx;
}
