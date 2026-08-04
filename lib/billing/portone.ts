"use client";

// 포트원(PortOne) V2 웹 결제 (KG이니시스 채널) — 안드로이드 앱(Google Play, lib/billing/
// playBilling.ts)과 별개로, 웹 브라우저에서의 실제 결제를 처리한다.
//
// 흐름: 브라우저 SDK로 결제창을 띄우고(requestPayment) → 성공하면 그 paymentId를
// 우리 백엔드로 보내서 → 백엔드가 포트원 서버에 그 결제 건을 직접 조회해 금액/상태를
// 검증한 뒤에만 코인/캐릭터/프리미엄을 지급한다(backend/services/portone.py).
// 클라이언트가 "결제했다"고 보내는 말을 그대로 믿지 않는다 — 위변조 방지.
//
// storeId/channelKey는 결제창을 여는 데만 쓰이는 공개 값이라 NEXT_PUBLIC_이 맞다.
// 실제 승인 여부를 가르는 API Secret은 백엔드에만 있다.

import * as PortOne from "@portone/browser-sdk/v2";
import { getEffectiveUserId } from "@/lib/auth/store";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "";
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "";

export type PortoneCoinResult =
  | { success: true; totalCoins: number; coinsGranted: number }
  | { success: false; message: string };

export type PortoneCharacterResult =
  | { success: true; characterId: string; freeCharSlots: string[] }
  | { success: false; message: string };

export type PortoneMembershipResult =
  | { success: true; membership: string }
  | { success: false; message: string };

/** 결제창을 띄우고, 성공하면 paymentId를 반환한다. 실패/취소면 null + 에러 메시지. */
async function openCheckout(params: {
  orderName: string;
  totalAmount: number;
}): Promise<{ paymentId: string } | { error: string }> {
  if (!STORE_ID || !CHANNEL_KEY) {
    return { error: "결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요." };
  }

  const paymentId = `kmate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // requestPayment()가 reject/throw할 수 있는 경우(SDK 내부 오류, 팝업 차단 등)를
  // 안 잡으면 이 함수를 호출한 화면의 "처리 중..." 버튼이 영원히 풀리지 않는다 —
  // 실제로 이렇게 멈추는 걸 라이브로 재현·확인했다. 항상 결과값(성공/에러)으로
  // 정리해서 반환하고, 절대 예외를 그대로 던지지 않는다.
  try {
    const response = await PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY,
      paymentId,
      orderName: params.orderName,
      totalAmount: params.totalAmount,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
    });

    // requestPayment 응답은 실패 시에만 code 필드가 존재한다(성공 시엔 없음) — 포트원
    // 공식 문서 기준 판단 로직.
    if (response?.code !== undefined) {
      return { error: response.message ?? "결제가 취소되었거나 실패했습니다." };
    }

    return { paymentId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "결제창을 열 수 없습니다." };
  }
}

export async function purchaseCoinPackWeb(
  productId: string,
  priceKrw: number,
  label: string
): Promise<PortoneCoinResult> {
  const opened = await openCheckout({ orderName: label, totalAmount: priceKrw });
  if ("error" in opened) return { success: false, message: opened.error };

  try {
    const res = await fetch(`${BACKEND_URL}/billing/verify-portone-coins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getEffectiveUserId(),
        product_id: productId,
        payment_id: opened.paymentId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, totalCoins: data.total_coins, coinsGranted: data.coins_granted };
    }
    return { success: false, message: data.message ?? data.detail ?? "결제 검증에 실패했습니다." };
  } catch {
    return { success: false, message: "서버에 연결할 수 없습니다." };
  }
}

export async function purchaseCharacterPackWeb(
  productId: string,
  priceKrw: number,
  label: string
): Promise<PortoneCharacterResult> {
  const opened = await openCheckout({ orderName: label, totalAmount: priceKrw });
  if ("error" in opened) return { success: false, message: opened.error };

  try {
    const res = await fetch(`${BACKEND_URL}/billing/verify-portone-character`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getEffectiveUserId(),
        product_id: productId,
        payment_id: opened.paymentId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, characterId: data.character_id, freeCharSlots: data.free_char_slots };
    }
    return { success: false, message: data.message ?? data.detail ?? "결제 검증에 실패했습니다." };
  } catch {
    return { success: false, message: "서버에 연결할 수 없습니다." };
  }
}

export async function purchaseMembershipWeb(priceKrw: number): Promise<PortoneMembershipResult> {
  const opened = await openCheckout({ orderName: "K-MATE 프리미엄 (월간 구독)", totalAmount: priceKrw });
  if ("error" in opened) return { success: false, message: opened.error };

  try {
    const res = await fetch(`${BACKEND_URL}/billing/verify-portone-membership`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getEffectiveUserId(),
        payment_id: opened.paymentId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, membership: data.membership };
    }
    return { success: false, message: data.message ?? data.detail ?? "결제 검증에 실패했습니다." };
  } catch {
    return { success: false, message: "서버에 연결할 수 없습니다." };
  }
}
