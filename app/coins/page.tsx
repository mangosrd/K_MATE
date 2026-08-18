"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import {
  isPlayBillingAvailable, initPlayBilling, purchaseCoinPack, type CoinPackId, type LocalizedProduct,
} from "@/lib/billing/playBilling";
import styles from "./coins.module.css";
import { admobRewardAdService } from "@/lib/ads/rewardedAd";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const REWARD_COPY = {
  ko: { title: "무료 코인 받기", detail: "광고 1회당 5코인 · 하루 5회", used: "오늘 이용", button: "광고 보고 +5", loading: "불러오는 중…" },
  en: { title: "Free coins", detail: "5 coins per ad · 5 daily", used: "Used today", button: "Watch +5", loading: "Loading…" },
  ja: { title: "無料コイン", detail: "広告1回で5コイン・1日5回", used: "本日の利用", button: "広告を見て +5", loading: "読み込み中…" },
  zh: { title: "免费金币", detail: "每次广告5金币・每天5次", used: "今日已使用", button: "观看广告 +5", loading: "加载中…" },
  "zh-TW": { title: "免費金幣", detail: "每次廣告5金幣・每天5次", used: "今日已使用", button: "觀看廣告 +5", loading: "載入中…" },
  ru: { title: "Бесплатные монеты", detail: "5 монет за рекламу · 5 раз в день", used: "Сегодня", button: "Смотреть +5", loading: "Загрузка…" },
  th: { title: "รับเหรียญฟรี", detail: "โฆษณาละ 5 เหรียญ · วันละ 5 ครั้ง", used: "ใช้วันนี้", button: "ดูโฆษณา +5", loading: "กำลังโหลด…" },
} as const;

interface CoinPack {
  product_id: string;
  coins: number;
  price_krw: number;
  label: string;
}

const PACK_ICONS: Record<string, string> = {
  kmate_coins_small: "🪙",
  kmate_coins_medium: "💰",
  kmate_coins_large: "🏆",
};

// pack.label은 백엔드가 한국어로만 내려주므로(routers/billing.py), 화면에는 대신
// product_id 기준으로 번역된 라벨을 쓴다 — coins/price_krw 등 나머지 값만 백엔드 걸 쓴다.
const PACK_LABEL_KEYS: Record<string, string> = {
  kmate_coins_small: "coinPackSmallLabel",
  kmate_coins_medium: "coinPackMediumLabel",
  kmate_coins_large: "coinPackLargeLabel",
};

export default function CoinsPage() {
  const { t, language } = useLanguage();
  const rewardCopy = REWARD_COPY[language];
  const isNativeAndroid = isPlayBillingAvailable();

  const [coins, setCoins] = useState(0);
  // 백엔드 연결 실패 시에도 팩이 보이도록 fallback 기본값 설정 — billing.py COIN_PACKS와 일치해야 한다.
  const FALLBACK_PACKS: CoinPack[] = [
    { product_id: "kmate_coins_small",  coins: 50,  price_krw: 1200, label: "코인 50개" },
    { product_id: "kmate_coins_medium", coins: 180, price_krw: 3300, label: "코인 180개 (30개 보너스)" },
    { product_id: "kmate_coins_large",  coins: 500, price_krw: 6600, label: "코인 500개 (100개 보너스)" },
  ];
  const [packs, setPacks] = useState<CoinPack[]>(FALLBACK_PACKS);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const [adRemaining, setAdRemaining] = useState<number | null>(null);
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const [storePrices, setStorePrices] = useState<Record<string, LocalizedProduct>>({});

  useEffect(() => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/billing/coin-packs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data && data.length > 0) setPacks(data); })
      .catch(() => {}); // 실패해도 fallback 유지
    fetch(`${BACKEND_URL}/user/${userId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCoins(data.coins); })
      .catch(() => {});
  }, []);


  // 안드로이드 앱에서만 인앱결제 리스너를 연결한다 — 웹에서는 그냥 아무 일도 안 함
  useEffect(() => {
    if (!isNativeAndroid) return;
    initPlayBilling({
      onPremiumVerified: () => {}, // 이 화면에서는 구독을 안 사므로 무시
      onCoinsGranted: (totalCoins) => {
        setCoins(totalCoins);
        setBuyingId(null);
      },
      onCharacterUnlocked: () => {}, // 이 화면에서는 캐릭터 구매를 안 하므로 무시
      onError: (message) => {
        setError(message);
        setBuyingId(null);
      },
      onProductsUpdated: (products) => {
        setStorePrices(Object.fromEntries(products.map((product) => [product.productId, product])));
      },
    });
  }, [isNativeAndroid]);

  const handleBuy = async (pack: CoinPack) => {
    if (isNativeAndroid && !storePrices[pack.product_id]) {
      setError(language === "ko" ? "현재 지역에서는 이 결제 상품을 이용할 수 없어요." : "This product is unavailable in your current store.");
      return;
    }
    setError(null);
    setBuyingId(pack.product_id);

    if (isNativeAndroid) {
      try {
        await purchaseCoinPack(pack.product_id as CoinPackId);
      } catch {
        setError(t("cannotOpenPaymentMsg"));
        setBuyingId(null);
      }
      return;
    }

    // 웹: 포트원(KG이니시스) 결제창을 띄우고, 결제가 실제로 확인되면 백엔드가 코인을 지급한다.
    setError("결제는 Android 앱의 Google Play에서만 이용할 수 있어요.");
    setBuyingId(null);
  };

  const handleRewardedAd = async () => {
    if (adBusy) return;
    setAdBusy(true); setError(null); setAdMessage(null);
    try {
      const userId = getEffectiveUserId();
      const prepareRes = await fetch(`${BACKEND_URL}/billing/ads/prepare`, {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: userId }),
      });
      const prepared = await prepareRes.json().catch(() => null);
      if (!prepareRes.ok) throw new Error(prepared?.detail ?? "광고 보상을 준비하지 못했어요.");
      setAdRemaining(prepared.watches_remaining);
      const transactionId = await admobRewardAdService.show(userId, prepared.claim_id);
      const rewardRes = await fetch(`${BACKEND_URL}/billing/ads/watch`, {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: userId, claim_id: prepared.claim_id, reward_transaction_id: transactionId }),
      });
      const reward = await rewardRes.json().catch(() => null);
      if (!rewardRes.ok) throw new Error(reward?.detail ?? "보상을 지급하지 못했어요.");
      setCoins(reward.total_coins); setAdRemaining(reward.watches_remaining); setAdMessage(reward.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "광고를 불러오지 못했어요.");
    } finally { setAdBusy(false); }
  };

  return (
    <>
      <div className="page-content">
        <header className={styles.header}>
          <Link href="/me" className={styles.backBtn}>‹</Link>
          <p className={styles.title}>{t("coinShopTitle")}</p>
          <div className="coin-badge">
            <span className="coin-icon">🪙</span>
            <span>{coins}</span>
          </div>
        </header>

        <div className={styles.inner}>
          <div className={styles.intro}>
            <span className={styles.introEmoji}>🪙</span>
            <p className={styles.introSub}>{t("coinShopIntro")}</p>
          </div>

          {error && (
            <p style={{ color: "var(--red)", fontSize: 13, textAlign: "center", marginBottom: 12, fontWeight: 600 }}>
              {error}
            </p>
          )}

          <section className={styles.rewardCard}>
            <div className={styles.rewardIcon}>▶</div>
            <div className={styles.rewardCopy}>
              <strong>{rewardCopy.title}</strong>
              <span>{adRemaining === null ? rewardCopy.detail : `${rewardCopy.used} ${5 - adRemaining} / 5`}</span>
            </div>
            <button type="button" onClick={() => void handleRewardedAd()} disabled={adBusy || !admobRewardAdService.isAvailable()}>
              {adBusy ? rewardCopy.loading : rewardCopy.button}
            </button>
          </section>
          {adMessage && <p className={styles.rewardMessage}>{adMessage}</p>}

          <div className={styles.packList}>
            {packs.map((pack) => (
              <div key={pack.product_id} className={styles.packCard}>
                <div className={styles.packLeft}>
                  <span className={styles.packIcon}>{PACK_ICONS[pack.product_id] ?? "🪙"}</span>
                  <div>
                    <p className={styles.packLabel}>{t(PACK_LABEL_KEYS[pack.product_id] ?? "coins")}</p>
                    <p className={styles.packPrice}>
                      {storePrices[pack.product_id]?.localizedPrice ?? (isNativeAndroid ? t("processingBtn") : "—")}
                    </p>
                  </div>
                </div>
                <button
                  className={`btn btn-gold btn-sm ${styles.buyBtn}`}
                  onClick={() => handleBuy(pack)}
                  disabled={buyingId === pack.product_id || (isNativeAndroid && !storePrices[pack.product_id])}
                >
                  {buyingId === pack.product_id ? t("processingBtn") : t("buyBtn")}
                </button>
              </div>
            ))}
          </div>

          <p className={styles.notice}>{t("coinShopNotice")}</p>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
