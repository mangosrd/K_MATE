"""
계정 설정 라우터 — 개인정보 수정, 비밀번호 변경, 알림/테마 설정,
결제 수단(시뮬레이션), 고객 지원 문의.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.support_email import notify_support_team
from schemas.schemas import (
    ProfileUpdateRequest, ChangePasswordRequest, SimpleSuccessResponse,
    PreferencesResponse, PreferencesUpdateRequest,
    PaymentMethodResponse, PaymentMethodCreateRequest,
    SupportTicketRequest, SupportTicketResponse,
    AuthUserResponse,
)
from models.models import User, PaymentMethod, SupportTicket
import bcrypt
import uuid

router = APIRouter(tags=["account"])


def _to_auth_response(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        language=user.language,
        membership=user.membership.value if hasattr(user.membership, "value") else user.membership,
    )


# ── 개인정보 수정 ────────────────────────────────────────────
@router.patch("/user/{user_id}/profile", response_model=AuthUserResponse)
def update_profile(user_id: str, req: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")

    if req.email != user.email:
        existing = db.query(User).filter(User.email == req.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")

    user.name = req.name
    user.email = req.email
    db.commit()
    db.refresh(user)
    return _to_auth_response(user)


# ── 비밀번호 변경 ────────────────────────────────────────────
@router.put("/auth/change-password", response_model=SimpleSuccessResponse)
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")

    if not bcrypt.checkpw(req.current_password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="현재 비밀번호가 올바르지 않습니다")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="새 비밀번호는 8자 이상이어야 합니다")

    user.password_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.commit()
    return SimpleSuccessResponse(success=True, message="비밀번호가 변경되었습니다")


# ── 알림 / 테마 설정 ──────────────────────────────────────────
@router.get("/user/{user_id}/preferences", response_model=PreferencesResponse)
def get_preferences(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")
    return PreferencesResponse(
        theme_pref=user.theme_pref,
        notify_chat=user.notify_chat,
        notify_diary=user.notify_diary,
        notify_marketing=user.notify_marketing,
    )


@router.put("/user/{user_id}/preferences", response_model=PreferencesResponse)
def update_preferences(user_id: str, req: PreferencesUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")

    if req.theme_pref is not None:
        user.theme_pref = req.theme_pref
    if req.notify_chat is not None:
        user.notify_chat = req.notify_chat
    if req.notify_diary is not None:
        user.notify_diary = req.notify_diary
    if req.notify_marketing is not None:
        user.notify_marketing = req.notify_marketing

    db.commit()
    db.refresh(user)
    return PreferencesResponse(
        theme_pref=user.theme_pref,
        notify_chat=user.notify_chat,
        notify_diary=user.notify_diary,
        notify_marketing=user.notify_marketing,
    )


# ── 결제 수단 (시뮬레이션) ────────────────────────────────────
# 카드 전체 번호는 저장하지 않고 브랜드/끝 4자리만 남긴다. 실제 카드사 승인 절차는 없다 —
# /user/{id}/membership 구독 전환 자체가 이미 결제 연동 전 시뮬레이션이라(PremiumView.tsx 참고),
# 여기서도 같은 방식으로 "등록된 카드처럼 보이는" 상태만 관리한다.
def _luhn_valid(number: str) -> bool:
    digits = [int(d) for d in number]
    checksum = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


def _detect_brand(number: str) -> str:
    if number.startswith("4"):
        return "Visa"
    if number[:2] in {str(n) for n in range(51, 56)} or number[:4] in {str(n) for n in range(2221, 2721)}:
        return "Mastercard"
    if number[:2] in ("34", "37"):
        return "American Express"
    if number.startswith(("35", "62")):
        return "JCB / UnionPay"
    return "Card"


@router.get("/user/{user_id}/payment-methods", response_model=list[PaymentMethodResponse])
def list_payment_methods(user_id: str, db: Session = Depends(get_db)):
    methods = (
        db.query(PaymentMethod)
        .filter(PaymentMethod.user_id == user_id)
        .order_by(PaymentMethod.created_at.desc())
        .all()
    )
    return [
        PaymentMethodResponse(id=m.id, brand=m.brand, last4=m.last4, created_at=m.created_at.isoformat())
        for m in methods
    ]


@router.post("/user/{user_id}/payment-methods", response_model=PaymentMethodResponse)
def add_payment_method(user_id: str, req: PaymentMethodCreateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")

    digits = "".join(ch for ch in req.card_number if ch.isdigit())
    if len(digits) < 12 or len(digits) > 19 or not _luhn_valid(digits):
        raise HTTPException(status_code=400, detail="유효하지 않은 카드 번호입니다")

    method = PaymentMethod(
        id=str(uuid.uuid4()),
        user_id=user_id,
        brand=_detect_brand(digits),
        last4=digits[-4:],
    )
    db.add(method)
    db.commit()
    db.refresh(method)
    return PaymentMethodResponse(
        id=method.id, brand=method.brand, last4=method.last4, created_at=method.created_at.isoformat()
    )


@router.delete("/payment-methods/{method_id}", response_model=SimpleSuccessResponse)
def delete_payment_method(method_id: str, db: Session = Depends(get_db)):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="결제 수단을 찾을 수 없습니다")
    db.delete(method)
    db.commit()
    return SimpleSuccessResponse(success=True, message="결제 수단이 삭제되었습니다")


# ── 고객 지원 문의 ────────────────────────────────────────────
@router.post("/support/tickets", response_model=SupportTicketResponse)
def create_support_ticket(req: SupportTicketRequest, db: Session = Depends(get_db)):
    ticket = SupportTicket(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        name=req.name,
        email=req.email,
        category=req.category,
        message=req.message,
    )
    db.add(ticket)
    db.commit()
    notify_support_team(
        ticket_id=ticket.id,
        name=ticket.name,
        email=ticket.email,
        category=ticket.category,
        message=ticket.message,
    )
    return SupportTicketResponse(success=True, ticket_id=ticket.id)


# ── 코인 직접 지급 (광고 보상 등 내부 용도) ─────────────────────
# 포트원/Play 결제와 달리 외부 영수증 검증 없이 바로 코인을 더해주는 엔드포인트.
# 현재 용도: 광고 보상(me 페이지 AdRewardModal). 이 엔드포인트는 별도 인증/검증
# 없이 coin을 지급하므로, 실제 서비스에서는 JWT 인증 미들웨어를 붙여야 한다.
from pydantic import BaseModel

class AddCoinsRequest(BaseModel):
    coins: int
    reason: str = ""

class AddCoinsResponse(BaseModel):
    success: bool
    total_coins: int

@router.post("/user/{user_id}/add-coins", response_model=AddCoinsResponse)
def add_coins(user_id: str, req: AddCoinsRequest, db: Session = Depends(get_db)):
    """코인 직접 지급 — 광고 보상(AdRewardModal) 등 내부 용도."""
    from models.models import Economy
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    economy = db.query(Economy).filter(Economy.user_id == user_id).with_for_update().first()
    if not economy:
        economy = Economy(id=str(uuid.uuid4()), user_id=user_id, coins=0)
        db.add(economy)
        db.flush()

    economy.coins += req.coins
    db.commit()
    return AddCoinsResponse(success=True, total_coins=economy.coins)
