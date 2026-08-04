// POST /api/billing/character → FastAPI /billing/web-character-dev 프록시
// coins 프록시(app/api/billing/coins/route.ts)와 동일한 이유로 존재한다 — 실제 결제
// 검증 없이 캐릭터를 잠금해제해주는 임시 시뮬레이션 엔드포인트를 브라우저가 직접
// 두드리지 못하게, Next.js 서버만 아는 내부 비밀키를 붙여서 프록시로만 호출한다.
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.user_id || !body.product_id || !body.purchase_token) {
      return NextResponse.json({ success: false, message: "user_id, product_id, purchase_token required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/billing/web-character-dev`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        user_id: body.user_id,
        product_id: body.product_id,
        purchase_token: body.purchase_token,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to reach billing service" }, { status: 502 });
  }
}
