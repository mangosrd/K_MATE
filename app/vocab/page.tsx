"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import { getLocalVocab, clearLocalVocab } from "@/lib/vocab/store";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { useTranslatedTexts } from "@/lib/translate/store";
import { MOCK_CHARACTERS } from "@/lib/db/mock";
import type { VocabItem } from "@/types/database";
import styles from "./vocab.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const MASTERY_CONFIG = {
  new:       { labelKey: "wordStatusNew",      color: "var(--text-muted)",     bg: "var(--bg-elevated)", border: "var(--border-subtle)" },
  learning:  { labelKey: "wordStatusLearning", color: "var(--blue)",           bg: "var(--blue-light)",  border: "var(--blue-mid)" },
  reviewing: { labelKey: "wordStatusReview",   color: "var(--color-warning)",  bg: "#FEF3C7",             border: "#FCD34D" },
  mastered:  { labelKey: "mastered",           color: "var(--mint)",           bg: "var(--mint-light)",  border: "#90CBA8" },
};

// 기장별 탭 구성
const CHARACTER_TABS = [
  { id: "all", name: "전체", emoji: "📚", nameEn: "All" },
  ...MOCK_CHARACTERS.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, nameEn: c.name })),
];

// 캐릭터 ID → 기장 이름 조회
const charNameMap: Record<string, string> = Object.fromEntries(
  MOCK_CHARACTERS.map((c) => [c.id, c.name])
);

export default function VocabPage() {
  const { t, language } = useLanguage();
  const [selectedChar, setSelectedChar] = useState<string>("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);

  const loadVocab = () => {
    const local = getLocalVocab();
    setVocab(local);

    fetch(`${BACKEND_URL}/vocab/${getEffectiveUserId()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((remote: VocabItem[]) => {
        if (remote.length === 0) return;
        const localWords = new Set(local.map((v) => `${v.character_id}:${v.word}`));
        const merged = [...local, ...remote.filter((v) => !localWords.has(`${v.character_id}:${v.word}`))];
        setVocab(merged);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadVocab();
  }, []);

  const handleReset = async () => {
    // 1) 로컬스토리지 삭제
    clearLocalVocab();
    setVocab([]);
    setShowResetModal(false);

    // 2) DB에서도 삭제 (best-effort — 실패해도 로컬은 이미 지워진 상태)
    try {
      await fetch(`${BACKEND_URL}/vocab/${getEffectiveUserId()}`, {
        method: "DELETE",
      });
    } catch {
      // 백엔드가 꺼져있어도 로컬은 이미 초기화됨
    }
  };

  const filtered = selectedChar === "all"
    ? vocab
    : vocab.filter((v) => v.character_id === selectedChar);

  const mastered = filtered.filter((v) => v.mastery === "mastered").length;
  const reviewing = filtered.filter((v) => v.mastery === "reviewing").length;

  // 단어 뜻/예문 번역 — 훅은 항상 최상위에서 무조건 호출해야 하므로 조건부 return 이전에 호출
  const listFlatItems = filtered.flatMap((item) => [
    { text: item.meaning, contextKo: item.word },
    { text: item.sentence_translation, contextKo: item.sentence },
  ]);
  const translatedListFlat = useTranslatedTexts(listFlatItems, language);

  const practiceWord = practiceMode ? filtered[practiceIdx] : undefined;
  const practiceItems = practiceWord
    ? [
        { text: practiceWord.meaning, contextKo: practiceWord.word },
        { text: practiceWord.sentence_translation, contextKo: practiceWord.sentence },
      ]
    : [];
  const [translatedPracticeMeaning, translatedPracticeTrans] = useTranslatedTexts(practiceItems, language);

  const exitPractice = () => {
    setPracticeMode(false);
    setShowAnswer(false);
    setPracticeIdx(0);
  };

  const handlePracticeNext = () => {
    setShowAnswer(false);
    setPracticeIdx((i) => i + 1);
  };

  // ── 연습 모드 ────────────────────────────────────────────────────────────
  if (practiceMode && filtered.length > 0) {
    const isFinished = practiceIdx >= filtered.length;

    if (isFinished) {
      return (
        <>
          <div className="page-content">
            <header className={styles.practiceHeader}>
              <button onClick={exitPractice} className={styles.closeBtn}>✕</button>
              <div>
                <p className={styles.practiceTitle}>{t("practiceVocab")}</p>
              </div>
            </header>
            <div className={styles.practiceArea} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 48 }}>🎉</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{t("practiceCompleteTitle")}</h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
                {t("practiceCompleteSub", { n: filtered.length })}
              </p>
              <button className="btn btn-primary btn-lg" onClick={exitPractice} id="btn-practice-done">
                {t("backToList")}
              </button>
            </div>
          </div>
          <BottomNav />
        </>
      );
    }

    const word = filtered[practiceIdx];
    const charName = word.character_name ?? charNameMap[word.character_id] ?? word.character_id;
    return (
      <>
        <div className="page-content">
          <header className={styles.practiceHeader}>
            <button onClick={exitPractice} className={styles.closeBtn}>✕</button>
            <div>
              <p className={styles.practiceTitle}>{t("practiceVocab")}</p>
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
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  ✈️ {charName}
                </p>
              </div>
              <div className={styles.flashBack}>
                <p className={styles.flashMeaning}>{translatedPracticeMeaning ?? word.meaning}</p>
                <div className={styles.flashExample}>
                  <p className={styles.flashSentence}>"{word.sentence}"</p>
                  <p className={styles.flashTrans}>{translatedPracticeTrans ?? word.sentence_translation}</p>
                </div>
              </div>
            </button>

            {showAnswer && (
              <button className="btn btn-primary btn-lg" onClick={handlePracticeNext} id="btn-next-word">
                {t("nextWord")}
              </button>
            )}
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  // ── 메인 목록 ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("vocabTitle")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t("vocabSub")}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {filtered.length > 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setPracticeMode(true); setPracticeIdx(0); setShowAnswer(false); }}
                id="btn-practice"
              >
                ✏️ {t("practiceVocab")}
              </button>
            )}
            {/* 초기화 버튼 */}
            <button
              className="btn btn-sm"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
              onClick={() => setShowResetModal(true)}
              id="btn-vocab-reset"
              title="단어장 초기화"
            >
              🗑️
            </button>
          </div>
        </header>

        <div className={styles.inner}>
          {/* 기장별 탭 */}
          <div className={styles.regionTabs} role="tablist">
            {CHARACTER_TABS.map((tab) => {
              const count = tab.id === "all"
                ? vocab.length
                : vocab.filter((v) => v.character_id === tab.id).length;
              const char = MOCK_CHARACTERS.find((c) => c.id === tab.id);
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={selectedChar === tab.id}
                  id={`vocab-tab-${tab.id}`}
                  className={`${styles.regionTab} ${selectedChar === tab.id ? styles.regionTabActive : ""}`}
                  onClick={() => setSelectedChar(tab.id)}
                >
                  {char ? (
                    <div className={styles.tabAvatar}>
                      <Image
                        src={`/characters/${char.id}.png`}
                        alt={char.name}
                        width={28}
                        height={28}
                        className={styles.tabAvatarImg}
                      />
                    </div>
                  ) : (
                    <span className={styles.regionTabEmoji}>{tab.emoji}</span>
                  )}
                  <span className={styles.regionTabName}>{tab.name}</span>
                  {count > 0 && (
                    <span className={styles.tabCount}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 통계 */}
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{filtered.length}</span>
              <span className={styles.statKo}>{t("learnedWords")}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: "var(--mint)" }}>{mastered}</span>
              <span className={styles.statKo}>{t("masteredWords")}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: "var(--color-warning)" }}>{reviewing}</span>
              <span className={styles.statKo}>{t("mastered")}</span>
            </div>
          </div>

          {/* 단어 목록 */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>📖</p>
              <p>{t("vocabTitle")}</p>
              <Link href="/map" className="btn btn-primary btn-sm">{t("travel")} →</Link>
            </div>
          ) : (
            <div>
              <p className="section-title">
                {t("allWords")} · {filtered.length}
              </p>
              <div className={styles.wordList}>
                {filtered.map((item, idx) => {
                  const cfg = MASTERY_CONFIG[item.mastery];
                  const meaning = translatedListFlat[idx * 2] ?? item.meaning;
                  const translation = translatedListFlat[idx * 2 + 1] ?? item.sentence_translation;
                  const charName = item.character_name ?? charNameMap[item.character_id] ?? item.character_id;
                  const charInfo = MOCK_CHARACTERS.find((c) => c.id === item.character_id);
                  return (
                    <div key={item.id} className={styles.wordCard} id={`word-${item.id}`}>
                      <div className={styles.wordHeader}>
                        <div>
                          <p className={styles.wordText}>{item.word}</p>
                          {item.reading && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>[{item.reading}]</p>
                          )}
                          <p className={styles.wordMeaning}>{meaning}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {t(cfg.labelKey)}
                          </span>
                          {/* 기장 배지 */}
                          <span className={styles.charBadge}>
                            {charInfo && (
                              <Image
                                src={`/characters/${charInfo.id}.png`}
                                alt={charName}
                                width={14}
                                height={14}
                                className={styles.charBadgeImg}
                              />
                            )}
                            {charName}
                          </span>
                        </div>
                      </div>
                      {item.sentence && (
                        <div className={styles.wordExample}>
                          <p className={styles.wordSentence}>"{item.sentence}"</p>
                          {translation && (
                            <p className={styles.wordTranslation}>{translation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* 초기화 확인 모달 */}
      {showResetModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowResetModal(false)}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <div className="modal-handle" />
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>단어장 초기화</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
              저장된 단어 <strong>{vocab.length}개</strong>가 모두 삭제됩니다.<br />
              이 작업은 되돌릴 수 없어요.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary btn-lg"
                style={{ flex: 1 }}
                onClick={() => setShowResetModal(false)}
                id="btn-reset-cancel"
              >
                취소
              </button>
              <button
                className="btn btn-lg"
                style={{ flex: 1, background: "var(--red)", color: "#fff", border: "none" }}
                onClick={handleReset}
                id="btn-reset-confirm"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
