import pytest

from backend import accounts, quota
from backend.routes import account as route

USER = "11111111-1111-1111-1111-111111111111"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture
def signed_in(monkeypatch):
    monkeypatch.setattr(quota, "verify_token", lambda token: USER if token == "good-token" else None)


def test_requires_a_valid_login(client, monkeypatch, signed_in):
    deleted = []
    monkeypatch.setattr(route, "delete_user_account", deleted.append)
    assert client.delete("/auth/account").status_code == 401
    assert client.delete("/auth/account", headers={"Authorization": "Bearer nope"}).status_code == 401
    assert deleted == []


def test_deletes_the_callers_own_account_only(client, monkeypatch, signed_in):
    deleted = []
    monkeypatch.setattr(route, "delete_user_account", deleted.append)
    r = client.delete("/auth/account", headers=AUTH)
    assert r.status_code == 200 and r.json() == {"success": True}
    assert deleted == [USER]


def test_failure_is_reported_not_hidden(client, monkeypatch, signed_in):
    def boom(user_id):
        raise Exception("supabase down")

    monkeypatch.setattr(route, "delete_user_account", boom)
    from fastapi.testclient import TestClient
    from backend.main import app

    r = TestClient(app, raise_server_exceptions=False).delete("/auth/account", headers=AUTH)
    assert r.status_code == 500
    assert r.json()["detail"]["error"] == "deletion_failed"
    assert "supabase down" not in r.text  # internal details are not leaked


def test_is_rate_limited(client, monkeypatch, signed_in):
    monkeypatch.setattr(route, "delete_user_account", lambda user_id: None)
    limit = route.account_limit.limiter.limit
    for _ in range(limit):
        assert client.delete("/auth/account", headers=AUTH).status_code == 200
    assert client.delete("/auth/account", headers=AUTH).status_code == 429


class FakeTable:
    def __init__(self, log):
        self.log = log

    def delete(self):
        self.log.append("delete diagnoses")
        return self

    def eq(self, column, value):
        self.log.append(f"where {column}={value}")
        return self

    def execute(self):
        return None


def test_delete_user_account_removes_data_then_the_login(monkeypatch):
    log = []

    class FakeClient:
        auth = type("A", (), {"admin": type("Ad", (), {"delete_user": staticmethod(lambda uid: log.append(f"delete auth user {uid}"))})()})()

        def table(self, name):
            log.append(f"table {name}")
            return FakeTable(log)

    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service")
    monkeypatch.setattr(accounts, "create_client", lambda url, key: FakeClient())
    accounts.delete_user_account(USER)
    assert log == ["table diagnoses", "delete diagnoses", f"where user_id={USER}", f"delete auth user {USER}"]


def test_delete_user_account_needs_the_service_key(monkeypatch):
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    with pytest.raises(RuntimeError):
        accounts.delete_user_account(USER)
