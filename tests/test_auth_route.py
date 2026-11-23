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
    monkeypatch.setattr(auth.supabase.auth, "sign_up", lambda creds: SimpleNamespace(user=user, session=None))
    r = client.post("/auth/signup", json={"email": "n@b.com", "password": "pw"})
    assert r.json() == {"success": True, "user_id": "u2", "email": "n@b.com", "needs_verification": True}


def test_signup_returns_tokens_when_supabase_issues_a_session(client, monkeypatch):
    user = SimpleNamespace(id="u3", email="s@b.com")
    session = SimpleNamespace(access_token="tok", refresh_token="ref")
    monkeypatch.setattr(auth.supabase.auth, "sign_up", lambda creds: SimpleNamespace(user=user, session=session))
    r = client.post("/auth/signup", json={"email": "s@b.com", "password": "pw"})
    assert r.json() == {"success": True, "user_id": "u3", "email": "s@b.com", "token": "tok", "refresh_token": "ref"}


def test_signin_flags_unverified_email(client, monkeypatch):
    def boom(creds):
        raise Exception("Email not confirmed")

    monkeypatch.setattr(auth.supabase.auth, "sign_in_with_password", boom)
    r = client.post("/auth/signin", json={"email": "a@b.com", "password": "pw"})
    assert r.json() == {"success": False, "error": "Email not confirmed", "code": "email_not_confirmed"}


def test_resend_asks_supabase_to_send_the_signup_email(client, monkeypatch):
    sent = []
    monkeypatch.setattr(auth.supabase.auth, "resend", lambda creds: sent.append(creds))
    r = client.post("/auth/resend", json={"email": "n@b.com"})
    assert r.json() == {"success": True}
    assert sent == [{"type": "signup", "email": "n@b.com"}]


def test_resend_never_reveals_whether_an_account_exists(client, monkeypatch):
    def boom(creds):
        raise Exception("User not found")

    monkeypatch.setattr(auth.supabase.auth, "resend", boom)
    assert client.post("/auth/resend", json={"email": "ghost@b.com"}).json() == {"success": True}


def test_resend_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(auth.supabase.auth, "resend", lambda creds: None)
    limit = auth.auth_limit.limiter.limit
    for _ in range(limit):
        assert client.post("/auth/resend", json={"email": "a@b.com"}).status_code == 200
    assert client.post("/auth/resend", json={"email": "a@b.com"}).status_code == 429


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
