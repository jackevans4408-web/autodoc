import base64

import pytest

from backend.routes import diagnose as route


@pytest.fixture
def mocks(monkeypatch):
    calls = {}

    def fake_diagnose_car(**kwargs):
        calls["diagnose_car"] = kwargs
        return "DIAGNOSIS TEXT"

    def fake_get_recalls(year, make, model):
        calls["recalls"] = (year, make, model)
        return [{"campaign": "1"}]

    def fake_videos(**kwargs):
        calls["videos"] = kwargs
        return [{"title": "v"}]

    monkeypatch.setattr(route, "diagnose_car", fake_diagnose_car)
    monkeypatch.setattr(route, "get_recalls", fake_get_recalls)
    monkeypatch.setattr(route, "format_recalls_for_claude", lambda r: "RECALL TEXT")
    monkeypatch.setattr(route, "get_repair_videos", fake_videos)
    return calls


CAR = {"car_year": "2015", "car_make": "Honda", "car_model": "Civic", "car_engine": "1.8L"}


def test_first_message_runs_full_pipeline(client, mocks):
    r = client.post("/diagnose", json={"text": "rattling noise", **CAR})
    assert r.status_code == 200
    assert r.json() == {"diagnosis": "DIAGNOSIS TEXT", "recalls": "RECALL TEXT", "videos": [{"title": "v"}]}
    assert mocks["recalls"] == ("2015", "Honda", "Civic")
    assert mocks["diagnose_car"]["car_info"] == "2015 Honda Civic 1.8L"
    assert mocks["diagnose_car"]["is_followup"] is False


def test_followup_skips_recalls_and_videos(client, mocks):
    history = [{"role": "user", "content": "q"}, {"role": "assistant", "content": "a"}]
    r = client.post("/diagnose", json={"text": "more?", "is_followup": True, "conversation_history": history, **CAR})
    assert r.status_code == 200
    assert r.json()["videos"] == [] and r.json()["recalls"] is None
    assert "recalls" not in mocks and "videos" not in mocks
    assert mocks["diagnose_car"]["conversation_history"] == history


def test_no_recall_lookup_without_full_vehicle(client, mocks):
    client.post("/diagnose", json={"text": "noise", "car_year": "2015"})
    assert "recalls" not in mocks
    assert mocks["diagnose_car"]["car_info"] == "2015 None None"


def test_image_is_decoded(client, mocks):
    raw = b"\xff\xd8fake-jpeg"
    r = client.post("/diagnose", json={"image_base64": base64.b64encode(raw).decode(), "image_type": "image/png"})
    assert r.status_code == 200
    assert mocks["diagnose_car"]["image_data"] == raw
    assert mocks["diagnose_car"]["image_type"] == "image/png"


def test_rejects_oversized_text(client, mocks):
    r = client.post("/diagnose", json={"text": "x" * (route.MAX_TEXT_CHARS + 1)})
    assert r.status_code == 422
    assert "diagnose_car" not in mocks


def test_rejects_oversized_image(client, mocks):
    r = client.post("/diagnose", json={"image_base64": "A" * (route.MAX_IMAGE_BASE64_CHARS + 1)})
    assert r.status_code == 422
    assert "diagnose_car" not in mocks


def test_rejects_overlong_history(client, mocks):
    history = [{"role": "user", "content": "x"}] * 21
    r = client.post("/diagnose", json={"text": "hi", "conversation_history": history})
    assert r.status_code == 422


def test_rate_limit_per_minute(client, mocks):
    limit = route.diagnose_per_minute.limiter.limit
    for _ in range(limit):
        assert client.post("/diagnose", json={"text": "hi"}).status_code == 200
    r = client.post("/diagnose", json={"text": "hi"})
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) >= 1
    assert "Too many requests" in r.json()["detail"]


def test_rate_limit_is_per_client_ip(client, mocks):
    limit = route.diagnose_per_minute.limiter.limit
    for _ in range(limit):
        client.post("/diagnose", json={"text": "hi"}, headers={"X-Forwarded-For": "1.1.1.1"})
    blocked = client.post("/diagnose", json={"text": "hi"}, headers={"X-Forwarded-For": "1.1.1.1"})
    other = client.post("/diagnose", json={"text": "hi"}, headers={"X-Forwarded-For": "2.2.2.2"})
    assert blocked.status_code == 429
    assert other.status_code == 200


def test_spoofed_leading_forwarded_entries_do_not_bypass_limit(client, mocks):
    limit = route.diagnose_per_minute.limiter.limit
    for i in range(limit):
        client.post("/diagnose", json={"text": "hi"}, headers={"X-Forwarded-For": f"10.0.0.{i}, 9.9.9.9"})
    r = client.post("/diagnose", json={"text": "hi"}, headers={"X-Forwarded-For": "10.0.1.1, 9.9.9.9"})
    assert r.status_code == 429


def test_rate_limited_requests_never_reach_the_ai(client, mocks):
    limit = route.diagnose_per_minute.limiter.limit
    for _ in range(limit):
        client.post("/diagnose", json={"text": "hi"})
    mocks.clear()
    assert client.post("/diagnose", json={"text": "hi"}).status_code == 429
    assert "diagnose_car" not in mocks


def test_route_does_not_write_to_the_database():
    # The app saves each user's history itself, under that user's own login. The backend must not write anonymous copies.
    assert not hasattr(route, "save_diagnosis")
