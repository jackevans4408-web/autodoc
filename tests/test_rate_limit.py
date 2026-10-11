from starlette.requests import Request

from backend.rate_limit import SlidingWindowLimiter, client_ip


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_allows_up_to_limit_then_blocks():
    limiter = SlidingWindowLimiter(3, 60, clock=FakeClock())
    assert [limiter.check("a") for _ in range(3)] == [0, 0, 0]
    assert limiter.check("a") > 0


def test_retry_after_reflects_oldest_hit():
    clock = FakeClock()
    limiter = SlidingWindowLimiter(2, 60, clock=clock)
    limiter.check("a")
    clock.now += 10
    limiter.check("a")
    clock.now += 20
    assert round(limiter.check("a")) == 30


def test_window_expiry_frees_capacity():
    clock = FakeClock()
    limiter = SlidingWindowLimiter(1, 60, clock=clock)
    assert limiter.check("a") == 0
    assert limiter.check("a") > 0
    clock.now += 61
    assert limiter.check("a") == 0


def test_keys_are_independent():
    limiter = SlidingWindowLimiter(1, 60, clock=FakeClock())
    assert limiter.check("a") == 0
    assert limiter.check("b") == 0
    assert limiter.check("a") > 0


def test_blocked_requests_do_not_extend_the_block():
    clock = FakeClock()
    limiter = SlidingWindowLimiter(1, 60, clock=clock)
    limiter.check("a")
    for _ in range(50):
        clock.now += 1
        limiter.check("a")
    clock.now += 11  # 61s after the only counted hit
    assert limiter.check("a") == 0


def _request(headers=None, client=("1.2.3.4", 5000)):
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": client,
    }
    return Request(scope)


def test_client_ip_uses_rightmost_forwarded_entry():
    # The leftmost entry is attacker-controlled; the rightmost was added by the trusted proxy.
    assert client_ip(_request({"X-Forwarded-For": "6.6.6.6, 9.9.9.9"})) == "9.9.9.9"


def test_client_ip_falls_back_to_socket_address():
    assert client_ip(_request()) == "1.2.3.4"
    assert client_ip(_request(client=None)) == "unknown"
