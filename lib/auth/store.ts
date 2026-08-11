"use client";

const STORAGE_KEY = "kmate_auth_user";
const ACCESS_TOKEN_KEY = "kmate_access_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language: string;
  membership: string;
  access_token?: string;
}

function readAccessTokenUserId(token: string | null): string | null {
  if (!token || typeof window === "undefined") return null;

  try {
    const encoded = token.split(".", 1)[0];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      encoded.length + ((4 - (encoded.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(window.atob(base64)) as { sub?: unknown; exp?: unknown };
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
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

export function getAuthStorageSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  const previousUser = getCurrentUser();
  const previousToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const accessToken = user.access_token
    ?? (previousUser?.id === user.id && readAccessTokenUserId(previousToken) === user.id
      ? previousToken
      : null);

  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...user, access_token: accessToken ?? undefined }));
  if (accessToken && readAccessTokenUserId(accessToken) === user.id) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  }
  // 서버 컴포넌트(예: /learn/[characterId])는 localStorage를 못 읽으므로,
  // 로그인 유저 id를 쿠키로도 남겨서 서버에서도 실제 멤버십을 확인할 수 있게 한다.
  document.cookie = `kmate_uid=${user.id}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
  window.dispatchEvent(new Event("kmate-auth-changed"));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("kmate-auth-logging-out"));
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(GUEST_ID_KEY);
  document.cookie = "kmate_uid=; path=/; max-age=0";
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  window.dispatchEvent(new Event("kmate-auth-changed"));
}

export async function logoutFromServer() {
  if (typeof window === "undefined") return;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const headers = getAuthHeaders();
  try {
    if (headers.Authorization) {
      await fetch(`${BACKEND_URL}/auth/logout`, { method: "POST", headers });
    }
  } finally {
    logout();
  }
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
const GUEST_INSTALLATION_KEY = "kmate_guest_installation";

function getOrCreateGuestInstallationId(): string {
  const existing = localStorage.getItem(GUEST_INSTALLATION_KEY);
  if (existing) return existing;

  const installationId = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
  localStorage.setItem(GUEST_INSTALLATION_KEY, installationId);
  return installationId;
}

function getCachedGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_ID_KEY);
}

export function getEffectiveUserId(): string {
  const userId = getCurrentUser()?.id ?? getCachedGuestId();
  if (!userId) throw new Error("K-MATE session is not ready");
  return userId;
}

// 앱 최초 마운트 시 한 번 호출 — 로그인도 안 했고 게스트 id도 아직 없으면 백엔드에
// 새 게스트 계정을 발급받아 저장해둔다. 이 요청이 끝나기 전(보통 100ms 안팎)까지는
// getEffectiveUserId()가 잠깐 공용 목업 id로 폴백되지만, 그 사이 실제로 채팅 등을
// 시작할 가능성은 낮다. 실패해도 조용히 넘어가고 다음 방문 때 다시 시도된다.
//
// 로그인 유저와 마찬가지로 kmate_uid 쿠키도 같이 남긴다 — /learn/[characterId]는 서버
// 컴포넌트라 localStorage를 못 읽고 쿠키로만 실제 계정을 식별하는데, 이게 없으면
// 게스트가 개별 구매한 캐릭터도 그 페이지에서만 계속 잠긴 것처럼 보인다.
export async function ensureGuestAccount(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const currentUser = getCurrentUser();
  if (currentUser) {
    // 이전 앱 버전에서 로그인한 사용자도 서버 컴포넌트가 세션을 읽을 수 있게
    // 브라우저 저장소의 기존 토큰을 쿠키로 한 번 마이그레이션한다.
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && readAccessTokenUserId(token) === currentUser.id) {
      document.cookie = `kmate_uid=${currentUser.id}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      return true;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    document.cookie = "kmate_uid=; path=/; max-age=0";
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  }

  const existing = getCachedGuestId();
  const existingToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (existing && readAccessTokenUserId(existingToken) === existing) {
    const token = existingToken!;
    document.cookie = `kmate_uid=${existing}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    return true;
  }

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${BACKEND_URL}/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installation_id: getOrCreateGuestInstallationId() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.id && data.access_token) {
      localStorage.setItem(GUEST_ID_KEY, data.id);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      document.cookie = `kmate_uid=${data.id}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(data.access_token)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      window.dispatchEvent(new Event("kmate-auth-changed"));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
