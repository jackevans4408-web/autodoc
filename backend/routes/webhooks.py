import hmac
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.plans import FREE, tier_for_product
from backend.store import get_store

router = APIRouter()

GRANT_EVENTS = {
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "SUBSCRIPTION_EXTENDED",
    "REFUND_REVERSED",
}


def _valid_uuid(value) -> Optional[str]:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, AttributeError, TypeError):
        return None  # RevenueCat anonymous ids ("$RCAnonymousID:...") and anything else that is not a Supabase user id


def _ms_to_dt(ms) -> Optional[datetime]:
    try:
        return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc)
    except (TypeError, ValueError, OverflowError, OSError):
        return None


def _check_auth(request: Request):
    expected = os.getenv("REVENUECAT_WEBHOOK_AUTH")
    if not expected:
        # Fail closed: without a configured secret anyone could grant themselves a plan.
        raise HTTPException(status_code=503, detail="Webhook not configured")
    received = request.headers.get("authorization", "")
    if not hmac.compare_digest(received.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/webhooks/revenuecat")
def revenuecat_webhook(payload: dict, request: Request, store=Depends(get_store)):
    """Keep the subscriptions table in sync with RevenueCat. Always answers 200 for events we deliberately ignore,
    and 5xx for real failures so RevenueCat retries."""
    _check_auth(request)

    event = payload.get("event") or {}
    event_type = event.get("type")
    user_id = _valid_uuid(event.get("app_user_id")) or _valid_uuid(event.get("original_app_user_id"))
    if not user_id:
        return {"status": "ignored", "reason": "no user id"}

    event_ms = event.get("event_timestamp_ms")
    event_ms = int(event_ms) if isinstance(event_ms, (int, float)) else int(time.time() * 1000)
    event_id = str(event.get("id") or "")

    if event_type in GRANT_EVENTS:
        product_id = event.get("new_product_id") if event_type == "PRODUCT_CHANGE" else None
        tier = tier_for_product(product_id or event.get("product_id"), event.get("entitlement_ids"))
        expires_at = _ms_to_dt(event.get("expiration_at_ms"))
        if not tier or not expires_at:
            # Unknown product or no expiry: never grant open-ended access by accident.
            return {"status": "ignored", "reason": "unmapped product or missing expiration"}
    elif event_type == "EXPIRATION" or (event_type == "CANCELLATION" and event.get("cancel_reason") == "CUSTOMER_SUPPORT"):
        # Expired, or refunded through Apple/Google support: access ends now.
        tier, expires_at = FREE, datetime.now(timezone.utc)
    else:
        # TEST, BILLING_ISSUE, SUBSCRIPTION_PAUSED, ordinary CANCELLATION (access continues until expiry), and others.
        return {"status": "ignored", "reason": f"event {event_type} needs no change"}

    try:
        applied = store.apply_subscription_event(user_id, tier, expires_at, event_ms, event_id)
    except Exception as exc:
        if "23503" in str(exc):  # foreign key violation: a user id that does not exist in Supabase auth
            return {"status": "ignored", "reason": "unknown user"}
        raise
    return {"status": "applied" if applied else "stale", "tier": tier}
