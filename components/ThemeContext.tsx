"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { getAuthHeaders } from "@/lib/auth/store";
import { useAuthUser } from "@/lib/auth/useAuthUser";

export type Theme = "light" | "dark";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const STORAGE_KEY = "kmate_theme";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  setTheme: () => {},
});

function getThemeSnapshot(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("kmate-theme-changed", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("kmate-theme-changed", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

const getServerThemeSnapshot = (): Theme => "light";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser } = useAuthUser();
  const userId = authUser?.id;
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();

    fetch(`${BACKEND_URL}/user/${userId}/preferences`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.theme_pref === "light" || data?.theme_pref === "dark") {
          localStorage.setItem(STORAGE_KEY, data.theme_pref);
          window.dispatchEvent(new Event("kmate-theme-changed"));
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [userId]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("kmate-theme-changed"));

    if (!userId) return;
    fetch(`${BACKEND_URL}/user/${userId}/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ user_id: userId, theme_pref: next }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
