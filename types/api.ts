// ============================================================
// K-MATE API 요청/응답 타입
// ============================================================

import type { Memory } from "./database";

// ---- POST {backend}/chat (FastAPI) ----
export interface ChatRequest {
  character_id: string;
  user_message: string;
  session_history: ChatMessage[];
  user_id?: string;
  place_id?: string;
  user_language?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  callback_memory?: string | null; // 되짚기: 세션 초반 + 저장된 기억이 있을 때만 채워짐
  word_suggestion?: {
    word: string;
    meaning: string;
    sentence: string;
  } | null;
  affinity_delta?: number;
  coins_spent?: number;
  remaining_coins?: number | null;
  free_messages_remaining?: number | null; // 무료 회원에게만 채워짐, 프리미엄이면 null
}

// ---- /api/memory ----
export interface MemoryRequest {
  userId: string;
  characterId: string;
  sessionHistory: ChatMessage[];
}

export interface MemoryResponse {
  savedMemories: Memory[];
}

// ---- /api/unlock ----
export interface UnlockRequest {
  userId: string;
  diaryId: string;
  method: "coin" | "stamp";
}

export interface UnlockResponse {
  success: boolean;
  remainingCoins?: number;
  error?: string;
}
