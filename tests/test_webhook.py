from datetime import datetime, timedelta, timezone

import pytest

from backend.main import app
from backend.store import InMemoryUsageStore, get_store

USER = "11111111-1111-1111-1111-111111111111"
SECRET = "Bearer test-webhook-secret"
HEADERS = {"Authorization": SECRET}


@pytest.fixture
def store(monkeypatch):
    monkeypatch.setenv("REVENUECAT_WEBHOOK_AUTH", SECRET)
    s = InMemoryUsageStore()
    app.dependency_overrides[get_store] = lambda: s
    yield s
    app.dependency_overrides.clear()


def _ms(delta=timedelta(0)):
    return int((datetime.now(timezone.utc) + delta).timestamp() * 1000)


def _event(type_, **fields):
    event = {
        "type": type_,
        "id": f"evt-{type_}",
        "app_user_id": USER,
        "product_id": "engineeye_plus_monthly",
        "entitlement_ids": ["plus"],
        "expiration_at_ms": _ms(timedelta(days=30)),
        "event_timestamp_ms": _ms(),
    }
    event.update(fields)
    return {"event": event}


def test_rejects_missing_or_wrong_auth(client, store):
    assert client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE")).status_code == 401
    assert client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE"), headers={"Authorization": "Bearer nope"}).status_code == 401
    assert store.get_subscription(USER) is None


def test_fails_closed_when_secret_not_configured(client, store, monkeypatch):
    monkeypatch.delenv("REVENUECAT_WEBHOOK_AUTH")
    r = client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE"), headers={"Authorization": ""})
    assert r.status_code == 503
    assert store.get_subscription(USER) is None


@pytest.mark.parametrize("type_", ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "SUBSCRIPTION_EXTENDED", "REFUND_REVERSED"])
def test_grant_events_set_the_tier(client, store, type_):
    r = client.post("/webhooks/revenuecat", json=_event(type_), headers=HEADERS)
    assert r.status_code == 200 and r.json() == {"status": "applied", "tier": "plus"}
    sub = store.get_subscription(USER)
    assert sub.tier == "plus" and sub.expires_at > datetime.now(timezone.utc)


def test_unlimited_product(client, store):
    payload = _event("INITIAL_PURCHASE", product_id="engineeye_unlimited_monthly", entitlement_ids=["unlimited"])
    client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert store.get_subscription(USER).tier == "unlimited"


def test_product_change_uses_new_product(client, store):
    client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE", event_timestamp_ms=_ms(-timedelta(hours=1))), headers=HEADERS)
    payload = _event("PRODUCT_CHANGE", product_id="engineeye_plus_monthly", new_product_id="engineeye_unlimited_monthly")
    client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert store.get_subscription(USER).tier == "unlimited"


def test_expiration_returns_to_free(client, store):
    client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE", event_timestamp_ms=_ms(-timedelta(hours=1))), headers=HEADERS)
    r = client.post("/webhooks/revenuecat", json=_event("EXPIRATION"), headers=HEADERS)
    assert r.json()["tier"] == "free"
    assert store.get_subscription(USER).tier == "free"


def test_ordinary_cancellation_keeps_access_until_expiry(client, store):
    client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE", event_timestamp_ms=_ms(-timedelta(hours=1))), headers=HEADERS)
    r = client.post("/webhooks/revenuecat", json=_event("CANCELLATION", cancel_reason="UNSUBSCRIBE"), headers=HEADERS)
    assert r.status_code == 200 and r.json()["status"] == "ignored"
    assert store.get_subscription(USER).tier == "plus"


def test_refund_cancellation_revokes_access(client, store):
    client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE", event_timestamp_ms=_ms(-timedelta(hours=1))), headers=HEADERS)
    client.post("/webhooks/revenuecat", json=_event("CANCELLATION", cancel_reason="CUSTOMER_SUPPORT"), headers=HEADERS)
    assert store.get_subscription(USER).tier == "free"


@pytest.mark.parametrize("type_", ["TEST", "BILLING_ISSUE", "SUBSCRIPTION_PAUSED", "NON_RENEWING_PURCHASE", "SOMETHING_NEW"])
def test_other_events_are_acknowledged_without_change(client, store, type_):
    r = client.post("/webhooks/revenuecat", json=_event(type_), headers=HEADERS)
    assert r.status_code == 200 and r.json()["status"] == "ignored"
    assert store.get_subscription(USER) is None


def test_out_of_order_events_do_not_overwrite_newer_state(client, store):
    client.post("/webhooks/revenuecat", json=_event("EXPIRATION", id="late", event_timestamp_ms=_ms()), headers=HEADERS)
    stale = _event("INITIAL_PURCHASE", id="early", event_timestamp_ms=_ms(-timedelta(days=1)))
    r = client.post("/webhooks/revenuecat", json=stale, headers=HEADERS)
    assert r.status_code == 200 and r.json()["status"] == "stale"
    assert store.get_subscription(USER).tier == "free"


def test_duplicate_delivery_is_harmless(client, store):
    payload = _event("INITIAL_PURCHASE")
    assert client.post("/webhooks/revenuecat", json=payload, headers=HEADERS).json()["status"] == "applied"
    assert client.post("/webhooks/revenuecat", json=payload, headers=HEADERS).json()["status"] == "stale"
    assert store.get_subscription(USER).tier == "plus"


def test_anonymous_revenuecat_ids_are_ignored(client, store):
    payload = _event("INITIAL_PURCHASE", app_user_id="$RCAnonymousID:abc123")
    r = client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert r.status_code == 200 and r.json()["status"] == "ignored"


def test_falls_back_to_original_app_user_id(client, store):
    payload = _event("INITIAL_PURCHASE", app_user_id="$RCAnonymousID:abc123", original_app_user_id=USER)
    client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert store.get_subscription(USER).tier == "plus"


def test_unknown_product_never_grants_access(client, store):
    payload = _event("INITIAL_PURCHASE", product_id="mystery", entitlement_ids=None)
    r = client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert r.json()["status"] == "ignored" and store.get_subscription(USER) is None


def test_grant_without_expiration_is_ignored(client, store):
    payload = _event("INITIAL_PURCHASE", expiration_at_ms=None)
    r = client.post("/webhooks/revenuecat", json=payload, headers=HEADERS)
    assert r.json()["status"] == "ignored" and store.get_subscription(USER) is None


def test_unknown_user_foreign_key_error_is_acknowledged(client, store, monkeypatch):
    def boom(*args):
        raise Exception('insert violates foreign key constraint {"code": "23503"}')

    monkeypatch.setattr(store, "apply_subscription_event", boom)
    r = client.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE"), headers=HEADERS)
    assert r.status_code == 200 and r.json()["reason"] == "unknown user"


def test_database_outage_returns_5xx_so_revenuecat_retries(store, monkeypatch):
    from fastapi.testclient import TestClient

    def boom(*args):
        raise Exception("connection refused")

    monkeypatch.setattr(store, "apply_subscription_event", boom)
    c = TestClient(app, raise_server_exceptions=False)
    assert c.post("/webhooks/revenuecat", json=_event("INITIAL_PURCHASE"), headers=HEADERS).status_code == 500
