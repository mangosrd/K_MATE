// ============================================================
// 코인 규칙 엔진 — 서버 전용
// 코인 획득·차감·잔액 확인은 반드시 서버에서만 처리
// ============================================================

import type { CoinEarnReason } from "@/types/game";

// ---- 코인 획득 테이블 ----
export const COIN_EARN_TABLE: Record<CoinEarnReason, number> = {
  daily_login: 5,
  lesson_complete: 10,
  review_complete: 5,
  stamp_earned: 20,
  streak_bonus: 15,
  daily_mission: 10,
};

// ---- 소비 비용 ----
export const COIN_COST = {
  diary_unlock: 50,
  translation_hint: 5,
  character_theme: 300,
  streak_shield: 150,
  translation_hint_bundle: 80, // 5회 묶음 할인
} as const;

/**
 * 코인 차감 검증 — 잔액이 충분한지 서버에서 확인
 */
export function canAfford(currentCoins: number, cost: number): boolean {
  return currentCoins >= cost;
}

/**
 * 코인 차감 계산 (실제 DB 업데이트는 별도)
 */
export function deductCoins(
  currentCoins: number,
  cost: number
): { success: boolean; newBalance: number; error?: string } {
  if (!canAfford(currentCoins, cost)) {
    return {
      success: false,
      newBalance: currentCoins,
      error: `Insufficient coins. Need ${cost}, have ${currentCoins}.`,
    };
  }
  return {
    success: true,
    newBalance: currentCoins - cost,
  };
}

/**
 * 코인 획득 계산
 */
export function earnCoins(
  currentCoins: number,
  reason: CoinEarnReason
): { newBalance: number; earned: number } {
  const earned = COIN_EARN_TABLE[reason];
  return {
    newBalance: currentCoins + earned,
    earned,
  };
}
