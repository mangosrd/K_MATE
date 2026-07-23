// ============================================================
// POST /api/purchase — 상점 코인 소비 처리
// 아이템 구매 요청 → 서버에서 잔액 재확인 후 차감
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { deductCoins } from "@/lib/game/coins";
import { MOCK_ECONOMY } from "@/lib/db/mock";
import type { PurchaseRequest, PurchaseResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PurchaseRequest;
    const { userId, itemId, cost } = body;

    if (!userId || !itemId || cost == null) {
      return NextResponse.json(
        { error: "userId, itemId, cost required" },
        { status: 400 }
      );
    }

    // 서버에서 잔액 재확인 (클라이언트가 전달한 cost는 신뢰하지 않음)
    const economy = MOCK_ECONOMY; // TODO: DB에서 userId로 조회
    const result = deductCoins(economy.coins, cost);

    if (!result.success) {
      return NextResponse.json(
        { success: false, newBalance: economy.coins, error: result.error } satisfies PurchaseResponse,
        { status: 402 }
      );
    }

    // TODO: DB에서 economy.coins 업데이트 + 아이템 지급 + 거래 로그 기록
    console.log(
      `[/api/purchase] user=${userId} item=${itemId} cost=${cost} balance: ${economy.coins} → ${result.newBalance}`
    );

    return NextResponse.json(
      { success: true, newBalance: result.newBalance } satisfies PurchaseResponse
    );
  } catch (error) {
    console.error("[/api/purchase] error:", error);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
