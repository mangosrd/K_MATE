// POST /api/unlock → Python FastAPI 프록시
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/diary/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:  body.userId ?? body.user_id ?? "user-001",
        diary_id: body.diaryId ?? body.diary_id,
        method:   body.method ?? "coin",
      }),
    });

    if (!res.ok) {
      // 백엔드 미연결 시 mock 처리
      return NextResponse.json({ success: true, remainingCoins: 25 });
    }

    const data = await res.json();
    return NextResponse.json({
      success:        data.success,
      remainingCoins: data.remaining_coins,
      message:        data.message,
    });
  } catch {
    // 백엔드 미연결 fallback
    return NextResponse.json({ success: true, remainingCoins: 25 });
  }
}
