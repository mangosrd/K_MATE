"use client";

import type { ChatMessage } from "@/types/api";
import { getEffectiveUserId } from "@/lib/auth/store";

const STORAGE_PREFIX = "kmate_chat_";

// 캐릭터별 대화 기록을 로컬(브라우저)에 저장한다.
// 재접속 시 이전 대화를 이어서 할지, 새로 시작할지 선택할 수 있도록 하기 위함.
// 로그인한 계정별로 분리되도록 저장 키에 사용자 id를 포함한다.

function key(characterId: string): string {
  return `${STORAGE_PREFIX}${getEffectiveUserId()}_${characterId}`;
}

export function getChatHistory(characterId: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(characterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(characterId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  // A character greeting by itself is not a conversation. Keeping it in
  // storage creates a misleading resume prompt on the next visit.
  if (!messages.some((message) => message.role === "user")) {
    localStorage.removeItem(key(characterId));
    return;
  }
  localStorage.setItem(key(characterId), JSON.stringify(messages));
}

export function clearChatHistory(characterId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(characterId));
}
