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
  callback_memory?: string | null; // 되짚기: 맥락에 맞는 과거 기억 한 줄 (현재 백엔드에서 항상 null)
  word_suggestion?: {
    word: string;
    meaning: string;
    sentence: string;
  } | null;
  affinity_delta?: number;
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

// ---- /api/diary ----
export interface DiaryRequest {
  userId: string;
  characterId: string;
  sessionEvents: string[]; // 오늘 세션에서 일어난 주요 사건
}

export interface DiaryResponse {
  diaryId: string;
  bodyKo: string;
  createdAt: string;
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

// ---- /api/purchase ----
export interface PurchaseRequest {
  userId: string;
  itemId: string;
  cost: number;
}

export interface PurchaseResponse {
  success: boolean;
  newBalance: number;
  error?: string;
}
