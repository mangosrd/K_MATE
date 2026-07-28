"""
인증 라우터 — POST /auth/register, /auth/login
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db
from schemas.schemas import RegisterRequest, LoginRequest, AuthUserResponse, WithdrawRequest, WithdrawResponse
from models.models import User, Economy, Progress, Memory, DiaryEntry, VocabItem
import bcrypt
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_response(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        language=user.language,
        membership=user.membership.value if hasattr(user.membership, "value") else user.membership,
    )


@router.post("/register", response_model=AuthUserResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """이메일 회원가입"""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다")

    password_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        id=str(uuid.uuid4()),
        name=req.name,
        email=req.email,
        password_hash=password_hash,
        language="ko",
        membership="free",
        free_char_slots=["kyuhyun", "haneul"],
    )
    db.add(user)
    db.flush()

    db.add(Economy(id=str(uuid.uuid4()), user_id=user.id, coins=35))
    db.commit()
    db.refresh(user)

    return _to_response(user)


@router.post("/login", response_model=AuthUserResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """이메일 로그인"""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    if user.is_withdrawn:
        raise HTTPException(status_code=401, detail="탈퇴한 계정입니다")

    if not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    return _to_response(user)


@router.post("/withdraw", response_model=WithdrawResponse)
def withdraw(req: WithdrawRequest, db: Session = Depends(get_db)):
    """
    회원 탈퇴.

    전자상거래 등에서의 소비자보호에 관한 법률 시행령 제6조에 따라 계약/청약철회,
    대금결제·재화공급 관련 기록은 탈퇴 후에도 5년간 보관해야 하므로, 계정을 식별할
    수 있는 최소 정보(id, email, membership 이력, 탈퇴 시각)만 남기고 나머지 개인
    데이터(학습 진도, 대화 기억, 일기, 단어장, 코인)는 즉시 DB에서 완전히 삭제한다.
    """
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or user.is_withdrawn:
        raise HTTPException(status_code=404, detail="계정을 찾을 수 없습니다")

    if not user.password_hash or not bcrypt.checkpw(
        req.password.encode("utf-8"), user.password_hash.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="비밀번호가 올바르지 않습니다")

    # 개인 콘텐츠 하드 삭제 — 법적 보관 의무가 없는 데이터
    db.query(Progress).filter(Progress.user_id == user.id).delete()
    db.query(Memory).filter(Memory.user_id == user.id).delete()
    db.query(DiaryEntry).filter(DiaryEntry.user_id == user.id).delete()
    db.query(VocabItem).filter(VocabItem.user_id == user.id).delete()
    db.query(Economy).filter(Economy.user_id == user.id).delete()

    # 계정 자체는 식별 정보(id, email)만 남기고 나머지 개인정보는 제거, 로그인 불가 처리
    user.name = "탈퇴한 회원"
    user.password_hash = None
    user.language = "en"
    user.level = 1
    user.free_char_slots = []
    user.is_withdrawn = True
    user.withdrawn_at = func.now()

    db.commit()

    return WithdrawResponse(success=True, message="회원 탈퇴가 완료되었습니다")
