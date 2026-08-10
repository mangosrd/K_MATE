"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./learn.module.css";
import { SPECIAL_CHAPTERS, MOCK_CHARACTERS, isChapterUnlocked } from "@/lib/db/mock";
import { getEffectiveUserId, setPreferredCaptainId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import type { Character, Chapter } from "@/types/database";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface LearnViewProps {
  char: Character;
  chapters: Chapter[];
}

export default function LearnView({ char, chapters }: LearnViewProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  // 스페셜 챕터 상세 화면에서 "챕터 목록으로"를 누르면 ?tab=special로 들어온다 — 그 경우 기본값
  // "regional"로 초기화해버리면 스페셜 탭을 보다 나간 사람이 엉뚱하게 지역 문화 탭을 보게 된다.
  const [tab, setTab] = useState<"regional" | "special">(
    searchParams.get("tab") === "special" ? "special" : "regional"
  );
  const [specialCategory, setSpecialCategory] = useState<"romance" | "daily" | "friendship">("romance");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>(char.id);
  const [stamps, setStamps] = useState<string[]>([]);

  useEffect(() => {
    setPreferredCaptainId(char.id);
  }, [char.id]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/progress/${getEffectiveUserId()}/${char.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setStamps(data.stamps ?? []);
      })
      .catch(() => {});
  }, [char.id]);

  // 챕터당 실제 문제 수는 단어/문장/대화 구성에 따라 제각각이라(약 25~27개) "current_step > (idx+1)*10"
  // 같은 고정 임계값 계산은 챕터 하나만 완료해도 다음 챕터까지 완료 처리해버리는 버그가 있었다.
  // 게다가 스페셜(로맨스 등) 챕터를 완료해도 같은 current_step이 올라가 지역 문화 챕터까지 완료로
  // 잘못 표시됐다. 완료 여부는 반드시 해당 챕터 id가 stamps에 실제로 찍혔는지로만 판단한다.
  const completedRegionalCount = chapters.filter((c) => stamps.includes(c.id)).length;

  const activeCaptain = MOCK_CHARACTERS.find((c) => c.id === selectedCaptainId) ?? char;

  const filteredSpecialChapters = SPECIAL_CHAPTERS.filter(
    (sc) =>
      sc.category === specialCategory &&
      (!sc.character_id || sc.character_id === activeCaptain.id)
  );

  return (
    <div className="page-content">
      {/* 헤더 */}
      <header className="page-header">
        <Link href={`/region/${char.region_id}`} className={styles.backBtn}>‹</Link>
        <div>
          <h1 className="page-title">{t("learnPageTitle")}</h1>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t("learnTitle")}</p>
        </div>
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
            <section className={styles.captainHub} aria-label={`${activeCaptain.name} ${t("learnTitle")}`}>
              <div className={styles.captainHubProfile}>
                <Image
                  src={`/characters/${activeCaptain.id}.png`}
                  alt={activeCaptain.name}
                  width={56}
                  height={56}
                  className={styles.captainHubAvatar}
                />
                <div className={styles.captainHubText}>
                  <p className={styles.captainHubEyebrow}>✈️ {t("learnTitle")}</p>
                  <h2>{activeCaptain.name} {t("captainBadge")}</h2>
                  <p>Study with Captain {activeCaptain.name}</p>
                </div>
              </div>
              <Link href={`/chat/${activeCaptain.id}`} className="btn btn-primary btn-sm" id="btn-go-chat">
                💬 {t("chatTitle")}
              </Link>
            </section>

            {/* 진도 요약 */}
            <div className={styles.progressCard}>
              <div className={styles.progressInfo}>
                <p className={styles.progressLabel}>{t("progressLabel")}</p>
                <p className={styles.progressValue}>{t("totalChapters")} {chapters.length} · {t("chapterCount")} {completedRegionalCount}</p>
              </div>
              <div className={styles.progressRing}>
                <span className={styles.progressPct}>
                  {chapters.length > 0 ? Math.round((completedRegionalCount / chapters.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* 챕터 목록 */}
            <section>
              <p className={styles.sectionLabel}>REGIONAL CURRICULUM · {char.name} {t("regionalChaptersLabel")}</p>
              <div className={styles.chapterList}>
                {chapters.map((chapter, idx) => {
                  const isCompleted = stamps.includes(chapter.id);
                  // 정적 chapter.is_locked는 항상 false라 실질적으로 아무 챕터나 순서 없이 열려
                  // 있었다 — 반드시 바로 이전 챕터를 완료해야 다음 챕터가 열리도록 stamps 기반으로
                  // 판단한다.
                  const isLocked = !isCompleted && !isChapterUnlocked(chapter.id, char.id, stamps);
                  const isActive = !isLocked && !isCompleted;

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
                        title={isLocked ? t("chapterLockedHint") : undefined}
                      >
                        <div className={`${styles.chapterIcon} ${isCompleted ? styles.iconDone : ""} ${isActive ? styles.iconActive : ""} ${isLocked ? styles.iconLocked : ""}`}>
                          <span className={styles.chapterEmoji} aria-hidden="true">{chapter.emoji}</span>
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
                            {/* 챕터 내부 문항 단위 진행률은 백엔드에 저장되지 않으므로(챕터 완료 여부만
                                stamps로 기록됨), 여기서는 챕터 완료 여부만 점으로 표시한다.
                                이전엔 currentStep을 "챕터당 10문항"으로 가정해 문항 단위로 채웠으나,
                                실제 문항 수(~25~27개)와 맞지 않아 챕터 하나만 끝내도 다음 챕터까지
                                점이 채워지는 버그가 있었다. */}
                            {Array.from({ length: chapter.step_count }).map((_, si) => (
                              <div
                                key={si}
                                className={`${styles.stepDot} ${isCompleted ? styles.stepDone : ""} ${isLocked ? styles.stepLocked : ""}`}
                              />
                            ))}
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

        {/* 2. 스페셜 주제별 스토리 탭 — 순서 강제가 아닌 개별 영구 소장 콘텐츠 */}
        {tab === "special" && (
          <section className={styles.specialSection}>
            <div className={styles.captainSelectorBox}>
              <p className={styles.selectorLabel}>{t("selectCaptainLearn")}</p>
              <div className={styles.captainPills}>
                {MOCK_CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.captainPill} ${selectedCaptainId === c.id ? styles.captainActive : ""}`}
                    onClick={() => {
                      setSelectedCaptainId(c.id);
                      setPreferredCaptainId(c.id);
                    }}
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
              {filteredSpecialChapters.map((sc) => {
                // 스페셜 챕터도 stamps에 완료 여부가 정확히 기록되므로(id별로 구분되어
                // 지역 챕터와 절대 섞이지 않음), 완료 배지를 보여줄 수 있다 — 예전엔 이 탭이
                // 진행 상태를 아예 보여주지 않고 항상 🔒만 표시했다.
                const isCompleted = stamps.includes(sc.id);
                // 스토리는 챕터 순서를 강제하지 않는다. 프리미엄 구매자는 전체를 영구 소장하고,
                // 무료 회원은 원하는 에피소드 하나만 5코인으로 영구 해금할 수 있다.
                const isSequenceLocked = false;
                return (
                  <div key={sc.id} className={styles.chapterRow}>
                    <Link
                      href={isSequenceLocked ? "#" : `/learn/${activeCaptain.id}/${sc.id}`}
                      className={`${styles.chapterCard} ${isCompleted ? styles.chapterDone : styles.chapterLocked}`}
                      aria-disabled={isSequenceLocked}
                      title={isSequenceLocked ? t("chapterLockedHint") : undefined}
                    >
                      <div className={`${styles.chapterIcon} ${isCompleted ? styles.iconDone : ""} ${isSequenceLocked ? styles.iconLocked : ""}`}>
                        <span className={styles.chapterEmoji} aria-hidden="true">{sc.emoji}</span>
                      </div>

                      <div className={styles.chapterInfo}>
                        <div className={styles.chapterMeta}>
                          <div>
                            <p className={styles.chapterNum}>{t("tabSpecial")} {sc.order}</p>
                            <p className={styles.chapterTitle}>{sc.title}</p>
                            <p className={styles.chapterTitleEn}>{sc.title_en}</p>
                          </div>
                          {isCompleted
                            ? <span className="badge badge-mint">{t("completed")}</span>
                            : isSequenceLocked
                              ? <span className="badge badge-muted">{t("locked")}</span>
                              : <span className="badge badge-gold">⭐ {t("premiumOnly")}</span>}
                        </div>
                        <p className={styles.chapterDesc}>{sc.description}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
