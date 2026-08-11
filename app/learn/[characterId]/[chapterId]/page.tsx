"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./session.module.css";
import LoadingSplash from "@/components/LoadingSplash";
import { getChapterContent } from "@/lib/content/chapters";
import { addVocabWord } from "@/lib/vocab/store";
import { getAuthHeaders, getEffectiveUserId } from "@/lib/auth/store";
import { useLanguage } from "@/components/LanguageContext";
import { canAccessCharacter, isChapterUnlocked, getCharacterById } from "@/lib/db/mock";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useTranslationMap, substituteTranslations, TranslatableItem } from "@/lib/translate/store";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
import type { ChapterContent, ChapterWord as Word, ChapterSentence as Sentence, DialogueScene, DialogueTurn } from "@/types/content";

// ── 기장별 전용 음성 톤 조절 함수 (TTS) ─────────────────────────
async function playCaptainVoice(text: string, characterId: string) {
  // 음성 생성(TTS)은 유료 API 원가와 운영 복잡도를 늘리므로 현재 서비스에서 사용하지 않는다.
  // 기존 버튼은 숨겨 두었고, 이 조기 반환으로 ElevenLabs/브라우저 TTS는 호출되지 않는다.
  return;

  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, characterId: "yongwoo" }),
    });

    const contentType = res.headers.get("content-type");
    if (res.ok && contentType?.includes("audio/mpeg")) {
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
    utterance.voice = nativeMaleKoVoice ?? null;
  } else if (nativeKoVoice) {
    utterance.voice = nativeKoVoice ?? null;
  }

  window.speechSynthesis.speak(utterance);
}

const CAPTAIN_SHORT_NAME: Record<string, string> = {
  kyuhyun: "규현", haneul: "하늘", sunwoo: "선우", sangwoo: "상우", yongwoo: "용우",
};

type Phase = "intro" | "story" | "vocab_review" | "session" | "complete";
type ExerciseType = "flashcard" | "multiple_choice" | "fill_blank" | "sentence_match" | "sentence_builder" | "listening_choice" | "speaking_practice" | "dialogue_comprehension";

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
  // Predictable progression: memorize -> match meaning -> choose translation
  // -> exactly two sentence-level translation exercises.
  const review: ExerciseItem[] = words.map((w) => ({
    id: `flash-${w.id}`, type: "flashcard", questionText: w.word, reading: w.reading,
    correctAnswer: w.meaning, hintText: w.reading,
    explanation: `${w.word} [${w.reading}] : ${w.meaning}`, options: [], originalData: w,
  }));
  const meaningMatch: ExerciseItem[] = words.map((w) => ({
    id: `mc-${w.id}`, type: "multiple_choice", questionText: w.word, reading: w.reading,
    correctAnswer: w.meaning, hintText: `${w.reading} · ${w.example}`,
    explanation: `${w.word} [${w.reading}] = ${w.meaning}`,
    options: shuffle([w.meaning, ...shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3).map((x) => x.meaning)]),
    originalData: w,
  }));
  const translationChoice: ExerciseItem[] = words.map((w) => ({
    id: `translate-${w.id}`, type: "multiple_choice", questionText: w.meaning, reading: "",
    correctAnswer: w.word, hintText: w.example_en,
    explanation: `${w.meaning} = ${w.word} [${w.reading}]`,
    options: shuffle([w.word, ...shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3).map((x) => x.word)]),
    originalData: w,
  }));
  const sentenceBuild: ExerciseItem[] = sentences.slice(0, 2).map((s) => ({
    id: `sentence-${s.id}`, type: "sentence_builder", questionText: s.en, reading: s.reading,
    correctAnswer: s.ko, hintText: s.reading,
    explanation: `${s.en} = ${s.ko}`,
    options: shuffle(s.ko.split(/\s+/)),
    originalData: s,
  }));
  const sequence: ExerciseItem[] = [];
  const sentenceInsertAt = Math.max(0, Math.floor(words.length / 2));
  words.forEach((_, index) => {
    sequence.push(review[index], meaningMatch[index]);
    if (index === 0 && sentenceBuild[0]) sequence.push(sentenceBuild[0]);
    sequence.push(translationChoice[index]);
    if (index === sentenceInsertAt && sentenceBuild[1]) sequence.push(sentenceBuild[1]);
  });
  if (words.length === 0) sequence.push(...sentenceBuild);
  return sequence;

  /* Legacy generators below are retained temporarily for content migration. */
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

  // 3. 빈칸 채우기 — 외국인 학습자는 대부분 자판에 한글 입력 자체가 안 돼 있어서, 정답을
  // 직접 타이핑하게 하면 사실상 풀 수 없는 문제였다. 직접 입력 대신 4지선다 객관식으로 바꾼다.
  const fillBlankTargets = sentences.map((s) => {
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
    return { s, targetWord, blankSentence };
  });

  fillBlankTargets.forEach(({ s, targetWord, blankSentence }) => {
    // 오답 후보: 같은 챕터의 다른 빈칸 정답 + 단어 목록에서 채운다(문장이 몇 개 없는 챕터에서도
    // 최대한 4개를 채우기 위해 두 출처를 합친다).
    const wrongPool = Array.from(
      new Set([
        ...fillBlankTargets.filter((d) => d.targetWord !== targetWord).map((d) => d.targetWord),
        ...words.map((w) => w.word).filter((w) => w !== targetWord),
      ])
    );
    const wrong = shuffle(wrongPool).slice(0, 3);

    list.push({
      id: `fb-${s.id}`,
      type: "fill_blank",
      questionText: s.ko,
      reading: s.reading,
      blankSentence: blankSentence,
      correctAnswer: targetWord,
      hintText: `정답 첫 글자: '${targetWord[0]}' (총 ${targetWord.length}글자)`,
      explanation: `정답: "${targetWord}" ➔ 전체 문장: "${s.ko}" (${s.en})`,
      options: shuffle([targetWord, ...wrong]),
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
  // 유료 음성 생성 기능을 운영하지 않으므로 듣기 전용 문제는 출제하지 않는다.
  if (false) words.slice(0, 3).forEach((w) => {
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
  const { t, language } = useLanguage();
  const { membership, membershipLoaded } = useMembership();
  const { freeSlots, freeSlotsLoaded } = useFreeCharSlots();
  const router = useRouter();
  const isSpecialStory = chapterId.startsWith("sp-");
  const requiresPremium = getCharacterById(characterId)?.requires_premium ?? false;
  const canAccess = canAccessCharacter(characterId, membership, freeSlots);

  useEffect(() => {
    if (!isSpecialStory && requiresPremium && membershipLoaded && freeSlotsLoaded && !canAccess) {
      router.replace("/premium");
    }
  }, [canAccess, freeSlotsLoaded, isSpecialStory, membershipLoaded, requiresPremium, router]);

  // 챕터 콘텐츠는 이제 챕터별로 쪼개진 청크를 동적 import로 그때그때 받아온다
  // (lib/content/chapters.ts 참고) — chapterId가 바뀔 때마다 새로 받아와야 한다.
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setContentLoaded(false);
    getChapterContent(chapterId).then((data) => {
      if (cancelled) return;
      setContent(data);
      setContentLoaded(true);
    });
    return () => { cancelled = true; };
  }, [chapterId]);

  // 로컬/캐시 상태에서는 청크가 사실상 순식간에 도착해서 로딩 화면이 한 프레임만
  // 그려지고 사라지는 "깜빡임"이 생긴다. 실제 로딩이 이보다 빨라도 화면은 최소 5초는
  // 붙잡아두고, "랜딩중..." → "랜딩 완료!" 2단계로 보여줘서 순간적으로 스쳐 지나가지
  // 않고 로딩 화면답게 보이도록 한다.
  const [loadingPhase, setLoadingPhase] = useState<"landing" | "done">("landing");
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);
  useEffect(() => {
    setLoadingPhase("landing");
    setMinLoadingTimeElapsed(false);
    const doneTextTimer = setTimeout(() => setLoadingPhase("done"), 350);
    const dismissTimer = setTimeout(() => setMinLoadingTimeElapsed(true), 650);
    return () => {
      clearTimeout(doneTextTimer);
      clearTimeout(dismissTimer);
    };
  }, [chapterId]);

  const exercises = useMemo(
    () => (content ? generateExercises(content.words, content.sentences, content.dialogues ?? []) : []),
    [chapterId, content]
  );

  // 단어 뜻/예문 번역/스토리 번역은 챕터 콘텐츠에 한국어+영어로만 준비돼 있어, 그 외
  // UI 언어에서는 화면에 그릴 때 실시간으로 번역해서 보여준다(lib/translate/store.ts,
  // 결과는 캐싱됨). 채점에 쓰이는 원본 영어 값(정답 비교 등)은 절대 바꾸지 않고,
  // 화면에 보여주는 텍스트만 이 맵으로 치환한다.
  const translatableItems: TranslatableItem[] = useMemo(() => {
    if (!content) return [];
    const items: TranslatableItem[] = [];
    content.words.forEach((w) => {
      items.push({ text: w.meaning, contextKo: w.word });
      items.push({ text: w.example_en, contextKo: w.example });
    });
    content.sentences.forEach((s) => items.push({ text: s.en, contextKo: s.ko }));
    (content.dialogues ?? []).forEach((d) => {
      items.push({ text: d.question_en, contextKo: d.question });
      d.turns.forEach((turn) => {
        if (turn.en) items.push({ text: turn.en, contextKo: turn.text });
      });
    });
    content.story.forEach((b) => {
      if (b.en) items.push({ text: b.en, contextKo: b.text });
    });
    return items;
  }, [content]);
  const translationMap = useTranslationMap(translatableItems, language);
  const tr = (text: string) => substituteTranslations(text, translationMap);

  const [phase, setPhase] = useState<Phase>("intro");
  const [lessonSessionId, setLessonSessionId] = useState<string | null>(null);
  const [entryError, setEntryError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [rewardCoins, setRewardCoins] = useState<number | null>(null);
  const [replaySession, setReplaySession] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  // 발음(로마자) 표시 여부 — 기본 숨김, 토글로 ON/OFF
  const [showReading, setShowReading] = useState(false);

  // 다음 챕터 ID 계산 (e.g. ch-k01 ➔ ch-k02, sp-rom-kyuhyun-01 ➔ sp-rom-kyuhyun-02)
  // 접두사 길이가 고정 4글자(ch-k01)라고 가정하면 sp-rom-{name}-01처럼 접두사 길이가
  // 캐릭터마다 다른 로맨스 챕터에서 잘못 잘려 nextChapterId가 존재하지 않는 id가 되어버린다.
  // 끝자리 숫자만 정규식으로 분리해 접두사 길이에 상관없이 안전하게 계산한다.
  const chapterIdMatch = chapterId.match(/^(.*?)(\d+)$/);
  const chapterPrefix = chapterIdMatch ? chapterIdMatch[1] : chapterId;
  const chapterNum = chapterIdMatch ? parseInt(chapterIdMatch[2], 10) : 1;
  const numDigits = chapterIdMatch ? chapterIdMatch[2].length : 2;
  const nextNum = chapterNum + 1;
  const nextChapterId = `${chapterPrefix}${String(nextNum).padStart(numDigits, "0")}`;

  // 챕터 목록으로 돌아가는 링크 — 스페셜(sp-) 챕터에서 왔으면 목록 페이지도 "스페셜 주제별" 탭으로
  // 열어야 한다. 그냥 /learn/${characterId}로만 보내면 그 페이지의 탭 상태가 기본값(지역 문화)으로
  // 초기화돼서, 스페셜 챕터를 보다가 목록으로 나가면 엉뚱하게 지역 문화 목록이 나오는 문제가 있었다.
  const backToListHref = chapterId.startsWith("sp-")
    ? `/learn/${characterId}?tab=special`
    : `/learn/${characterId}`;

  // ── 문제 상태 ─────────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedTokenIndexes, setSelectedTokenIndexes] = useState<number[]>([]);
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
  const [wrongCount, setWrongCount] = useState(0);

  // "다음 챕터" 버튼은 같은 페이지 템플릿(app/learn/[characterId]/[chapterId]) 안에서
  // chapterId만 바뀌는 client-side 이동이라, Next.js가 이 컴포넌트를 재마운트하지 않고
  // 재사용할 수 있다 — 그러면 phase/currentIdx/score 등이 이전 챕터 값 그대로 남아
  // 새 챕터인데 완료 화면이나 엉뚱한 진행 상태가 뜬다. chapterId가 바뀔 때마다 세션
  // 진행 상태를 명시적으로 초기화한다.
  useEffect(() => {
    setPhase("intro");
    setCurrentIdx(0);
    setStoryIdx(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLessonSessionId(null);
    setEntryError("");
    setRewardCoins(null);
    setReplaySession(false);
    setShowReading(false);
  }, [chapterId]);

  const totalExercises = exercises.length;
  const currentEx = exercises[currentIdx];
  const pct = Math.round((currentIdx / totalExercises) * 100);

  useEffect(() => {
    setSelectedOption(null);
    setSelectedTokenIndexes([]);
    setInputText("");
    setAttempts(0);
    setShowHint(false);
    setIsSubmitted(false);
    setIsCorrect(null);
    setIsSkipped(false);
    setFlipped(false);
    setIsListeningSTT(false);
  }, [currentIdx]);

  // 챕터 순서 잠금(이전 챕터 완료 여부) 확인용 — 목록 페이지에서만 막던 걸 콘텐츠 페이지에서도
  // 다시 한번 검증한다. 목록의 Link가 href="#"로 막아주긴 하지만, URL을 직접 입력하면
  // 그 차단을 그냥 우회할 수 있었다.
  const [stamps, setStamps] = useState<string[]>([]);
  const [stampsLoaded, setStampsLoaded] = useState(false);
  const [storyAccess, setStoryAccess] = useState<boolean | null>(isSpecialStory ? null : true);
  const [storyUnlocking, setStoryUnlocking] = useState(false);
  const [storyAccessError, setStoryAccessError] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/progress/${getEffectiveUserId()}/${characterId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setStamps(data.stamps ?? []); })
      .catch(() => {})
      .finally(() => setStampsLoaded(true));
  }, [characterId]);

  useEffect(() => {
    if (!isSpecialStory) {
      setStoryAccess(true);
      return;
    }
    // DEV_MODE에서는 백엔드 없이도 스토리 접근 허용 (로컬 미리보기용)
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      setStoryAccess(true);
      return;
    }
    setStoryAccess(null);
    fetch(`${BACKEND_URL}/learning/story-access/${getEffectiveUserId()}/${chapterId}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStoryAccess(Boolean(data?.has_access)))
      .catch(() => setStoryAccess(false));
  }, [chapterId, isSpecialStory]);

  const unlockStory = async () => {
    setStoryUnlocking(true);
    setStoryAccessError("");
    try {
      const res = await fetch(`${BACKEND_URL}/learning/unlock-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: getEffectiveUserId(), chapter_id: chapterId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "스토리를 해금할 수 없어요.");
      setStoryAccess(true);
    } catch (error) {
      setStoryAccessError(error instanceof Error ? error.message : "스토리를 해금할 수 없어요.");
    } finally {
      setStoryUnlocking(false);
    }
  };

  const handleCheckAnswer = (answerToTest?: string) => {
    if (isSubmitted) return;

    const answer = (answerToTest ?? selectedOption ?? inputText).trim();
    if (!answer) return;

    const correct = currentEx.correctAnswer.trim();
    // 공백뿐 아니라 문장부호도 제거 — 음성 인식(STT) 결과는 마침표/물음표 등을 포함하지 않으므로,
    // 부호를 안 지우면 정답을 정확히 발음해도 정답 문장의 마침표 때문에 항상 오답 처리되는 문제가 있었다.
    const normalize = (s: string) => s
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[\p{P}\p{S}\s]/gu, "");
    const cleanAnswer = normalize(answer);
    const cleanCorrect = normalize(correct);
    const matches = cleanAnswer.length > 0 && cleanAnswer === cleanCorrect;

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
          character_name: getCharacterById(characterId)?.name,
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
        setWrongCount((count) => count + 1);
      } else {
        setIsCorrect(false);
        setSelectedOption(null);
      }
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 >= totalExercises) {
      setPhase("complete");
      // 로컬 stamps에도 바로 반영해둔다 — 안 하면 "다음 챕터" 버튼으로 바로 이동했을 때
      // isChapterUnlocked가 방금 끝낸 이 챕터를 stamps에서 못 찾아 다음 챕터를 잘못
      // 잠금 처리한다. 아래 PUT은 fire-and-forget이라 다음 챕터 진입 시점의 진도 재조회
      // (stamps는 characterId 기준으로만 fetch)보다 늦게 끝날 수도 있어, 백엔드 응답을
      // 기다렸다 반영하는 방식으론 이 경쟁 상태를 막을 수 없다.
      setStamps((prev) => (prev.includes(chapterId) ? prev : [...prev, chapterId]));
      // 챕터 완료를 백엔드 진도에 기록 (best-effort — 실패해도 화면 흐름엔 영향 없음)
      if (!lessonSessionId) return;
      fetch(`${BACKEND_URL}/learning/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: getEffectiveUserId(),
          session_id: lessonSessionId,
          step_delta: totalExercises,
          add_stamp: chapterId,
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          setRewardCoins(data.reward_coins ?? 0);
          setStamps(data.stamps ?? []);
        })
        .catch(() => setRewardCoins(0));
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
        character_name: getCharacterById(characterId)?.name,
        word: data.word,
        reading: data.reading,
        meaning: data.meaning,
        sentence: data.example,
        sentence_translation: data.example_en,
      });
    }
    void handleNext();
  };

  const handleStartLesson = async () => {
    setEntryError("");
    setIsStarting(true);
    try {
      // DEV_MODE에서는 백엔드 없이 스토리 바로 진입 (로컬 미리보기용)
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        setLessonSessionId("dev-session");
        setReplaySession(stamps.includes(chapterId));
        setStoryIdx(0);
        setPhase("story");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/learning/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ user_id: getEffectiveUserId(), character_id: characterId, chapter_id: chapterId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "학습을 시작할 수 없어요.");
      setLessonSessionId(data.session_id);
      setReplaySession(Boolean(data.is_replay));
      setStoryIdx(0);
      setPhase("story");
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "학습을 시작할 수 없어요.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleReplay = () => {
    setPhase("intro");
    setCurrentIdx(0);
    setStoryIdx(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLessonSessionId(null);
    setRewardCoins(null);
    setReplaySession(true);
    setEntryError("");
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

  // ── 챕터 순서 잠금(진도 stamps) + 챕터 콘텐츠 + 멤버십/무료슬롯, 전부 비동기로 받아온다 ──
  // stamps를 fetch로 받아와야만 잠금 여부를 판단할 수 있는데, 그 전에 곧바로 아래 인트로/본문
  // JSX를 렌더링해버리면 그 첫 렌더(서버사이드 렌더링 결과 + 하이드레이션 페이로드)에 실제
  // 챕터 콘텐츠가 이미 포함돼버린다 — 화면엔 잠깐 뒤 잠금 화면이 떠도, 페이지 소스/네트워크
  // 응답에는 잠긴 챕터의 내용이 그대로 노출되는 문제가 있었다. 멤버십/freeSlots도 마운트
  // 직후엔 항상 기본값(무료회원)으로 시작해서 실제 백엔드 조회가 끝나기 전까진, 진짜 프리미엄
  // 회원도 잠깐 🔒 잠금 화면을 봤다가 콘텐츠로 바뀌는 깜빡임이 있었다. 다만 멤버십 대기는
  // 프리미엄 전용 캐릭터일 때만 필요하다 — 무료 캐릭터는 membership을 보기도 전에 이미
  // 접근이 허용되므로, 규현/하늘 챕터에 뒤로가기로 재진입할 때마다 로딩 화면이 뜨는
  // 불필요한 깜빡임이 새로 생겼었다.
  if (!isSpecialStory && requiresPremium && membershipLoaded && freeSlotsLoaded && !canAccess) {
    return <LoadingSplash message={t("loadingChapter")} />;
  }

  if (
    !stampsLoaded || !contentLoaded || !minLoadingTimeElapsed ||
    (!isSpecialStory && requiresPremium && (!membershipLoaded || !freeSlotsLoaded)) ||
    (isSpecialStory && storyAccess === null)
  ) {
    return <LoadingSplash message={t(loadingPhase === "landing" ? "loadingChapter" : "loadingChapterDone")} />;
  }

  // ── 프리미엄 접근 제어 ──────────────────────────────────
  // 이전엔 이 페이지(실제 챕터 콘텐츠)에는 프리미엄 체크가 전혀 없었다. 목록 페이지
  // (/learn/[characterId])에서만 막고 있어서, 무료 회원도 프리미엄 캐릭터의 챕터 URL을
  // 직접 알면(주소창 입력, 공유 링크 등) 그대로 들어가 전체 콘텐츠를 볼 수 있었다.
  if (!isSpecialStory && !canAccess) return <LoadingSplash message={t("loadingChapter")} />;

  if (isSpecialStory && !storyAccess) {
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <div className={styles.introEmoji}>🔒</div>
          <h1 className={styles.introTitle}>이 스토리는 아직 잠겨 있어요</h1>
          <p className={styles.introTitleEn}>프리미엄을 결제하면 모든 스토리를 영구 소장할 수 있고, 이 스토리만 5코인으로 해금할 수도 있어요.</p>
          <button className="btn btn-primary btn-lg" onClick={() => void unlockStory()} disabled={storyUnlocking}>
            {storyUnlocking ? "해금 중…" : "🪙 5코인으로 스토리 해금"}
          </button>
          <Link href="/premium" className="btn btn-secondary btn-lg">⭐ 프리미엄 보기</Link>
          {storyAccessError && <p style={{ color: "var(--red)", textAlign: "center", fontWeight: 700 }}>{storyAccessError}</p>}
          <Link href={backToListHref} className="btn btn-text">{t("backToList")}</Link>
        </div>
      </main>
    );
  }

  if (!isSpecialStory && !isChapterUnlocked(chapterId, characterId, stamps)) {
    return (
      <main className={styles.page}>
        <div className={styles.noticeCard}>
          <div className={styles.noticeIcon} aria-hidden="true">🔒</div>
          <div className={styles.noticeCopy}>
            <h1 className={styles.noticeTitle}>{t("chapterLockedHint")}</h1>
          </div>
          <Link href={backToListHref} className={`btn btn-primary btn-lg ${styles.noticeButton}`}>
            {t("backToList")}
          </Link>
        </div>
      </main>
    );
  }

  // ── 콘텐츠 미준비 (아직 스토리/단어가 채워지지 않은 챕터) ──────
  if (!content) {
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <div className={styles.introEmoji}>🚧</div>
          <h1 className={styles.introTitle}>{t("contentNotReadyTitle")}</h1>
          <p className={styles.introTitleEn}>{t("contentNotReadySub")}</p>
          <Link href={backToListHref} className="btn btn-primary btn-lg" style={{ textAlign: "center" }}>
            {t("backToList")}
          </Link>
        </div>
      </main>
    );
  }

  // ── 인트로 화면 ─────────────────────────────────────────
  if (phase === "intro") {
    const hasCompletedChapter = stamps.includes(chapterId);
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <section className={styles.introHero}>
            <div className={styles.introEmoji}>{content.emoji}</div>
            <div className={styles.introHeading}>
              <span className={styles.introEyebrow}>{t("sessionTagline")}</span>
              <h1 className={styles.introTitle}>{content.title}</h1>
            </div>
          </section>

          <div className={styles.introStats}>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>{content.words.length}</span>
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

          <div className={styles.introRoute} aria-hidden="true">
            <span>▣</span><i /><span>↔</span><i /><span>✓</span><i /><span>✎</span>
          </div>

          <div className={styles.introFooter}>
            <button
              className={`${styles.introStartButton} btn btn-primary btn-lg`}
              onClick={() => void handleStartLesson()}
              disabled={isStarting}
              id="btn-start-session"
            >
              {isStarting
                ? "학습 준비 중…"
                : `${hasCompletedChapter ? "↻ " : ""}${t("startLearn")} · 🪙 ${hasCompletedChapter ? 0 : 3}`}
            </button>
            {entryError && <p className={styles.introError}>{entryError}</p>}
            <Link href={backToListHref} className={styles.introMainLink}>
              {t("goToLearnMain")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── 스토리 브리핑 ──────────────────────────────────────────
  // 로맨스/일상/친구 스페셜 챕터(sp-*)는 말풍선으로 끊지 않고 소설처럼 한 화면에 쭉 읽게 하고,
  // 등장 단어는 다 읽은 뒤 "오늘의 단어" 화면에서 모아서 학습+저장한다.
  // 지역 문화 챕터(ch-*)는 기존 카카오톡 버블 스타일(단어별 하이라이트 칩)을 그대로 유지한다.
  const isNarrativeChapter = chapterId.startsWith("sp-");

  if (phase === "story" && isNarrativeChapter) {
    return (
      <main className={styles.page}>
        <div className={styles.novelCard}>
          <div className={styles.storyHeader}>
            <Link href={backToListHref} className={styles.closeBtn} aria-label="닫기">✕</Link>
            <div className={styles.storyHeaderInfo}>
              <span className={styles.storyHeaderEmoji}>{content.emoji}</span>
              <span className={styles.storyHeaderTitle}>{content.title}</span>
            </div>
            <div className={styles.storyHeaderRight}>
              <button
                className={`${styles.readingToggleBtn} ${showReading ? styles.readingToggleActive : ""}`}
                onClick={() => setShowReading((v) => !v)}
                aria-label={showReading ? "발음 숨기기" : "발음 보기"}
                id="btn-toggle-reading"
              >
                {showReading ? "가" : "가"}
                <span className={styles.readingToggleBadge}>abc</span>
              </button>
              <button className={styles.storySkipBtn} onClick={() => setPhase("session")}>
                {t("storySkip")}
              </button>
            </div>
          </div>

          <div className={styles.novelBody}>
            {content.story.map((bubble, i) => (
              <div key={i} className={styles.novelBlock}>
                <p className={styles.novelPara}>{bubble.text}</p>
                {bubble.reading && showReading && (
                  <p className={styles.novelReading}>[{bubble.reading}]</p>
                )}
                {bubble.en && <p className={styles.novelTranslation}>{tr(bubble.en)}</p>}
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={() => setPhase("vocab_review")}
            id="btn-story-next"
          >
            {t("todaysWords")}
          </button>
        </div>
      </main>
    );
  }

  if (phase === "vocab_review") {
    const saveAllAndContinue = () => {
      content.words.forEach((w) => {
        addVocabWord({
          character_id: characterId,
          character_name: getCharacterById(characterId)?.name,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          sentence: w.example,
          sentence_translation: w.example_en,
        });
      });
      setPhase("session");
    };

    return (
      <main className={styles.page}>
        <div className={styles.vocabReviewCard}>
          <div className={styles.storyHeader}>
            <Link href={backToListHref} className={styles.closeBtn} aria-label="닫기">✕</Link>
            <div className={styles.storyHeaderInfo}>
              <span className={styles.storyHeaderEmoji}>{content.emoji}</span>
              <span className={styles.storyHeaderTitle}>{content.title}</span>
            </div>
          </div>

          <div className={styles.vocabReviewIntro}>
            <p className={styles.vocabReviewIntroEmoji}>📖</p>
            <p className={styles.vocabReviewIntroTitle}>{t("todaysWords")}</p>
            <p className={styles.vocabReviewIntroSub}>{t("todaysWordsSub")}</p>
          </div>

          <div className={styles.vocabReviewList}>
            {content.words.map((w) => (
              <div key={w.id} className={styles.vocabReviewItem}>
                <span className={styles.vocabReviewWord}>{w.word}</span>
                <span className={styles.vocabReviewReading}>[{w.reading}]</span>
                <p className={styles.vocabReviewMeaning}>{tr(w.meaning)}</p>
                <p className={styles.vocabReviewExample}>
                  {w.example}
                  <br />
                  {tr(w.example_en)}
                </p>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" onClick={saveAllAndContinue} id="btn-vocab-review-next">
            {t("saveWordsAndQuiz")}
          </button>
        </div>
      </main>
    );
  }

  // ── 스토리 브리핑 (카카오톡 대화창 스타일 사전지식 공유, 지역 문화 챕터 전용) ──
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
            <Link href={backToListHref} className={styles.closeBtn} aria-label="닫기">✕</Link>
            <div className={styles.storyHeaderInfo}>
              <span className={styles.storyHeaderEmoji}>{content.emoji}</span>
              <span className={styles.storyHeaderTitle}>{content.title}</span>
            </div>
            <div className={styles.storyHeaderRight}>
              <button
                className={`${styles.readingToggleBtn} ${showReading ? styles.readingToggleActive : ""}`}
                onClick={() => setShowReading((v) => !v)}
                aria-label={showReading ? "발음 숨기기" : "발음 보기"}
                id="btn-toggle-reading"
              >
                가
                <span className={styles.readingToggleBadge}>abc</span>
              </button>
              <button className={styles.storySkipBtn} onClick={() => setPhase("session")}>
                {t("storySkip")}
              </button>
            </div>
          </div>

          <div className={styles.storyThread}>
            {visible.map((bubble, i) => {
              const word = highlightWord(bubble.highlight_word_id);
              return (
                <div key={i} className={styles.storyRow}>
                  <div className={styles.storyAvatar}>
                    <Image
                      src={`/characters/${characterId}.png`}
                      alt={CAPTAIN_SHORT_NAME[characterId] ?? content.title}
                      width={40}
                      height={40}
                      className={styles.storyAvatarImg}
                    />
                  </div>
                  <div className={styles.storyBubbleCol}>
                    <span className={styles.storySpeakerName}>
                      {CAPTAIN_SHORT_NAME[characterId] ?? content.title} {t("captainBadge")}
                    </span>
                    <div className={styles.storyBubble}>
                      <p className={styles.storyText}>{bubble.text}</p>
                      {bubble.reading && showReading && (
                        <p className={`${styles.storyReading} ${styles.readingReveal}`}>[{bubble.reading}]</p>
                      )}
                      {bubble.en && <p className={styles.storyEn}>{tr(bubble.en)}</p>}
                      {word && (
                        <div className={styles.storyWordChip}>
                          <span className={styles.storyWordChipWord}>{word.word}</span>
                          <span className={styles.storyWordChipMeaning}>{tr(word.meaning)}</span>
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
        <div className={styles.confetti} aria-hidden="true">
          {Array.from({ length: 36 }, (_, index) => <span key={index} />)}
        </div>
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
              <span className={styles.rStatNum}>{wrongCount}</span>
              <span className={styles.rStatLabel}>{t("wrongLabel")}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>🪙 +{replaySession ? 0 : (rewardCoins ?? "…")}</span>
              <span className={styles.rStatLabel}>{replaySession ? t("completed") : t("coinEarned")}</span>
            </div>
          </div>
          <div className={styles.completeActions}>
            <button type="button" className="btn btn-primary btn-lg" onClick={handleReplay}>
              ↻ {t("startLearn")}
            </button>
            <Link href={`/learn/${characterId}/${nextChapterId}`} className="btn btn-primary btn-lg" id="btn-next-chapter">
              {t("nextChapter")} ({t("totalChapters")} {nextNum})
            </Link>
            <Link href={backToListHref} className="btn btn-secondary btn-lg">
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

  // 🎧🗣️ 스킵된 듣기/말하기 문제는 객관식 카드로 대체되는데, 그대로 questionText를 보여주면
  // (듣기: questionText===정답 단어, 말하기: questionText===정답 문장) 정답이 그대로 노출돼
  // 보기 중 "똑같이 생긴 걸 고르기"만 하면 되는 무의미한 문제가 된다. 스킵 시에는 정답 텍스트
  // 대신 뜻/번역을 보여주고, 🔊 버튼은 그대로 정답 오디오를 재생하게 해서 듣기·의미 단서로
  // 정답을 고르는 정상적인 문제로 바꾼다.
  const isFallbackVisualQuiz =
    (currentEx.type === "listening_choice" || currentEx.type === "speaking_practice") && isSkipped;
  const fallbackPrompt = isFallbackVisualQuiz
    ? currentEx.type === "speaking_practice"
      ? (currentEx.originalData as Sentence).en
      : (currentEx.originalData as Word).meaning
    : null;
  const fallbackHintText = isFallbackVisualQuiz
    ? currentEx.type === "speaking_practice"
      ? `발음: [${currentEx.reading}]`
      : `발음: [${currentEx.reading}] · 예문: ${(currentEx.originalData as Word).example}`
    : null;

  // ── 세션 진행 화면 ───────────────────────────────────────
  return (
    <main className={styles.page}>
      {/* 헤더 진도 바 */}
      <div className={styles.sessionHeader}>
        <Link href={backToListHref} className={styles.closeBtn} aria-label="닫기">✕</Link>
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
              {currentEx.type === "sentence_builder" && "🧩 배운 단어로 문장 완성"}
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
              <p>{fallbackHintText ?? tr(currentEx.hintText)}</p>
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
                  <p className={styles.flashMeaning}>{tr(currentEx.correctAnswer)}</p>
                  <p className={styles.flashExample}>{(currentEx.originalData as Word).example}</p>
                  <p className={styles.flashReading}>[{(currentEx.originalData as Word).example_reading}]</p>
                  <p className={styles.flashExampleEn}>{tr((currentEx.originalData as Word).example_en)}</p>
                </div>
              </button>
              {flipped && (
                <button className="btn btn-primary btn-lg" onClick={handleFlashcardNext} id="btn-next-flash">
                  {t("nextQuestion")}
                </button>
              )}
            </>
          )}

          {currentEx.type === "sentence_builder" && (
            <>
              <div className={styles.mcQuestion}>
                <h2 className={styles.mcWord}>{tr(currentEx.questionText)}</h2>
                {currentEx.reading && <p className={styles.mcReading}>[{currentEx.reading}]</p>}
              </div>
              <div className={styles.sentenceAnswer}>
                {selectedTokenIndexes.length === 0 && <span>단어를 순서대로 눌러 문장을 완성하세요</span>}
                {selectedTokenIndexes.map((tokenIndex) => (
                  <button key={tokenIndex} onClick={() => !isSubmitted && setSelectedTokenIndexes((items) => items.filter((i) => i !== tokenIndex))}>
                    {currentEx.options[tokenIndex]}
                  </button>
                ))}
              </div>
              <div className={styles.tokenBank}>
                {currentEx.options.map((token, tokenIndex) => (
                  <button key={`${token}-${tokenIndex}`} disabled={isSubmitted || selectedTokenIndexes.includes(tokenIndex)} onClick={() => setSelectedTokenIndexes((items) => [...items, tokenIndex])}>{token}</button>
                ))}
              </div>
              {!isSubmitted && <button className="btn btn-primary btn-lg" disabled={!selectedTokenIndexes.length} onClick={() => handleCheckAnswer(selectedTokenIndexes.map((i) => currentEx.options[i]).join(" "))}>{t("checkAnswerWithCount", { n: 3 - attempts })}</button>}
              {isSubmitted && <div className={styles.resultBox}>
                <p className={isCorrect ? styles.correctText : styles.wrongText}>{isCorrect ? t("correctNotice") : `${t("wrongFinalPrefix")} ${currentEx.correctAnswer}`}</p>
                <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
                <button className="btn btn-primary btn-lg" onClick={handleNext}>{t("nextQuestion")}</button>
              </div>}
            </>
          )}

          {/* 2. 객관식 & 문장 매칭 & 스킵된 듣기/말하기 */}
          {(currentEx.type === "multiple_choice" || currentEx.type === "sentence_match" || ((currentEx.type === "listening_choice" || currentEx.type === "speaking_practice") && isSkipped)) && (
            <>
              <div className={styles.mcQuestion}>
                <div className={styles.wordAudioRow}>
                  <h2 className={styles.mcWord}>{fallbackPrompt ? tr(fallbackPrompt) : currentEx.questionText}</h2>
                  <button
                    type="button"
                    className={styles.inlineListenBtn}
                    onClick={() => playCaptainVoice(currentEx.questionText, characterId)}
                    title="듣기"
                  >
                    🔊
                  </button>
                </div>
                {!isFallbackVisualQuiz && currentEx.reading && (
                  <p className={styles.mcReading}>[{currentEx.reading}]</p>
                )}
                {isFallbackVisualQuiz && (
                  <p className={styles.audioHint}>👆 🔊 버튼을 눌러 듣고 알맞은 답을 골라보세요</p>
                )}
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
                      {tr(opt)}
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
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{tr(currentEx.correctAnswer)}</strong></p>
                  )}
                  <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
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
                {currentEx.reading && <p className={styles.mcReading}>[{currentEx.reading}]</p>}
                <p className={styles.fbTranslation}>{tr((currentEx.originalData as Sentence).en)}</p>
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
                      {tr(opt)}
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
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{tr(currentEx.correctAnswer)}</strong></p>
                  )}
                  <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
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
                {currentEx.reading && <p className={styles.mcReading}>[{currentEx.reading}]</p>}
                <p className={styles.audioHint}>{tr((currentEx.originalData as Sentence).en)}</p>
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
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{tr(currentEx.correctAnswer)}</strong></p>
                  )}
                  <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
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
                      {tr(opt)}
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
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{tr(currentEx.correctAnswer)}</strong></p>
                  )}
                  <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
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
                      {turn.en && <p className={styles.dlgEn}>{tr(turn.en)}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.mcQuestion}>
                <p className={styles.dlgQuestion}>{currentEx.questionText}</p>
                <p className={styles.mcReading}>{tr(currentEx.hintText)}</p>
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
                      {tr(opt)}
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
                    <p className={styles.wrongText}>{t("wrongFinalPrefix")} <strong>{tr(currentEx.correctAnswer)}</strong></p>
                  )}
                  <p className={styles.explanation}>{tr(currentEx.explanation)}</p>
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
