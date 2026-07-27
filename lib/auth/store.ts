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
  // 서버 컴포넌트(예: /learn/[characterId])는 localStorage를 못 읽으므로,
  // 로그인 유저 id를 쿠키로도 남겨서 서버에서도 실제 멤버십을 확인할 수 있게 한다.
  document.cookie = `kmate_uid=${user.id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "kmate_uid=; path=/; max-age=0";
}

// 로그인 상태면 실제 계정 id를, 아니면 게스트용 공용 목업 id를 반환한다.
// 로그인 없이도 앱이 계속 동작하게 하면서, 로그인한 사용자는 각자의 데이터로 분리되도록 함.
export function getEffectiveUserId(): string {
  return getCurrentUser()?.id ?? MOCK_USER.id;
}
