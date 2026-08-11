"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import { getLocalVocab, clearLocalVocab } from "@/lib/vocab/store";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage, type Language } from "@/components/LanguageContext";
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

type ReviewCopy = {
  choice: string;
  written: string;
  choicePrompt: string;
  writtenPrompt: string;
  answerPlaceholder: string;
  check: string;
  correct: string;
  incorrect: string;
  answer: string;
  next: string;
  complete: string;
  completeSub: string;
  back: string;
  exit: string;
};

const REVIEW_COPY: Record<Language, ReviewCopy> = {
  ko: { choice: "객관식", written: "직접 입력", choicePrompt: "이 한국어 단어의 뜻을 고르세요", writtenPrompt: "뜻과 예문을 보고 한국어 단어를 입력하세요", answerPlaceholder: "한국어 단어를 입력하세요", check: "정답 확인", correct: "정답이에요!", incorrect: "다시 생각해 봐요.", answer: "정답", next: "다음 문제", complete: "복습 완료!", completeSub: "모든 단어를 복습했어요.", back: "단어장으로", exit: "복습 나가기" },
  en: { choice: "Multiple choice", written: "Type answer", choicePrompt: "Choose the meaning of this Korean word", writtenPrompt: "Read the meaning and example, then type the Korean word", answerPlaceholder: "Type the Korean word", check: "Check answer", correct: "Correct!", incorrect: "Try again.", answer: "Answer", next: "Next question", complete: "Review complete!", completeSub: "You reviewed every word.", back: "Back to vocab", exit: "Exit review" },
  ru: { choice: "Выбор", written: "Ввести ответ", choicePrompt: "Выберите значение этого корейского слова", writtenPrompt: "Прочитайте значение и пример, затем введите корейское слово", answerPlaceholder: "Введите корейское слово", check: "Проверить", correct: "Верно!", incorrect: "Попробуйте ещё раз.", answer: "Ответ", next: "Следующий вопрос", complete: "Повторение завершено!", completeSub: "Вы повторили все слова.", back: "К словарю", exit: "Выйти" },
  zh: { choice: "选择题", written: "输入答案", choicePrompt: "请选择这个韩语单词的意思", writtenPrompt: "阅读释义和例句后，输入韩语单词", answerPlaceholder: "输入韩语单词", check: "检查答案", correct: "回答正确！", incorrect: "再试一次。", answer: "答案", next: "下一题", complete: "复习完成！", completeSub: "你已复习全部单词。", back: "返回生词本", exit: "退出复习" },
  ja: { choice: "選択問題", written: "入力問題", choicePrompt: "この韓国語の意味を選んでください", writtenPrompt: "意味と例文を見て、韓国語の単語を入力してください", answerPlaceholder: "韓国語の単語を入力", check: "答えを確認", correct: "正解です！", incorrect: "もう一度考えてみましょう。", answer: "答え", next: "次の問題", complete: "復習完了！", completeSub: "すべての単語を復習しました。", back: "単語帳へ", exit: "復習を終了" },
  "zh-TW": { choice: "選擇題", written: "輸入答案", choicePrompt: "請選擇這個韓語單字的意思", writtenPrompt: "閱讀釋義和例句後，輸入韓語單字", answerPlaceholder: "輸入韓語單字", check: "檢查答案", correct: "答對了！", incorrect: "再想想看。", answer: "答案", next: "下一題", complete: "複習完成！", completeSub: "你已複習全部單字。", back: "返回生詞本", exit: "離開複習" },
  th: { choice: "แบบเลือกตอบ", written: "พิมพ์คำตอบ", choicePrompt: "เลือกความหมายของคำเกาหลีนี้", writtenPrompt: "อ่านความหมายและตัวอย่าง แล้วพิมพ์คำเกาหลี", answerPlaceholder: "พิมพ์คำเกาหลี", check: "ตรวจคำตอบ", correct: "ถูกต้อง!", incorrect: "ลองอีกครั้ง", answer: "คำตอบ", next: "ข้อถัดไป", complete: "ทบทวนเสร็จแล้ว!", completeSub: "คุณทบทวนคำศัพท์ครบแล้ว", back: "กลับไปคำศัพท์", exit: "ออกจากการทบทวน" },
};

const OX_COPY: Record<Language, { label: string; prompt: string }> = {
  ko: { label: "O / X", prompt: "아래 뜻이 이 단어와 맞으면 O, 아니면 X를 누르세요" },
  en: { label: "True / False", prompt: "Press O if this meaning matches the Korean word, or X if it does not" },
  ru: { label: "О / Х", prompt: "Нажмите О, если значение верное, или Х, если неверное" },
  zh: { label: "O / X", prompt: "如果释义正确请按 O，不正确请按 X" },
  ja: { label: "O / X", prompt: "意味が合っていれば O、違っていれば X を押してください" },
  "zh-TW": { label: "O / X", prompt: "如果釋義正確請按 O，不正確請按 X" },
  th: { label: "O / X", prompt: "กด O หากความหมายถูกต้อง หรือ X หากไม่ถูกต้อง" },
};

function normalizeKoreanAnswer(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function VocabQuiz({ items, language, onExit }: { items: VocabItem[]; language: Language; onExit: () => void }) {
  const copy = REVIEW_COPY[language];
  const oxCopy = OX_COPY[language];
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"choice" | "written" | "ox">("choice");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const translationItems = items.flatMap((item) => [
    { text: item.meaning, contextKo: item.word },
    { text: item.sentence_translation || item.sentence, contextKo: item.sentence },
  ]);
  const translations = useTranslatedTexts(translationItems, language);
  const item = items[index];

  const meaningAt = (itemIndex: number) => translations[itemIndex * 2] ?? items[itemIndex].meaning;
  const sentenceAt = (itemIndex: number) =>
    translations[itemIndex * 2 + 1] ?? items[itemIndex].sentence_translation ?? items[itemIndex].sentence;

  const optionIndexes = (() => {
    const currentMeaning = meaningAt(index);
    const distractors = items
      .map((_, itemIndex) => itemIndex)
      .filter((itemIndex) => itemIndex !== index && meaningAt(itemIndex) !== currentMeaning)
      .sort((a, b) => ((a * 17 + index * 7) % items.length) - ((b * 17 + index * 7) % items.length))
      .slice(0, 3);
    return [index, ...distractors].sort((a, b) => ((a * 11 + index * 5) % items.length) - ((b * 11 + index * 5) % items.length));
  })();
  const wrongOxIndex = items
    .map((_, itemIndex) => itemIndex)
    .find((itemIndex) => itemIndex !== index && meaningAt(itemIndex) !== meaningAt(index));
  const oxIsTrue = index % 2 === 0 || wrongOxIndex === undefined;
  const oxMeaningIndex = oxIsTrue ? index : wrongOxIndex;

  const resetQuestion = () => {
    setSelectedIndex(null);
    setTypedAnswer("");
    setIsCorrect(null);
  };

  const nextQuestion = () => {
    resetQuestion();
    setIndex((current) => current + 1);
  };

  if (!item || index >= items.length) {
    return (
      <>
        <div className="page-content">
          <div className={styles.practiceArea}>
            <p className={styles.quizCompleteEmoji}>🎉</p>
            <h1 className={styles.quizCompleteTitle}>{copy.complete}</h1>
            <p className={styles.quizCompleteSub}>{copy.completeSub}</p>
            <button className="btn btn-primary btn-lg" onClick={onExit}>{copy.back}</button>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const selectChoice = (optionIndex: number) => {
    if (isCorrect) return;
    setSelectedIndex(optionIndex);
    setIsCorrect(optionIndex === index);
  };

  const submitWritten = () => {
    if (!typedAnswer.trim() || isCorrect) return;
    setIsCorrect(normalizeKoreanAnswer(typedAnswer) === normalizeKoreanAnswer(item.word));
  };

  const submitOx = (answer: boolean) => {
    if (isCorrect) return;
    setSelectedIndex(answer ? 1 : 0);
    setIsCorrect(answer === oxIsTrue);
  };

  return (
    <>
      <div className="page-content">
        <header className={styles.practiceHeader}>
          <button onClick={onExit} className={styles.closeBtn} aria-label={copy.exit}>←</button>
          <div>
            <p className={styles.practiceTitle}>{copy.choicePrompt}</p>
            <p className={styles.practiceSub}>{index + 1} / {items.length}</p>
          </div>
          <div className={styles.practiceProgress}>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${(index / items.length) * 100}%` }} /></div>
          </div>
        </header>

        <div className={styles.practiceArea}>
          <div className={styles.quizModeSwitch} role="tablist" aria-label={copy.choicePrompt}>
            <button className={mode === "choice" ? styles.quizModeActive : ""} onClick={() => { setMode("choice"); resetQuestion(); }}>{copy.choice}</button>
            <button className={mode === "written" ? styles.quizModeActive : ""} onClick={() => { setMode("written"); resetQuestion(); }}>{copy.written}</button>
            <button className={mode === "ox" ? styles.quizModeActive : ""} onClick={() => { setMode("ox"); resetQuestion(); }}>{oxCopy.label}</button>
          </div>

          {mode === "choice" ? (
            <>
              <section className={styles.quizQuestionCard}>
                <p className={styles.quizPrompt}>{copy.choicePrompt}</p>
                <p className={styles.quizWord}>{item.word}</p>
                {item.reading && <p className={styles.flashReading}>[{item.reading}]</p>}
              </section>
              <div className={styles.choiceList}>
                {optionIndexes.map((optionIndex) => {
                  const isSelected = selectedIndex === optionIndex;
                  const isRight = optionIndex === index;
                  return (
                    <button
                      key={optionIndex}
                      className={`${styles.choiceOption} ${isSelected ? (isRight ? styles.choiceCorrect : styles.choiceWrong) : ""}`}
                      onClick={() => selectChoice(optionIndex)}
                      disabled={isCorrect === true}
                    >
                      {meaningAt(optionIndex)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : mode === "written" ? (
            <>
              <section className={styles.quizQuestionCard}>
                <p className={styles.quizPrompt}>{copy.writtenPrompt}</p>
                <p className={styles.quizMeaning}>{meaningAt(index)}</p>
                {item.sentence && (
                  <div className={styles.quizExample}>
                    <p>“{item.sentence}”</p>
                    <p>{sentenceAt(index)}</p>
                  </div>
                )}
              </section>
              <form className={styles.writtenForm} onSubmit={(event) => { event.preventDefault(); submitWritten(); }}>
                <input value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} placeholder={copy.answerPlaceholder} autoCapitalize="none" autoCorrect="off" />
                <button className="btn btn-primary" type="submit" disabled={!typedAnswer.trim() || isCorrect === true}>{copy.check}</button>
              </form>
            </>
          ) : (
            <>
              <section className={styles.quizQuestionCard}>
                <p className={styles.quizPrompt}>{oxCopy.prompt}</p>
                <p className={styles.quizWord}>{item.word}</p>
                <p className={styles.quizMeaning}>{meaningAt(oxMeaningIndex)}</p>
              </section>
              <div className={styles.oxActions}>
                <button className={styles.oxTrue} onClick={() => submitOx(true)} disabled={isCorrect === true}>O</button>
                <button className={styles.oxFalse} onClick={() => submitOx(false)} disabled={isCorrect === true}>X</button>
              </div>
            </>
          )}

          {isCorrect !== null && (
            <div className={`${styles.quizFeedback} ${isCorrect ? styles.quizFeedbackCorrect : styles.quizFeedbackWrong}`} role="status">
              <strong>{isCorrect ? copy.correct : copy.incorrect}</strong>
              {!isCorrect && <span>{copy.answer}: {item.word} · {meaningAt(index)}</span>}
            </div>
          )}
          {isCorrect && <button className="btn btn-primary btn-lg" onClick={nextQuestion}>{copy.next}</button>}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default function VocabPage() {
  const { t, language } = useLanguage();
  const [selectedChar, setSelectedChar] = useState<string>("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loadVocab = () => {
    const local = getLocalVocab();
    setVocab(local);

    fetch(`${BACKEND_URL}/vocab/${getEffectiveUserId()}`, { headers: getAuthHeaders() })
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
    setIsResetting(true);
    setResetError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/vocab/${getEffectiveUserId()}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Vocabulary deletion failed (${response.status})`);

      // Clear the browser cache only after the database accepts the deletion.
      clearLocalVocab();
      setVocab([]);
      setShowResetModal(false);
    } catch {
      setResetError("단어장 초기화에 실패했습니다. 네트워크 연결 후 다시 시도해 주세요.");
    } finally {
      setIsResetting(false);
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
    return <VocabQuiz items={filtered} language={language} onExit={exitPractice} />;

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
            {false && filtered.length > 0 && (
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
          <section className={styles.studyHero}>
            <div className={styles.studyHeroCopy}>
              <span className={styles.studyEyebrow}>✦ {t("practiceVocab")}</span>
              <h2>{filtered.length > 0 ? `${filtered.length} ${t("learnedWords")}` : t("vocabTitle")}</h2>
              <p>{filtered.length > 0 ? `${mastered} ${t("masteredWords")} · ${reviewing} ${t("wordStatusReview")}` : t("vocabSub")}</p>
            </div>
            {filtered.length > 0 ? (
              <button
                className={styles.studyHeroBtn}
                onClick={() => { setPracticeMode(true); setPracticeIdx(0); setShowAnswer(false); }}
              >
                {t("practiceVocab")} →
              </button>
            ) : (
              <span className={styles.studyHeroEmoji}>📚</span>
            )}
          </section>

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
                  <span className={styles.regionTabName}>{tab.id === "all" ? t("tabAll") : tab.name}</span>
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
              <span className={styles.statKo}>{t("wordStatusReview")}</span>
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
          onClick={() => { if (!isResetting) setShowResetModal(false); }}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <div className="modal-handle" />
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>단어장 초기화</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
              저장된 단어 <strong>{vocab.length}개</strong>가 모두 삭제됩니다.<br />
              이 작업은 되돌릴 수 없어요.
            </p>
            {resetError && (
              <p role="alert" style={{ fontSize: 13, color: "var(--red)", fontWeight: 700, marginBottom: 16 }}>
                {resetError}
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary btn-lg"
                style={{ flex: 1 }}
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                id="btn-reset-cancel"
              >
                취소
              </button>
              <button
                className="btn btn-lg"
                style={{ flex: 1, background: "var(--red)", color: "#fff", border: "none" }}
                onClick={handleReset}
                disabled={isResetting}
                id="btn-reset-confirm"
              >
                {isResetting ? "초기화 중..." : "초기화"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
