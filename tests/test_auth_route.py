from types import SimpleNamespace

from backend.routes import auth


def test_signin_success(client, monkeypatch):
    user = SimpleNamespace(id="u1", email="a@b.com")
    session = SimpleNamespace(access_token="tok", refresh_token="ref")
    monkeypatch.setattr(auth.supabase.auth, "sign_in_with_password", lambda creds: SimpleNamespace(user=user, session=session))
    r = client.post("/auth/signin", json={"email": "a@b.com", "password": "pw"})
    assert r.json() == {"success": True, "user_id": "u1", "email": "a@b.com", "token": "tok", "refresh_token": "ref"}


def test_signin_failure_returns_error(client, monkeypatch):
    def boom(creds):
        raise Exception("Invalid login credentials")

    monkeypatch.setattr(auth.supabase.auth, "sign_in_with_password", boom)
    r = client.post("/auth/signin", json={"email": "a@b.com", "password": "bad"})
    assert r.json() == {"success": False, "error": "Invalid login credentials"}


def test_signup_success(client, monkeypatch):
    user = SimpleNamespace(id="u2", email="n@b.com")
    monkeypatch.setattr(auth.supabase.auth, "sign_up", lambda creds: SimpleNamespace(user=user))
    r = client.post("/auth/signup", json={"email": "n@b.com", "password": "pw"})
    assert r.json() == {"success": True, "user_id": "u2", "email": "n@b.com"}


def test_auth_is_rate_limited(client, monkeypatch):
    def boom(creds):
        raise Exception("no")

    monkeypatch.setattr(auth.supabase.auth, "sign_in_with_password", boom)
    limit = auth.auth_limit.limiter.limit
    for _ in range(limit):
        assert client.post("/auth/signin", json={"email": "a@b.com", "password": "x"}).status_code == 200
    assert client.post("/auth/signin", json={"email": "a@b.com", "password": "x"}).status_code == 429


class FakeRefreshClient:
    def __init__(self, behaviour):
        seen = []
        self.seen = seen

        def refresh_session(token):
            seen.append(token)
            if behaviour == "fail":
                raise Exception("Invalid Refresh Token")
            user = SimpleNamespace(id="u1", email="a@b.com")
            return SimpleNamespace(user=user, session=SimpleNamespace(access_token="new-tok", refresh_token="new-ref"))

        self.auth = SimpleNamespace(refresh_session=refresh_session)


def test_refresh_returns_new_tokens(client, monkeypatch):
    fake = FakeRefreshClient("ok")
    monkeypatch.setattr(auth, "create_client", lambda url, key: fake)
    r = client.post("/auth/refresh", json={"refresh_token": "old-ref"})
    assert r.json() == {"success": True, "user_id": "u1", "email": "a@b.com", "token": "new-tok", "refresh_token": "new-ref"}
    assert fake.seen == ["old-ref"]


def test_refresh_with_bad_token_reports_failure(client, monkeypatch):
    monkeypatch.setattr(auth, "create_client", lambda url, key: FakeRefreshClient("fail"))
    r = client.post("/auth/refresh", json={"refresh_token": "bad"})
    assert r.json() == {"success": False, "error": "Invalid Refresh Token"}


def test_refresh_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(auth, "create_client", lambda url, key: FakeRefreshClient("fail"))
    limit = auth.auth_limit.limiter.limit
    for _ in range(limit):
        assert client.post("/auth/refresh", json={"refresh_token": "x"}).status_code == 200
    assert client.post("/auth/refresh", json={"refresh_token": "x"}).status_code == 429
