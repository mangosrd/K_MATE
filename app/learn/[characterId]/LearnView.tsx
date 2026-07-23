"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./learn.module.css";
import { SpecialChapter, SPECIAL_CHAPTERS, MOCK_CHARACTERS } from "@/lib/db/mock";
import type { Character, Chapter } from "@/types/database";

interface LearnViewProps {
  char: Character;
  chapters: Chapter[];
  currentStep: number;
}

export default function LearnView({ char, chapters, currentStep }: LearnViewProps) {
  const [tab, setTab] = useState<"regional" | "special">("regional");
  const [specialCategory, setSpecialCategory] = useState<"romance" | "daily" | "friendship">("romance");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>(char.id);

  const activeCaptain = MOCK_CHARACTERS.find((c) => c.id === selectedCaptainId) ?? char;

  const filteredSpecialChapters = SPECIAL_CHAPTERS.filter(
    (sc) => sc.category === specialCategory
  );

  return (
    <div className="page-content">
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href={`/region/${char.region_id}`} className={styles.backBtn}>‹</Link>
        <div className={styles.headerCenter}>
          <div className={styles.headerAvatar}>{activeCaptain.emoji}</div>
          <div>
            <h1 className={styles.headerTitle}>{activeCaptain.name} 기장과 공부하기</h1>
            <p className={styles.headerSub}>Study with Captain {activeCaptain.name}</p>
          </div>
        </div>
        <Link href={`/chat/${activeCaptain.id}`} className="btn btn-primary btn-sm" id="btn-go-chat">
          💬 대화
        </Link>
      </header>

      <div className={styles.inner}>
        {/* 커리큘럼 탭 스위처 */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${tab === "regional" ? styles.tabActive : ""}`}
            onClick={() => setTab("regional")}
          >
            🗺️ 지역 문화 (10대 챕터)
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "special" ? styles.tabActive : ""}`}
            onClick={() => setTab("special")}
          >
            ⭐ 스페셜 주제별 (30대 챕터)
          </button>
        </div>

        {/* 1. 지역 문화 커리큘럼 탭 */}
        {tab === "regional" && (
          <>
            {/* 진도 요약 */}
            <div className={styles.progressCard}>
              <div className={styles.progressInfo}>
                <p className={styles.progressLabel}>현재 진도</p>
                <p className={styles.progressValue}>챕터 {Math.ceil(currentStep / 10)} · 단계 {currentStep}</p>
              </div>
              <div className={styles.progressRing}>
                <span className={styles.progressPct}>{Math.round((currentStep / (chapters.length * 10)) * 100)}%</span>
              </div>
            </div>

            {/* 챕터 목록 */}
            <section>
              <p className={styles.sectionLabel}>REGIONAL CHAPTERS · {char.name} 기장의 지역 문화 커리큘럼 (10단계)</p>
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
                              <p className={styles.chapterNum}>챕터 {chapter.order}</p>
                              <p className={styles.chapterTitle}>{chapter.title}</p>
                              <p className={styles.chapterTitleEn}>{chapter.title_en}</p>
                            </div>
                            {isActive && <span className="badge badge-red">진행중</span>}
                            {isCompleted && <span className="badge badge-mint">완료</span>}
                            {isLocked && <span className="badge badge-muted">잠김</span>}
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

                          <p className={styles.chapterStats}>
                            단어 20개 · 문장 30개 · {chapter.step_count}단계
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* 2. 스페셜 주제별 스토리 탭 (로맨스/일상/친구 30 챕터 - 유료모드) */}
        {tab === "special" && (
          <section className={styles.specialSection}>
            <div className={styles.captainSelectorBox}>
              <p className={styles.selectorLabel}>👨‍✈️ 함께 공부할 남성 기장님 선택</p>
              <div className={styles.captainPills}>
                {MOCK_CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.captainPill} ${selectedCaptainId === c.id ? styles.captainActive : ""}`}
                    onClick={() => setSelectedCaptainId(c.id)}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.name} 기장</span>
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
                ❤️ 로맨스 스토리 (10개)
              </button>
              <button
                className={`${styles.subTabBtn} ${specialCategory === "daily" ? styles.subTabActive : ""}`}
                onClick={() => setSpecialCategory("daily")}
              >
                ☕ 일상 스토리 (10개)
              </button>
              <button
                className={`${styles.subTabBtn} ${specialCategory === "friendship" ? styles.subTabActive : ""}`}
                onClick={() => setSpecialCategory("friendship")}
              >
                🤝 친구 스토리 (10개)
              </button>
            </div>

            {/* 카테고리 헤더 요약 */}
            <div className={styles.specialCategoryCard}>
              <div className={styles.specialBadge}>⭐ 프리미엄 스페셜 모드</div>
              <h2 className={styles.specialTitle}>
                {specialCategory === "romance" && "❤️ 로맨스 스토리 (Romance Story)"}
                {specialCategory === "daily" && "☕ 일상 스토리 (Daily Life Story)"}
                {specialCategory === "friendship" && "🤝 친구 스토리 (Friendship Story)"}
              </h2>
              <p className={styles.specialMeta}>
                총 10개 챕터 · 단어 100개 · 문장 50개 · {activeCaptain.name} 기장과 달콤한 실전 대화!
              </p>
            </div>

            {/* 스페셜 챕터 목록 */}
            <div className={styles.chapterList}>
              {filteredSpecialChapters.map((sc) => (
                <div key={sc.id} className={styles.chapterRow}>
                  <Link
                    href={`/learn/${activeCaptain.id}/ch-k01`}
                    className={`${styles.chapterCard} ${styles.chapterLocked}`}
                  >
                    <div className={`${styles.chapterIcon} ${styles.iconLocked}`}>
                      🔒 {sc.emoji}
                    </div>

                    <div className={styles.chapterInfo}>
                      <div className={styles.chapterMeta}>
                        <div>
                          <p className={styles.chapterNum}>스페셜 챕터 {sc.order}</p>
                          <p className={styles.chapterTitle}>{sc.title}</p>
                          <p className={styles.chapterTitleEn}>{sc.title_en}</p>
                        </div>
                        <span className="badge badge-gold">⭐ 프리미엄</span>
                      </div>
                      <p className={styles.chapterDesc}>{sc.description}</p>

                      <p className={styles.chapterStats}>
                        단어 {sc.total_words}개 · 문장 {sc.total_sentences}개 · {sc.step_count}단계 (스페셜 모드)
                      </p>
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
