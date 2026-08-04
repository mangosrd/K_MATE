"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, getEffectiveUserId } from "@/lib/auth/store";

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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  // 로컬 저장값을 먼저 즉시 반영하고(깜빡임 최소화), 로그인 유저면 서버에 저장된 실제
  // 선호값으로 다시 한번 동기화한다 — 다른 기기에서 바꾼 테마도 따라오도록.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      setThemeState(saved);
    }

    const authUser = getCurrentUser();
    if (!authUser) return;

    fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.theme_pref === "light" || data?.theme_pref === "dark") {
          applyTheme(data.theme_pref);
          setThemeState(data.theme_pref);
          localStorage.setItem(STORAGE_KEY, data.theme_pref);
        }
      })
      .catch(() => {});
  }, []);

  const applyTheme = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);

    const authUser = getCurrentUser();
    if (!authUser) return;
    fetch(`${BACKEND_URL}/user/${getEffectiveUserId()}/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: getEffectiveUserId(), theme_pref: next }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
