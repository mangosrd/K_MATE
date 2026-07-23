// ============================================================
// 해금 규칙 엔진 — 서버 전용
// 일기 해금 조건 판정은 반드시 서버에서만 처리
// ============================================================

import type { Progress } from "@/types/database";
import { COIN_COST, canAfford } from "./coins";

export type UnlockMethod = "coin" | "stamp" | "step";

export interface UnlockCheckResult {
  canUnlock: boolean;
  method: UnlockMethod;
  error?: string;
}

/**
 * 코인으로 해금 가능한지 확인
 */
export function checkCoinUnlock(
  currentCoins: number,
  cost: number = COIN_COST.diary_unlock
): UnlockCheckResult {
  if (canAfford(currentCoins, cost)) {
    return { canUnlock: true, method: "coin" };
  }
  return {
    canUnlock: false,
    method: "coin",
    error: `Need ${cost} coins (have ${currentCoins})`,
  };
}

/**
 * 스탬프로 해금 가능한지 확인
 */
export function checkStampUnlock(
  progress: Progress,
  requiredStampCount: number = 3
): UnlockCheckResult {
  if (progress.stamps.length >= requiredStampCount) {
    return { canUnlock: true, method: "stamp" };
  }
  return {
    canUnlock: false,
    method: "stamp",
    error: `Need ${requiredStampCount} stamps (have ${progress.stamps.length})`,
  };
}

/**
 * 진행 단계로 해금 가능한지 확인
 */
export function checkStepUnlock(
  progress: Progress,
  requiredStep: number
): UnlockCheckResult {
  if (progress.current_step >= requiredStep) {
    return { canUnlock: true, method: "step" };
  }
  return {
    canUnlock: false,
    method: "step",
    error: `Need step ${requiredStep} (at step ${progress.current_step})`,
  };
}
