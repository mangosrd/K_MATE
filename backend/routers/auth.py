"""
인증 라우터 — POST /auth/register, /auth/login
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.schemas import RegisterRequest, LoginRequest, AuthUserResponse
from models.models import User, Economy
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

    if not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    return _to_response(user)
