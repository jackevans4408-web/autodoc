from fastapi import APIRouter, Depends, HTTPException, Request

from backend.accounts import delete_user_account
from backend.quota import require_user_id
from backend.rate_limit import rate_limit

router = APIRouter()

account_limit = rate_limit("account", 5, 60)


@router.delete("/auth/account", dependencies=[Depends(account_limit)])
def delete_account(request: Request):
    """Delete the signed-in user's account and data (Apple guideline 5.1.1(v)). Always requires a valid login token."""
    user_id = require_user_id(request)
    try:
        delete_user_account(user_id)
    except Exception as exc:
        print(f"Account deletion failed for {user_id}: {exc}")
        raise HTTPException(status_code=500, detail={"error": "deletion_failed", "message": "We couldn't delete your account. Please try again."})
    return {"success": True}
