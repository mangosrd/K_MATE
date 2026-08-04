"""
포트원(PortOne) V2 결제 서버 검증
==============================
Google Play 검증(services/play_billing.py)과 같은 이유 — 클라이언트가 스스로
"결제됐다"고 보내는 정보(금액 포함)를 그대로 믿으면 위변조로 실제보다 싼 금액을
결제한 척하거나 아예 결제 없이 지급받을 수 있다. 브라우저에서 결제창을 띄운 뒤에는
반드시 서버가 포트원 API로 그 결제 건을 직접 조회해서, 실제로 완료됐는지+금액이
맞는지 확인한 뒤에만 코인/캐릭터/프리미엄을 지급해야 한다.

필요한 사전 준비 (포트원 관리자콘솔에서 직접 해야 함, 코드로는 불가):
1. [결제연동] 탭에서 V2 API Secret 발급 → .env의 PORTONE_API_SECRET
2. [연동 관리] > [채널 관리]에서 PG(KG이니시스) 채널 추가 → 채널 키를
   .env.local의 NEXT_PUBLIC_PORTONE_CHANNEL_KEY
3. 상점 아이디는 콘솔 상단에서 확인 → .env.local의 NEXT_PUBLIC_PORTONE_STORE_ID
4. (실결제 전환 시) KG이니시스와 실계약 완료 — 테스트 상점 그대로 두면 실제 결제가
   안 되거나 예상치 못한 응답이 온다.
"""
import httpx
from database import get_settings

PORTONE_API_BASE = "https://api.portone.io"


async def get_payment(payment_id: str) -> dict | None:
    """결제 단건 조회 — GET /payments/{paymentId}. 존재하지 않는 결제 건이면(잘못된/위조된
    payment_id 등) None을 반환한다 — 이건 서버 오류가 아니라 "검증 실패"의 정상적인
    한 경우라서, 예외로 던지면 안 되고 verify_payment()가 False로 처리할 수 있게 한다.
    """
    settings = get_settings()
    if not settings.portone_api_secret:
        raise RuntimeError(
            "PORTONE_API_SECRET이 설정되지 않았습니다. 포트원 관리자콘솔의 "
            "[결제연동] 탭에서 V2 API Secret을 발급받아 .env에 지정하세요."
        )

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.get(
            f"{PORTONE_API_BASE}/payments/{payment_id}",
            headers={"Authorization": f"PortOne {settings.portone_api_secret}"},
        )
        if res.status_code == 404:
            return None
        res.raise_for_status()
        return res.json()


async def verify_payment(payment_id: str, expected_amount: int) -> bool:
    """결제가 실제로 완료(PAID)됐고, 결제 총액이 우리가 상품 가격표에서 기대하는
    금액과 정확히 일치하는지 확인한다. 셋 중 하나라도 안 맞으면 False.
    """
    data = await get_payment(payment_id)
    if data is None or data.get("status") != "PAID":
        return False
    total = (data.get("amount") or {}).get("total")
    return total == expected_amount
