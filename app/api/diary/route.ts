// ============================================================
// POST /api/diary — 100자 한국어 일기 생성
// 세션 종료 조건 달성 시 비동기로 호출
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { llmChat } from "@/lib/llm/router";
import { getCharacterById } from "@/lib/db/mock";
import type { DiaryRequest, DiaryResponse } from "@/types/api";

async function loadCharacterPersona(characterId: string): Promise<string> {
  try {
    const data = await import(`@/content/characters/${characterId}.json`);
    return data.persona as string;
  } catch {
    return "";
  }
}

const DIARY_SYSTEM_PROMPT = `You are writing a personal diary entry as a Korean AI character.

Rules:
- Write EXACTLY around 100 Korean characters (한글 기준)
- Write in first person, from the character's perspective
- Reflect the character's personality and the memories/events provided
- Use natural, warm, slightly literary Korean (반말 or 해요체 — match character)
- Include a specific emotional moment from today
- Do NOT write in English. Korean only.
- Output ONLY the diary text. No explanation, no title, no date.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DiaryRequest;
    const { userId, characterId, sessionEvents } = body;

    if (!userId || !characterId) {
      return NextResponse.json(
        { error: "userId and characterId required" },
        { status: 400 }
      );
    }

    // 1. 캐릭터 페르소나 로드
    const persona = await loadCharacterPersona(characterId);

    const memories: { content: string }[] = []; // TODO: DB 조회로 교체

    const memorySummary = memories
      .slice(0, 5)
      .map((m) => m.content)
      .join("\n");

    const eventsText =
      sessionEvents && sessionEvents.length > 0
        ? sessionEvents.join("\n")
        : "오늘 사용자와 대화를 나눴다.";

    // 3. 일기 생성
    const diaryBody = await llmChat(
      [
        { role: "system", content: DIARY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Character context:\n${persona.substring(0, 300)}\n\nMemories:\n${memorySummary}\n\nToday's events:\n${eventsText}\n\nWrite a ~100 Korean character diary entry.`,
        },
      ],
      { temperature: 0.85, max_tokens: 256 }
    );

    // 4. DB 저장 (목 모드: 로그만)
    const diaryId = `diary-${Date.now()}`;
    console.log("[/api/diary] Generated diary:", diaryBody);
    // TODO: Supabase 연결 시
    // await supabase.from("diary_entries").insert({ ... unlocked: false })

    const response: DiaryResponse = {
      diaryId,
      bodyKo: diaryBody.trim(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/diary] error:", error);
    return NextResponse.json({ error: "Failed to generate diary" }, { status: 500 });
  }
}
