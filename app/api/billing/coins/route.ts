// POST /api/billing/coins → FastAPI /billing/web-coins-dev 프록시
//
// 이 백엔드 엔드포인트는 포트원 연동 전까지 실제 결제 검증 없이 코인을 지급하는
// 임시 시뮬레이션이라, 아무나 user_id만 알면 직접 호출해서 무료로 코인을 받아갈 수
// 있었다(라이브 테스트로 재현·확인함). 브라우저 JS가 백엔드를 직접 호출하면 그 URL과
// 파라미터가 그대로 노출되므로, Next.js 서버(이 라우트)만 아는 내부 비밀키를 붙여서
// 프록시로만 호출하게 한다. 포트원 실연동 시 이 라우트와 백엔드 쪽 엔드포인트를
// 통째로 실제 결제 검증 로직으로 교체해야 한다.
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.user_id || !body.product_id || !body.purchase_token) {
      return NextResponse.json({ success: false, message: "user_id, product_id, purchase_token required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/billing/web-coins-dev`, {
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
