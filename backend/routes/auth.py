from fastapi import APIRouter, Depends
from backend.rate_limit import rate_limit
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

router = APIRouter()

auth_limit = rate_limit("auth", 10, 60)

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/signin", dependencies=[Depends(auth_limit)])
def signin(request: AuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "success": True,
            "user_id": response.user.id,
            "email": response.user.email,
            "token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/auth/signup", dependencies=[Depends(auth_limit)])
def signup(request: AuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        return {
            "success": True,
            "user_id": response.user.id,
            "email": response.user.email
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/auth/refresh", dependencies=[Depends(auth_limit)])
def refresh(request: RefreshRequest):
    """Swap a refresh token for a new access token (Supabase access tokens expire after about an hour)."""
    try:
        # A throwaway client keeps one user's session from leaking into the shared client used for sign-in.
        client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
        response = client.auth.refresh_session(request.refresh_token)
        return {
            "success": True,
            "user_id": response.user.id,
            "email": response.user.email,
            "token": response.session.access_token,
            "refresh_token": response.session.refresh_token
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
