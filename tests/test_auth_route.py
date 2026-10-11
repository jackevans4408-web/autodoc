from types import SimpleNamespace

from backend.routes import auth


def test_signin_success(client, monkeypatch):
    user = SimpleNamespace(id="u1", email="a@b.com")
    session = SimpleNamespace(access_token="tok")
    monkeypatch.setattr(auth.supabase.auth, "sign_in_with_password", lambda creds: SimpleNamespace(user=user, session=session))
    r = client.post("/auth/signin", json={"email": "a@b.com", "password": "pw"})
    assert r.json() == {"success": True, "user_id": "u1", "email": "a@b.com", "token": "tok"}


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
