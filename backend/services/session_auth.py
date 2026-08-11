"""Signed access tokens used by user-owned API routes."""

import base64
import binascii
import hashlib
import hmac
import json
import time

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db, get_settings
from models.models import User

# The app remains signed in between launches. Revocation is handled by logout or
# account withdrawal; this token only authorizes the user-owned letter endpoints.
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365


def issue_access_token(user_id: str, auth_version: int = 0) -> str:
    secret = get_settings().internal_api_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured")

    payload = {
        "sub": user_id,
        "ver": auth_version,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def _read_access_token(authorization: str | None) -> tuple[str, int]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login is required")

    try:
        encoded, signature = authorization.removeprefix("Bearer ").split(".", 1)
        secret = get_settings().internal_api_secret
        if not secret:
            raise HTTPException(status_code=503, detail="Authentication is not configured")
        expected = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid signature")
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding))
        if not payload.get("sub") or int(payload["exp"]) < time.time():
            raise ValueError("expired")
        # Tokens issued before auth-version support deliberately map to version
        # zero, so existing installed apps remain signed in after deployment.
        return str(payload["sub"]), int(payload.get("ver", 0))
    except (ValueError, KeyError, TypeError, binascii.Error, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Your login has expired. Please sign in again.")


def require_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> str:
    """Validate both the signed token and the current account state.

    Tokens are intentionally long-lived so the mobile app stays signed in, but a
    withdrawn or deleted account must lose API access immediately.
    """
    user_id, token_version = _read_access_token(authorization)
    active_user = db.query(User.id, User.auth_version).filter(
        User.id == user_id,
        User.is_withdrawn.is_(False),
    ).first()
    if not active_user:
        raise HTTPException(status_code=401, detail="This account is no longer available")
    if int(active_user[1] or 0) != token_version:
        raise HTTPException(status_code=401, detail="Your login has expired. Please sign in again.")
    return user_id


def revoke_user_sessions(user: User) -> None:
    """Invalidate all access tokens previously issued for one account."""
    user.auth_version = int(user.auth_version or 0) + 1


def require_same_user(current_user_id: str, requested_user_id: str) -> None:
    if not hmac.compare_digest(current_user_id, requested_user_id):
        raise HTTPException(status_code=403, detail="You can only access your own account data")
