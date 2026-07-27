"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_USER, MOCK_PROGRESS, MOCK_ECONOMY } from "@/lib/db/mock";
import { getLocalVocab } from "@/lib/vocab/store";
import { getAllLocalDiaries } from "@/lib/diary/store";
import { getCurrentUser, getEffectiveUserId, logout as clearSession } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import LanguageModal from "@/components/LanguageModal";
import type { Progress } from "@/types/database";
import styles from "./me.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function MePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);

  const authUser = getCurrentUser();
  const displayName = authUser?.name ?? MOCK_USER.name;
  const displayLevel = MOCK_USER.level; // 레벨 시스템은 아직 백엔드에 없어 목업 유지

  const [coins, setCoins] = useState(MOCK_ECONOMY.coins);
  const [progress, setProgress] = useState<Progress>(MOCK_PROGRESS);
  const vocab = getLocalVocab();
  const diaries = getAllLocalDiaries();
  const masteredCount = vocab.filter((v) => v.mastery === "mastered").length;
  const unlockedDiaries = diaries.filter((d) => d.unlocked).length;

  useEffect(() => {
    const userId = getEffectiveUserId();

    fetch(`${BACKEND_URL}/user/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCoins(data.coins); })
      .catch(() => {});

    fetch(`${BACKEND_URL}/progress/${userId}/kyuhyun`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setProgress(data); })
      .catch(() => {});
  }, []);

  const affinityStars = Math.round(progress.affinity / 20);

  const handleLogout = () => {
    clearSession();
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
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{displayName}</p>
                <p className={styles.profileLevel}>{t("beginnerLearner")} · Lv.{displayLevel}</p>
              </div>
              <div className={styles.profileCoin}>
                <p className={styles.coinNum}>🪙 {coins}</p>
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
                  {progress.affinity} / 100
                </span>
              </div>
              <div className={styles.streakRow}>
                <span>🔥</span>
                <span className={styles.streakNum}>{progress.streak_days}일 연속</span>
              </div>
            </div>
          </div>

          {/* 학습 통계 */}
          <div>
            <p className="section-title">{t("learningStats")}</p>
            <div className={styles.statsGrid}>
              {[
                { icon: "📖", num: vocab.length,                             labelKey: "learnedWords" },
                { icon: "✅", num: masteredCount,                             labelKey: "mastered" },
                { icon: "🗺️", num: progress.visited_places.length,           labelKey: "visitedPlaces" },
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
