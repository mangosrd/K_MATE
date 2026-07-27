"use client";

import type { ChatMessage } from "@/types/api";

const STORAGE_PREFIX = "kmate_chat_";

// 캐릭터별 대화 기록을 로컬(브라우저)에 저장한다.
// 재접속 시 이전 대화를 이어서 할지, 새로 시작할지 선택할 수 있도록 하기 위함.

export function getChatHistory(characterId: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + characterId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(characterId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + characterId, JSON.stringify(messages));
}

export function clearChatHistory(characterId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_PREFIX + characterId);
}
