import os
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from backend.plans import KINDS, WINDOW_HOURS


@dataclass
class Subscription:
    tier: str
    expires_at: Optional[datetime]


@dataclass
class ConsumeResult:
    allowed: bool
    event_id: Optional[int]
    used: int


def _parse_ts(value) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


class InMemoryUsageStore:
    """Process-local store used by tests and local development."""

    def __init__(self, clock=lambda: datetime.now(timezone.utc)):
        self._clock = clock
        self._lock = threading.Lock()
        self._subs: dict[str, dict] = {}
        self._events: dict[int, tuple[str, str, datetime]] = {}
        self._next_id = 1

    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        sub = self._subs.get(user_id)
        return Subscription(sub["tier"], sub["expires_at"]) if sub else None

    def _count(self, user_id: str, kind: str) -> int:
        cutoff = self._clock() - timedelta(hours=WINDOW_HOURS)
        return sum(1 for u, k, t in self._events.values() if u == user_id and k == kind and t > cutoff)

    def consume(self, user_id: str, kind: str, limit: Optional[int]) -> ConsumeResult:
        with self._lock:
            used = self._count(user_id, kind)
            if limit is not None and used >= limit:
                return ConsumeResult(False, None, used)
            event_id = self._next_id
            self._next_id += 1
            self._events[event_id] = (user_id, kind, self._clock())
            return ConsumeResult(True, event_id, used + 1)

    def release(self, event_id: int) -> None:
        with self._lock:
            self._events.pop(event_id, None)

    def usage_counts(self, user_id: str) -> dict:
        with self._lock:
            return {kind: self._count(user_id, kind) for kind in KINDS}

    def apply_subscription_event(self, user_id: str, tier: str, expires_at: Optional[datetime], event_ms: int, event_id: str) -> bool:
        """Returns False when the event is older than what is already stored (out-of-order or duplicate delivery)."""
        with self._lock:
            current = self._subs.get(user_id)
            if current and current["last_event_ms"] >= event_ms:
                return False
            self._subs[user_id] = {"tier": tier, "expires_at": expires_at, "last_event_ms": event_ms, "last_event_id": event_id}
            return True


class SupabaseUsageStore:
    """Backed by the tables and functions in supabase/migrations/001_subscriptions.sql.

    Uses the service-role key: these tables have row level security enabled with no policies, so only the backend can touch them.
    """

    def __init__(self, client):
        self._db = client

    @classmethod
    def from_env(cls):
        from supabase import create_client

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to use usage limits")
        return cls(create_client(url, key))

    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        rows = self._db.table("subscriptions").select("tier,expires_at").eq("user_id", user_id).limit(1).execute().data
        if not rows:
            return None
        return Subscription(rows[0]["tier"], _parse_ts(rows[0]["expires_at"]))

    def consume(self, user_id: str, kind: str, limit: Optional[int]) -> ConsumeResult:
        rows = self._db.rpc(
            "consume_usage",
            {"p_user": user_id, "p_kind": kind, "p_limit": limit, "p_window_hours": WINDOW_HOURS},
        ).execute().data
        row = rows[0] if isinstance(rows, list) else rows
        return ConsumeResult(bool(row["allowed"]), row.get("event_id"), int(row["used"]))

    def release(self, event_id: int) -> None:
        self._db.rpc("release_usage", {"p_event": event_id}).execute()

    def usage_counts(self, user_id: str) -> dict:
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=WINDOW_HOURS)).isoformat()
        rows = self._db.table("usage_events").select("kind").eq("user_id", user_id).gt("created_at", cutoff).execute().data
        counts = {kind: 0 for kind in KINDS}
        for row in rows:
            counts[row["kind"]] = counts.get(row["kind"], 0) + 1
        return counts

    def apply_subscription_event(self, user_id: str, tier: str, expires_at: Optional[datetime], event_ms: int, event_id: str) -> bool:
        applied = self._db.rpc(
            "apply_subscription_event",
            {
                "p_user": user_id,
                "p_tier": tier,
                "p_expires_at": expires_at.isoformat() if expires_at else None,
                "p_event_ms": event_ms,
                "p_event_id": event_id,
            },
        ).execute().data
        return bool(applied)


_store = None
_store_lock = threading.Lock()


def get_store():
    """FastAPI dependency returning the process-wide store. Overridden in tests."""
    global _store
    with _store_lock:
        if _store is None:
            _store = SupabaseUsageStore.from_env()
        return _store


def get_store_if_enforced():
    """Like get_store, but returns None while usage limits are off so the live app works without the service key configured."""
    from backend.plans import enforcement_enabled

    return get_store() if enforcement_enabled() else None
