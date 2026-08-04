"use client";

import { MOCK_USER } from "@/lib/db/mock";

const STORAGE_KEY = "kmate_auth_user";
const ACCESS_TOKEN_KEY = "kmate_access_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language: string;
  membership: string;
  access_token?: string;
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
  if (user.access_token) localStorage.setItem(ACCESS_TOKEN_KEY, user.access_token);
  // 서버 컴포넌트(예: /learn/[characterId])는 localStorage를 못 읽으므로,
  // 로그인 유저 id를 쿠키로도 남겨서 서버에서도 실제 멤버십을 확인할 수 있게 한다.
  document.cookie = `kmate_uid=${user.id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  document.cookie = "kmate_uid=; path=/; max-age=0";
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 회원 탈퇴 시 이 계정으로 남아있던 로컬 캐시(단어장/일기/선호 메이트/세션)를 모두 지운다.
// 서버 쪽 개인 데이터 삭제는 /auth/withdraw 호출자가 별도로 처리한다.
export function clearWithdrawnUserLocalData(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`kmate_vocab_${userId}`);
  localStorage.removeItem(`kmate_diary_${userId}`);
  localStorage.removeItem(PREFERRED_CAPTAIN_KEY_PREFIX + userId);
  logout();
}

// 마이페이지의 "메이트 카드"에 표시할 기장 선택 — 온보딩에서 고른 뒤 한 번도 안 바뀌었다면
// kyuhyun이 기본값이다. vocab/diary/chat 로컬 저장소와 마찬가지로 계정별로 분리되도록
// 키에 사용자 id를 포함한다 — 예전엔 브라우저 전체에 키 하나만 써서, 같은 브라우저에서
// 로그아웃 후 새 계정을 만들면 이전 계정이 고른 기장이 그대로 보이는 문제가 있었다.
const PREFERRED_CAPTAIN_KEY_PREFIX = "kmate_preferred_captain_";

export function getPreferredCaptainId(): string {
  if (typeof window === "undefined") return "kyuhyun";
  return localStorage.getItem(PREFERRED_CAPTAIN_KEY_PREFIX + getEffectiveUserId()) || "kyuhyun";
}

export function setPreferredCaptainId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFERRED_CAPTAIN_KEY_PREFIX + getEffectiveUserId(), id);
}

// 로그인 상태면 실제 계정 id를, 아니면 이 브라우저 전용으로 발급받은 게스트 id를,
// 그마저 아직 없으면(발급 요청이 아직 안 끝났거나 실패했을 때) 공용 목업 id로 폴백한다.
// 로그인 없이도 앱이 계속 동작하게 하면서, 방문자별로도 데이터가 분리되도록 함
// (예전엔 비로그인 방문자 전원이 공용 목업 id를 같이 써서, 무료 대화 10회 같은
// 계정별 한도가 모든 비로그인 방문자에게 공유되는 문제가 있었다).
const GUEST_ID_KEY = "kmate_guest_id";

function getCachedGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_ID_KEY);
}

export function getEffectiveUserId(): string {
  return getCurrentUser()?.id ?? getCachedGuestId() ?? MOCK_USER.id;
}

// 앱 최초 마운트 시 한 번 호출 — 로그인도 안 했고 게스트 id도 아직 없으면 백엔드에
// 새 게스트 계정을 발급받아 저장해둔다. 이 요청이 끝나기 전(보통 100ms 안팎)까지는
// getEffectiveUserId()가 잠깐 공용 목업 id로 폴백되지만, 그 사이 실제로 채팅 등을
// 시작할 가능성은 낮다. 실패해도 조용히 넘어가고 다음 방문 때 다시 시도된다.
//
// 로그인 유저와 마찬가지로 kmate_uid 쿠키도 같이 남긴다 — /learn/[characterId]는 서버
// 컴포넌트라 localStorage를 못 읽고 쿠키로만 실제 계정을 식별하는데, 이게 없으면
// 게스트가 개별 구매한 캐릭터도 그 페이지에서만 계속 잠긴 것처럼 보인다.
export async function ensureGuestAccount(): Promise<void> {
  if (typeof window === "undefined") return;
  if (getCurrentUser()) return; // 로그인 계정이 있으면 게스트 발급 자체가 불필요

  const existing = getCachedGuestId();
  if (existing && localStorage.getItem(ACCESS_TOKEN_KEY)) {
    document.cookie = `kmate_uid=${existing}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    return;
  }

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${BACKEND_URL}/auth/guest`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.id && data.access_token) {
      localStorage.setItem(GUEST_ID_KEY, data.id);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      document.cookie = `kmate_uid=${data.id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  } catch {
    /* no-op */
  }
}
