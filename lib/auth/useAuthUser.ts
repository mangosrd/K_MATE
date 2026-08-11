"use client";

import { useState, useEffect } from "react";
import { getAuthHeaders, getCurrentUser, getEffectiveUserId, AuthUser } from "./store";
import { MOCK_USER } from "@/lib/db/mock";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// getCurrentUser()를 렌더 중에 직접 부르면(서버는 항상 null, 클라이언트는 마운트 즉시
// localStorage의 실제 값) 로그인 여부에 따라 렌더 결과가 서버/클라이언트 간에 달라져
// hydration mismatch가 난다. 항상 서버와 동일한 초기값(비로그인)으로 시작했다가,
// 마운트 이후에만 실제 로그인 상태로 갱신한다.
export function useAuthUser() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    setAuthUser(getCurrentUser());
    setAuthLoaded(true);
  }, []);

  return { authUser, authLoaded };
}

// canAccessCharacter에 넘길 멤버십 — 같은 이유로 마운트 전까지는 항상 MOCK_USER(무료 회원)
// 기준값을 쓰다가, 마운트 이후에만 실제 값으로 바꾼다.
//
// getCurrentUser()에 캐시된 membership이 아니라 백엔드에서 항상 새로 조회한다 — 게스트
// 계정(로그인 안 한 방문자)은 애초에 getCurrentUser()가 null이라 캐시된 값 자체가 없고,
// 로그인 계정도 다른 기기에서 구독했거나 하면 로컬 캐시가 오래된 값일 수 있다. 프리미엄
// 구독 버튼을 눌러도 화면에 아무 변화가 없어 보였던 게 바로 이 문제였다 — 백엔드는
// 정상적으로 구독 처리했는데, 이 훅이 로그인 계정의 캐시된 membership만 보고 있어서
// 게스트로 구독한 경우 영원히 반영이 안 됐다.
export function useMembership() {
  const [membership, setMembership] = useState<string>(MOCK_USER.membership);
  const [membershipLoaded, setMembershipLoaded] = useState(false);

  useEffect(() => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/user/${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.membership) setMembership(data.membership); })
      .catch(() => {})
      .finally(() => setMembershipLoaded(true));
  }, []);

  return { membership, membershipLoaded };
}

// canAccessCharacter의 세 번째 인자(freeSlots) — 기본 무료 캐릭터(kyuhyun/haneul) 외에도
// 개별 구매로 잠금해제한 캐릭터가 이 배열에 들어간다. 대부분의 화면이 이 값을 실제로
// 조회하지 않고 MOCK_USER.free_character_slots(항상 고정값)를 그대로 썼던 탓에, 캐릭터를
// 개별 구매해도 대부분의 화면에서 여전히 잠긴 것처럼 보이는 문제가 있었다.
export function useFreeCharSlots() {
  const [freeSlots, setFreeSlots] = useState<string[]>(MOCK_USER.free_character_slots);
  const [freeSlotsLoaded, setFreeSlotsLoaded] = useState(false);

  useEffect(() => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/user/${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.free_char_slots)) setFreeSlots(data.free_char_slots);
      })
      .catch(() => {})
      .finally(() => setFreeSlotsLoaded(true));
  }, []);

  return { freeSlots, freeSlotsLoaded };
}
