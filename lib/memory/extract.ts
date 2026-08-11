// ============================================================
// 기억 추출 — 세션 요약 → 기억 JSON 추출
// 세션 종료 시 /api/memory에서 호출됨
// ============================================================

import { llmChat } from "@/lib/llm/router";
import type { ChatMessage } from "@/types/api";
import type { MemoryType } from "@/types/database";

export interface ExtractedMemory {
  type: MemoryType;
  content: string;
}

const EXTRACT_PROMPT = `You are a memory extraction assistant for a Korean language learning app.

Analyze the conversation and extract 2–4 important memories about the USER (not the AI character).
Focus on:
- PREFERENCE: things the user likes/dislikes (food, places, activities)
- EMOTION: emotional moments, memorable exchanges, reactions
- FACT: knowledge the user gained about Korea / Korean
- PROGRESS: Korean words/phrases the user practiced or learned

Output ONLY valid JSON array. No explanation. Format:
[
  { "type": "preference", "content": "사용자가 떡볶이를 좋아한다고 했다." },
  { "type": "emotion", "content": "경복궁에서 한복을 보고 사용자가 매우 흥분했다." }
]

Rules:
- Write content in Korean
- Max 4 memories
- Focus on emotionally significant or practically useful memories
- Skip generic exchanges`;

/**
 * 세션 대화 히스토리에서 기억 추출
 */
export async function extractMemories(
  sessionHistory: ChatMessage[]
): Promise<ExtractedMemory[]> {
  if (sessionHistory.length < 2) return [];

  const conversationText = sessionHistory
    .map((m) => `${m.role === "user" ? "User" : "Character"}: ${m.content}`)
    .join("\n");

  const response = await llmChat(
    [
      { role: "system", content: EXTRACT_PROMPT },
      {
        role: "user",
        content: `Extract memories from this conversation:\n\n${conversationText}`,
      },
    ],
    { temperature: 0.3, max_tokens: 512 }
  );

  try {
    // JSON 블록 추출 (LLM이 가끔 ```json ``` 감싸는 경우 처리)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as ExtractedMemory[];
    // 타입 검증
    const validTypes: MemoryType[] = ["fact", "preference", "progress", "emotion"];
    return parsed.filter(
      (m) =>
        validTypes.includes(m.type as MemoryType) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= 500
    ).slice(0, 4);
  } catch {
    console.error("Memory extraction parse error:", response);
    return [];
  }
}
