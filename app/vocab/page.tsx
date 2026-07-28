"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { getLocalVocab } from "@/lib/vocab/store";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import type { VocabItem } from "@/types/database";
import styles from "./vocab.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const MASTERY_CONFIG = {
  new:       { ko: "새 단어",   en: "New",       color: "var(--text-muted)",       bg: "var(--bg-elevated)", border: "var(--border-subtle)" },
  learning:  { ko: "학습 중",   en: "Learning",  color: "var(--blue)",             bg: "var(--blue-light)",  border: "var(--blue-mid)" },
  reviewing: { ko: "복습 필요", en: "Review Due", color: "var(--color-warning)",   bg: "#FEF3C7",            border: "#FCD34D" },
  mastered:  { ko: "마스터",    en: "Mastered",  color: "var(--mint)",             bg: "var(--mint-light)",  border: "#90CBA8" },
};

export default function VocabPage() {
  const { t } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [vocab, setVocab] = useState<VocabItem[]>([]);

  const regionTabs = [
    { id: "all",         name: t("tabAll"),       emoji: "🗺️" },
    { id: "seoul",       name: t("seoulRoute"),   emoji: "🏯" },
    { id: "jeonju",      name: t("jeonjuRoute"),  emoji: "🏮" },
    { id: "busan",       name: t("busanRoute"),   emoji: "⚓" },
    { id: "chungcheong", name: t("chungcheongRoute"), emoji: "🏛️" },
    { id: "jeju",        name: t("jejuRoute"),    emoji: "🌋" },
  ];

  useEffect(() => {
    // 로컬(브라우저) 저장분을 우선 보여준다 — 백엔드가 꺼져 있어도 항상 동작
    const local = getLocalVocab();
    setVocab(local);

    // 백엔드가 살아있으면 서버 저장분과 합쳐서(중복 단어 제외) 보여준다
    fetch(`${BACKEND_URL}/vocab/${getEffectiveUserId()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((remote: VocabItem[]) => {
        if (remote.length === 0) return;
        const localWords = new Set(local.map((v) => `${v.character_id}:${v.word}`));
        const merged = [...local, ...remote.filter((v) => !localWords.has(`${v.character_id}:${v.word}`))];
        setVocab(merged);
      })
      .catch(() => {});
  }, []);

  const filtered = selectedRegion === "all"
    ? vocab
    : vocab.filter((v) => {
        const charRegion: Record<string, string> = {
          kyuhyun: "seoul", haneul: "jeonju", sunwoo: "busan",
          sangwoo: "chungcheong", yongwoo: "jeju",
        };
        return charRegion[v.character_id] === selectedRegion;
      });

  const mastered = filtered.filter((v) => v.mastery === "mastered").length;
  const reviewing = filtered.filter((v) => v.mastery === "reviewing").length;

  const exitPractice = () => {
    setPracticeMode(false);
    setShowAnswer(false);
    setPracticeIdx(0);
  };

  const handlePracticeNext = () => {
    setShowAnswer(false);
    setPracticeIdx((i) => i + 1);
  };

  if (practiceMode && filtered.length > 0) {
    // 카드를 다 돌면(practiceIdx가 목록 끝을 넘어가면) 완료 화면을 보여준다 — 예전엔 "다음"으로
    // 넘어갈 방법 자체가 없어서(카드를 뒤집는 것 말고는 아무 인터랙션도 없었음) 첫 단어에서
    // 멈춘 채 진행이 안 되는 버그가 있었다.
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

  return (
    <>
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("vocabTitle")}</h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{t("vocabSub")}</p>
          </div>
          {filtered.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => { setPracticeMode(true); setPracticeIdx(0); setShowAnswer(false); }} id="btn-practice">
              ✏️ {t("practiceVocab")}
            </button>
          )}
        </header>

        <div className={styles.inner}>
          <div className={styles.regionTabs} role="tablist">
            {regionTabs.map((tab) => (
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
