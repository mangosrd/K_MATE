"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import type { ChatMessage, ChatResponse } from "@/types/api";
import styles from "./chat.module.css";

import { MOCK_CHARACTERS, MOCK_USER, canAccessCharacter } from "@/lib/db/mock";
import { addVocabWord } from "@/lib/vocab/store";
import { addLocalDiary } from "@/lib/diary/store";
import { getChatHistory, saveChatHistory, clearChatHistory } from "@/lib/chat/store";
import { getEffectiveUserId } from "@/lib/auth/store";

const REGION_NAMES: Record<string, string> = {
  seoul: "서울·경기 노선",
  jeonju: "전주·전라 노선",
  busan: "부산·경남 노선",
  chungcheong: "충청·공주 노선",
  jeju: "제주 노선",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";


import { useLanguage } from "@/components/LanguageContext";

export default function ChatPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const { language } = useLanguage();
  const canAccess = canAccessCharacter(characterId, MOCK_USER.membership, MOCK_USER.free_character_slots);

  // 실제 캐릭터 데이터 조회
  const char = MOCK_CHARACTERS.find((c) => c.id === characterId) ?? {
    id: characterId,
    name: characterId,
    emoji: "✈️",
    region_id: "seoul",
    description: "",
    description_en: "",
    tags: [],
    persona: "",
    requires_premium: false,
    avatar_url: "",
  };

  const INITIAL_MESSAGES: ChatMessage[] = [
    {
      role: "assistant",
      content: `안녕하세요, 승객 여러분. 저는 ${char.name} 기장입니다. ${REGION_NAMES[char.region_id] ?? "한국"} 탑승을 환영합니다! ✈️ 안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다.`,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callbackMemory, setCallbackMemory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [resumeChoice, setResumeChoice] = useState<"pending" | "resolved">(() =>
    getChatHistory(characterId) ? "pending" : "resolved"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 이전 대화 이어서 하기 / 새로 시작하기 선택
  const handleResume = () => {
    const history = getChatHistory(characterId);
    if (history) setMessages(history);
    setResumeChoice("resolved");
  };
  const handleFreshStart = () => {
    clearChatHistory(characterId);
    setMessages(INITIAL_MESSAGES);
    setResumeChoice("resolved");
  };

  // 대화 내용이 바뀔 때마다 로컬(브라우저)에 저장 — 재접속 시 이어서 할 수 있도록
  useEffect(() => {
    if (resumeChoice !== "resolved") return;
    saveChatHistory(characterId, messages);
  }, [messages, resumeChoice, characterId]);

  if (!canAccess) {
    return (
      <>
        <div className="page-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>{char.name} 기장 노선 잠금</h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", maxWidth: "300px" }}>
            이 노선은 프리미엄 전용입니다. 구독 후 대화를 이용하실 수 있습니다.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/chat" className="btn btn-secondary">← 목록으로</Link>
            <Link href="/premium" className="btn btn-gold">⭐ 프리미엄 보기</Link>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 단어 저장 토스트
  const showToast = useCallback((word: string) => {
    setSavedWords((prev) => [...prev, word]);
    setToast(`'${word}' saved to vocab!`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 단어장에 영구 저장 — 로컬(브라우저)에 우선 저장하고, 백엔드가 살아있으면 함께 동기화
  const saveWordToVocab = useCallback(
    (word: string, meaning: string, sentence: string) => {
      addVocabWord({
        character_id: characterId,
        word,
        meaning,
        sentence,
        sentence_translation: "",
      });
    },
    [characterId]
  );

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    setCallbackMemory(null);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: characterId,
          user_message: userMessage,
          session_history: messages,
          user_id: getEffectiveUserId(),
          user_language: language,
        }),
      });

      const data: ChatResponse = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);

      if (data.callback_memory) {
        setCallbackMemory(data.callback_memory);
      }

      if (data.word_suggestion?.word) {
        showToast(data.word_suggestion.word);
        saveWordToVocab(
          data.word_suggestion.word,
          data.word_suggestion.meaning,
          data.word_suggestion.sentence
        );
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "잠깐만요... 연결이 불안정해요. 다시 시도해볼게요! 😅" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSessionEnd = async () => {
    const userId = getEffectiveUserId();

    // 1. 기억 추출 + 저장 (LLM 추출 후 백엔드 MySQL에 best-effort 저장)
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        characterId,
        sessionHistory: messages,
      }),
    }).catch(() => {});

    // 2. 일기 생성 — 실제 백엔드(FastAPI)가 LLM 호출 + MySQL 저장까지 함께 수행
    const sessionEvents = messages
      .filter((m) => m.role === "assistant")
      .slice(-3)
      .map((m) => m.content);

    try {
      const res = await fetch(`${BACKEND_URL}/diary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          character_id: characterId,
          session_events: sessionEvents,
          place_name: REGION_NAMES[char.region_id] ?? "한국 여행",
          unlock_cost: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addLocalDiary({
          id: data.diary_id,
          character_id: characterId,
          body_ko: data.body_ko,
          place_name: data.place_name,
          unlocked: false,
          unlock_cost: 5,
          created_at: data.created_at,
        });
      }
    } catch {
      // 백엔드 미연결 — 일기가 생성/저장되지 않지만 화면 흐름은 막지 않는다
    }

    // 대화가 마무리됐으므로 다음에 들어오면 새 대화로 시작한다
    clearChatHistory(characterId);
    window.location.href = "/diary";
  };

  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setToast("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <>
      <div className={styles.chatShell}>
        {/* 헤더 */}
        <header className={styles.chatHeader}>
          <Link href="/map" className={styles.backBtn} aria-label="Back to map">
            ‹
          </Link>
          <div className={styles.charInfo}>
            <div className={styles.charAvatar}>
              <Image
                src={`/characters/${char.id}.png`}
                alt={`${char.name} 기장`}
                width={40}
                height={40}
                className={styles.charAvatarImg}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className={styles.charEmojiBack}>{char.emoji}</span>
            </div>
            <div>
              <p className={styles.charName}>{char.name} 기장</p>
              <p className={styles.charLocation}>✈️ {REGION_NAMES[char.region_id] ?? "한국 노선"}</p>
            </div>
          </div>
          <button
            className={styles.endBtn}
            onClick={() => setShowEndModal(true)}
            id="btn-session-end"
            aria-label="End session"
          >
            종료
          </button>
        </header>

        {/* 되짚기 카드 */}
        {callbackMemory && (
          <div className={`callback-card ${styles.callbackWrap}`}>
            <span className="callback-icon">💭</span>
            <p>{callbackMemory}</p>
          </div>
        )}

        {/* 메시지 영역 */}
        <div className={styles.messages} role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowAi}`}
            >
              {msg.role === "assistant" && (
                <div className={styles.msgAvatar}>{char.emoji}</div>
              )}
              <div
                className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* 로딩 */}
          {isLoading && (
            <div className={`${styles.msgRow} ${styles.msgRowAi}`}>
              <div className={styles.msgAvatar}>{char.emoji}</div>
              <div className="chat-bubble chat-bubble-ai">
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 저장된 단어 칩 */}
        {savedWords.length > 0 && (
          <div className={styles.savedWordsRow}>
            {savedWords.slice(-3).map((w, i) => (
              <span key={i} className={`badge badge-mint ${styles.wordChip}`}>
                ✓ {w}
              </span>
            ))}
          </div>
        )}

        {/* 입력창 */}
        <div className={styles.inputArea}>
          <button
            type="button"
            className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
            onClick={startListening}
            title="한국어 음성 입력"
            aria-label="Speech recognition"
          >
            {isListening ? "🎙️" : "🎤"}
          </button>
          <input
            id="chat-input"
            className={styles.chatInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "듣고 있습니다... 한국어로 말씀하세요" : "한국어 또는 질문을 입력하세요..."}
            aria-label="Chat message input"
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            id="btn-send"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="toast" role="status" aria-live="assertive">
          📖 {toast}
        </div>
      )}

      {/* 이전 대화 이어서 하기 / 새로 시작하기 선택 */}
      {resumeChoice === "pending" && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-resume-title">
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 id="modal-resume-title" className={styles.modalTitle}>
              이전 대화가 있어요
            </h2>
            <p className={styles.modalSub}>
              {char.name} 기장님과 나눈 대화를 이어서 할까요, 새로 시작할까요?
            </p>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={handleFreshStart} id="btn-chat-fresh">
                새로 시작하기
              </button>
              <button className="btn btn-primary" onClick={handleResume} id="btn-chat-resume">
                이어서 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 세션 종료 모달 */}
      {showEndModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-end-title"
          onClick={() => setShowEndModal(false)}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 id="modal-end-title" className={styles.modalTitle}>
              대화가 끝났어요
            </h2>
            <p className={styles.modalSub}>
              오늘의 대화를 바탕으로 메이트가 일기를 쓰기 시작해요. 종료하시겠어요?
            </p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEndModal(false)}
                id="btn-keep-chatting"
              >
                계속 대화하기
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSessionEnd}
                id="btn-end-and-diary"
              >
                📔 종료 및 일기 보기
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
