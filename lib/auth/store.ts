"use client";

import { MOCK_USER } from "@/lib/db/mock";

const STORAGE_KEY = "kmate_auth_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language: string;
  membership: string;
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// 로그인 상태면 실제 계정 id를, 아니면 게스트용 공용 목업 id를 반환한다.
// 로그인 없이도 앱이 계속 동작하게 하면서, 로그인한 사용자는 각자의 데이터로 분리되도록 함.
export function getEffectiveUserId(): string {
  return getCurrentUser()?.id ?? MOCK_USER.id;
}
