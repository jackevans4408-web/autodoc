import os

# The route and service modules build Supabase/Anthropic clients at import time, so dummy config must be set first.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
os.environ.setdefault("YOUTUBE_API_KEY", "test-key")

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.routes import auth, diagnose


@pytest.fixture(autouse=True)
def reset_limiters():
    limiters = [
        diagnose.diagnose_per_minute.limiter,
        diagnose.diagnose_per_hour.limiter,
        auth.auth_limit.limiter,
    ]
    for limiter in limiters:
        limiter.reset()
    yield


@pytest.fixture
def client():
    return TestClient(app)
