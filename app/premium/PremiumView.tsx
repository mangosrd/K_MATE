"use client";

import Link from "next/link";
import { MOCK_CHARACTERS } from "@/lib/db/mock";
import { useLanguage } from "@/components/LanguageContext";
import styles from "./premium.module.css";

const PERKS = [
  { icon: "🧑‍🤝‍🧑", ko: "모든 메이트 이용", en: "Unlimited access to all mates" },
  { icon: "📔", ko: "모든 일기 해금 가능", en: "Unlock diaries from all mates" },
  { icon: "📖", ko: "전체 챕터 학습", en: "Access all learning chapters" },
  { icon: "🗺️", ko: "모든 지역 탐방", en: "Explore all 5 regions" },
  { icon: "🪙", ko: "코인 보너스 +50%", en: "50% bonus coins on all activities" },
  { icon: "⭐", ko: "신규 콘텐츠 우선 접근", en: "Early access to new content" },
];

export default function PremiumView() {
  const { t } = useLanguage();
  const premiumChars = MOCK_CHARACTERS.filter((c) => c.requires_premium);

  return (
    <main className={styles.page}>
      {/* 상단 배경 */}
      <div className={styles.topBg} aria-hidden="true" />

      <div className={styles.inner}>
        {/* 배지 */}
        <div className={styles.badge}>
          <span>⭐</span>
          <span>K-MATE PREMIUM</span>
        </div>

        <h1 className={styles.title}>더 많은 메이트,<br />더 넓은 한국</h1>
        <p className={styles.subtitle}>Meet more mates, explore all of Korea</p>

        {/* 프리미엄 전용 캐릭터 */}
        <div className={styles.charRow}>
          {premiumChars.map((char) => (
            <div key={char.id} className={styles.charChip}>
              <span className={styles.charEmoji}>{char.emoji}</span>
              <span className={styles.charName}>{char.name}</span>
              <span className={styles.charRegion}>
                {char.region_id === "busan" ? "부산" : char.region_id === "chungcheong" ? "충청" : "제주"}
              </span>
            </div>
          ))}
        </div>

        {/* 혜택 목록 */}
        <div className={styles.perks}>
          {PERKS.map((perk) => (
            <div key={perk.ko} className={styles.perkItem}>
              <span className={styles.perkIcon}>{perk.icon}</span>
              <div>
                <p className={styles.perkKo}>{perk.ko}</p>
                <p className={styles.perkEn}>{perk.en}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 가격 카드 */}
        <div className={styles.priceCard}>
          <div className={styles.priceTop}>
            <div>
              <p className={styles.priceLabel}>{t("monthlySub")}</p>
              <p className={styles.priceAmount}>₩4,900<span className={styles.pricePer}>{t("perMonth")}</span></p>
            </div>
            <div className={styles.priceBadge}>BEST</div>
          </div>
          <p className={styles.priceSub}>{t("cancelAnytime")}</p>
        </div>

        {/* CTA */}
        <button className={styles.ctaBtn} id="btn-subscribe">
          {t("startPremiumBtn")}
        </button>
        <p className={styles.ctaSub}>{t("freeTrial")}</p>

        <Link href="/map" className="btn btn-ghost" style={{ textAlign: "center" }}>
          {t("laterBtn")}
        </Link>
      </div>
    </main>
  );
}
