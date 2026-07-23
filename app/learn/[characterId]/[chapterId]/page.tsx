"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./session.module.css";

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

const CAPTAIN_VOICE_NAMES: Record<string, string> = {
  kyuhyun: "🌋 용우 기장 전용 보이스 (중저음 톤)",
  haneul: "🌋 용우 기장 전용 보이스 (중저음 톤)",
  sunwoo: "🌋 용우 기장 전용 보이스 (중저음 톤)",
  sangwoo: "🌋 용우 기장 전용 보이스 (중저음 톤)",
  yongwoo: "🌋 용우 기장 전용 보이스 (중저음 톤)",
};

// ── 데이터 구조 ─────────────────────────────────────────────
type Word = {
  id: string;
  word: string;
  reading: string; // 발음 그대로 (Romanization)
  meaning: string;
  example: string;
  example_reading: string;
  example_en: string;
};

type Sentence = {
  id: string;
  ko: string;
  reading: string;
  en: string;
};

const CHAPTER_DATA: Record<string, { title: string; emoji: string; words: Word[]; sentences: Sentence[] }> = {
  "ch-k01": {
    title: "조선의 궁궐과 경복궁",
    emoji: "🏯",
    words: [
      { id: "w01", word: "경복궁", reading: "gyeong-bok-gung", meaning: "Gyeongbokgung Palace", example: "경복궁은 조선시대 정궁이에요.", example_reading: "gyeong-bok-gung-eun jo-seon-si-dae jeong-gung-i-e-yo", example_en: "Gyeongbokgung is the main Joseon palace." },
      { id: "w02", word: "수문장", reading: "su-mun-jang", meaning: "Palace Gate Guard", example: "수문장 교대의식을 관람하세요.", example_reading: "su-mun-jang gyo-dae-ui-sik-eun gwan-ram-ha-se-yo", example_en: "Watch the Royal Guard Changing Ceremony." },
      { id: "w03", word: "근정전", reading: "geun-jeong-jeon", meaning: "Main Throne Hall", example: "근정전은 국왕의 즉위식이 열린 곳입니다.", example_reading: "geun-jeong-jeon-eun guk-wang-ui jeuk-wi-sik-i yeol-rin got-im-ni-da", example_en: "Geunjeongjeon is where coronation held." },
      { id: "w04", word: "광화문", reading: "gwang-hwa-mun", meaning: "Gwanghwamun Gate", example: "광화문 앞에서 만나요.", example_reading: "gwang-hwa-mun ap-e-seo man-na-yo", example_en: "Let's meet in front of Gwanghwamun." },
      { id: "w05", word: "한복", reading: "han-bok", meaning: "Traditional Hanbok", example: "한복을 입으면 무료 입장입니다.", example_reading: "han-bok-eul ib-eu-myeon mu-ryo ib-jang-im-ni-da", example_en: "Admission is free if you wear Hanbok." },
    ],
    sentences: [
      { id: "s01", ko: "경복궁은 조선의 으뜸 궁궐입니다.", reading: "gyeong-bok-gung-eun jo-seon-ui eu-tteum gung-gwol-im-ni-da", en: "Gyeongbokgung is the main palace of Joseon." },
      { id: "s02", ko: "수문장 교대의식은 매일 열립니다.", reading: "su-mun-jang gyo-dae-ui-sik-eun mae-il yeol-rim-ni-da", en: "Guard Changing Ceremony is held daily." },
      { id: "s03", ko: "한복을 입고 근정전을 걸어보세요.", reading: "han-bok-eul ib-go geun-jeong-jeon-eul geol-eo-bo-se-yo", en: "Walk through Geunjeongjeon in Hanbok." },
      { id: "s04", ko: "광화문 광장은 서울의 중심입니다.", reading: "gwang-hwa-mun gwang-jang-eun seo-ul-ui jung-sim-im-ni-da", en: "Gwanghwamun Square is the heart of Seoul." },
      { id: "s05", ko: "조선 왕조 600년 역사가 담겨 있습니다.", reading: "jo-seon wang-jo yuk-baek-nyeon yeok-sa-ga dam-gyeo it-seum-ni-da", en: "It holds 600 years of Joseon Dynasty history." },
    ],
  },
};

const DEFAULT_CHAPTER = {
  title: "한국의 전통과 문화",
  emoji: "🏮",
  words: [
    { id: "w01", word: "안녕하세요", reading: "an-nyeong-ha-se-yo", meaning: "Hello (formal)", example: "안녕하세요, 환영합니다!", example_reading: "an-nyeong-ha-se-yo, hwan-yeong-ham-ni-da!", example_en: "Hello, welcome!" },
    { id: "w02", word: "전통", reading: "jeon-tong", meaning: "Tradition", example: "한국의 아름다운 전통입니다.", example_reading: "han-guk-ui a-reum-da-un jeon-tong-im-ni-da.", example_en: "It is a beautiful Korean tradition." },
    { id: "w03", word: "문화", reading: "mun-hwa", meaning: "Culture", example: "전통 문화를 함께 배워요.", example_reading: "jeon-tong mun-hwa-reul ham-kke bae-wo-yo.", example_en: "Let's learn traditional culture together." },
    { id: "w04", word: "감사합니다", reading: "gam-sa-ham-ni-da", meaning: "Thank you", example: "도와주셔서 감사합니다.", example_reading: "do-wa-ju-seo-seo gam-sa-ham-ni-da.", example_en: "Thank you for your help." },
    { id: "w05", word: "아름답다", reading: "a-reum-dap-da", meaning: "Beautiful", example: "풍경이 정말 아름다워요.", example_reading: "pung-gyeong-i jeong-mal a-reum-da-wo-yo.", example_en: "The scenery is really beautiful." },
  ],
  sentences: [
    { id: "s01", ko: "한국에 오신 것을 환영합니다.", reading: "han-guk-e o-sin geot-eul hwan-yeong-ham-ni-da", en: "Welcome to Korea." },
    { id: "s02", ko: "전통 한옥이 참 아름답습니다.", reading: "jeon-tong han-ok-i cham a-reum-dap-seum-ni-da", en: "Traditional Hanok is really beautiful." },
    { id: "s03", ko: "즐거운 여행이 되시기 바랍니다.", reading: "jeul-geo-un yeo-haeng-i doe-si-gi ba-ram-ni-da", en: "Have a pleasant journey." },
    { id: "s04", ko: "안전하게 좌석 벨트를 착용하세요.", reading: "an-jeon-ha-ge jwa-seok bel-teu-reul chak-yong-ha-se-yo", en: "Fasten your seat belt safely." },
    { id: "s05", ko: "한국어와 문화를 즐겁게 배워보세요.", reading: "han-guk-eo-wa mun-hwa-reul jeul-geb-ge bae-wo-bo-se-yo", en: "Enjoy learning Korean language and culture." },
  ],
};

type Phase = "intro" | "session" | "complete";
type ExerciseType = "flashcard" | "multiple_choice" | "fill_blank" | "sentence_match" | "listening_choice" | "speaking_practice";

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
  originalData: Word | Sentence;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateExercises(words: Word[], sentences: Sentence[]): ExerciseItem[] {
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
    const targetWord = parts[0];
    const rest = parts.slice(1).join(" ");
    const blankSentence = `____ ${rest}`;

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

  return shuffle(list).slice(0, 10);
}

export default function LearningSessionPage({
  params,
}: {
  params: Promise<{ characterId: string; chapterId: string }>;
}) {
  const { characterId, chapterId } = use(params);
  const chapter = CHAPTER_DATA[chapterId] ?? DEFAULT_CHAPTER;

  const exercises = useMemo(
    () => generateExercises(chapter.words, chapter.sentences),
    [chapterId]
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);

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
    } else {
      setCurrentIdx((i) => i + 1);
    }
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

  // ── 인트로 화면 ─────────────────────────────────────────
  if (phase === "intro") {
    return (
      <main className={styles.page}>
        <div className={styles.introCard}>
          <div className={styles.introEmoji}>{chapter.emoji}</div>
          <h1 className={styles.introTitle}>{chapter.title}</h1>
          <p className={styles.introTitleEn}>Interactive Culture & Language Session</p>
          <div className={styles.introStats}>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>10</span>
              <span className={styles.introStatLabel}>단계</span>
            </div>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>{totalExercises}</span>
              <span className={styles.introStatLabel}>문제</span>
            </div>
            <div className={styles.introStat}>
              <span className={styles.introStatNum}>3회</span>
              <span className={styles.introStatLabel}>기회</span>
            </div>
          </div>
          <div className={styles.introTypes}>
            <span className={styles.introType}>🔊 용우 기장 보이스</span>
            <span className={styles.introType}>🔤 발음 그대로 (Romanization)</span>
            <span className={styles.introType}>💡 힌트 보기</span>
            <span className={styles.introType}>🗣️ {CAPTAIN_VOICE_NAMES[characterId]}</span>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setPhase("session")} id="btn-start-session">
            🚀 학습 시작!
          </button>
          <Link href={`/learn/${characterId}`} className="btn btn-ghost" style={{ textAlign: "center" }}>
            ‹ 챕터 목록으로
          </Link>
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
          <h1 className={styles.completeTitle}>학습 완료!</h1>
          <p className={styles.completeSub}>Session Complete!</p>
          <div className={styles.resultScore}>
            <span className={styles.scoreNum}>+{score}</span>
            <span className={styles.scoreLabel}>점수</span>
          </div>
          <div className={styles.resultStats}>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>{correctCount}</span>
              <span className={styles.rStatLabel}>정답</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>{totalExercises - correctCount}</span>
              <span className={styles.rStatLabel}>오답</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.rStatNum}>🪙 +{Math.floor(score / 10)}</span>
              <span className={styles.rStatLabel}>코인 획득</span>
            </div>
          </div>
          <div className={styles.completeActions}>
            <Link href={`/learn/${characterId}/${nextChapterId}`} className="btn btn-primary btn-lg" id="btn-next-chapter">
              ▶️ 다음 챕터 학습하기 (챕터 {nextNum})
            </Link>
            <Link href={`/learn/${characterId}`} className="btn btn-secondary btn-lg">
              📖 챕터 목록으로
            </Link>
            <Link href={`/chat/${characterId}`} className="btn btn-blue btn-lg">
              💬 기장님과 대화하기
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
            </p>

            <div className={styles.headerBtnGroup}>
              <button
                type="button"
                className={styles.voicePlayBtn}
                onClick={() => playCaptainVoice(currentEx.questionText, characterId)}
                title="용우 기장 목소리로 들려주기"
              >
                🔊 들어보기
              </button>

              <button
                type="button"
                className={styles.hintToggleBtn}
                onClick={() => setShowHint(!showHint)}
                title="💡 힌트 보기"
              >
                💡 {showHint ? "힌트 닫기" : "힌트"}
              </button>

              {(currentEx.type === "listening_choice" || currentEx.type === "speaking_practice") && !isSkipped && (
                <button className={styles.skipBtn} onClick={() => setIsSkipped(true)} title="텍스트 문제로 스킵">
                  ⏭️ 스킵
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
                <button className="btn btn-primary btn-lg" onClick={handleNext} id="btn-next-flash">
                  다음 문제 →
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
                <p className={styles.voiceBadge}>{CAPTAIN_VOICE_NAMES[characterId]}</p>
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
                  ❌ 오답입니다! 다시 시도해 보세요. (남은 기회: {3 - attempts}회)
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer()}
                  disabled={!selectedOption}
                >
                  정답 확인 (기회 {3 - attempts}/3)
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>🎉 정답입니다!</p>
                  ) : (
                    <p className={styles.wrongText}>💡 3회 실패 — 정답: <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    다음 문제 →
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
                  ❌ 오답입니다! 다시 입력해 보세요. (남은 기회: {3 - attempts}회)
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer(inputText)}
                  disabled={!inputText.trim()}
                >
                  정답 확인 (기회 {3 - attempts}/3)
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>🎉 정답입니다!</p>
                  ) : (
                    <p className={styles.wrongText}>💡 3회 실패 — 정답: <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    다음 문제 →
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
                    <p className={styles.correctText}>🎉 훌륭한 한국어 발음입니다!</p>
                  ) : (
                    <p className={styles.wrongText}>💡 3회 시도 완료 — 올바른 문장: <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    다음 문제 →
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
                  🔊 소리 듣기 (용우 기장 중저음 톤)
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
                  ❌ 오답입니다! 다시 들어보고 선택하세요. (남은 기회: {3 - attempts}회)
                </div>
              )}

              {!isSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleCheckAnswer()}
                  disabled={!selectedOption}
                >
                  정답 확인 (기회 {3 - attempts}/3)
                </button>
              )}

              {isSubmitted && (
                <div className={styles.resultBox}>
                  {isCorrect ? (
                    <p className={styles.correctText}>🎉 정답입니다!</p>
                  ) : (
                    <p className={styles.wrongText}>💡 3회 실패 — 정답: <strong>{currentEx.correctAnswer}</strong></p>
                  )}
                  <p className={styles.explanation}>{currentEx.explanation}</p>
                  <button className="btn btn-primary btn-lg" onClick={handleNext}>
                    다음 문제 →
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
