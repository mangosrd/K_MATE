"""Signed access tokens used by user-owned API routes."""

import base64
import binascii
import hashlib
import hmac
import json
import time

from fastapi import Header, HTTPException

from database import get_settings

TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30


def issue_access_token(user_id: str) -> str:
    secret = get_settings().internal_api_secret
    if not secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured")

    payload = {"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    encoded = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def require_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login is required")

    try:
        encoded, signature = authorization.removeprefix("Bearer ").split(".", 1)
        secret = get_settings().internal_api_secret
        expected = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).hexdigest()
        if not secret or not hmac.compare_digest(signature, expected):
            raise ValueError("invalid signature")
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding))
        if not payload.get("sub") or int(payload["exp"]) < time.time():
            raise ValueError("expired")
        return str(payload["sub"])
    except (ValueError, KeyError, TypeError, binascii.Error, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Your login has expired. Please sign in again.")


def require_same_user(current_user_id: str, requested_user_id: str) -> None:
    if not hmac.compare_digest(current_user_id, requested_user_id):
        raise HTTPException(status_code=403, detail="You can only access your own letters")
