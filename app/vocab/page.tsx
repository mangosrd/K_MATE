"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { MOCK_USER } from "@/lib/db/mock";
import type { VocabItem } from "@/types/database";
import styles from "./vocab.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const MASTERY_CONFIG = {
  new:       { ko: "새 단어",   en: "New",       color: "var(--text-muted)",       bg: "var(--bg-elevated)", border: "var(--border-subtle)" },
  learning:  { ko: "학습 중",   en: "Learning",  color: "var(--blue)",             bg: "var(--blue-light)",  border: "var(--blue-mid)" },
  reviewing: { ko: "복습 필요", en: "Review Due", color: "var(--color-warning)",   bg: "#FEF3C7",            border: "#FCD34D" },
  mastered:  { ko: "마스터",    en: "Mastered",  color: "var(--mint)",             bg: "var(--mint-light)",  border: "#90CBA8" },
};

// 지역 탭 (전체 포함)
const REGION_TABS = [
  { id: "all",         name: "전체",      en: "All",        emoji: "🗺️" },
  { id: "seoul",       name: "서울·경기", en: "Seoul",      emoji: "🏯" },
  { id: "jeonju",      name: "전주·전라", en: "Jeonju",     emoji: "🏮" },
  { id: "busan",       name: "부산·경남", en: "Busan",      emoji: "⚓" },
  { id: "chungcheong", name: "충청·공주", en: "Chungcheong",emoji: "🏛️" },
  { id: "jeju",        name: "제주",      en: "Jeju",       emoji: "🌋" },
];

type RegionTab = typeof REGION_TABS[number]["id"];

export default function VocabPage() {
  const [selectedRegion, setSelectedRegion] = useState<RegionTab>("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [vocab, setVocab] = useState<VocabItem[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/vocab/${MOCK_USER.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: VocabItem[]) => setVocab(data))
      .catch(() => setVocab([]));
  }, []);

  const filtered = selectedRegion === "all"
    ? vocab
    : vocab.filter((v) => {
        // character_id를 region 매핑으로 필터
        const charRegion: Record<string, string> = {
          kyuhyun: "seoul", haneul: "jeonju", sunwoo: "busan",
          sangwoo: "chungcheong", yongwoo: "jeju",
        };
        return charRegion[v.character_id] === selectedRegion;
      });

  const mastered = filtered.filter((v) => v.mastery === "mastered").length;
  const reviewing = filtered.filter((v) => v.mastery === "reviewing").length;

  // ── 연습 모드 ────────────────────────────────────────────
  if (practiceMode && filtered.length > 0) {
    const word = filtered[practiceIdx % filtered.length];
    const cfg = MASTERY_CONFIG[word.mastery];
    return (
      <>
        <div className="page-content">
          {/* 연습 헤더 */}
          <header className={styles.practiceHeader}>
            <button onClick={() => { setPracticeMode(false); setShowAnswer(false); setPracticeIdx(0); }} className={styles.closeBtn}>✕</button>
            <div>
              <p className={styles.practiceTitle}>단어 연습</p>
              <p className={styles.practiceSub}>{practiceIdx + 1} / {filtered.length}</p>
            </div>
            <div className={styles.practiceProgress}>
              <div className="progress-bar" style={{ width: 80 }}>
                <div className="progress-fill" style={{ width: `${((practiceIdx) / filtered.length) * 100}%` }} />
              </div>
            </div>
          </header>

          <div className={styles.practiceArea}>
            <button
              className={`${styles.flashCard} ${showAnswer ? styles.flipped : ""}`}
              onClick={() => setShowAnswer(!showAnswer)}
              aria-label="카드 뒤집기"
            >
              <div className={styles.flashFront}>
                <p className={styles.flashWord}>{word.word}</p>
                <p className={styles.flashReading}>{word.reading}</p>
                <p className={styles.flashHint}>탭해서 뒤집기</p>
              </div>
              <div className={styles.flashBack}>
                <p className={styles.flashMeaning}>{word.meaning}</p>
                <div className={styles.flashExample}>
                  <p className={styles.flashSentence}>"{word.sentence}"</p>
                  <p className={styles.flashTrans}>{word.sentence_translation}</p>
                </div>
              </div>
            </button>

            {showAnswer && (
              <div className={styles.practiceActions}>
                <button className="btn btn-secondary" onClick={() => { setShowAnswer(false); setPracticeIdx((i) => Math.max(0, i - 1)); }}>
                  ‹ 이전
                </button>
                <button className="btn btn-primary" onClick={() => { setShowAnswer(false); setPracticeIdx((i) => i + 1); }} id="btn-next-vocab">
                  다음 →
                </button>
              </div>
            )}

            {practiceIdx >= filtered.length && (
              <div className={styles.practiceComplete}>
                <p>🎉 완료!</p>
                <button className="btn btn-primary" onClick={() => { setPracticeMode(false); setPracticeIdx(0); setShowAnswer(false); }}>
                  목록으로
                </button>
              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  // ── 기본 목록 화면 ────────────────────────────────────────
  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">단어장</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>Vocabulary</p>
          </div>
          {filtered.length > 0 && (
            <button className="btn btn-blue btn-sm" onClick={() => { setPracticeMode(true); setPracticeIdx(0); setShowAnswer(false); }} id="btn-practice">
              ✏️ 연습
            </button>
          )}
        </header>

        <div className={styles.inner}>
          {/* 지역 탭 (가로 스크롤) */}
          <div className={styles.regionTabs} role="tablist">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={selectedRegion === tab.id}
                id={`vocab-tab-${tab.id}`}
                className={`${styles.regionTab} ${selectedRegion === tab.id ? styles.regionTabActive : ""}`}
                onClick={() => setSelectedRegion(tab.id)}
              >
                <span className={styles.regionTabEmoji}>{tab.emoji}</span>
                <span className={styles.regionTabName}>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* 통계 */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{filtered.length}</span>
              <span className={styles.statKo}>저장</span>
              <span className={styles.statEn}>Saved</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: "var(--mint)" }}>{mastered}</span>
              <span className={styles.statKo}>마스터</span>
              <span className={styles.statEn}>Mastered</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: "var(--color-warning)" }}>{reviewing}</span>
              <span className={styles.statKo}>복습 필요</span>
              <span className={styles.statEn}>Review Due</span>
            </div>
          </div>

          {/* 복습 배너 */}
          {reviewing > 0 && (
            <div className={styles.reviewBanner}>
              <div>
                <p className={styles.reviewBannerTitle}>오늘의 복습</p>
                <p className={styles.reviewBannerSub}>Today&apos;s Review · {reviewing}개 준비됨</p>
              </div>
              <button className="btn btn-blue btn-sm" onClick={() => { setPracticeMode(true); setPracticeIdx(0); }} id="btn-start-review">
                시작 →
              </button>
            </div>
          )}

          {/* 단어 목록 */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>📖</p>
              <p>이 지역에 저장된 단어가 없어요</p>
              <p className={styles.emptyEn}>No words saved for this region yet.</p>
              <Link href="/map" className="btn btn-primary btn-sm">여행 시작하기 →</Link>
            </div>
          ) : (
            <div>
              <p className="section-title">
                {selectedRegion === "all" ? "전체 단어" : REGION_TABS.find((t) => t.id === selectedRegion)?.name + " 단어"} · {filtered.length}개
              </p>
              <div className={styles.wordList}>
                {filtered.map((item) => {
                  const cfg = MASTERY_CONFIG[item.mastery];
                  return (
                    <div key={item.id} className={styles.wordCard} id={`word-${item.id}`}>
                      <div className={styles.wordHeader}>
                        <div>
                          <p className={styles.wordText}>{item.word}</p>
                          <p className={styles.wordMeaning}>{item.meaning}</p>
                        </div>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.ko}
                        </span>
                      </div>
                      <div className={styles.wordExample}>
                        <p className={styles.wordSentence}>"{item.sentence}"</p>
                        <p className={styles.wordTranslation}>{item.sentence_translation}</p>
                      </div>
                      <div className={styles.wordTags}>
                        {item.tags.map((tag) => (
                          <span key={tag} className="badge badge-blue">{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
