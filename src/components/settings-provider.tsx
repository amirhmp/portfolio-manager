"use client";

import { DISPLAY_SCALE_COOKIE_KEY, THEME_COOKIE_KEY } from "@/constants";
import { createContext, useContext, useState, type ReactNode } from "react";

type SettingsContextValue = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  displayScale: number;
  setDisplayScale: (scale: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const ONE_YEAR_SECONDS = 31536000;

export function SettingsProvider({
  initialTheme,
  initialDisplayScale,
  children,
}: {
  initialTheme: "light" | "dark";
  initialDisplayScale: number;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);
  const [displayScale, setDisplayScaleState] = useState(initialDisplayScale);

  function setTheme(next: "light" | "dark") {
    setThemeState(next);
    // Flip the class immediately for instant feedback in this tab; the
    // cookie is what makes the *next* server render (this tab's next
    // navigation, or a fresh visit) come back with the right theme
    // already applied, no client-side correction needed.
    document.documentElement.classList.toggle("dark", next === "dark");
    document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  }

  function setDisplayScale(next: number) {
    setDisplayScaleState(next);
    document.cookie = `${DISPLAY_SCALE_COOKIE_KEY}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  }

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, displayScale, setDisplayScale }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
