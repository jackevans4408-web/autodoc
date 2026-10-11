import os
import threading
import time
from collections import deque

from fastapi import HTTPException, Request

_SWEEP_THRESHOLD = 10_000


class SlidingWindowLimiter:
    """In-memory sliding-window limiter. State is per process, so with several workers each gets its own budget."""

    def __init__(self, limit: int, window_seconds: float, clock=time.monotonic):
        self.limit = limit
        self.window = window_seconds
        self._clock = clock
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> float:
        """Record a hit. Returns 0 if allowed, otherwise the seconds until the caller may retry."""
        now = self._clock()
        cutoff = now - self.window
        with self._lock:
            if len(self._hits) > _SWEEP_THRESHOLD:
                self._sweep(cutoff)
            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= self.limit:
                return max(hits[0] + self.window - now, 0.001)
            hits.append(now)
            return 0

    def reset(self):
        with self._lock:
            self._hits.clear()

    def _sweep(self, cutoff: float):
        for key in [k for k, h in self._hits.items() if not h or h[-1] <= cutoff]:
            del self._hits[key]


def client_ip(request: Request) -> str:
    # Behind Railway's proxy the rightmost X-Forwarded-For entry is the one the proxy added; earlier entries are client-supplied.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


def rate_limit(scope: str, limit: int, window_seconds: int):
    """Build a FastAPI dependency allowing `limit` requests per `window_seconds` per client IP.

    The limit can be overridden with the env var RATE_LIMIT_<SCOPE>, e.g. RATE_LIMIT_DIAGNOSE_MINUTE=20.
    """
    limiter = SlidingWindowLimiter(_env_int(f"RATE_LIMIT_{scope.upper()}", limit), window_seconds)

    def dependency(request: Request):
        retry_after = limiter.check(client_ip(request))
        if retry_after:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please slow down and try again shortly.",
                headers={"Retry-After": str(int(retry_after) + 1)},
            )

    dependency.limiter = limiter
    return dependency
