from fastapi import APIRouter, Depends, Request

from backend.quota import require_user_id, usage_summary
from backend.rate_limit import rate_limit
from backend.store import get_store

router = APIRouter()

usage_limit = rate_limit("usage", 30, 60)


@router.get("/usage", dependencies=[Depends(usage_limit)])
def usage(request: Request, store=Depends(get_store)):
    """Current plan and remaining allowance for the signed-in user, for the app's usage counter and paywall."""
    return usage_summary(store, require_user_id(request))
