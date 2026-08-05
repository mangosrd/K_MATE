"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_ECONOMY } from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import {
  isPlayBillingAvailable, initPlayBilling, purchaseCoinPack, type CoinPackId,
} from "@/lib/billing/playBilling";
import styles from "./coins.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  const { t } = useLanguage();
  const isNativeAndroid = isPlayBillingAvailable();

  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  // 백엔드 연결 실패 시에도 팩이 보이도록 fallback 기본값 설정 — billing.py COIN_PACKS와 일치해야 한다.
  const FALLBACK_PACKS: CoinPack[] = [
    { product_id: "kmate_coins_small",  coins: 50,  price_krw: 1200, label: "코인 50개" },
    { product_id: "kmate_coins_medium", coins: 180, price_krw: 3300, label: "코인 180개 (30개 보너스)" },
    { product_id: "kmate_coins_large",  coins: 500, price_krw: 6600, label: "코인 500개 (100개 보너스)" },
  ];
  const [packs, setPacks] = useState<CoinPack[]>(FALLBACK_PACKS);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = getEffectiveUserId();
    fetch(`${BACKEND_URL}/billing/coin-packs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data && data.length > 0) setPacks(data); })
      .catch(() => {}); // 실패해도 fallback 유지
    fetch(`${BACKEND_URL}/user/${userId}`)
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
    });
  }, [isNativeAndroid]);

  const handleBuy = async (pack: CoinPack) => {
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

          <div className={styles.packList}>
            {packs.map((pack) => (
              <div key={pack.product_id} className={styles.packCard}>
                <div className={styles.packLeft}>
                  <span className={styles.packIcon}>{PACK_ICONS[pack.product_id] ?? "🪙"}</span>
                  <div>
                    <p className={styles.packLabel}>{t(PACK_LABEL_KEYS[pack.product_id] ?? "coins")}</p>
                    <p className={styles.packPrice}>₩{pack.price_krw.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  className={`btn btn-gold btn-sm ${styles.buyBtn}`}
                  onClick={() => handleBuy(pack)}
                  disabled={buyingId === pack.product_id}
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
