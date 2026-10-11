import pytest

from backend import quota
from backend.main import app
from backend.plans import LIMITS
from backend.routes import diagnose as route
from backend.store import InMemoryUsageStore, get_store, get_store_if_enforced

from datetime import datetime, timedelta, timezone

USER = "11111111-1111-1111-1111-111111111111"
OTHER = "22222222-2222-2222-2222-222222222222"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture
def store():
    s = InMemoryUsageStore()
    app.dependency_overrides[get_store] = lambda: s
    app.dependency_overrides[get_store_if_enforced] = lambda: s
    yield s
    app.dependency_overrides.clear()


@pytest.fixture
def enforced(monkeypatch, store):
    monkeypatch.setenv("ENFORCE_USAGE_LIMITS", "1")
    tokens = {"good-token": USER, "other-token": OTHER}
    monkeypatch.setattr(quota, "verify_token", lambda token: tokens.get(token))
    return store


@pytest.fixture
def ai(monkeypatch):
    calls = {"n": 0, "fail": False}

    def fake(**kwargs):
        calls["n"] += 1
        if calls["fail"]:
            raise RuntimeError("anthropic down")
        return "ANSWER"

    monkeypatch.setattr(route, "diagnose_car", fake)
    monkeypatch.setattr(route, "get_recalls", lambda *a: None)
    monkeypatch.setattr(route, "format_recalls_for_claude", lambda r: "none")
    monkeypatch.setattr(route, "get_repair_videos", lambda **k: [])
    monkeypatch.setattr(route, "save_diagnosis", lambda **k: None)
    return calls


def _post(client, headers=AUTH, **body):
    body.setdefault("text", "noise")
    return client.post("/diagnose", json=body, headers=headers)


def test_enforcement_off_keeps_legacy_behaviour(client, ai, monkeypatch):
    monkeypatch.delenv("ENFORCE_USAGE_LIMITS", raising=False)
    # No token, no store configured: the live app must keep working.
    assert client.post("/diagnose", json={"text": "noise"}).status_code == 200


def test_enforced_requires_a_valid_token(client, enforced, ai):
    assert client.post("/diagnose", json={"text": "x"}).status_code == 401
    assert _post(client, headers={"Authorization": "Bearer nope"}).status_code == 401
    assert _post(client, headers={"Authorization": "Basic good-token"}).status_code == 401
    assert ai["n"] == 0


def test_401_body_tells_app_to_sign_in(client, enforced, ai):
    r = client.post("/diagnose", json={"text": "x"})
    assert r.json()["detail"]["error"] == "auth_required"


def test_free_user_hits_diagnosis_limit_with_402(client, enforced, ai, monkeypatch):
    # Raise the per-IP limit so only the plan limit is under test.
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    limit = LIMITS["free"]["diagnosis"]
    for _ in range(limit):
        assert _post(client).status_code == 200
    r = _post(client)
    assert r.status_code == 402
    detail = r.json()["detail"]
    assert detail["error"] == "quota_exceeded" and detail["tier"] == "free"
    assert detail["kind"] == "diagnosis" and detail["limit"] == limit
    assert ai["n"] == limit  # the blocked request never reached the AI


def test_other_users_are_unaffected(client, enforced, ai, monkeypatch):
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    for _ in range(LIMITS["free"]["diagnosis"] + 1):
        _post(client)
    assert _post(client, headers={"Authorization": "Bearer other-token"}).status_code == 200


def test_quote_uses_its_own_allowance(client, enforced, ai):
    assert _post(client, kind="quote").status_code == 200
    r = _post(client, kind="quote")
    assert r.status_code == 402 and r.json()["detail"]["kind"] == "quote"
    assert _post(client).status_code == 200  # diagnoses unaffected by the used-up quote allowance


def test_followups_do_not_consume_diagnoses(client, enforced, ai, monkeypatch):
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    assert _post(client).status_code == 200
    for _ in range(5):
        assert _post(client, is_followup=True).status_code == 200
    assert enforced.usage_counts(USER) == {"diagnosis": 1, "followup": 5, "quote": 0}


def test_followup_flag_cannot_bypass_the_plan(client, enforced, ai, monkeypatch):
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    for _ in range(LIMITS["free"]["followup"]):
        assert _post(client, is_followup=True).status_code == 200
    r = _post(client, is_followup=True)
    assert r.status_code == 402 and r.json()["detail"]["kind"] == "followup"


def test_paid_plan_gets_higher_limit(client, enforced, ai, monkeypatch):
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    enforced.apply_subscription_event(USER, "plus", datetime.now(timezone.utc) + timedelta(days=5), 1, "e")
    for _ in range(LIMITS["free"]["diagnosis"] + 1):
        assert _post(client).status_code == 200


def test_expired_subscription_falls_back_to_free(client, enforced, ai):
    enforced.apply_subscription_event(USER, "unlimited", datetime.now(timezone.utc) - timedelta(minutes=1), 1, "e")
    assert _post(client, kind="quote").status_code == 200
    assert _post(client, kind="quote").status_code == 402


def test_unlimited_plan_is_not_capped(client, enforced, ai, monkeypatch):
    monkeypatch.setattr(route.diagnose_per_minute.limiter, "limit", 1000)
    monkeypatch.setattr(route.diagnose_per_hour.limiter, "limit", 1000)
    enforced.apply_subscription_event(USER, "unlimited", datetime.now(timezone.utc) + timedelta(days=5), 1, "e")
    for _ in range(40):
        assert _post(client, kind="quote").status_code == 200


def test_failed_request_gives_the_use_back(enforced, ai):
    from fastapi.testclient import TestClient

    ai["fail"] = True
    c = TestClient(app, raise_server_exceptions=False)
    assert _post(c).status_code == 500
    assert enforced.usage_counts(USER)["diagnosis"] == 0
    ai["fail"] = False
    assert _post(c).status_code == 200
    assert enforced.usage_counts(USER)["diagnosis"] == 1


def test_invalid_kind_rejected(client, enforced, ai):
    assert _post(client, kind="hack").status_code == 422


def test_usage_endpoint_summarises_plan(client, enforced):
    enforced.consume(USER, "diagnosis", 10)
    enforced.consume(USER, "diagnosis", 10)
    r = client.get("/usage", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["tier"] == "free" and body["enforced"] is True and body["window_hours"] == 24
    assert body["usage"]["diagnosis"] == {"used": 2, "limit": 10, "remaining": 8}
    assert body["usage"]["quote"] == {"used": 0, "limit": 1, "remaining": 1}


def test_usage_endpoint_unlimited_has_no_remaining(client, enforced):
    enforced.apply_subscription_event(USER, "unlimited", datetime.now(timezone.utc) + timedelta(days=5), 1, "e")
    body = client.get("/usage", headers=AUTH).json()
    assert body["tier"] == "unlimited"
    assert body["usage"]["diagnosis"] == {"used": 0, "limit": None, "remaining": None}


def test_usage_endpoint_requires_auth(client, enforced):
    assert client.get("/usage").status_code == 401


def test_verify_token_caches_and_rejects_failures(monkeypatch):
    quota._token_cache.clear()
    calls = []

    class FakeAuth:
        def get_user(self, token):
            calls.append(token)
            if token == "bad":
                raise Exception("invalid JWT")
            return type("R", (), {"user": type("U", (), {"id": USER})()})()

    monkeypatch.setattr(quota, "_client", lambda: type("C", (), {"auth": FakeAuth()})())
    assert quota.verify_token("t1") == USER
    assert quota.verify_token("t1") == USER
    assert calls == ["t1"]  # second call served from the cache
    assert quota.verify_token("bad") is None
    assert quota.verify_token("bad") is None
    assert calls == ["t1", "bad", "bad"]  # failures are never cached
    quota._token_cache.clear()
