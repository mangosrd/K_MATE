"use client";

import { useState, useRef, useEffect, use, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/ui/BottomNav";
import LoadingSplash from "@/components/LoadingSplash";
import type { ChatMessage, ChatResponse } from "@/types/api";
import styles from "./chat.module.css";

import { MOCK_CHARACTERS, canAccessCharacter } from "@/lib/db/mock";
import { addLocalDiary } from "@/lib/diary/store";
import { getChatHistory, saveChatHistory, clearChatHistory } from "@/lib/chat/store";
import { getAuthHeaders, getEffectiveUserId, getCurrentUser, setPreferredCaptainId } from "@/lib/auth/store";
import { useMembership, useFreeCharSlots } from "@/lib/auth/useAuthUser";
import { useLanguage, type Language } from "@/components/LanguageContext";
import { getSpeechRecognitionConstructor } from "@/lib/browser/speechRecognition";

const REGION_NAMES: Record<string, string> = {
  seoul: "서울·경기 노선",
  jeonju: "전주·전라 노선",
  busan: "부산·경남 노선",
  chungcheong: "충청·공주 노선",
  jeju: "제주 노선",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type ChatUiCopy = {
  chooseCaptain: string;
  captain: string;
  voiceInput: string;
  listening: string;
  inputPlaceholder: string;
  resumeTitle: string;
  resumeBody: (name: string) => string;
  freshStart: string;
  resume: string;
  endTitle: string;
  endBody: string;
  keepChatting: string;
  endAndDiary: string;
};

const CHAT_UI_COPY: Record<Language, ChatUiCopy> = {
  ko: { chooseCaptain: "기장님 선택", captain: "기장", voiceInput: "한국어 음성 입력", listening: "듣고 있습니다… 한국어로 말씀하세요", inputPlaceholder: "한국어로 입력하거나 질문해 보세요…", resumeTitle: "이전 대화가 있어요", resumeBody: (name) => `${name} 기장님과 나눈 대화를 이어서 할까요, 새로 시작할까요?`, freshStart: "새로 시작하기", resume: "이어서 하기", endTitle: "대화가 끝났어요", endBody: "오늘의 대화를 바탕으로 메이트가 일기를 쓰기 시작해요. 종료하시겠어요?", keepChatting: "계속 대화하기", endAndDiary: "종료 및 일기 보기" },
  en: { chooseCaptain: "Choose captain", captain: "Captain", voiceInput: "Korean voice input", listening: "Listening… Speak in Korean", inputPlaceholder: "Type in Korean or ask a question…", resumeTitle: "You have a previous chat", resumeBody: (name) => `Continue your chat with Captain ${name}, or start a new one?`, freshStart: "Start new", resume: "Continue", endTitle: "End this chat?", endBody: "Your mate will begin writing a diary from today's chat. Would you like to end it?", keepChatting: "Keep chatting", endAndDiary: "End and view diary" },
  ru: { chooseCaptain: "Выбрать капитана", captain: "Капитан", voiceInput: "Голосовой ввод на корейском", listening: "Слушаю… Говорите по-корейски", inputPlaceholder: "Напишите по-корейски или задайте вопрос…", resumeTitle: "У вас есть предыдущий чат", resumeBody: (name) => `Продолжить разговор с капитаном ${name} или начать новый?`, freshStart: "Начать новый", resume: "Продолжить", endTitle: "Завершить разговор?", endBody: "На основе сегодняшнего разговора ваш спутник начнёт писать дневник. Завершить?", keepChatting: "Продолжить разговор", endAndDiary: "Завершить и открыть дневник" },
  zh: { chooseCaptain: "选择机长", captain: "机长", voiceInput: "韩语语音输入", listening: "正在聆听… 请说韩语", inputPlaceholder: "请输入韩语或提出问题…", resumeTitle: "你有一段之前的对话", resumeBody: (name) => `要继续与${name}机长的对话，还是重新开始？`, freshStart: "重新开始", resume: "继续对话", endTitle: "要结束对话吗？", endBody: "你的伙伴会根据今天的对话开始写日记。确定结束吗？", keepChatting: "继续对话", endAndDiary: "结束并查看日记" },
  ja: { chooseCaptain: "機長を選ぶ", captain: "機長", voiceInput: "韓国語の音声入力", listening: "聞いています… 韓国語で話してください", inputPlaceholder: "韓国語で入力するか、質問してください…", resumeTitle: "前回の会話があります", resumeBody: (name) => `${name}機長との会話を続けますか？ それとも新しく始めますか？`, freshStart: "新しく始める", resume: "続きから", endTitle: "会話を終了しますか？", endBody: "今日の会話をもとに、メイトが日記を書き始めます。終了しますか？", keepChatting: "会話を続ける", endAndDiary: "終了して日記を見る" },
  "zh-TW": { chooseCaptain: "選擇機長", captain: "機長", voiceInput: "韓語語音輸入", listening: "正在聆聽… 請說韓語", inputPlaceholder: "請輸入韓語或提出問題…", resumeTitle: "你有一段先前的對話", resumeBody: (name) => `要繼續與${name}機長的對話，還是重新開始？`, freshStart: "重新開始", resume: "繼續對話", endTitle: "要結束對話嗎？", endBody: "你的夥伴會根據今天的對話開始寫日記。確定結束嗎？", keepChatting: "繼續對話", endAndDiary: "結束並查看日記" },
  th: { chooseCaptain: "เลือกกัปตัน", captain: "กัปตัน", voiceInput: "ป้อนเสียงภาษาเกาหลี", listening: "กำลังฟัง… กรุณาพูดภาษาเกาหลี", inputPlaceholder: "พิมพ์ภาษาเกาหลีหรือถามคำถาม…", resumeTitle: "มีบทสนทนาก่อนหน้า", resumeBody: (name) => `ต้องการคุยต่อกับกัปตัน ${name} หรือเริ่มใหม่?`, freshStart: "เริ่มใหม่", resume: "คุยต่อ", endTitle: "จบบทสนทนาหรือไม่?", endBody: "เมทจะเริ่มเขียนไดอารีจากบทสนทนาวันนี้ ต้องการจบหรือไม่?", keepChatting: "คุยต่อ", endAndDiary: "จบและดูไดอารี" },
};

const CHAT_GENERIC_OPENING: Record<Language, string> = {
  ko: "반가워요. 오늘은 어떤 이야기를 나누고 싶어요?",
  en: "It is good to see you. What would you like to talk about today?",
  ru: "Рад вас видеть. О чём вы хотели бы поговорить сегодня?",
  zh: "很高兴见到你。今天想聊些什么？",
  ja: "会えてうれしいです。今日は何について話したいですか？",
  "zh-TW": "很高興見到你。今天想聊些什麼？",
  th: "ดีใจที่ได้พบคุณ วันนี้อยากคุยเรื่องอะไรครับ",
};

const CHAT_RETRY_MESSAGE: Record<Language, string> = {
  ko: "잠깐만요… 연결이 불안정해요. 다시 시도해 볼게요!",
  en: "One moment… The connection is unstable. Let me try again!",
  ru: "Минуточку… Соединение нестабильно. Попробуем ещё раз!",
  zh: "请稍等… 网络连接不稳定。我们再试一次！",
  ja: "少し待ってください… 接続が不安定です。もう一度試します！",
  "zh-TW": "請稍等… 網路連線不穩定。我們再試一次！",
  th: "รอสักครู่… การเชื่อมต่อไม่เสถียร ลองอีกครั้งนะครับ",
};

const REGION_TRANSLATION_KEYS: Record<string, string> = {
  seoul: "seoulRoute",
  jeonju: "jeonjuRoute",
  busan: "busanRoute",
  chungcheong: "chungcheongRoute",
  jeju: "jejuRoute",
};

const subscribeToLocalChatHistory = () => () => {};

// The first line is shown before the API is called, so it must carry the same
// character voice as the server prompt instead of falling back to an airline notice.
const CAPTAIN_OPENINGS: Record<Language, Record<string, string>> = {
  ko: {
    kyuhyun: "오늘도 찾아와 줘서 고마워, 아가씨. 오늘 하루는 어땠어?",
    haneul: "반갑습니다. 오늘 하루는 어땠어요? 이야기 듣고 싶어요.",
    sunwoo: "왜 이제 옴 ㅠㅠ..? 오늘 뭐 했어?",
    sangwoo: "타워, 그쪽이 없어서 내 하늘이 잠깐 우울했는데… 거짓말 같이 마주하고 있으니 날씨가 맑아지는군요. 오늘 하루는 어땠습니까?",
    yongwoo: "뭐 하다 이제 와.",
  },
  en: {
    kyuhyun: "Thank you for coming by again, miss. How was your day?",
    haneul: "It is nice to see you. How was your day? I would love to hear about it.",
    sunwoo: "Why are you only here now...? What did you do today?",
    sangwoo: "Tower, the sky felt a little gloomy without you. But now that we are face to face, it is clearing up. How was your day?",
    yongwoo: "What took you so long?",
  },
  ru: {
    kyuhyun: "Спасибо, что снова заглянули, мадемуазель. Как прошёл ваш день?",
    haneul: "Рад вас видеть. Как прошёл ваш день? Мне хочется послушать.",
    sunwoo: "Почему ты только сейчас пришла ㅠㅠ..? Чем сегодня занималась?",
    sangwoo: "Тауэр, без вас моё небо немного грустило. Но стоило нам встретиться — и оно прояснилось. Как прошёл ваш день?",
    yongwoo: "Чем занималась так долго?",
  },
  zh: {
    kyuhyun: "谢谢你今天又来找我，小姐。今天过得怎么样？",
    haneul: "很高兴见到你。今天过得怎么样？我想听你说说。",
    sunwoo: "怎么现在才来ㅠㅠ..? 今天都做什么了？",
    sangwoo: "塔台，没有你的时候，我的天空有点忧郁。不过现在见到你，天气像奇迹一样放晴了。今天过得怎么样？",
    yongwoo: "怎么现在才来？",
  },
  ja: {
    kyuhyun: "今日も来てくれてありがとう、お嬢さん。今日はどんな一日だった？",
    haneul: "会えてうれしいです。今日はどんな一日でしたか？お話を聞かせてください。",
    sunwoo: "なんで今さら来たのㅠㅠ..? 今日何してたの？",
    sangwoo: "タワー、あなたがいない間は私の空が少し曇っていました。でもこうして会えたら、嘘みたいに晴れてきました。今日はどんな一日でしたか？",
    yongwoo: "今まで何してたの。",
  },
  "zh-TW": {
    kyuhyun: "謝謝妳今天又來找我，小姐。今天過得怎麼樣？",
    haneul: "很高興見到你。今天過得怎麼樣？我想聽你說說。",
    sunwoo: "怎麼現在才來ㅠㅠ..? 今天都做什麼了？",
    sangwoo: "塔台，沒有你的時候，我的天空有點憂鬱。不過現在見到你，天氣像奇蹟一樣放晴了。今天過得怎麼樣？",
    yongwoo: "現在才來？剛剛在忙什麼。",
  },
  th: {
    kyuhyun: "ขอบคุณที่แวะมาหาผมอีกนะครับ คุณหนู วันนี้เป็นอย่างไรบ้างครับ?",
    haneul: "ยินดีที่ได้เจอนะครับ วันนี้เป็นอย่างไรบ้าง? ผมอยากฟังเรื่องของคุณครับ",
    sunwoo: "ทำไมเพิ่งมาล่ะ ㅠㅠ..? วันนี้ทำอะไรมาบ้าง?",
    sangwoo: "ทาวเวอร์ ตอนคุณไม่อยู่ท้องฟ้าของผมหม่นหมองไปนิดหน่อย แต่พอได้พบกันอีกครั้งฟ้าก็ใสขึ้นอย่างกับปาฏิหาริย์ วันนี้เป็นอย่างไรบ้างครับ?",
    yongwoo: "ไปทำอะไรมา ถึงเพิ่งมาล่ะ",
  },
};

export default function ChatPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params);
  const { language, t } = useLanguage();
  const ui = CHAT_UI_COPY[language];
  const { membership, membershipLoaded } = useMembership();
  const { freeSlots, freeSlotsLoaded } = useFreeCharSlots();
  const router = useRouter();
  const canAccess = canAccessCharacter(characterId, membership, freeSlots);

  useEffect(() => {
    setPreferredCaptainId(characterId);
  }, [characterId]);

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

  useEffect(() => {
    if (char.requires_premium && membershipLoaded && freeSlotsLoaded && !canAccess) {
      router.replace("/premium");
    }
  }, [canAccess, char.requires_premium, freeSlotsLoaded, membershipLoaded, router]);

  const initialOpening =
    CAPTAIN_OPENINGS[language][char.id] ?? CHAT_GENERIC_OPENING[language];
  const routeLabel = t(REGION_TRANSLATION_KEYS[char.region_id] ?? "routeLabel");
  const INITIAL_MESSAGES: ChatMessage[] = [
    {
      role: "assistant",
      content: initialOpening,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callbackMemory, setCallbackMemory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  // 서버는 localStorage에 접근할 수 없어 항상 "resolved"로 렌더한다 — 초기값을
  // getChatHistory()로 바로 잡으면 서버/클라이언트 렌더 결과가 달라져 하이드레이션
  // 에러가 난다. 마운트 후에만(클라이언트에서만) 저장된 대화가 있는지 확인한다.
  // Do not write the greeting to storage until we have checked for an existing
  // conversation. Otherwise the initial render can overwrite it before the
  // user gets a chance to press "continue".
  const [resumeResolvedFor, setResumeResolvedFor] = useState<string | null>(null);
  const hasSavedConversation = useSyncExternalStore(
    subscribeToLocalChatHistory,
    () => Boolean(getChatHistory(characterId)?.some((message) => message.role === "user")),
    () => false,
  );
  const hasCurrentConversation = messages.some((message) => message.role === "user");
  // Only offer to resume history when entering an otherwise fresh room. The
  // first message of a brand-new conversation is saved immediately; without
  // this guard that save made hasSavedConversation turn true during the chat
  // and opened the resume modal over the conversation in progress.
  const resumePending = hasSavedConversation
    && resumeResolvedFor !== characterId
    && !hasCurrentConversation;
  const visibleMessages = useMemo(
    () => messages.some((message) => message.role === "user")
      ? messages
      : [{ role: "assistant" as const, content: initialOpening }],
    [initialOpening, messages],
  );

  /*
    // 저장된 기록이 시작 인사말(캐릭터가 먼저 건 말) 하나뿐이면 "대화"라고 볼 수
    // 없다 — 아래 저장 effect가 인사말만 있어도 그대로 저장해버려서, 실제로 아무
    // 말도 안 하고 페이지만 열었다 나가도 다음 방문 때 계속 팝업이 떴었다.
    // 사용자가 실제로 메시지를 보낸 기록이 있을 때만 이어서 하기를 제안한다.
  */
  // Reading saved history during render avoids two state-setting effects and
  // keeps the localized opening in sync without an extra paint.
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendInFlightRef = useRef(false);

  // 이전 대화 이어서 하기 / 새로 시작하기 선택
  const handleResume = () => {
    const history = getChatHistory(characterId);
    if (history) setMessages(history);
    setResumeResolvedFor(characterId);
  };
  const handleFreshStart = () => {
    clearChatHistory(characterId);
    setMessages(INITIAL_MESSAGES);
    setResumeResolvedFor(characterId);
  };

  // 대화 내용이 바뀔 때마다 로컬(브라우저)에 저장 — 재접속 시 이어서 할 수 있도록
  useEffect(() => {
    if (resumePending) return;
    saveChatHistory(characterId, visibleMessages);
  }, [characterId, resumePending, visibleMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);


  const sendMessage = async () => {
    if (!input.trim() || isLoading || sendInFlightRef.current) return;

    sendInFlightRef.current = true;

    const userMessage = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [
      ...visibleMessages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    // Persist synchronously so a quick app background/navigation cannot leave
    // the resume record behind the UI state.
    saveChatHistory(characterId, newMessages);
    setIsLoading(true);
    setCallbackMemory(null);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          character_id: characterId,
          user_message: userMessage,
          session_history: visibleMessages,
          user_id: getEffectiveUserId(),
          user_language: language,
        }),
      });

      // 무료 대화 10회 소진 — 답장 없이 결제 유도 모달만 띄운다(사용자가 보낸 메시지는
      // 화면에 남겨두되, 가짜 답장을 지어내지 않는다).
      if (res.status === 402) {
        setShowPaywall(true);
        return;
      }
      if (!res.ok) throw new Error("chat request failed");

      const data: ChatResponse = await res.json();

      const completedMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: data.reply },
      ];
      setMessages(completedMessages);
      // Do not rely only on the post-render effect: mobile WebViews may pause
      // before it runs, making a reply that was visible appear to disappear on
      // the next visit.
      saveChatHistory(characterId, completedMessages);
      setFreeRemaining(data.free_messages_remaining ?? null);

      if (data.coins_spent) {
        setToast(`🪙 -${data.coins_spent}`);
        setTimeout(() => setToast(null), 3000);
      }

      if (data.callback_memory) {
        setCallbackMemory(data.callback_memory);
      }

    } catch {
      const failedMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: CHAT_RETRY_MESSAGE[language] },
      ];
      setMessages(failedMessages);
      saveChatHistory(characterId, failedMessages);
    } finally {
      sendInFlightRef.current = false;
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

    // 승객이 한 마디도 안 하고(초기 인사만 있는 상태) 바로 종료하면 나눈 대화 자체가
    // 없으므로, 일기/기억을 생성·저장할 소재도 없다 — 굳이 LLM을 호출해 빈 대화 기반의
    // 일기를 만들지 않는다.
    const hasConversation = messages.some((m) => m.role === "user");
    if (!hasConversation) {
      clearChatHistory(characterId);
      window.location.href = "/diary";
      return;
    }

    // 1. 기억 추출 + 저장 (LLM 추출 후 백엔드 MySQL에 best-effort 저장)
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        userId,
        characterId,
        sessionHistory: messages,
      }),
    }).catch(() => {});

    // 2. 일기 생성 — 실제 백엔드(FastAPI)가 LLM 호출 + MySQL 저장까지 함께 수행
    // 예전엔 기장 자신의 마지막 대사 3개만 넘겨서, AI가 실제 대화 주제를 전혀 모른 채
    // 일기를 썼다(그래서 늘 뻔한 내용만 나오고, 승객을 "여행자" 같은 일반 호칭으로만 부름).
    // 승객 발언까지 포함한 전체 대화(+실명)를 넘겨서 실제로 오간 얘기에서 소재를 골라
    // 승객 이름을 부르며 쓰게 한다.
    const userName = getCurrentUser()?.name;
    const sessionEvents = messages
      .slice(-20)
      .map((m) => `${m.role === "user" ? "승객" : `${char.name} 기장`}: ${m.content}`);

    try {
      const res = await fetch(`${BACKEND_URL}/diary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: userId,
          character_id: characterId,
          session_events: sessionEvents,
          user_name: userName,
          place_name: REGION_NAMES[char.region_id] ?? "한국 여행",
          unlock_cost: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addLocalDiary({
          id: data.diary_id,
          character_id: characterId,
          body_ko: "",
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

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = getSpeechRecognitionConstructor(window);

    if (!SpeechRecognition) {
      setToast(t("sttNotSupportedToast"));
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

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event) => {
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

  // 접근 제어 체크는 반드시 모든 훅 호출(useState/useRef/useEffect/useCallback) 이후,
  // 즉 컴포넌트 로직 마지막에서 해야 한다. 예전엔 이 return이 훅 선언 중간에 있어서
  // (이 아래로 useEffect 1개, useCallback 2개, useState 1개가 더 있었음) 리렌더링 시점에
  // canAccess 값이 달라지면(예: 다른 탭에서 프리미엄 결제 후 돌아왔을 때) 훅 호출 순서가
  // 바뀌어 "Rendered fewer hooks than expected" 런타임 에러로 채팅 화면이 통째로 깨질 수 있었다.
  // membership/freeSlots는 마운트 직후엔 항상 기본값(무료회원)으로 시작해서 실제 백엔드
  // 조회가 끝나기 전까진, 진짜 프리미엄 회원도 잠깐 🔒 잠금 화면을 봤다가 채팅 화면으로
  // 바뀌는 깜빡임이 있었다. 다만 이 대기가 필요한 건 프리미엄 전용 캐릭터일 때뿐이다 —
  // 무료 캐릭터는 membership을 보기도 전에 이미 접근이 허용되므로, 매번(뒤로가기로
  // 재진입할 때마다도) 로딩 화면을 띄우면 불필요한 깜빡임만 새로 생긴다.
  if (char.requires_premium && (!membershipLoaded || !freeSlotsLoaded)) {
    return <LoadingSplash />;
  }

  if (!canAccess) {
    return <LoadingSplash />;
  }

  return (
    <>
      <div className={styles.chatShell}>
        {/* 헤더 */}
        <header className={styles.chatHeader}>
          <Link href="/chat" className={styles.backBtn} aria-label={ui.chooseCaptain}>
            <span aria-hidden="true">‹</span>
            <span>{ui.chooseCaptain}</span>
          </Link>
          <div className={styles.charInfo}>
            <div className={styles.charAvatar}>
              <Image
                src={`/characters/${char.id}.png`}
                alt={`${ui.captain} ${char.name}`}
                width={40}
                height={40}
                className={styles.charAvatarImg}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className={styles.charEmojiBack}>{char.emoji}</span>
            </div>
            <div>
              <p className={styles.charName}>{language === "ko" ? `${char.name} ${ui.captain}` : `${ui.captain} ${char.name}`}</p>
              <p className={styles.charLocation}>✈️ {routeLabel}</p>
            </div>
          </div>
          <button
            className={styles.endBtn}
            onClick={() => setShowEndModal(true)}
            id="btn-session-end"
            aria-label="End session"
          >
            {t("endSessionBtn")}
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
          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowAi}`}
            >
              {msg.role === "assistant" && (
                <div className={styles.msgAvatar}>
                  <Image src={`/characters/${char.id}.png`} alt={char.name} width={32} height={32} className={styles.msgAvatarImg} />
                </div>
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

        {/* 무료 대화 남은 횟수 안내 */}
        {freeRemaining !== null && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: "0 0 6px" }}>
            {t("freeRemainingMsg", { n: String(freeRemaining) })} ·{" "}
            <Link href="/premium" style={{ color: "var(--red)", fontWeight: 700 }}>
              {t("unlimitedChatLink")}
            </Link>
          </p>
        )}

        {/* 입력창 */}
        <div className={styles.inputArea}>
          <button
            type="button"
            className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
            onClick={startListening}
            title={ui.voiceInput}
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
            placeholder={isListening ? ui.listening : ui.inputPlaceholder}
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
      {resumePending && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-resume-title">
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 id="modal-resume-title" className={styles.modalTitle}>
              {ui.resumeTitle}
            </h2>
            <p className={styles.modalSub}>
              {ui.resumeBody(char.name)}
            </p>
            <div className={styles.modalActions}>
              <button className={`btn btn-secondary btn-lg ${styles.pillBtn}`} onClick={handleFreshStart} id="btn-chat-fresh">
                {ui.freshStart}
              </button>
              <button className={`btn btn-primary btn-lg ${styles.pillBtn}`} onClick={handleResume} id="btn-chat-resume">
                {ui.resume}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 무료 대화 10회 소진 — 프리미엄 유도 */}
      {showPaywall && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-paywall-title"
          onClick={() => setShowPaywall(false)}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 id="modal-paywall-title" className={styles.modalTitle}>
              {t("paywallTitle")}
            </h2>
            <p className={styles.modalSub}>
              {t("paywallSub", { name: char.name })}
            </p>
            <div className={styles.modalActions}>
              <button
                className={`btn btn-secondary btn-lg ${styles.pillBtn}`}
                onClick={() => setShowPaywall(false)}
              >
                {t("notNowBtn")}
              </button>
              <Link href="/coins" className={`btn btn-primary btn-lg ${styles.pillBtn}`}>
                {t("coinShopTitle")}
              </Link>
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
              {ui.endTitle}
            </h2>
            <p className={styles.modalSub}>
              {ui.endBody}
            </p>
            <div className={styles.modalActions}>
              <button
                className={`btn btn-secondary btn-lg ${styles.pillBtn}`}
                onClick={() => setShowEndModal(false)}
                id="btn-keep-chatting"
              >
                {ui.keepChatting}
              </button>
              <button
                className={`btn btn-primary btn-lg ${styles.pillBtn}`}
                onClick={handleSessionEnd}
                id="btn-end-and-diary"
              >
                {ui.endAndDiary}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
