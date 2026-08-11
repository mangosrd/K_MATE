"""
결제 검증 라우터 — 안드로이드 앱(Play 스토어)의 Google Play 인앱결제 전용.
웹의 국내 결제(포트원)는 별도 라우터로 붙일 예정이라 여기서는 다루지 않는다.
"""
import hashlib
import uuid

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db, get_settings
from schemas.schemas import (
    AndroidPurchaseVerifyRequest, PurchaseVerifyResponse, CoinPack, CoinPurchaseResponse,
    CharacterPack, CharacterPurchaseResponse, PortonePaymentVerifyRequest,
    WatchAdRequest, WatchAdResponse,
)
from models.models import User, Purchase, Economy
from services.membership import activate_monthly_premium
from services.play_billing import (
    acknowledge_product_purchase,
    acknowledge_subscription_purchase,
    consume_product_purchase,
    verify_product_purchase,
    verify_subscription_purchase,
)
from services.portone import verify_payment
from services.ads import grant_ad_reward, AD_COIN_REWARD
from services.session_auth import require_current_user, require_same_user

# 프리미엄 구독 가격 — app/premium/PremiumView.tsx의 표시 가격과 반드시 일치해야 한다
# (여기 값이 실제 결제 검증 기준 금액이라, 프론트 표시와 어긋나면 결제가 거부된다).
PREMIUM_PRICE_KRW = 4900
PREMIUM_WELCOME_COINS = 500

router = APIRouter(prefix="/billing", tags=["billing"])


def _validate_existing_purchase(
    purchase: Purchase, *, user_id: str, product_id: str
) -> None:
    if purchase.user_id != user_id or purchase.product_id != product_id:
        raise HTTPException(
            status_code=409,
            detail="This purchase receipt is already linked to another account or product.",
        )


def _finalize_google_purchase(db: Session, purchase: Purchase, kind: str) -> None:
    """Notify Google only after the local entitlement and ledger are durable."""
    if purchase.status == "finalized":
        return
    if kind == "subscription":
        acknowledge_subscription_purchase(purchase.product_id, purchase.purchase_token)
    elif kind == "consumable":
        consume_product_purchase(purchase.product_id, purchase.purchase_token)
    elif kind == "non_consumable":
        acknowledge_product_purchase(purchase.product_id, purchase.purchase_token)
    else:
        raise ValueError(f"Unknown Google Play purchase kind: {kind}")
    purchase.status = "finalized"
    db.commit()


def _receipt_reference(purchase_token: str) -> str:
    """Return a safe, fixed-length ledger reference without exposing the receipt."""
    return hashlib.sha256(purchase_token.encode("utf-8")).hexdigest()


def require_internal_secret(x_internal_secret: str | None = Header(default=None)):
    """web-coins-dev / web-character-dev 전용 게이트.

    이 두 엔드포인트는 실제 결제 검증 없이 코인/캐릭터를 지급하는 임시 시뮬레이션이라,
    아무나 user_id만 알면(자기 자신의 계정이어도) 직접 호출해서 무제한으로 공짜 지급을
    받아갈 수 있었다(라이브 테스트로 직접 재현·확인함). Next.js 서버(프론트)만 아는
    비밀키를 헤더로 요구해서, 브라우저에서 API를 직접 두드리는 걸 막는다 — 근본적인
    "요청의 user_id가 진짜 그 사람인지" 인증은 아니지만, 최소한 결제 절차를 거치지 않고
    이 엔드포인트를 직접 호출하는 가장 쉬운 악용 경로는 막는다.
    """
    settings = get_settings()
    if not settings.internal_api_secret or x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

# 코인팩 — 일기(5코인)/사진첩(15코인) 언락 단가 기준으로 산정.
# 실제 가격은 Play Console에 상품 등록할 때도 여기와 동일하게 맞춰야 한다.
COIN_PACKS: dict[str, dict] = {
    "kmate_coins_small":  {"coins": 50,  "price_krw": 1200, "label": "코인 50개"},
    "kmate_coins_medium": {"coins": 180, "price_krw": 3300, "label": "코인 180개 (30개 보너스)"},
    "kmate_coins_large":  {"coins": 500, "price_krw": 6600, "label": "코인 500개 (100개 보너스)"},
}

# 캐릭터 개별 잠금해제 — 구독(₩4,900/월) 부담스러운 유저를 위한 1회성 소액 결제.
# 프리미엄 전용 캐릭터(sunwoo/sangwoo/yongwoo)만 대상. 구매하면 canAccessCharacter가
# 이미 지원하는 free_char_slots 배열에 캐릭터를 추가하는 방식이라 별도 접근제어 로직이
# 필요 없다 — kyuhyun/haneul이 원래 이 배열로 무료 제공되던 것과 완전히 같은 메커니즘.
CHARACTER_PACKS: dict[str, dict] = {
    "kmate_character_sunwoo":  {"character_id": "sunwoo",  "price_krw": 2900, "label": "차선우 기장님 잠금해제"},
    "kmate_character_sangwoo": {"character_id": "sangwoo", "price_krw": 2900, "label": "천상우 기장님 잠금해제"},
    "kmate_character_yongwoo": {"character_id": "yongwoo", "price_krw": 2900, "label": "권용우 기장님 잠금해제"},
}


@router.post("/verify-android", response_model=PurchaseVerifyResponse)
def verify_android_purchase(req: AndroidPurchaseVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """안드로이드 앱에서 발생한 Google Play 구독 결제를 서버에서 검증하고,
    유효하면 프리미엄 멤버십으로 승격한다.
    """
    if req.product_id != "kmate_premium_monthly":
        raise HTTPException(status_code=400, detail="Unknown premium subscription product.")

    user = db.query(User).filter(User.id == req.user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 같은 영수증(purchase_token)이 이미 처리된 적 있으면 재검증 없이 바로 성공 응답
    # (클라이언트가 네트워크 재시도 등으로 같은 요청을 중복 전송해도 안전하게 처리)
    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "google_play", Purchase.purchase_token == req.purchase_token)
        .first()
    )
    if existing:
        _validate_existing_purchase(existing, user_id=req.user_id, product_id=req.product_id)
        try:
            _finalize_google_purchase(db, existing, "subscription")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")
        return PurchaseVerifyResponse(
            success=True, membership=user.membership, message="이미 처리된 결제입니다."
        )

    try:
        is_valid = verify_subscription_purchase(req.product_id, req.purchase_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play 결제 검증 실패: {e}")

    if not is_valid:
        return PurchaseVerifyResponse(
            success=False, membership=user.membership, message="유효하지 않은 결제입니다."
        )

    purchase = _activate_premium_and_grant_welcome_coins(
        db, user, "google_play", req.product_id, req.purchase_token
    )
    try:
        _finalize_google_purchase(db, purchase, "subscription")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")

    return PurchaseVerifyResponse(success=True, membership=user.membership, message="결제가 확인되었습니다.")


@router.get("/coin-packs", response_model=list[CoinPack])
def list_coin_packs():
    """코인 상점에 보여줄 상품 목록"""
    return [
        CoinPack(product_id=pid, coins=p["coins"], price_krw=p["price_krw"], label=p["label"])
        for pid, p in COIN_PACKS.items()
    ]


def _grant_coins(
    db: Session, user_id: str, coins: int, *, reference_id: str | None = None
) -> int:
    """유저 코인 지갑에 코인을 더해준다. 지갑이 없으면 새로 만든다. 반환값은 지급 후 총 코인.

    with_for_update()로 행 잠금을 걸어서, 같은 유저가 거의 동시에 결제 2건을 완료해도
    (예: 두 기기/두 탭에서 동시 결제) 한쪽 지급이 다른 쪽에 덮어써지지 않게 한다 —
    단순 "읽고 더해서 쓰기"는 두 요청이 같은 시점의 값을 읽으면 한 건이 유실될 수 있다.
    """
    economy = (
        db.query(Economy)
        .filter(Economy.user_id == user_id)
        .with_for_update()
        .first()
    )
    if not economy:
        economy = Economy(id=str(uuid.uuid4()), user_id=user_id, coins=0)
        db.add(economy)
        db.flush()
    from services.wallet import change_coins
    economy = change_coins(
        db,
        user_id,
        coins,
        "purchase_reward",
        reference_type="billing",
        reference_id=reference_id,
    )
    return economy.coins


def _activate_premium_and_grant_welcome_coins(
    db: Session, user: User, platform: str, product_id: str, purchase_token: str
) -> Purchase:
    """Apply a verified one-month premium purchase exactly once with its coin reward."""
    activate_monthly_premium(db, user, PREMIUM_PRICE_KRW)
    _grant_coins(
        db,
        user.id,
        PREMIUM_WELCOME_COINS,
        reference_id=_receipt_reference(purchase_token),
    )
    purchase = Purchase(
        id=str(uuid.uuid4()),
        user_id=user.id,
        platform=platform,
        product_id=product_id,
        purchase_token=purchase_token,
        status="verified",
    )
    db.add(purchase)
    db.commit()
    return purchase


@router.post("/verify-android-coins", response_model=CoinPurchaseResponse)
def verify_android_coin_purchase(req: AndroidPurchaseVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """안드로이드 앱에서 발생한 Google Play 코인팩(소모성 상품) 결제를 검증하고 코인을 지급한다."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = COIN_PACKS.get(req.product_id)
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 코인팩: {req.product_id}")

    # 소모성 상품이라 같은 상품을 여러 번 살 수 있지만, 같은 영수증(purchase_token)이
    # 두 번 들어오면(네트워크 재시도 등) 중복 지급하지 않는다.
    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "google_play", Purchase.purchase_token == req.purchase_token)
        .first()
    )
    if existing:
        _validate_existing_purchase(existing, user_id=req.user_id, product_id=req.product_id)
        try:
            _finalize_google_purchase(db, existing, "consumable")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")
        economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
        return CoinPurchaseResponse(
            success=True, coins_granted=0, total_coins=economy.coins if economy else 0,
            message="이미 처리된 결제입니다.",
        )

    try:
        is_valid = verify_product_purchase(req.product_id, req.purchase_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play 결제 검증 실패: {e}")

    if not is_valid:
        economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
        return CoinPurchaseResponse(
            success=False, coins_granted=0, total_coins=economy.coins if economy else 0,
            message="유효하지 않은 결제입니다.",
        )

    total = _grant_coins(
        db,
        req.user_id,
        pack["coins"],
        reference_id=_receipt_reference(req.purchase_token),
    )
    purchase = Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="google_play",
        product_id=req.product_id,
        purchase_token=req.purchase_token,
        status="verified",
    )
    db.add(purchase)
    db.commit()
    try:
        _finalize_google_purchase(db, purchase, "consumable")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")

    return CoinPurchaseResponse(
        success=True, coins_granted=pack["coins"], total_coins=total,
        message=f"{pack['coins']}코인이 지급되었습니다.",
    )


@router.post("/web-coins-dev", response_model=CoinPurchaseResponse, dependencies=[Depends(require_internal_secret)])
def web_coin_purchase_dev(req: AndroidPurchaseVerifyRequest, db: Session = Depends(get_db)):
    """웹(포트원 연동 전) 코인 구매 임시 시뮬레이션 — 프리미엄 구독의 웹 시뮬레이션과
    동일한 목적. 실제 결제 검증 없이 코인을 바로 지급한다. 포트원 붙이면 이 엔드포인트를
    실제 결제 검증 로직으로 교체해야 한다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = COIN_PACKS.get(req.product_id)
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 코인팩: {req.product_id}")

    # verify-android-coins와 동일하게 같은 영수증(purchase_token)이 두 번 들어오면(네트워크
    # 재시도, 중복 클릭 등) 중복 지급하지 않는다 — 이 체크가 없어서 실제로 같은 토큰을 두 번
    # 보내면 코인이 매번 다시 지급되는 버그가 있었다(라이브 테스트로 발견).
    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "web_dev", Purchase.purchase_token == req.purchase_token)
        .first()
    )
    if existing:
        economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
        return CoinPurchaseResponse(
            success=True, coins_granted=0, total_coins=economy.coins if economy else 0,
            message="이미 처리된 결제입니다.",
        )

    total = _grant_coins(db, req.user_id, pack["coins"])
    db.add(Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="web_dev",
        product_id=req.product_id,
        purchase_token=req.purchase_token,
        status="verified",
    ))
    db.commit()

    return CoinPurchaseResponse(
        success=True, coins_granted=pack["coins"], total_coins=total,
        message=f"{pack['coins']}코인이 지급되었습니다. (웹 결제 시뮬레이션)",
    )


@router.post("/verify-portone-coins", response_model=CoinPurchaseResponse)
async def verify_portone_coin_purchase(req: PortonePaymentVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    raise HTTPException(status_code=410, detail="PortOne payments are no longer supported. Use Google Play Billing.")
    """웹(포트원 KG이니시스)에서 발생한 코인팩 결제를 서버가 직접 조회해서 검증하고 지급한다.
    payment_id를 영수증(purchase_token 자리)으로 써서 중복 지급 방지 로직을 그대로 재사용한다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = COIN_PACKS.get(req.product_id or "")
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 코인팩: {req.product_id}")

    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "portone", Purchase.purchase_token == req.payment_id)
        .first()
    )
    if existing:
        economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
        return CoinPurchaseResponse(
            success=True, coins_granted=0, total_coins=economy.coins if economy else 0,
            message="이미 처리된 결제입니다.",
        )

    try:
        is_valid = await verify_payment(req.payment_id, pack["price_krw"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"포트원 결제 검증 실패: {e}")

    if not is_valid:
        economy = db.query(Economy).filter(Economy.user_id == req.user_id).first()
        return CoinPurchaseResponse(
            success=False, coins_granted=0, total_coins=economy.coins if economy else 0,
            message="유효하지 않은 결제입니다.",
        )

    total = _grant_coins(db, req.user_id, pack["coins"])
    db.add(Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="portone",
        product_id=req.product_id,
        purchase_token=req.payment_id,
        status="verified",
    ))
    db.commit()

    return CoinPurchaseResponse(
        success=True, coins_granted=pack["coins"], total_coins=total,
        message=f"{pack['coins']}코인이 지급되었습니다.",
    )


@router.get("/character-packs", response_model=list[CharacterPack])
def list_character_packs():
    """캐릭터 개별 잠금해제 상점에 보여줄 상품 목록"""
    return [
        CharacterPack(
            product_id=pid, character_id=p["character_id"],
            price_krw=p["price_krw"], label=p["label"],
        )
        for pid, p in CHARACTER_PACKS.items()
    ]


def _grant_character(db: Session, user_id: str, character_id: str) -> list[str]:
    """free_char_slots에 캐릭터를 추가한다. 이미 있으면 그대로 둔다(중복 방지).

    with_for_update로 잠가서, 코인/free_chat_count와 같은 이유로 동시 요청에 의한
    갱신 유실을 막는다. JSON 컬럼은 리스트를 그 자리에서 append하면 SQLAlchemy가 값이
    바뀐 걸 감지하지 못해 DB에 반영이 안 될 수 있어서, 새 리스트를 만들어 통째로
    재할당한다.
    """
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current = list(user.free_char_slots or [])
    if character_id not in current:
        user.free_char_slots = current + [character_id]
        db.flush()
    return user.free_char_slots


@router.post("/verify-android-character", response_model=CharacterPurchaseResponse)
def verify_android_character_purchase(req: AndroidPurchaseVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    """안드로이드 앱에서 발생한 Google Play 캐릭터 개별 잠금해제(소모성 상품) 결제를 검증한다."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = CHARACTER_PACKS.get(req.product_id)
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 캐릭터 상품: {req.product_id}")

    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "google_play", Purchase.purchase_token == req.purchase_token)
        .first()
    )
    if existing:
        _validate_existing_purchase(existing, user_id=req.user_id, product_id=req.product_id)
        try:
            _finalize_google_purchase(db, existing, "non_consumable")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")
        return CharacterPurchaseResponse(
            success=True, character_id=pack["character_id"],
            free_char_slots=user.free_char_slots or [], message="이미 처리된 결제입니다.",
        )

    try:
        is_valid = verify_product_purchase(req.product_id, req.purchase_token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play 결제 검증 실패: {e}")

    if not is_valid:
        return CharacterPurchaseResponse(
            success=False, character_id=pack["character_id"],
            free_char_slots=user.free_char_slots or [], message="유효하지 않은 결제입니다.",
        )

    slots = _grant_character(db, req.user_id, pack["character_id"])
    purchase = Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="google_play",
        product_id=req.product_id,
        purchase_token=req.purchase_token,
        status="verified",
    )
    db.add(purchase)
    db.commit()
    try:
        _finalize_google_purchase(db, purchase, "non_consumable")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Play purchase finalization failed: {e}")

    return CharacterPurchaseResponse(
        success=True, character_id=pack["character_id"], free_char_slots=slots,
        message=f"{pack['label']} 완료되었습니다.",
    )


@router.post("/web-character-dev", response_model=CharacterPurchaseResponse, dependencies=[Depends(require_internal_secret)])
def web_character_purchase_dev(req: AndroidPurchaseVerifyRequest, db: Session = Depends(get_db)):
    """웹(포트원 연동 전) 캐릭터 개별 잠금해제 임시 시뮬레이션 — 코인/프리미엄 웹
    시뮬레이션과 동일한 목적. 포트원 붙이면 실제 결제 검증 로직으로 교체해야 한다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = CHARACTER_PACKS.get(req.product_id)
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 캐릭터 상품: {req.product_id}")

    # _grant_character 자체는 이미 있으면 다시 안 더해서 앱 상태는 안전하지만, 영수증
    # 처리 이력을 안 남기면 나중에 포트원 실결제로 바뀔 때 같은 영수증으로 두 번 결제
    # 승인이 나갈 위험이 있다 — verify-android-character와 동일하게 기록해둔다.
    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "web_dev", Purchase.purchase_token == req.purchase_token)
        .first()
    )
    if existing:
        return CharacterPurchaseResponse(
            success=True, character_id=pack["character_id"],
            free_char_slots=user.free_char_slots or [], message="이미 처리된 결제입니다.",
        )

    slots = _grant_character(db, req.user_id, pack["character_id"])
    db.add(Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="web_dev",
        product_id=req.product_id,
        purchase_token=req.purchase_token,
        status="verified",
    ))
    db.commit()

    return CharacterPurchaseResponse(
        success=True, character_id=pack["character_id"], free_char_slots=slots,
        message=f"{pack['label']} 완료되었습니다. (웹 결제 시뮬레이션)",
    )


@router.post("/verify-portone-character", response_model=CharacterPurchaseResponse)
async def verify_portone_character_purchase(req: PortonePaymentVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    raise HTTPException(status_code=410, detail="PortOne payments are no longer supported. Use Google Play Billing.")
    """웹(포트원 KG이니시스)에서 발생한 캐릭터 개별 잠금해제 결제를 검증하고 지급한다."""
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pack = CHARACTER_PACKS.get(req.product_id or "")
    if not pack:
        raise HTTPException(status_code=400, detail=f"알 수 없는 캐릭터 상품: {req.product_id}")

    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "portone", Purchase.purchase_token == req.payment_id)
        .first()
    )
    if existing:
        return CharacterPurchaseResponse(
            success=True, character_id=pack["character_id"],
            free_char_slots=user.free_char_slots or [], message="이미 처리된 결제입니다.",
        )

    try:
        is_valid = await verify_payment(req.payment_id, pack["price_krw"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"포트원 결제 검증 실패: {e}")

    if not is_valid:
        return CharacterPurchaseResponse(
            success=False, character_id=pack["character_id"],
            free_char_slots=user.free_char_slots or [], message="유효하지 않은 결제입니다.",
        )

    slots = _grant_character(db, req.user_id, pack["character_id"])
    db.add(Purchase(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        platform="portone",
        product_id=req.product_id,
        purchase_token=req.payment_id,
        status="verified",
    ))
    db.commit()

    return CharacterPurchaseResponse(
        success=True, character_id=pack["character_id"], free_char_slots=slots,
        message=f"{pack['label']} 완료되었습니다.",
    )


@router.post("/verify-portone-membership", response_model=PurchaseVerifyResponse)
async def verify_portone_membership(req: PortonePaymentVerifyRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    raise HTTPException(status_code=410, detail="PortOne payments are no longer supported. Use Google Play Billing.")
    """웹(포트원 KG이니시스)에서 발생한 프리미엄 구독 결제를 검증하고 승격한다."""
    user = db.query(User).filter(User.id == req.user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(Purchase)
        .filter(Purchase.platform == "portone", Purchase.purchase_token == req.payment_id)
        .first()
    )
    if existing:
        return PurchaseVerifyResponse(success=True, membership=user.membership, message="이미 처리된 결제입니다.")

    try:
        is_valid = await verify_payment(req.payment_id, PREMIUM_PRICE_KRW)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"포트원 결제 검증 실패: {e}")

    if not is_valid:
        return PurchaseVerifyResponse(success=False, membership=user.membership, message="유효하지 않은 결제입니다.")

    _activate_premium_and_grant_welcome_coins(
        db, user, "portone", "kmate_premium_monthly", req.payment_id
    )

    return PurchaseVerifyResponse(success=True, membership=user.membership, message="결제가 확인되었습니다.")


@router.post("/ads/watch", response_model=WatchAdResponse)
def watch_ad(req: WatchAdRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
    raise HTTPException(
        status_code=410,
        detail="Ad rewards are unavailable until verified rewarded-ad delivery is enabled.",
    )
    """보상형 광고 시청 완료 보상 — 1회당 5코인, 하루 최대 100코인(20회)까지.

    실제 광고 SDK가 붙기 전까지는 프론트가 시뮬레이션(카운트다운 모달) 재생 후 이
    엔드포인트를 호출한다. 실제 리워드 광고 SDK(AdMob 등)를 붙이면, SDK의 "보상 획득"
    콜백이 온 경우에만 이 엔드포인트를 호출하도록 프론트만 바꾸면 되고 서버 로직은
    그대로 재사용된다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        granted, remaining, total_coins = grant_ad_reward(db, req.user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="User not found")

    if not granted:
        return WatchAdResponse(
            success=False, coins_granted=0, total_coins=total_coins,
            watches_remaining=0, message="오늘 광고로 받을 수 있는 코인을 모두 받았어요. 내일 다시 시도해주세요.",
        )

    return WatchAdResponse(
        success=True, coins_granted=AD_COIN_REWARD, total_coins=total_coins,
        watches_remaining=remaining, message=f"{AD_COIN_REWARD}코인을 받았어요!",
    )
