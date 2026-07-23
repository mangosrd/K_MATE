"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_USER, MOCK_PROGRESS, MOCK_ECONOMY, MOCK_VOCAB, MOCK_DIARY } from "@/lib/db/mock";
import { useLanguage } from "@/components/LanguageContext";
import LanguageModal from "@/components/LanguageModal";
import styles from "./me.module.css";

export default function MePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);

  const affinityStars = Math.round(MOCK_PROGRESS.affinity / 20);
  const masteredCount = MOCK_VOCAB.filter((v) => v.mastery === "mastered").length;
  const unlockedDiaries = MOCK_DIARY.filter((d) => d.unlocked).length;

  const handleLogout = () => {
    router.push("/login");
  };

  const getLangName = (lang: string) => {
    switch (lang) {
      case "en": return "🇺🇸 English";
      case "ru": return "🇷🇺 Русский";
      case "zh": return "🇨🇳 中文";
      case "ja": return "🇯🇵 日本語";
      default:   return "🇰🇷 한국어";
    }
  };

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("myPage")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              {language === "ko" ? "My Page" : t("myPage")}
            </p>
          </div>
        </header>

        <div className={styles.inner}>
          {/* 프로필 카드 */}
          <div className={styles.profileCard}>
            <div className={styles.profileBg} aria-hidden="true" />
            <div className={styles.profileContent}>
              <div className={styles.profileAvatar}>
                {MOCK_USER.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{MOCK_USER.name}</p>
                <p className={styles.profileLevel}>{t("beginnerLearner")} · Lv.{MOCK_USER.level}</p>
              </div>
              <div className={styles.profileCoin}>
                <p className={styles.coinNum}>🪙 {MOCK_ECONOMY.coins}</p>
                <p className={styles.coinLabel}>{t("coins")}</p>
              </div>
            </div>
          </div>

          {/* 메이트 카드 */}
          <div className={styles.mateCard}>
            <div className={styles.mateAvatar}>✈️</div>
            <div className={styles.mateInfo}>
              <div>
                <p className={styles.mateName}>양규현 기장과의 노선</p>
                <p className={styles.mateNameEn}>Route with Captain Yang Kyuhyun</p>
              </div>
              <div className={styles.affinityRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: 16 }}>
                    {i < affinityStars ? "❤️" : "🤍"}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
                  {MOCK_PROGRESS.affinity} / 100
                </span>
              </div>
              <div className={styles.streakRow}>
                <span>🔥</span>
                <span className={styles.streakNum}>{MOCK_PROGRESS.streak_days}일 연속</span>
              </div>
            </div>
          </div>

          {/* 학습 통계 */}
          <div>
            <p className="section-title">{t("learningStats")}</p>
            <div className={styles.statsGrid}>
              {[
                { icon: "📖", num: MOCK_VOCAB.length,                        labelKey: "learnedWords" },
                { icon: "✅", num: masteredCount,                             labelKey: "mastered" },
                { icon: "🗺️", num: MOCK_PROGRESS.visited_places.length,      labelKey: "visitedPlaces" },
                { icon: "📔", num: unlockedDiaries,                           labelKey: "diaries" },
              ].map((stat) => (
                <div key={stat.labelKey} className={styles.statItem}>
                  <span className={styles.statIcon}>{stat.icon}</span>
                  <span className={styles.statNum}>{stat.num}</span>
                  <span className={styles.statKo}>{t(stat.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 설정 ([나] 카테고리 내 언어 설정 버튼 활성화) */}
          <div>
            <p className="section-title">{t("settings")}</p>
            <div className={styles.settingList}>
              <button
                className={styles.settingItem}
                onClick={() => setShowLangModal(true)}
                id="btn-language-setting"
              >
                <span>{t("langSettings")}</span>
                <span className={styles.settingValue}>{getLangName(language)} ›</span>
              </button>

              <button className={styles.settingItem} onClick={handleLogout} style={{ color: "#ef4444" }}>
                <span>🚪 {t("logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* 🌐 언어 선택 모달 */}
      <LanguageModal isOpen={showLangModal} onClose={() => setShowLangModal(false)} />
    </>
  );
}
