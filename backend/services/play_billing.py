"""
Google Play 인앱결제(구독) 서버 검증
==================================
안드로이드 앱(Play 스토어 배포)에서 발생한 결제는 클라이언트가 스스로 "결제됐다"고
말하는 걸 그대로 믿으면 안 되고, Google Play Developer API로 서버가 직접 영수증
(purchase token)을 조회해서 실제로 유효한 결제인지 확인해야 한다.

필요한 사전 준비 (Play Console에서 직접 해야 함, 코드로는 불가):
1. Google Cloud 프로젝트에서 "Android Publisher API" 활성화
2. 서비스 계정 생성 후 JSON 키 발급
3. Play Console → 설정 → API 액세스에서 그 서비스 계정을 "본인 앱 관리자"로 연결
4. 발급받은 JSON 키 파일 경로를 .env의 GOOGLE_PLAY_SERVICE_ACCOUNT_FILE에 지정
5. Play Console에서 구독 상품(subscriptionId) 등록 — 예: "kmate_premium_monthly"
"""
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build
from database import get_settings

settings = get_settings()

_ANDROID_PUBLISHER_SCOPE = ["https://www.googleapis.com/auth/androidpublisher"]

_service = None


def _get_play_service():
    global _service
    if _service is None:
        if not settings.google_play_service_account_file:
            raise RuntimeError(
                "GOOGLE_PLAY_SERVICE_ACCOUNT_FILE이 설정되지 않았습니다. "
                "Play Console에서 서비스 계정 JSON 키를 발급받아 .env에 경로를 지정하세요."
            )
        creds = service_account.Credentials.from_service_account_file(
            settings.google_play_service_account_file, scopes=_ANDROID_PUBLISHER_SCOPE
        )
        _service = build("androidpublisher", "v3", credentials=creds)
    return _service


def verify_subscription_purchase(product_id: str, purchase_token: str) -> bool:
    """구독 결제가 실제로 유효한지 Google Play Developer API로 확인한다.

    paymentState: 0=대기, 1=결제완료, 2=무료체험, 3=보류(유예) 중 1 또는 2만 유효로 본다.
    만료 시각(expiryTimeMillis)이 아직 지나지 않아야 한다.
    """
    service = _get_play_service()
    result = (
        service.purchases()
        .subscriptions()
        .get(
            packageName=settings.google_play_package_name,
            subscriptionId=product_id,
            token=purchase_token,
        )
        .execute()
    )

    payment_state = result.get("paymentState")
    expiry_ms = int(result.get("expiryTimeMillis", 0))
    now_ms = int(time.time() * 1000)
    is_valid = payment_state in (1, 2) and expiry_ms > now_ms

    # Google 정책상 구독은 결제 후 3일 이내에 acknowledge하지 않으면 자동 환불된다.
    return is_valid


def acknowledge_subscription_purchase(product_id: str, purchase_token: str) -> None:
    """Acknowledge only after the entitlement has been committed locally."""
    service = _get_play_service()
    result = (
        service.purchases()
        .subscriptions()
        .get(
            packageName=settings.google_play_package_name,
            subscriptionId=product_id,
            token=purchase_token,
        )
        .execute()
    )
    if result.get("acknowledgementState") == 0:
        service.purchases().subscriptions().acknowledge(
            packageName=settings.google_play_package_name,
            subscriptionId=product_id,
            token=purchase_token,
            body={},
        ).execute()


def verify_product_purchase(product_id: str, purchase_token: str) -> bool:
    """코인팩 같은 소모성(consumable) 단건 상품 결제를 확인한다.

    구독과 달리 코인팩은 "products" API로 조회한다. purchaseState: 0=결제완료,
    1=취소됨, 2=대기중 — 0만 유효로 본다. 소모성 상품은 결제 확인 후 반드시
    consume()을 호출해줘야 유저가 같은 상품을 또 구매할 수 있다(안 하면 Play가
    "이미 소유한 상품"으로 취급해서 재구매를 막아버린다).
    """
    service = _get_play_service()
    result = (
        service.purchases()
        .products()
        .get(
            packageName=settings.google_play_package_name,
            productId=product_id,
            token=purchase_token,
        )
        .execute()
    )

    return result.get("purchaseState") == 0


def consume_product_purchase(product_id: str, purchase_token: str) -> None:
    """Finalize a consumable only after its coins are committed locally."""
    service = _get_play_service()
    result = (
        service.purchases()
        .products()
        .get(
            packageName=settings.google_play_package_name,
            productId=product_id,
            token=purchase_token,
        )
        .execute()
    )
    # Google may have consumed the item even if our following DB status update
    # failed. Treat an already-consumed receipt as successfully finalized so a
    # client retry can repair the local status instead of getting stuck.
    if result.get("consumptionState") == 1:
        return
    service.purchases().products().consume(
        packageName=settings.google_play_package_name,
        productId=product_id,
        token=purchase_token,
    ).execute()


def acknowledge_product_purchase(product_id: str, purchase_token: str) -> None:
    """Finalize a non-consumable without making it purchasable again."""
    service = _get_play_service()
    result = (
        service.purchases()
        .products()
        .get(
            packageName=settings.google_play_package_name,
            productId=product_id,
            token=purchase_token,
        )
        .execute()
    )
    if result.get("acknowledgementState") == 0:
        service.purchases().products().acknowledge(
            packageName=settings.google_play_package_name,
            productId=product_id,
            token=purchase_token,
            body={},
        ).execute()
