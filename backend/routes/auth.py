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
        message = str(e)
        result = {"success": False, "error": message}
        # Supabase refuses sign-in until the emailed link is opened; flag it so the app can show the "check your email" screen.
        if "email not confirmed" in message.lower():
            result["code"] = "email_not_confirmed"
        return result

@router.post("/auth/signup", dependencies=[Depends(auth_limit)])
def signup(request: AuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        result = {
            "success": True,
            "user_id": response.user.id,
            "email": response.user.email
        }
        # A session only exists when email confirmation is off; include the tokens so the app can use the account immediately.
        session = getattr(response, "session", None)
        if session:
            result["token"] = session.access_token
            result["refresh_token"] = session.refresh_token
        else:
            result["needs_verification"] = True
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


class RefreshRequest(BaseModel):
    refresh_token: str

class ResendRequest(BaseModel):
    email: str

@router.post("/auth/resend", dependencies=[Depends(auth_limit)])
def resend(request: ResendRequest):
    """Send the sign-up verification email again. Always answers success so the endpoint cannot be used to find out which emails have accounts."""
    try:
        supabase.auth.resend({"type": "signup", "email": request.email})
    except Exception as e:
        print(f"Resend verification failed: {type(e).__name__}")
    return {"success": True}

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
