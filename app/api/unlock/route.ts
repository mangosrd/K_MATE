// POST /api/unlock → Python FastAPI 프록시
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.userId && !body.user_id) {
      return NextResponse.json({ success: false, message: "user_id is required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/diary/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:  body.userId ?? body.user_id,
        diary_id: body.diaryId ?? body.diary_id,
        method:   body.method ?? "coin",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // 예전엔 백엔드 요청이 실패해도 { success: true, remainingCoins: 25 }로 무조건
      // "성공"이라고 거짓 응답을 보내고 있었다 — 코인 부족/잘못된 diary_id 등으로 실제로는
      // 해금이 안 됐는데도 화면에는 해금된 것처럼 보이고, 새로고침하면 다시 잠긴 채로
      // 돌아오는(코인만 안 깎인) 혼란스러운 상태가 됐다. 실패는 실패로 그대로 전달한다.
      return NextResponse.json({ success: false, message: data.detail ?? "Unlock failed" }, { status: res.status });
    }

    return NextResponse.json({
      success:        data.success,
      remainingCoins: data.remaining_coins,
      message:        data.message,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to reach unlock service" }, { status: 502 });
  }
}
