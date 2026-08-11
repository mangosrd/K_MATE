import { NextRequest, NextResponse } from "next/server";
import { extractMemories } from "@/lib/memory/extract";
import type { MemoryRequest, MemoryResponse } from "@/types/api";
import type { Memory } from "@/types/database";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_ITEM_CHARS = 2000;
const MAX_HISTORY_TOTAL_CHARS = 12000;

type BackendMemory = Pick<Memory, "id" | "character_id" | "type" | "content" | "created_at">;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MemoryRequest;
    const { userId, characterId, sessionHistory } = body;
    const authorization = req.headers.get("authorization");

    if (!userId || !characterId || !Array.isArray(sessionHistory)) {
      return NextResponse.json(
        { error: "userId, characterId, sessionHistory required" },
        { status: 400 }
      );
    }
    if (!authorization) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const boundedHistory = sessionHistory.slice(-MAX_HISTORY_ITEMS);
    const totalChars = boundedHistory.reduce((sum, item) => sum + item.content.length, 0);
    if (
      boundedHistory.some((item) => item.content.length > MAX_HISTORY_ITEM_CHARS) ||
      totalChars > MAX_HISTORY_TOTAL_CHARS
    ) {
      return NextResponse.json({ error: "Conversation history is too long" }, { status: 413 });
    }

    // Verify the signed-in account before spending a Gemini request.
    const authCheck = await fetch(`${BACKEND_URL}/user/${encodeURIComponent(userId)}`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    if (!authCheck.ok) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: authCheck.status === 403 ? 403 : 401 }
      );
    }

    const extracted = await extractMemories(boundedHistory);
    if (extracted.length === 0) {
      return NextResponse.json({ savedMemories: [] } satisfies MemoryResponse);
    }

    const response = await fetch(`${BACKEND_URL}/memory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        user_id: userId,
        character_id: characterId,
        memories: extracted.map((memory) => ({
          type: memory.type,
          content: memory.content,
        })),
      }),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to save memories" }, { status: response.status });
    }

    const data = await response.json();
    const savedMemories: Memory[] = data.saved_memories.map((memory: BackendMemory) => ({
      id: memory.id,
      user_id: userId,
      character_id: memory.character_id,
      type: memory.type,
      content: memory.content,
      created_at: memory.created_at,
    }));

    return NextResponse.json({ savedMemories } satisfies MemoryResponse);
  } catch (error) {
    console.error("[/api/memory] error:", error);
    return NextResponse.json({ error: "Failed to extract memories" }, { status: 500 });
  }
}
