// ============================================================
// POST /api/memory — 세션 요약 → 기억 추출·저장
// 세션 종료 시 /api/chat 내부 또는 클라이언트에서 호출
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { extractMemories } from "@/lib/memory/extract";
import type { MemoryRequest, MemoryResponse } from "@/types/api";
import type { Memory } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MemoryRequest;
    const { userId, characterId, sessionHistory } = body;

    if (!userId || !characterId || !sessionHistory) {
      return NextResponse.json(
        { error: "userId, characterId, sessionHistory required" },
        { status: 400 }
      );
    }

    // 1. 기억 추출
    const extracted = await extractMemories(sessionHistory);

    if (extracted.length === 0) {
      return NextResponse.json({ savedMemories: [] } satisfies MemoryResponse);
    }

    // 2. DB 저장 (목 모드: 로그만 출력, Supabase 연결 시 실제 insert로 교체)
    const savedMemories: Memory[] = extracted.map((m, i) => ({
      id: `mem-${Date.now()}-${i}`,
      user_id: userId,
      character_id: characterId,
      type: m.type,
      content: m.content,
      created_at: new Date().toISOString(),
    }));

    console.log("[/api/memory] Saved memories:", savedMemories);
    // TODO: Supabase 연결 시
    // await supabase.from("memories").insert(savedMemories);

    return NextResponse.json({ savedMemories } satisfies MemoryResponse);
  } catch (error) {
    console.error("[/api/memory] error:", error);
    return NextResponse.json({ error: "Failed to extract memories" }, { status: 500 });
  }
}
