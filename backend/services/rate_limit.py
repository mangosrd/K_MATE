"""Small process-local abuse guard for public authentication endpoints.

This is intentionally not an account authorization mechanism. It limits bursts
before expensive password hashing, token verification, or database writes run.
"""

from collections import defaultdict, deque
import hashlib
from threading import Lock
import time

from fastapi import HTTPException


_events: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def _bucket_key(scope: str, identifier: str) -> str:
    digest = hashlib.sha256(identifier.encode("utf-8")).hexdigest()
    return f"{scope}:{digest}"


def enforce_rate_limit(
    scope: str,
    identifier: str,
    *,
    limit: int,
    window_seconds: int,
    now: float | None = None,
) -> None:
    current = time.monotonic() if now is None else now
    cutoff = current - window_seconds
    key = _bucket_key(scope, identifier)

    with _lock:
        if len(_events) >= 10_000:
            stale_cutoff = current - 3600
            stale_keys = [
                candidate_key
                for candidate_key, candidate_bucket in _events.items()
                if not candidate_bucket or candidate_bucket[-1] <= stale_cutoff
            ]
            for stale_key in stale_keys:
                _events.pop(stale_key, None)
        bucket = _events[key]
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = max(1, int(window_seconds - (current - bucket[0])))
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please wait and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        bucket.append(current)


def clear_rate_limit(scope: str, identifier: str) -> None:
    with _lock:
        _events.pop(_bucket_key(scope, identifier), None)


def _reset_for_tests() -> None:
    with _lock:
        _events.clear()
