"use client";

// Google Play 인앱결제 (안드로이드 앱 전용, Play 스토어 배포 시에만 동작)
// ─────────────────────────────────────────────────────────────
// 웹 브라우저에서는 이 모듈의 함수를 호출해도 아무 일도 일어나지 않는다(store가
// 없으므로). Capacitor가 네이티브 안드로이드 WebView에서 실행될 때만
// cordova-plugin-purchase가 자동으로 주입하는 전역 window.CdvPurchase를 사용한다.
//
// 이 플러그인은 Cordova/Ionic 툴체인을 기준으로 배포되는 라이브러리라 앰비언트(전역)
// 타입 선언 방식이 이 프로젝트의 tsconfig(bundler resolution + isolatedModules)와
// 잘 맞물리지 않았다. 그래서 라이브러리 전체 타입을 끌어오는 대신, 여기서 실제로
// 쓰는 최소한의 형태만 직접 정의해서 쓴다.
//
// 검증 흐름: 플러그인 자체의 원격 검증(validator) 기능은 쓰지 않고, 결제 승인
// (approved) 시점에 영수증 토큰을 우리 백엔드로 보내서 Google Play Developer API로
// 직접 검증한다 — 서비스 계정을 우리가 관리하므로 서드파티(iaptic 등) 검증 서비스에
// 의존하지 않기 위함. 구독(프리미엄)과 소모성 상품(코인팩)은 Play 쪽 검증 API 자체가
// 달라서(subscriptions vs products) 백엔드 엔드포인트도 분리했고, 여기서는
// transaction.products[0].id로 어떤 상품이 결제됐는지 보고 알맞은 엔드포인트로 보낸다.
//
// 가격: 실제 청구 금액은 여기 코드가 아니라 Play Console에 상품/구독 등록할 때 지정하는
// 값이 그대로 적용된다 — 웹 가격(PremiumView.tsx, /coins)과 반드시 맞춰야 한다.
//
// 실제 기기/Play Console 테스트 상품 없이는 끝까지 테스트할 수 없었던 부분이라,
// Play Console에서 실제 상품을 등록하고 내부 테스트 트랙에 올린 뒤 실기기로 반드시
// 결제 플로우를 직접 확인해야 한다.

import { Capacitor } from "@capacitor/core";
import { getEffectiveUserId } from "@/lib/auth/store";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const PREMIUM_MONTHLY_PRODUCT_ID = "kmate_premium_monthly";

// 백엔드 routers/billing.py의 COIN_PACKS와 반드시 동일하게 유지
export const COIN_PACK_IDS = ["kmate_coins_small", "kmate_coins_medium", "kmate_coins_large"] as const;
export type CoinPackId = (typeof COIN_PACK_IDS)[number];

// 백엔드 routers/billing.py의 CHARACTER_PACKS와 반드시 동일하게 유지
export const CHARACTER_PACK_IDS = [
  "kmate_character_sunwoo", "kmate_character_sangwoo", "kmate_character_yongwoo",
] as const;
export type CharacterPackId = (typeof CHARACTER_PACK_IDS)[number];

// cordova-plugin-purchase(store.js)가 노출하는 API 중 여기서 실제로 쓰는 부분만.
interface PurchaseTransaction {
  nativePurchase?: { purchaseToken?: string };
  purchaseToken?: string;
  products: { id: string }[];
  finish: () => Promise<void>;
}
interface PurchaseOffer {
  order: () => Promise<unknown>;
}
interface PurchaseProduct {
  getOffer: (id?: string) => PurchaseOffer | undefined;
}
interface PurchaseWhen {
  approved: (cb: (transaction: PurchaseTransaction) => void) => PurchaseWhen;
}
interface PurchaseStore {
  register: (products: { id: string; type: string; platform: string }[]) => void;
  when: () => PurchaseWhen;
  error: (cb: (err: { message?: string }) => void) => void;
  initialize: (platforms: string[]) => Promise<unknown>;
  get: (id: string) => PurchaseProduct | undefined;
}

export function isPlayBillingAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function getStore(): PurchaseStore | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { CdvPurchase?: { store: PurchaseStore } }).CdvPurchase?.store;
}

interface PlayBillingCallbacks {
  onPremiumVerified: (membership: string) => void;
  onCoinsGranted: (totalCoins: number, coinsGranted: number) => void;
  onCharacterUnlocked: (characterId: string, freeCharSlots: string[]) => void;
  onError: (message: string) => void;
}

let initialized = false;
// store.when().approved(...)는 최초 1회만 연결되는데, 여기서 클로저로 콜백을 그대로
// 캡처해버리면 나중에 다른 화면(예: 프리미엄 → 코인상점, 풀 리로드 없는 SPA 네비게이션)이
// initPlayBilling을 다시 불러도 리스너는 계속 "가장 처음 등록했던 화면"의 콜백만 참조하게
//된다 — 코인 화면의 결제가 프리미엄 화면의 onCoinsGranted(no-op)로 흘러가 조용히
// 아무 반응 없이 씹히는 버그가 있었다. 항상 "가장 최근에 initPlayBilling을 부른 화면"의
// 콜백을 쓰도록 별도 변수에 담아 리스너가 매번 최신 값을 참조하게 한다.
let currentCallbacks: PlayBillingCallbacks | null = null;

async function verifyOnBackend(transaction: PurchaseTransaction, callbacks: PlayBillingCallbacks) {
  const productId = transaction.products[0]?.id;
  // GooglePlay 어댑터의 Transaction은 nativePurchase.purchaseToken에 실제 영수증
  // 토큰을 담는다. 정확한 런타임 형태는 실기기 테스트로 재확인이 필요.
  const purchaseToken = transaction.nativePurchase?.purchaseToken ?? transaction.purchaseToken;

  if (!productId || !purchaseToken) {
    callbacks.onError("결제 영수증 정보를 찾을 수 없습니다.");
    return;
  }

  const isCoinPack = (COIN_PACK_IDS as readonly string[]).includes(productId);
  const isCharacterPack = (CHARACTER_PACK_IDS as readonly string[]).includes(productId);
  const endpoint = isCoinPack
    ? "/billing/verify-android-coins"
    : isCharacterPack
    ? "/billing/verify-android-character"
    : "/billing/verify-android";

  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getEffectiveUserId(),
        product_id: productId,
        purchase_token: purchaseToken,
      }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      await transaction.finish();
      if (isCoinPack) {
        callbacks.onCoinsGranted(data.total_coins, data.coins_granted);
      } else if (isCharacterPack) {
        callbacks.onCharacterUnlocked(data.character_id, data.free_char_slots);
      } else {
        callbacks.onPremiumVerified(data.membership);
      }
    } else {
      callbacks.onError(data.message ?? data.detail ?? "결제 검증에 실패했습니다.");
    }
  } catch {
    callbacks.onError("서버에 연결할 수 없습니다.");
  }
}

/** 앱 시작 시(또는 프리미엄/코인상점 화면 진입 시) 한 번 호출 — 상품 등록 + 결제 승인
 * 리스너 연결. 여러 화면에서 호출해도 실제 등록은 최초 1회만 일어난다(모듈 전역 플래그). */
export function initPlayBilling(callbacks: PlayBillingCallbacks) {
  currentCallbacks = callbacks; // 화면이 바뀔 때마다 항상 최신 콜백으로 갱신

  if (!isPlayBillingAvailable() || initialized) return;
  const store = getStore();
  if (!store) return;
  initialized = true;

  store.register([
    { id: PREMIUM_MONTHLY_PRODUCT_ID, type: "paid subscription", platform: "android-playstore" },
    ...COIN_PACK_IDS.map((id) => ({ id, type: "consumable", platform: "android-playstore" })),
    ...CHARACTER_PACK_IDS.map((id) => ({ id, type: "non consumable", platform: "android-playstore" })),
  ]);

  store.when().approved((transaction) => {
    if (currentCallbacks) verifyOnBackend(transaction, currentCallbacks);
  });

  store.error((err) => {
    currentCallbacks?.onError(err?.message ?? "결제 처리 중 오류가 발생했습니다.");
  });

  store.initialize(["android-playstore"]);
}

/** 프리미엄 구독 결제 시작 */
export async function purchasePremium(): Promise<void> {
  const store = getStore();
  const offer = store?.get(PREMIUM_MONTHLY_PRODUCT_ID)?.getOffer();
  if (offer) await offer.order();
}

/** 코인팩 결제 시작 */
export async function purchaseCoinPack(productId: CoinPackId): Promise<void> {
  const store = getStore();
  const offer = store?.get(productId)?.getOffer();
  if (offer) await offer.order();
}

/** 캐릭터 개별 잠금해제 결제 시작 */
export async function purchaseCharacterPack(productId: CharacterPackId): Promise<void> {
  const store = getStore();
  const offer = store?.get(productId)?.getOffer();
  if (offer) await offer.order();
}
