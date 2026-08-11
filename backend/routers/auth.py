"""
인증 라우터 — POST /auth/register, /auth/login
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_db, get_settings
from schemas.schemas import (
    AuthUserResponse, GoogleExchangeRequest, GoogleNativeLoginRequest,
    GuestCreateRequest, LoginRequest, RegisterRequest, WithdrawRequest, WithdrawResponse,
)
from models.models import User, Economy, GuestInstall, Progress, Memory, DiaryEntry, VocabItem
from sqlalchemy.exc import IntegrityError
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
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from services.session_auth import issue_access_token, require_current_user, require_same_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if email.count("@") != 1 or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=422, detail="A valid email address is required")
    return email


def _guest_install_hash(installation_id: str) -> str:
    secret = get_settings().internal_api_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured")
    return hmac.new(
        secret.encode("utf-8"),
        installation_id.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


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
        access_token=issue_access_token(user.id),
    )


def _find_or_create_google_user(profile: dict, db: Session) -> User:
    email = profile.get("email")
    if not email or not profile.get("email_verified"):
        raise HTTPException(status_code=400, detail="A verified Google email address is required.")
    email = _normalize_email(str(email))

    user = db.query(User).filter(User.email == email).first()
    if not user:
        name = str(profile.get("name") or email.split("@", 1)[0]).strip()[:100] or "Google User"
        user = User(id=str(uuid.uuid4()), name=name, email=email,
                    password_hash=None, language="ko", membership="free", free_char_slots=["kyuhyun", "haneul"])
        db.add(user)
        db.flush()
        db.add(Economy(id=str(uuid.uuid4()), user_id=user.id, coins=35))
        db.commit()
        db.refresh(user)
    elif user.is_withdrawn:
        raise HTTPException(status_code=401, detail="This account has been withdrawn.")
    return user


@router.get("/google/client-id")
def google_client_id():
    client_id = get_settings().google_client_id
    if not client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured")
    return {"client_id": client_id}


@router.post("/google/native", response_model=AuthUserResponse)
def google_native_login(payload: GoogleNativeLoginRequest, db: Session = Depends(get_db)):
    token = payload.id_token
    try:
        profile = google_id_token.verify_oauth2_token(token, google_requests.Request(), get_settings().google_client_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Google login verification failed")
    nonce = payload.nonce
    if profile.get("nonce") != nonce:
        raise HTTPException(status_code=401, detail="Google login verification failed")
    return _to_response(_find_or_create_google_user(profile, db))


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

    user = _find_or_create_google_user(profile, db)

    handoff = _sign_payload({"user_id": user.id, "exp": time.time() + 120})
    response = RedirectResponse(f"{settings.frontend_url.rstrip('/')}/login?oauth_code={handoff}")
    response.delete_cookie("kmate_google_state")
    return response


@router.post("/google/exchange", response_model=AuthUserResponse)
def google_exchange(payload: GoogleExchangeRequest, db: Session = Depends(get_db)):
    handoff = _read_signed_payload(payload.oauth_code)
    user = db.query(User).filter(User.id == handoff.get("user_id")).first()
    if not user or user.is_withdrawn:
        raise HTTPException(status_code=401, detail="Google login has expired. Please try again.")
    return _to_response(user)


@router.post("/register", response_model=AuthUserResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """이메일 회원가입"""
    email = _normalize_email(req.email)
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다")

    password_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
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
def create_guest(req: GuestCreateRequest, db: Session = Depends(get_db)):
    """비로그인 방문자용 익명 게스트 계정 생성.

    예전엔 로그인 안 한 방문자가 전부 고정된 공용 id(user-001)를 같이 썼는데, 그러면
    무료 대화 10회 같은 계정별 한도가 실제로는 "로그인 안 한 모든 방문자가 합쳐서
    10회"가 되어버린다. 프론트가 앱을 처음 띄울 때 이 엔드포인트를 한 번 불러서 방문자
    전용 id를 발급받아 localStorage에 저장해두고, 그 뒤로는 그 id를 계속 쓴다.
    """
    install_hash = _guest_install_hash(req.installation_id)
    existing_install = db.get(GuestInstall, install_hash)
    if existing_install:
        existing_user = db.query(User).filter(
            User.id == existing_install.user_id,
            User.is_withdrawn.is_(False),
        ).first()
        if existing_user:
            return _to_response(existing_user)
        db.delete(existing_install)
        db.flush()

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
    db.add(GuestInstall(install_hash=install_hash, user_id=user.id))
    try:
        db.commit()
    except IntegrityError:
        # Two simultaneous app mounts can race on first launch. The unique
        # installation hash selects one winner without creating two accounts.
        db.rollback()
        winner = db.get(GuestInstall, install_hash)
        winner_user = db.query(User).filter(
            User.id == winner.user_id,
            User.is_withdrawn.is_(False),
        ).first() if winner else None
        if not winner_user:
            raise HTTPException(status_code=503, detail="Guest account setup could not be completed")
        return _to_response(winner_user)
    db.refresh(user)

    return _to_response(user)


@router.post("/login", response_model=AuthUserResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """이메일 로그인"""
    email = _normalize_email(req.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    if user.is_withdrawn:
        raise HTTPException(status_code=401, detail="탈퇴한 계정입니다")

    if not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")

    return _to_response(user)


@router.post("/withdraw", response_model=WithdrawResponse)
def withdraw(req: WithdrawRequest, current_user_id: str = Depends(require_current_user), db: Session = Depends(get_db)):
    require_same_user(current_user_id, req.user_id)
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
