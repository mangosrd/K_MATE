"""
인증 라우터 — POST /auth/register, /auth/login
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db, get_settings
from schemas.schemas import RegisterRequest, LoginRequest, AuthUserResponse, WithdrawRequest, WithdrawResponse
from models.models import User, Economy, Progress, Memory, DiaryEntry, VocabItem
import bcrypt
import uuid
import base64
import hashlib
import hmac
import json
import secrets
import time
from urllib.parse import urlencode
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])


def _sign_payload(payload: dict) -> str:
    """Create a short-lived, tamper-proof browser handoff value."""
    secret = get_settings().internal_api_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured")
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def _read_signed_payload(value: str) -> dict:
    try:
        encoded, signature = value.split(".", 1)
        expected = hmac.new(
            get_settings().internal_api_secret.encode("utf-8"),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding))
        if payload["exp"] < time.time():
            raise ValueError("expired")
        return payload
    except (ValueError, KeyError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Login link expired. Please try Google login again.")


def _to_response(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        language=user.language,
        membership=user.membership.value if hasattr(user.membership, "value") else user.membership,
    )


@router.get("/google/start")
def google_start():
    """Send the browser to Google using the configured OAuth web client."""
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    state = _sign_payload({"nonce": secrets.token_urlsafe(24), "exp": time.time() + 600})
    redirect_uri = f"{settings.backend_public_url.rstrip('/')}/auth/google/callback"
    query = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    response = RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")
    response.set_cookie("kmate_google_state", state, max_age=600, httponly=True, secure=True, samesite="lax")
    return response


@router.get("/google/callback")
def google_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    """Verify Google's code, link the verified email to a K-MATE user, then return to Vercel."""
    settings = get_settings()
    cookie_state = request.cookies.get("kmate_google_state")
    if not cookie_state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(status_code=400, detail="Google login verification failed. Please try again.")
    _read_signed_payload(state)

    redirect_uri = f"{settings.backend_public_url.rstrip('/')}/auth/google/callback"
    try:
        token_response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15.0,
        )
        token_response.raise_for_status()
        access_token = token_response.json().get("access_token")
        profile_response = httpx.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
        )
        profile_response.raise_for_status()
        profile = profile_response.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Google could not complete the login. Please try again.")

    email = profile.get("email")
    if not email or not profile.get("email_verified"):
        raise HTTPException(status_code=400, detail="A verified Google email address is required.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            name=profile.get("name") or email.split("@", 1)[0],
            email=email,
            password_hash=None,
            language="ko",
            membership="free",
            free_char_slots=["kyuhyun", "haneul"],
        )
        db.add(user)
        db.flush()
        db.add(Economy(id=str(uuid.uuid4()), user_id=user.id, coins=35))
        db.commit()
        db.refresh(user)
    elif user.is_withdrawn:
        raise HTTPException(status_code=401, detail="This account has been withdrawn.")

    handoff = _sign_payload({"user_id": user.id, "exp": time.time() + 120})
    response = RedirectResponse(f"{settings.frontend_url.rstrip('/')}/login?oauth_code={handoff}")
    response.delete_cookie("kmate_google_state")
    return response


@router.post("/google/exchange", response_model=AuthUserResponse)
def google_exchange(payload: dict, db: Session = Depends(get_db)):
    handoff = _read_signed_payload(str(payload.get("oauth_code", "")))
    user = db.query(User).filter(User.id == handoff.get("user_id")).first()
    if not user or user.is_withdrawn:
        raise HTTPException(status_code=401, detail="Google login has expired. Please try again.")
    return _to_response(user)


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


@router.post("/guest", response_model=AuthUserResponse)
def create_guest(db: Session = Depends(get_db)):
    """비로그인 방문자용 익명 게스트 계정 생성.

    예전엔 로그인 안 한 방문자가 전부 고정된 공용 id(user-001)를 같이 썼는데, 그러면
    무료 대화 10회 같은 계정별 한도가 실제로는 "로그인 안 한 모든 방문자가 합쳐서
    10회"가 되어버린다. 프론트가 앱을 처음 띄울 때 이 엔드포인트를 한 번 불러서 방문자
    전용 id를 발급받아 localStorage에 저장해두고, 그 뒤로는 그 id를 계속 쓴다.
    """
    user = User(
        id=str(uuid.uuid4()),
        name="Guest",
        email=None,
        password_hash=None,
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
