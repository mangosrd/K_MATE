"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./learn.module.css";
import { SpecialChapter, SPECIAL_CHAPTERS, MOCK_CHARACTERS } from "@/lib/db/mock";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import type { Character, Chapter } from "@/types/database";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface LearnViewProps {
  char: Character;
  chapters: Chapter[];
  currentStep: number;
}

export default function LearnView({ char, chapters, currentStep: initialStep }: LearnViewProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"regional" | "special">("regional");
  const [specialCategory, setSpecialCategory] = useState<"romance" | "daily" | "friendship">("romance");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>(char.id);
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    fetch(`${BACKEND_URL}/progress/${getEffectiveUserId()}/${char.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCurrentStep(data.current_step); })
      .catch(() => {});
  }, [char.id]);

  const activeCaptain = MOCK_CHARACTERS.find((c) => c.id === selectedCaptainId) ?? char;

  const filteredSpecialChapters = SPECIAL_CHAPTERS.filter(
    (sc) =>
      sc.category === specialCategory &&
      (!sc.character_id || sc.character_id === activeCaptain.id)
  );

  return (
    <div className="page-content">
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href={`/region/${char.region_id}`} className={styles.backBtn}>‹</Link>
        <div className={styles.headerCenter}>
          <div className={styles.headerAvatar}>{activeCaptain.emoji}</div>
          <div>
            <h1 className={styles.headerTitle}>{activeCaptain.name} {t("learnTitle")}</h1>
            <p className={styles.headerSub}>Study with Captain {activeCaptain.name}</p>
          </div>
        </div>
        <Link href={`/chat/${activeCaptain.id}`} className="btn btn-primary btn-sm" id="btn-go-chat">
          💬 {t("chatTitle")}
        </Link>
      </header>

      <div className={styles.inner}>
        {/* 커리큘럼 탭 스위처 */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${tab === "regional" ? styles.tabActive : ""}`}
            onClick={() => setTab("regional")}
          >
            {t("tabRegional")}
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "special" ? styles.tabActive : ""}`}
            onClick={() => setTab("special")}
          >
            {t("tabSpecial")}
          </button>
        </div>

        {/* 1. 지역 문화 커리큘럼 탭 */}
        {tab === "regional" && (
          <>
            {/* 진도 요약 */}
            <div className={styles.progressCard}>
              <div className={styles.progressInfo}>
                <p className={styles.progressLabel}>{t("progressLabel")}</p>
                <p className={styles.progressValue}>{t("totalChapters")} {Math.ceil(currentStep / 10)} · {t("chapterCount")} {currentStep}</p>
              </div>
              <div className={styles.progressRing}>
                <span className={styles.progressPct}>{Math.round((currentStep / (chapters.length * 10)) * 100)}%</span>
              </div>
            </div>

            {/* 챕터 목록 */}
            <section>
              <p className={styles.sectionLabel}>REGIONAL CURRICULUM · {char.name} {t("regionalChaptersLabel")}</p>
              <div className={styles.chapterList}>
                {chapters.map((chapter, idx) => {
                  const isCompleted = currentStep > (idx + 1) * 10;
                  const isActive = !chapter.is_locked && !isCompleted;
                  const isLocked = chapter.is_locked;

                  return (
                    <div key={chapter.id} className={styles.chapterRow}>
                      {idx < chapters.length - 1 && (
                        <div className={`${styles.connector} ${isCompleted ? styles.connectorDone : ""}`} />
                      )}

                      <Link
                        href={isLocked ? "#" : `/learn/${char.id}/${chapter.id}`}
                        id={`chapter-${chapter.id}`}
                        className={`${styles.chapterCard} ${isCompleted ? styles.chapterDone : ""} ${isActive ? styles.chapterActive : ""} ${isLocked ? styles.chapterLocked : ""}`}
                        aria-disabled={isLocked}
                      >
                        <div className={`${styles.chapterIcon} ${isCompleted ? styles.iconDone : ""} ${isActive ? styles.iconActive : ""} ${isLocked ? styles.iconLocked : ""}`}>
                          {isCompleted ? "✓" : isLocked ? "🔒" : chapter.emoji}
                        </div>

                        <div className={styles.chapterInfo}>
                          <div className={styles.chapterMeta}>
                            <div>
                              <p className={styles.chapterNum}>{t("totalChapters")} {chapter.order}</p>
                              <p className={styles.chapterTitle}>{chapter.title}</p>
                              <p className={styles.chapterTitleEn}>{chapter.title_en}</p>
                            </div>
                            {isActive && <span className="badge badge-red">{t("ongoing")}</span>}
                            {isCompleted && <span className="badge badge-mint">{t("completed")}</span>}
                            {isLocked && <span className="badge badge-muted">{t("locked")}</span>}
                          </div>
                          <p className={styles.chapterDesc}>{chapter.description}</p>

                          <div className={styles.stepDots}>
                            {Array.from({ length: chapter.step_count }).map((_, si) => {
                              const stepNum = idx * 10 + si + 1;
                              const isDone = currentStep > stepNum;
                              const isCurrent = currentStep === stepNum;
                              return (
                                <div
                                  key={si}
                                  className={`${styles.stepDot} ${isDone ? styles.stepDone : ""} ${isCurrent ? styles.stepCurrent : ""} ${isLocked ? styles.stepLocked : ""}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* 2. 스페셜 주제별 스토리 탭 (로맨스/일상/친구 30 챕터) */}
        {tab === "special" && (
          <section className={styles.specialSection}>
            <div className={styles.captainSelectorBox}>
              <p className={styles.selectorLabel}>{t("selectCaptainLearn")}</p>
              <div className={styles.captainPills}>
                {MOCK_CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.captainPill} ${selectedCaptainId === c.id ? styles.captainActive : ""}`}
                    onClick={() => setSelectedCaptainId(c.id)}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name} {t("captainBadge")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 주제 서브 탭 */}
            <div className={styles.subTabBar}>
              <button
                className={`${styles.subTabBtn} ${specialCategory === "romance" ? styles.subTabActive : ""}`}
                onClick={() => setSpecialCategory("romance")}
              >
                {t("romanceStory")}
              </button>
              <button
                className={`${styles.subTabBtn} ${specialCategory === "daily" ? styles.subTabActive : ""}`}
                onClick={() => setSpecialCategory("daily")}
              >
                {t("dailyStory")}
              </button>
              <button
                className={`${styles.subTabBtn} ${specialCategory === "friendship" ? styles.subTabActive : ""}`}
                onClick={() => setSpecialCategory("friendship")}
              >
                {t("friendshipStory")}
              </button>
            </div>

            {/* 카테고리 헤더 요약 */}
            <div className={styles.specialCategoryCard}>
              <div className={styles.specialBadge}>{t("premiumSpecialMode")}</div>
              <h2 className={styles.specialTitle}>
                {specialCategory === "romance" && t("romanceStory")}
                {specialCategory === "daily" && t("dailyStory")}
                {specialCategory === "friendship" && t("friendshipStory")}
              </h2>
            </div>

            {/* 스페셜 챕터 목록 */}
            <div className={styles.chapterList}>
              {filteredSpecialChapters.map((sc) => (
                <div key={sc.id} className={styles.chapterRow}>
                  <Link
                    href={`/learn/${activeCaptain.id}/${sc.id}`}
                    className={`${styles.chapterCard} ${styles.chapterLocked}`}
                  >
                    <div className={`${styles.chapterIcon} ${styles.iconLocked}`}>
                      🔒 {sc.emoji}
                    </div>

                    <div className={styles.chapterInfo}>
                      <div className={styles.chapterMeta}>
                        <div>
                          <p className={styles.chapterNum}>{t("tabSpecial")} {sc.order}</p>
                          <p className={styles.chapterTitle}>{sc.title}</p>
                          <p className={styles.chapterTitleEn}>{sc.title_en}</p>
                        </div>
                        <span className="badge badge-gold">⭐ {t("premiumOnly")}</span>
                      </div>
                      <p className={styles.chapterDesc}>{sc.description}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
