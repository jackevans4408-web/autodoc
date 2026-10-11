import os
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, Request

from backend.plans import KINDS, WINDOW_HOURS, effective_tier, enforcement_enabled, limit_for

_TOKEN_CACHE_SECONDS = 60
_TOKEN_CACHE_MAX = 5000
_token_cache: dict[str, tuple[str, float]] = {}
_token_lock = threading.Lock()
_auth_client = None


def _client():
    global _auth_client
    if _auth_client is None:
        from supabase import create_client

        _auth_client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    return _auth_client


def verify_token(token: str) -> Optional[str]:
    """Return the Supabase user id for an access token, or None if it is invalid or expired.

    Asks Supabase to validate the token (so revoked sessions are rejected) and caches the answer briefly.
    """
    now = time.monotonic()
    with _token_lock:
        hit = _token_cache.get(token)
        if hit and hit[1] > now:
            return hit[0]
    try:
        user = _client().auth.get_user(token).user
        user_id = user.id if user else None
    except Exception:
        return None
    if user_id:
        with _token_lock:
            if len(_token_cache) >= _TOKEN_CACHE_MAX:
                _token_cache.clear()
            _token_cache[token] = (user_id, now + _TOKEN_CACHE_SECONDS)
    return user_id


def bearer_token(request: Request) -> Optional[str]:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    return token.strip() if scheme.lower() == "bearer" and token.strip() else None


def require_user_id(request: Request) -> str:
    token = bearer_token(request)
    user_id = verify_token(token) if token else None
    if not user_id:
        raise HTTPException(status_code=401, detail={"error": "auth_required", "message": "Please sign in again."})
    return user_id


def tier_for_user(store, user_id: str) -> str:
    sub = store.get_subscription(user_id)
    return effective_tier(sub.tier, sub.expires_at, datetime.now(timezone.utc)) if sub else "free"


@dataclass
class Reservation:
    event_id: Optional[int]


def reserve_usage(request: Request, store, kind: str) -> Optional[Reservation]:
    """Authenticate the caller and consume one use of `kind` from their plan.

    Returns None when enforcement is off (the legacy app sends no token). Raises 401 without a valid token and 402 when the plan's
    allowance for the rolling window is used up.
    """
    if not enforcement_enabled():
        return None
    user_id = require_user_id(request)
    tier = tier_for_user(store, user_id)
    limit = limit_for(tier, kind)
    result = store.consume(user_id, kind, limit)
    if not result.allowed:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "kind": kind,
                "tier": tier,
                "limit": limit,
                "window_hours": WINDOW_HOURS,
                "message": "You have used all of your free uses for now. Upgrade for more." if tier == "free" else "You have reached your plan's limit for now.",
            },
        )
    return Reservation(result.event_id)


def release_usage(store, reservation: Optional[Reservation]) -> None:
    """Give the use back when the request failed before producing an answer. Never raises."""
    if reservation and reservation.event_id is not None:
        try:
            store.release(reservation.event_id)
        except Exception as exc:
            print(f"Could not release usage {reservation.event_id}: {exc}")


def usage_summary(store, user_id: str) -> dict:
    tier = tier_for_user(store, user_id)
    counts = store.usage_counts(user_id)
    kinds = {}
    for kind in KINDS:
        limit = limit_for(tier, kind)
        used = counts.get(kind, 0)
        kinds[kind] = {"used": used, "limit": limit, "remaining": None if limit is None else max(limit - used, 0)}
    return {"tier": tier, "window_hours": WINDOW_HOURS, "enforced": enforcement_enabled(), "usage": kinds}
