// ============================================================
// POST /api/memory — 세션 요약 → 기억 추출 (LLM) → 백엔드(MySQL)에 저장
// 세션 종료 시 클라이언트(채팅 화면)에서 호출
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { extractMemories } from "@/lib/memory/extract";
import type { MemoryRequest, MemoryResponse } from "@/types/api";
import type { Memory } from "@/types/database";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

    // 1. 기억 추출 (LLM)
    const extracted = await extractMemories(sessionHistory);

    if (extracted.length === 0) {
      return NextResponse.json({ savedMemories: [] } satisfies MemoryResponse);
    }

    // 2. 백엔드(FastAPI+MySQL)에 영구 저장 시도 — 백엔드가 꺼져 있어도 화면 흐름은 막지 않는다
    let savedMemories: Memory[] = extracted.map((m, i) => ({
      id: `local-mem-${Date.now()}-${i}`,
      user_id: userId,
      character_id: characterId,
      type: m.type,
      content: m.content,
      created_at: new Date().toISOString(),
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(req.headers.get("authorization")
            ? { Authorization: req.headers.get("authorization") as string }
            : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          character_id: characterId,
          memories: extracted.map((m) => ({ type: m.type, content: m.content })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        savedMemories = data.saved_memories.map((m: any) => ({
          id: m.id,
          user_id: userId,
          character_id: m.character_id,
          type: m.type,
          content: m.content,
          created_at: m.created_at,
        }));
      }
    } catch {
      // 백엔드 미연결 — 추출된 기억은 반환하되 영구 저장은 되지 않음
    }

    return NextResponse.json({ savedMemories } satisfies MemoryResponse);
  } catch (error) {
    console.error("[/api/memory] error:", error);
    return NextResponse.json({ error: "Failed to extract memories" }, { status: 500 });
  }
}
