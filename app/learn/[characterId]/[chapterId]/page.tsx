"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./session.module.css";
import { getChapterContent } from "@/lib/content/chapters";
import { addVocabWord } from "@/lib/vocab/store";
import { getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
import type { ChapterWord as Word, ChapterSentence as Sentence, DialogueScene, DialogueTurn } from "@/types/content";

// ── 기장별 전용 음성 톤 조절 함수 (TTS) ─────────────────────────
async function playCaptainVoice(text: string, characterId: string) {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, characterId: "yongwoo" }),
    });

    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("audio/mpeg")) {
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn("ElevenLabs TTS Fallback to Native Speech Synthesis:", err);
  }

  // 🔊 로컬 폴백 시 낮은 피치(0.70 중저음 톤)로 낭독
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.pitch = 0.70; // 낮은 중저음 피치 조정
  utterance.rate = 0.95;  // 차분한 성우 낭독 속도

  const voices = window.speechSynthesis.getVoices();
  const nativeMaleKoVoice = voices.find(
    (v) =>
      v.lang.includes("ko") &&
      (v.name.includes("InJoon") ||
        v.name.includes("Hyunjoon") ||
        v.name.includes("BongJin") ||
        v.name.includes("Male") ||
        v.name.includes("남성"))
  );
  const nativeKoVoice = voices.find((v) => v.lang.includes("ko"));

  if (nativeMaleKoVoice) {
    utterance.voice = nativeMaleKoVoice;
  } else if (nativeKoVoice) {
    utterance.voice = nativeKoVoice;
  }

  window.speechSynthesis.speak(utterance);
}

const CAPTAIN_SHORT_NAME: Record<string, string> = {
  kyuhyun: "규현", haneul: "하늘", sunwoo: "선우", sangwoo: "상우", yongwoo: "용우",
};

type Phase = "intro" | "story" | "session" | "complete";
type ExerciseType = "flashcard" | "multiple_choice" | "fill_blank" | "sentence_match" | "listening_choice" | "speaking_practice" | "dialogue_comprehension";

interface ExerciseItem {
  id: string;
  type: ExerciseType;
  questionText: string;
  reading: string;
  blankSentence?: string;
  correctAnswer: string;
  hintText: string;
  explanation: string;
  options: string[];
  originalData: Word | Sentence | DialogueScene;
  dialogueTurns?: DialogueTurn[]; // dialogue_comprehension 전용
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateExercises(words: Word[], sentences: Sentence[], dialogues: DialogueScene[] = []): ExerciseItem[] {
  const list: ExerciseItem[] = [];

  // 1. 플래시카드
  words.forEach((w) => {
    list.push({
      id: `flash-${w.id}`,
      type: "flashcard",
      questionText: w.word,
      reading: w.reading,
      correctAnswer: w.meaning,
      hintText: `첫 글자: ${w.word[0]} (뜻: ${w.meaning.slice(0, 5)}...)`,
      explanation: `${w.word} [${w.reading}] : ${w.meaning}`,
      options: [],
      originalData: w,
    });
  });

  // 2. 객관식
  words.forEach((w) => {
    const wrong = shuffle(words.filter((item) => item.meaning !== w.meaning))
      .slice(0, 3)
      .map((item) => item.meaning);
    list.push({
      id: `mc-${w.id}`,
      type: "multiple_choice",
      questionText: w.word,
      reading: w.reading,
      correctAnswer: w.meaning,
      hintText: `발음: [${w.reading}] · 예문: ${w.example}`,
      explanation: `'${w.word}' [${w.reading}]의 올바른 뜻은 '${w.meaning}'입니다.`,
      options: shuffle([w.meaning, ...wrong]),
      originalData: w,
    });
  });

  // 3. 빈칸 채우기
  sentences.forEach((s) => {
    const parts = s.ko.split(" ");
    const firstToken = parts[0];
    const rest = parts.slice(1).join(" ");

    // 조사(는/은/을/를 등)가 단어에 붙어 있으면 실제 단어만 정답으로 삼는다 — 조사는 단어와 무관하므로
    const matchedWord = words.find(
      (w) => firstToken.startsWith(w.word) && firstToken.length > w.word.length
    );
    const targetWord = matchedWord ? matchedWord.word : firstToken;
    const particleSuffix = matchedWord ? firstToken.slice(matchedWord.word.length) : "";
    const blankSentence = `____${particleSuffix} ${rest}`;

    list.push({
      id: `fb-${s.id}`,
      type: "fill_blank",
      questionText: s.ko,
      reading: s.reading,
      blankSentence: blankSentence,
      correctAnswer: targetWord,
      hintText: `정답 첫 글자: '${targetWord[0]}' (총 ${targetWord.length}글자)`,
      explanation: `정답: "${targetWord}" ➔ 전체 문장: "${s.ko}" (${s.en})`,
      options: [],
      originalData: s,
    });
  });

  // 4. 문장 매칭
  sentences.forEach((s) => {
    const wrongEn = shuffle(sentences.filter((item) => item.en !== s.en))
      .slice(0, 3)
      .map((item) => item.en);
    list.push({
      id: `sm-${s.id}`,
      type: "sentence_match",
      questionText: s.ko,
      reading: s.reading,
      correctAnswer: s.en,
      hintText: `발음: [${s.reading}]`,
      explanation: `"${s.ko}" [${s.reading}] = "${s.en}"`,
      options: shuffle([s.en, ...wrongEn]),
      originalData: s,
    });
  });

  // 5. 듣기 문제 (Listening)
  words.slice(0, 3).forEach((w) => {
    const wrong = shuffle(words.filter((item) => item.word !== w.word))
      .slice(0, 3)
      .map((item) => item.word);
    list.push({
      id: `listen-${w.id}`,
      type: "listening_choice",
      questionText: w.word,
      reading: w.reading,
      correctAnswer: w.word,
      hintText: `뜻 힌트: ${w.meaning}`,
      explanation: `들린 단어: [${w.word}] (${w.reading}) - 뜻: ${w.meaning}`,
      options: shuffle([w.word, ...wrong]),
      originalData: w,
    });
  });

  // 6. 🗣️ 문장 읽기 연습 (Speaking Practice)
  sentences.slice(0, 2).forEach((s) => {
    const wrongOptions = shuffle(sentences.filter((item) => item.ko !== s.ko))
      .slice(0, 3)
      .map((item) => item.ko);

    list.push({
      id: `speak-${s.id}`,
      type: "speaking_practice",
      questionText: s.ko,
      reading: s.reading,
      correctAnswer: s.ko,
      hintText: `천천히 따라 읽으세요: [${s.reading}]`,
      explanation: `문장: "${s.ko}" [${s.reading}] (${s.en})`,
      options: shuffle([s.ko, ...wrongOptions]),
      originalData: s,
    });
  });

  // 7. 💬 대화 상황 파악 (Dialogue Comprehension) — 프리미엄(중급~고급) 챕터 전용
  const dialogueItems: ExerciseItem[] = dialogues.map((d) => ({
    id: `dlg-${d.id}`,
    type: "dialogue_comprehension",
    questionText: d.question,
    reading: "",
    correctAnswer: d.correct_answer,
    hintText: d.question_en,
    explanation: d.explanation,
    options: shuffle(d.options),
    originalData: d,
    dialogueTurns: d.turns,
  }));

  // 대화 문제는 항상 포함하고, 남은 자리를 다른 유형으로 무작위로 채운다
  const otherItems = shuffle(list).slice(0, Math.max(0, 10 - dialogueItems.length));
  return shuffle([...dialogueItems, ...otherItems]);
}

export default function LearningSessionPage({
  params,
}: {
  params: Promise<{ characterId: string; chapterId: string }>;
}) {
  const { characterId, chapterId } = use(params);
  const { t } = useLanguage();
  const content = getChapterContent(chapterId);

  const exercises = useMemo(
    () => (content ? generateExercises(content.words, content.sentences, content.dialogues ?? []) : []),
    [chapterId, content]
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);

  // 다음 챕터 ID 계산 (e.g. ch-k01 ➔ ch-k02)
  const chapterPrefix = chapterId.slice(0, 4);
  const chapterNum = parseInt(chapterId.slice(4) || "1", 10);
  const nextNum = chapterNum + 1;
  const nextChapterId = `${chapterPrefix}${nextNum < 10 ? "0" + nextNum : nextNum}`;

  // ── 문제 상태 ─────────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [isListeningSTT, setIsListeningSTT] = useState(false);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const totalExercises = exercises.length;
  const currentEx = exercises[currentIdx];
  const pct = Math.round((currentIdx / totalExercises) * 100);

  useEffect(() => {
    setSelectedOption(null);
    setInputText("");
    setAttempts(0);
    setShowHint(false);
    setIsSubmitted(false);
    setIsCorrect(null);
    setIsSkipped(false);
    setFlipped(false);
    setIsListeningSTT(false);
  }, [currentIdx]);

  const handleCheckAnswer = (answerToTest?: string) => {
    if (isSubmitted && isCorrect) return;

    const answer = (answerToTest ?? selectedOption ?? inputText).trim();
    if (!answer) return;

    const correct = currentEx.correctAnswer.trim();
    const cleanAnswer = answer.replace(/\s+/g, "").toLowerCase();
    const cleanCorrect = correct.replace(/\s+/g, "").toLowerCase();
    const matches = cleanAnswer === cleanCorrect || cleanAnswer.includes(cleanCorrect);

    if (matches) {
      setIsCorrect(true);
      setIsSubmitted(true);
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);

      // 단어(플래시카드/객관식/듣기) 문제를 맞히면 단어장에 저장한다
      const data = currentEx.originalData;
      if ("word" in data && "meaning" in data) {
        addVocabWord({
          character_id: characterId,
          word: data.word,
          reading: data.reading,
          meaning: data.meaning,
          sentence: data.example,
          sentence_translation: data.example_en,
        });
      }
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setIsCorrect(false);
        setIsSubmitted(true);
      } else {
        setIsCorrect(false);
        setSelectedOption(null);
      }
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= totalExercises) {
      setPhase("complete");
      // 챕터 완료를 백엔드 진도에 기록 (best-effort — 실패해도 화면 흐름엔 영향 없음)
      fetch(`${BACKEND_URL}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getEffectiveUserId(),
          character_id: characterId,
          step_delta: totalExercises,
          add_stamp: chapterId,
        }),
      }).catch(() => {});
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  // 플래시카드는 정답 채점이 없어 handleCheckAnswer를 거치지 않으므로,
  // 카드를 뒤집어 뜻까지 확인한 시점을 "학습 완료"로 보고 별도로 단어장에 저장한다.
  const handleFlashcardNext = () => {
    const data = currentEx.originalData;
    if ("word" in data && "meaning" in data) {
      addVocabWord({
        character_id: characterId,
        word: data.word,
        reading: data.reading,
        meaning: data.meaning,
        sentence: data.example,
        sentence_translation: data.example_en,
      });
    }
    handleNext();
  };

  const handleStartSTT = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("브라우저가 음성 인식을 지원하지 않습니다.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsListeningSTT(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInputText(transcript);
        handleCheckAnswer(transcript);
      };
      recognition.onerror = () => setIsListeningSTT(false);
      recognition.onend = () => setIsListeningSTT(false);
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningSTT(false);
    }
  };

  // ── 콘텐츠 미준비 (아직 스토리/단어가 채워지지 않은 챕터) ──────
  if (!content) {
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <div className={styles.introEmoji}>🚧</div>
          <h1 className={styles.introTitle}>{t("contentNotReadyTitle")}</h1>
          <p className={styles.introTitleEn}>{t("contentNotReadySub")}</p>
          <Link href={`/learn/${characterId}`} className="btn btn-primary btn-lg" style={{ textAlign: "center" }}>
            {t("backToList")}
          </Link>
        </div>
      </main>
    );
  }

  // ── 인트로 화면 ─────────────────────────────────────────
  if (phase === "intro") {
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <div className={styles.introEmoji}>{content.emoji}</div>
          <h1 className={styles.introTitle}>{content.title}</h1>
          <p className={styles.introTitleEn}>{t("sessionTagline")}</p>
          <div className={styles.introStats}>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>10</span>
              <span className={styles.introStatLabel}>{t("chapterCount")}</span>
            </div>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>{totalExercises}</span>
              <span className={styles.introStatLabel}>{t("questionsLabel")}</span>
            </div>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>{t("chancesCount")}</span>
              <span className={styles.introStatLabel}>{t("chancesLabel")}</span>
            </div>
          </div>
          <div className={styles.introTypes}>
            <span className={styles.introType}>{t("listen")}</span>
            <span className={styles.introType}>{t("romanizationChip")}</span>
            <span className={styles.introType}>{t("hintChip")}</span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => { setStoryIdx(0); setPhase("story"); }}
            id="btn-start-session"
          >
            {t("startLearn")}
          </button>
          <Link href={`/learn/${characterId}`} className="btn btn-ghost" style={{ textAlign: "center" }}>
            {t("backToList")}
          </Link>
        </div>
      </main>
    );
  }

  // ── 스토리 브리핑 (카카오톡 대화창 스타일 사전지식 공유) ──────
  if (phase === "story") {
    const bubbles = content.story;
    const visible = bubbles.slice(0, storyIdx + 1);
    const isLastBubble = storyIdx >= bubbles.length - 1;
    const highlightWord = (wordId?: string) =>
      wordId ? content.words.find((w) => w.id === wordId) : undefined;

    return (
      <main className={styles.page}>
        <div className={styles.storyCard}>
          <div className={styles.storyHeader}>
            <Link href={`/learn/${characterId}`} className={styles.closeBtn} aria-label="닫기">✕</Link>
            <div className={styles.storyHeaderInfo}>
              <span className={styles.storyHeaderEmoji}>{content.emoji}</span>
              <span className={styles.storyHeaderTitle}>{content.title}</span>
            </div>
            <button className={styles.storySkipBtn} onClick={() => setPhase("session")}>
              {t("storySkip")}
            </button>
          </div>

          <div className={styles.storyThread}>
            {visible.map((bubble, i) => {
              const word = highlightWord(bubble.highlight_word_id);
              return (
                <div key={i} className={styles.storyRow}>
                  <div className={styles.storyAvatar}>✈️</div>
                  <div className={styles.storyBubbleCol}>
                    <span className={styles.storySpeakerName}>
                      {CAPTAIN_SHORT_NAME[characterId] ?? content.title} {t("captainBadge")}
                    </span>
                    <div className={styles.storyBubble}>
                      <p className={styles.storyText}>{bubble.text}</p>
                      {bubble.reading && <p className={styles.storyReading}>[{bubble.reading}]</p>}
                      {bubble.en && <p className={styles.storyEn}>{bubble.en}</p>}
                      {word && (
                        <div className={styles.storyWordChip}>
                          <span className={styles.storyWordChipWord}>{word.word}</span>
                          <span className={styles.storyWordChipMeaning}>{word.meaning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => (isLastBubble ? setPhase("session") : setStoryIdx((i) => i + 1))}
            id="btn-story-next"
          >
            {isLastBubble ? t("storyGoToQuiz") : t("storyNext")}
          </button>
        </div>
      </main>
    );
  }

  // ── 완료 화면 (다음 챕터 진행 버튼 연동) ────────────────────
  if (phase === "complete") {
    return (
      <main className={styles.page}>
        <div className={styles.completeCard}>
          <div className={styles.completeEmoji}>🎉</div>
          <h1 className={styles.completeTitle}>{t("sessionComplete")}</h1>
          <p className={styles.completeSub}>{t("sessionTagline")}</p>
          <div className={styles.resultScore}>
            <span className={styles.scoreNum}>+{score}</span>
            <span className={styles.scoreLabel}>{t("scoreLabel")}</span>
          </div>
          <div className={styles.resultStats}>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>{correctCount}</span>
              <span className={styles.rStatLabel}>{t("correctLabel")}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>{totalExercises - correctCount}</span>
              <span className={styles.rStatLabel}>{t("wrongLabel")}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>🪙 +{Math.floor(score / 10)}</span>
              <span className={styles.rStatLabel}>{t("coinEarned")}</span>
            </div>
          </div>
          <div className={styles.completeActions}>
            <Link href={`/learn/${characterId}/${nextChapterId}`} className="btn btn-primary btn-lg" id="btn-next-chapter">
              {t("nextChapter")} ({t("totalChapters")} {nextNum})
            </Link>
            <Link href={`/learn/${characterId}`} className="btn btn-secondary btn-lg">
              {t("backToChapterList")}
            </Link>
            <Link href={`/chat/${characterId}`} className="btn btn-blue btn-lg">
              {t("chatWithCaptain")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 세션 진행 화면 ───────────────────────────────────────
  return (
    <main className={styles.page}>
      {/* 헤더 진도 바 */}
      <div className={styles.sessionHeader}>
        <Link href={`/learn/${characterId}`} className={styles.closeBtn} aria-label="닫기">✕</Link>
        <div className={styles.sessionProgress}>
          <div className={styles.sessionBar}>
            <div className={styles.sessionFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.sessionCount}>{currentIdx + 1}/{totalExercises}</span>
        </div>
        <div className={styles.sessionScore}>
          <span>⭐ {score}</span>
        </div>
      </div>

      {/* 카드 문제 영역 */}
      <div className={styles.exerciseArea}>
        <div className={styles.cardWrap}>
          {/* 상단 문제 유형, 🔊 들어보기, 💡 힌트, ⏭️ 스킵 */}
          <div className={styles.cardHeaderRow}>
            <p className={styles.exType}>
              {currentEx.type === "flashcard" && "🃏 플래시카드 · Flashcard"}
              {currentEx.type === "multiple_choice" && "✅ 객관식 · Multiple Choice"}
              {currentEx.type === "fill_blank" && "✏️ 빈칸 채우기 · Fill in the Blank"}
              {currentEx.type === "sentence_match" && "🔗 문장 매칭 · Sentence Match"}
              {currentEx.type === "listening_choice" && (isSkipped ? "👁️ 시각 퀴즈 (스킵됨)" : "🎧 듣기 문제 · Listening")}
              {currentEx.type === "speaking_practice" && (isSkipped ? "👁️ 시각 퀴즈 (스킵됨)" : "🗣️ 문장 읽기 · Speaking Practice")}
              {currentEx.type === "dialogue_comprehension" && "💬 대화 상황 파악 · Dialogue Comprehension"}
            </p>

            <div className={styles.headerBtnGroup}>
              <button
                type="button"
                className={styles.voicePlayBtn}
                onClick={() =>
                  playCaptainVoice(
                    currentEx.type === "dialogue_comprehension" && currentEx.dialogueTurns
                      ? currentEx.dialogueTurns.map((t) => t.text).join(". ")
                      : currentEx.questionText,
                    characterId
                  )
                }
                title="소리 듣기"
              >
                🔊 들어보기
              </button>

              <button
                type="button"
                className={styles.hintToggleBtn}
                onClick={() => setShowHint(!showHint)}
                title={t("hintChip")}
              >
                💡 {showHint ? t("hintCloseShort") : t("hintShort")}
              </button>

              {(currentEx.type === "listening_choice" || currentEx.type === "speaking_practice") && !isSkipped && (
                <button className={styles.skipBtn} onClick={() => setIsSkipped(true)} title={t("skip")}>
                  {t("skip")}
                </button>
              )}
            </div>
          </div>

          {showHint && (
            <div className={styles.hintCard}>
              <span className={styles.hintIcon}>💡</span>
              <p>{currentEx.hintText}</p>
            </div>
          )}

          {/* 1. 플래시카드 */}
          {currentEx.type === "flashcard" && (
            <>
              <button
                className={`${styles.flashCard} ${flipped ? styles.flipped : ""}`}
                onClick={() => setFlipped(!flipped)}
                aria-label="카드 뒤집기"
              >
                <div className={styles.flashFront}>
                  <p className={styles.flashWord}>{currentEx.questionText}</p>
                  <p className={styles.flashReading}>[{currentEx.reading}]</p>
                  <p className={styles.flashHint}>탭해서 뒤집기 · Tap to flip</p>
                </div>
                <div className={styles.flashBack}>
                  <p className={styles.flashMeaning}>{currentEx.correctAnswer}</p>
                  <p className={styles.flashExample}>{(currentEx.originalData as Word).example}</p>
                  <p className={styles.flashReading}>[{(currentEx.originalData as Word).example_reading}]</p>
                  <p className={styles.flashExampleEn}>{(currentEx.originalData as Word).example_en}</p>
                </div>
              </button>
              {flipped && (
                <button className="btn btn-primary btn-lg" onClick={handleFlashcardNext} id="btn-next-flash">
                  {t("nextQuestion")}
                </button>
              )}
            </>
          )}

          {/* 2. 객관식 & 문장 매칭 & 스킵된 듣기/말하기 */}
          {(currentEx.type === "multiple_choice" || currentEx.type === "sentence_match" || ((currentEx.type === "listening_choice" || currentEx.type === "speaking_practice") && isSkipped)) && (
            <>
              <div className={styles.mcQuestion}>
                <div className={styles.wordAudioRow}>
                  <h2 className={styles.mcWord}>{currentEx.questionText}</h2>
                  <button
                    type="button"
                    className={styles.inlineListenBtn}
                    onClick={() => playCaptainVoice(currentEx.questionText, characterId)}
                    title="듣기"
                  >
                    🔊
                  </button>
                </div>
                <p className={styles.mcReading}>[{currentEx.reading}]</p>
              </div>

              <div className={styles.mcOptions}>
                {currentEx.options.map((opt) => {
                  let cls = styles.mcOption;
                  if (selectedOption === opt) cls += " " + styles.mcSelected;

                  if (isSubmitted) {
                    if (opt === currentEx.correctAnswer) cls += " " + styles.mcCorrect;
                    else if (selectedOption === opt) cls += " " + styles.mcWrong;
                  }

                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => !isSubmitted && setSelectedOption(opt)}
                      disabled={isSubmitted}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!isSubmitted && attempts > 0 && attempts < 3 && (
                <div className={styles.attemptNotice}>
                  {t("attemptNoticeWithCount", { n: 3 - attempts })}
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer()}
                  disabled={!selectedOption}
                >
                  {t("checkAnswerWithCount", { n: 3 - attempts })}
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>{t("correctNotice")}</p>
                  ) : (
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    {t("nextQuestion")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 3. 빈칸 채우기 */}
          {currentEx.type === "fill_blank" && (
            <>
              <div className={styles.fbQuestion}>
                <div className={styles.wordAudioRow} style={{ justifyContent: "center" }}>
                  <h2 className={styles.fbSentence}>{currentEx.blankSentence}</h2>
                  <button
                    type="button"
                    className={styles.inlineListenBtn}
                    onClick={() => playCaptainVoice(currentEx.questionText, characterId)}
                    title="전체 문장 듣기"
                  >
                    🔊
                  </button>
                </div>
                <p className={styles.mcReading}>[{currentEx.reading}]</p>
                <p className={styles.fbTranslation}>{(currentEx.originalData as Sentence).en}</p>
              </div>

              <div className={styles.fbInputRow}>
                <input
                  className={styles.fbInput}
                  value={inputText}
                  onChange={(e) => !isSubmitted && setInputText(e.target.value)}
                  placeholder="빈칸에 들어갈 한글 단어를 입력하세요..."
                  disabled={isSubmitted}
                />
              </div>

              {!isSubmitted && attempts > 0 && attempts < 3 && (
                <div className={styles.attemptNotice}>
                  {t("attemptNoticeWithCount", { n: 3 - attempts })}
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer(inputText)}
                  disabled={!inputText.trim()}
                >
                  {t("checkAnswerWithCount", { n: 3 - attempts })}
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>{t("correctNotice")}</p>
                  ) : (
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    {t("nextQuestion")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 4. 🗣️ 문장 읽기 연습 (Speaking Practice) */}
          {currentEx.type === "speaking_practice" && !isSkipped && (
            <>
              <div className={styles.mcQuestion} style={{ textAlign: "center" }}>
                <div className={styles.wordAudioRow} style={{ justifyContent: "center" }}>
                  <h2 className={styles.mcWord} style={{ fontSize: 24 }}>{currentEx.questionText}</h2>
                  <button
                    type="button"
                    className={styles.inlineListenBtn}
                    onClick={() => playCaptainVoice(currentEx.questionText, characterId)}
                    title="기장 발음 들려주기"
                  >
                    🔊
                  </button>
                </div>
                <p className={styles.mcReading}>[{currentEx.reading}]</p>
                <p className={styles.audioHint}>{(currentEx.originalData as Sentence).en}</p>
                <p className={styles.speakingInstruction}>
                  👇 아래 🎤 마이크 버튼을 누르고 위 문장을 한국어로 따라 읽으세요!
                </p>
              </div>

              <div className={styles.speakingBox}>
                <button
                  type="button"
                  className={`${styles.sttBigBtn} ${isListeningSTT ? styles.sttBtnActive : ""}`}
                  onClick={handleStartSTT}
                  disabled={isSubmitted}
                >
                  {isListeningSTT ? "🎙️ 음성 수신 중..." : "🎤 버튼 누르고 문장 읽기"}
                </button>

                {inputText && (
                  <p className={styles.recognizedText}>
                    인식된 문장: <strong>"{inputText}"</strong>
                  </p>
                )}
              </div>

              {!isSubmitted && attempts > 0 && attempts < 3 && (
                <div className={styles.attemptNotice}>
                  ❌ 음성이 정확하지 않습니다. 마이크 버튼을 누르고 다시 읽어보세요! (남은 기회: {3 - attempts}회)
                </div>
              )}

              {!isSubmitted && inputText && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer(inputText)}
                >
                  발음 검사 제출 (기회 {3 - attempts}/3)
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>{t("speakingCorrect")}</p>
                  ) : (
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    {t("nextQuestion")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 5. 듣기 문제 (Listening Choice) */}
          {currentEx.type === "listening_choice" && !isSkipped && (
            <>
              <div className={styles.mcQuestion} style={{ textAlign: "center" }}>
                <button
                  type="button"
                  className={styles.audioPlayBtn}
                  onClick={() => playCaptainVoice(currentEx.correctAnswer, characterId)}
                >
                  🔊 소리 듣기
                </button>
                <p className={styles.audioHint}>들리는 한국어 단어를 선택하세요</p>
              </div>

              <div className={styles.mcOptions}>
                {currentEx.options.map((opt) => {
                  let cls = styles.mcOption;
                  if (selectedOption === opt) cls += " " + styles.mcSelected;
                  if (isSubmitted) {
                    if (opt === currentEx.correctAnswer) cls += " " + styles.mcCorrect;
                    else if (selectedOption === opt) cls += " " + styles.mcWrong;
                  }
                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => !isSubmitted && setSelectedOption(opt)}
                      disabled={isSubmitted}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!isSubmitted && attempts > 0 && attempts < 3 && (
                <div className={styles.attemptNotice}>
                  {t("attemptNoticeWithCount", { n: 3 - attempts })}
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer()}
                  disabled={!selectedOption}
                >
                  {t("checkAnswerWithCount", { n: 3 - attempts })}
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>{t("correctNotice")}</p>
                  ) : (
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    {t("nextQuestion")}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 7. 💬 대화 상황 파악 (Dialogue Comprehension) — 프리미엄 챕터 전용 */}
          {currentEx.type === "dialogue_comprehension" && (
            <>
              <div className={styles.dlgThread}>
                {currentEx.dialogueTurns?.map((turn, i) => (
                  <div key={i} className={`${styles.dlgTurn} ${i % 2 === 1 ? styles.dlgTurnRight : ""}`}>
                    <span className={styles.dlgSpeaker}>{turn.speaker}</span>
                    <div className={styles.dlgBubble}>
                      <p className={styles.dlgText}>{turn.text}</p>
                      {turn.reading && <p className={styles.dlgReading}>[{turn.reading}]</p>}
                      {turn.en && <p className={styles.dlgEn}>{turn.en}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.mcQuestion}>
                <p className={styles.dlgQuestion}>{currentEx.questionText}</p>
                <p className={styles.mcReading}>{currentEx.hintText}</p>
              </div>

              <div className={styles.mcOptions}>
                {currentEx.options.map((opt) => {
                  let cls = styles.mcOption;
                  if (selectedOption === opt) cls += " " + styles.mcSelected;
                  if (isSubmitted) {
                    if (opt === currentEx.correctAnswer) cls += " " + styles.mcCorrect;
                    else if (selectedOption === opt) cls += " " + styles.mcWrong;
                  }
                  return (
                    <button
                      key={opt}
                      className={cls}
                      onClick={() => !isSubmitted && setSelectedOption(opt)}
                      disabled={isSubmitted}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!isSubmitted && attempts > 0 && attempts < 3 && (
                <div className={styles.attemptNotice}>
                  {t("attemptNoticeWithCount", { n: 3 - attempts })}
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer()}
                  disabled={!selectedOption}
                >
                  {t("checkAnswerWithCount", { n: 3 - attempts })}
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>{t("correctNotice")}</p>
                  ) : (
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    {t("nextQuestion")}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </main>
  );
}
