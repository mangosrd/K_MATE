// ============================================================
// K-MATE 게임 도메인 타입
// ============================================================

// ---- 상점 아이템 ----
export type ShopItemType =
  | "diary_unlock"
  | "translation_hint"
  | "character_theme"
  | "streak_shield";

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  description: string;
  cost: number; // 코인
  quantity?: number; // 번들 수량
  emoji: string;
}

// ---- 코인 패키지 (충전) ----
export interface CoinPackage {
  id: string;
  coins: number;
  price_krw: number;
  label: string; // "소액 충전", "인기", "최고 가성비"
  badge?: string;
}

// ---- 스탬프 ----
export interface Stamp {
  placeId: string;
  placeName: string;
  acquiredAt: string;
}

// ---- 해금 조건 ----
export interface UnlockCondition {
  type: "coin" | "stamp" | "step";
  value: number | string;
  label: string; // 사용자에게 표시할 설명
}

// ---- 진행 단계 ----
export interface JourneyStep {
  stepNumber: number;
  title: string;
  description: string;
  status: "completed" | "active" | "locked";
  unlockCondition?: string;
  dialogueCount?: number;
  dialogueCompleted?: number;
}

// ---- 코인 획득 이유 ----
export type CoinEarnReason =
  | "daily_login"
  | "lesson_complete"
  | "review_complete"
  | "stamp_earned"
  | "streak_bonus"
  | "daily_mission";
