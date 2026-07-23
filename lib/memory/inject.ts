// ============================================================
// 기억 주입 — 시스템 프롬프트 조립
// 캐릭터 페르소나 + 관련 기억 + 장소 사실 → 완성된 시스템 프롬프트
// ============================================================

import type { Memory } from "@/types/database";

interface InjectOptions {
  persona: string;
  memories: Memory[];
  placeFacts?: string[];
  userLanguage?: string;
}

/**
 * 시스템 프롬프트 조립
 * 순서: 페르소나 → 기억 (감정 층 우선) → 장소 사실 → 대화 가이드
 */
export function buildSystemPrompt(options: InjectOptions): string {
  const { persona, memories, placeFacts = [], userLanguage = "en" } = options;

  // 기억을 타입별로 분리 (감정 층 우선 정렬)
  const emotionMemories = memories.filter((m) => m.type === "emotion");
  const preferenceMemories = memories.filter((m) => m.type === "preference");
  const factMemories = memories.filter((m) => m.type === "fact");
  const progressMemories = memories.filter((m) => m.type === "progress");

  const prioritizedMemories = [
    ...emotionMemories,
    ...preferenceMemories,
    ...factMemories,
    ...progressMemories,
  ];

  // 기억 섹션 조립
  let memoriesSection = "";
  if (prioritizedMemories.length > 0) {
    memoriesSection = `
[MEMORIES — Things you remember about this user]
${prioritizedMemories
  .slice(0, 8) // 최대 8개 (토큰 절약)
  .map((m) => `- [${m.type.toUpperCase()}] ${m.content}`)
  .join("\n")}

When a memory is relevant to the current conversation, weave it in naturally. Don't list all memories — pick the ONE most fitting one.`;
  }

  // 장소 사실 섹션
  let factsSection = "";
  if (placeFacts.length > 0) {
    factsSection = `
[PLACE FACTS — Only use these facts about this location. Do not fabricate.]
${placeFacts.map((f) => `- ${f}`).join("\n")}`;
  }

  // 언어 가이드
  const languageGuide = `
[LANGUAGE GUIDE]
The user's native language is: ${userLanguage.toUpperCase()}
- Respond in the user's language by default.
- If the user is trying to speak Korean, respond in Korean and gently correct any mistakes.
- Keep responses concise: 2–4 sentences in a chat context.`;

  return `${persona}${memoriesSection}${factsSection}${languageGuide}`;
}

/**
 * 되짚기(Callback) — 현재 맥락에 가장 맞는 기억 1개를 선택
 * 실제 서비스에서는 임베딩 유사도 검색으로 교체 가능
 */
export function pickCallbackMemory(
  memories: Memory[],
  currentMessage: string
): Memory | null {
  // MVP: 감정 층 기억을 우선으로 최신 1개 반환
  const emotionMemories = memories.filter((m) => m.type === "emotion");
  if (emotionMemories.length > 0) {
    // 현재 메시지에 키워드가 겹치는 기억 우선
    const matched = emotionMemories.find((m) =>
      currentMessage
        .toLowerCase()
        .split(" ")
        .some((word) => word.length > 3 && m.content.toLowerCase().includes(word))
    );
    return matched ?? emotionMemories[emotionMemories.length - 1];
  }
  const preferenceMemories = memories.filter((m) => m.type === "preference");
  return preferenceMemories[preferenceMemories.length - 1] ?? null;
}
