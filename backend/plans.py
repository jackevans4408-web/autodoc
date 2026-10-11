import json
import os
from datetime import datetime, timezone
from typing import Optional

FREE = "free"
PLUS = "plus"
UNLIMITED = "unlimited"
TIERS = (FREE, PLUS, UNLIMITED)

KINDS = ("diagnosis", "followup", "quote")

# Rolling window for all quotas.
WINDOW_HOURS = 24

# Uses per rolling window. None means unlimited.
# Follow-ups are a separate, more generous bucket so chatting about one diagnosis does not burn a diagnosis, while "is_followup" cannot be used to bypass the plan.
LIMITS: dict[str, dict[str, Optional[int]]] = {
    FREE: {"diagnosis": 10, "followup": 30, "quote": 1},
    PLUS: {"diagnosis": 50, "followup": 150, "quote": 25},
    UNLIMITED: {"diagnosis": None, "followup": None, "quote": None},
}

_DEFAULT_PRODUCT_TIERS = {
    "engineeye_plus_monthly": PLUS,
    "engineeye_unlimited_monthly": UNLIMITED,
}


def product_tiers() -> dict[str, str]:
    """Map store product ids to tiers. Override with REVENUECAT_PRODUCT_TIERS='{"product_id": "plus"}'."""
    raw = os.getenv("REVENUECAT_PRODUCT_TIERS")
    if raw:
        try:
            mapping = json.loads(raw)
            return {k: v for k, v in mapping.items() if v in (PLUS, UNLIMITED)}
        except (ValueError, AttributeError):
            pass
    return dict(_DEFAULT_PRODUCT_TIERS)


def tier_for_product(product_id: Optional[str], entitlement_ids: Optional[list] = None) -> Optional[str]:
    tier = product_tiers().get(product_id or "")
    if tier:
        return tier
    # Fall back to entitlement names (highest tier wins) so a renamed product still works.
    entitlements = set(entitlement_ids or [])
    if UNLIMITED in entitlements:
        return UNLIMITED
    if PLUS in entitlements:
        return PLUS
    return None


def effective_tier(tier: Optional[str], expires_at: Optional[datetime], now: Optional[datetime] = None) -> str:
    """The tier a user currently gets: paid tiers lapse to free once expires_at has passed."""
    if tier not in (PLUS, UNLIMITED):
        return FREE
    now = now or datetime.now(timezone.utc)
    if expires_at is not None and expires_at <= now:
        return FREE
    return tier


def limit_for(tier: str, kind: str) -> Optional[int]:
    return LIMITS[tier][kind]


def enforcement_enabled() -> bool:
    return os.getenv("ENFORCE_USAGE_LIMITS", "").strip().lower() in ("1", "true", "yes", "on")
