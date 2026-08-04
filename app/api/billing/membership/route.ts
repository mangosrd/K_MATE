// PUT /api/billing/membership → FastAPI PUT /user/{userId}/membership 프록시
// coins/character 프록시와 동일한 이유로 존재한다 — 실제 결제 검증 없이 프리미엄으로
// 즉시 승격시켜주는 임시 시뮬레이션 엔드포인트(코인/캐릭터보다도 가치가 큰 "전체 무료
// 해금"이라 더 위험함)를 브라우저가 직접 두드리지 못하게 막는다.
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.user_id) {
      return NextResponse.json({ success: false, message: "user_id required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/user/${encodeURIComponent(body.user_id)}/membership`, {
      method: "PUT",
      headers: { "X-Internal-Secret": INTERNAL_API_SECRET },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to reach billing service" }, { status: 502 });
  }
}
