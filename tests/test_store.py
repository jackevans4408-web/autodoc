from datetime import datetime, timedelta, timezone

from backend.store import InMemoryUsageStore, SupabaseUsageStore

USER = "11111111-1111-1111-1111-111111111111"


class Clock:
    def __init__(self):
        self.now = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)

    def __call__(self):
        return self.now


def test_consume_until_limit_then_deny():
    store = InMemoryUsageStore()
    results = [store.consume(USER, "diagnosis", 3) for _ in range(4)]
    assert [r.allowed for r in results] == [True, True, True, False]
    assert results[3].event_id is None and results[3].used == 3


def test_kinds_are_counted_separately():
    store = InMemoryUsageStore()
    assert store.consume(USER, "quote", 1).allowed
    assert not store.consume(USER, "quote", 1).allowed
    assert store.consume(USER, "diagnosis", 1).allowed


def test_users_are_counted_separately():
    store = InMemoryUsageStore()
    assert store.consume(USER, "quote", 1).allowed
    assert store.consume("other", "quote", 1).allowed


def test_unlimited_never_denies():
    store = InMemoryUsageStore()
    assert all(store.consume(USER, "diagnosis", None).allowed for _ in range(200))


def test_window_rolls_after_24_hours():
    clock = Clock()
    store = InMemoryUsageStore(clock=clock)
    assert store.consume(USER, "quote", 1).allowed
    clock.now += timedelta(hours=23, minutes=59)
    assert not store.consume(USER, "quote", 1).allowed
    clock.now += timedelta(minutes=2)
    assert store.consume(USER, "quote", 1).allowed


def test_release_gives_the_use_back():
    store = InMemoryUsageStore()
    first = store.consume(USER, "quote", 1)
    store.release(first.event_id)
    assert store.consume(USER, "quote", 1).allowed


def test_usage_counts():
    store = InMemoryUsageStore()
    store.consume(USER, "diagnosis", 10)
    store.consume(USER, "diagnosis", 10)
    store.consume(USER, "quote", 1)
    assert store.usage_counts(USER) == {"diagnosis": 2, "followup": 0, "quote": 1}


def test_subscription_events_are_ordered_and_idempotent():
    store = InMemoryUsageStore()
    exp = datetime(2026, 11, 1, tzinfo=timezone.utc)
    assert store.apply_subscription_event(USER, "plus", exp, 2000, "e2") is True
    # Older event arriving late must not overwrite the newer state.
    assert store.apply_subscription_event(USER, "free", None, 1000, "e1") is False
    # Redelivery of the same event is a no-op.
    assert store.apply_subscription_event(USER, "plus", exp, 2000, "e2") is False
    sub = store.get_subscription(USER)
    assert sub.tier == "plus" and sub.expires_at == exp
    assert store.apply_subscription_event(USER, "free", exp, 3000, "e3") is True
    assert store.get_subscription(USER).tier == "free"


def test_missing_subscription_is_none():
    assert InMemoryUsageStore().get_subscription(USER) is None


# --- SupabaseUsageStore against a fake client: checks the calls and response parsing, not the SQL itself ---


class FakeQuery:
    def __init__(self, data):
        self._data = data
        self.filters = []

    def select(self, *_):
        return self

    def eq(self, *args):
        self.filters.append(("eq",) + args)
        return self

    def gt(self, *args):
        self.filters.append(("gt",) + args)
        return self

    def limit(self, *_):
        return self

    def execute(self):
        return type("R", (), {"data": self._data})()


class FakeDb:
    def __init__(self, table_data=None, rpc_data=None):
        self.table_data = table_data or {}
        self.rpc_data = rpc_data
        self.rpc_calls = []
        self.queries = []

    def table(self, name):
        q = FakeQuery(self.table_data.get(name, []))
        self.queries.append((name, q))
        return q

    def rpc(self, name, params):
        self.rpc_calls.append((name, params))
        return FakeQuery(self.rpc_data)


def test_supabase_consume_calls_rpc_and_parses_rows():
    db = FakeDb(rpc_data=[{"allowed": True, "event_id": 7, "used": 3}])
    result = SupabaseUsageStore(db).consume(USER, "diagnosis", 10)
    assert (result.allowed, result.event_id, result.used) == (True, 7, 3)
    assert db.rpc_calls == [("consume_usage", {"p_user": USER, "p_kind": "diagnosis", "p_limit": 10, "p_window_hours": 24})]


def test_supabase_consume_denied_row():
    db = FakeDb(rpc_data=[{"allowed": False, "event_id": None, "used": 10}])
    result = SupabaseUsageStore(db).consume(USER, "diagnosis", 10)
    assert result.allowed is False and result.event_id is None


def test_supabase_release_and_apply_event():
    db = FakeDb(rpc_data=True)
    store = SupabaseUsageStore(db)
    store.release(5)
    exp = datetime(2026, 11, 1, tzinfo=timezone.utc)
    assert store.apply_subscription_event(USER, "plus", exp, 123, "evt") is True
    assert db.rpc_calls[0] == ("release_usage", {"p_event": 5})
    name, params = db.rpc_calls[1]
    assert name == "apply_subscription_event"
    assert params["p_expires_at"] == exp.isoformat() and params["p_event_ms"] == 123


def test_supabase_get_subscription_parses_timestamp():
    db = FakeDb(table_data={"subscriptions": [{"tier": "plus", "expires_at": "2026-11-01T00:00:00+00:00"}]})
    sub = SupabaseUsageStore(db).get_subscription(USER)
    assert sub.tier == "plus" and sub.expires_at == datetime(2026, 11, 1, tzinfo=timezone.utc)
    assert SupabaseUsageStore(FakeDb()).get_subscription(USER) is None


def test_supabase_usage_counts():
    db = FakeDb(table_data={"usage_events": [{"kind": "diagnosis"}, {"kind": "diagnosis"}, {"kind": "quote"}]})
    assert SupabaseUsageStore(db).usage_counts(USER) == {"diagnosis": 2, "followup": 0, "quote": 1}
