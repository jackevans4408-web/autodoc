from fastapi import APIRouter, Depends, Request
from typing import Literal, Optional, List
from pydantic import BaseModel, Field
from backend.rate_limit import rate_limit
from backend.quota import release_usage, reserve_usage
from backend.store import get_store_if_enforced
from backend.services.claude_service import diagnose_car
from backend.services.supabase_service import save_diagnosis
from backend.services.nhtsa_service import get_recalls, format_recalls_for_claude
from backend.services.youtube_service import get_repair_videos
import base64

router = APIRouter()

diagnose_per_minute = rate_limit("diagnose_minute", 10, 60)
diagnose_per_hour = rate_limit("diagnose_hour", 60, 3600)

# Roughly 5 MB of image once base64-encoded, and a generous cap on free text, to keep one request from running up a large bill.
MAX_IMAGE_BASE64_CHARS = 7_000_000
MAX_TEXT_CHARS = 4000

class MessageHistory(BaseModel):
    role: str
    content: str

class DiagnoseRequest(BaseModel):
    text: Optional[str] = Field(default=None, max_length=MAX_TEXT_CHARS)
    image_base64: Optional[str] = Field(default=None, max_length=MAX_IMAGE_BASE64_CHARS)
    image_type: Optional[str] = "image/jpeg"
    car_year: Optional[str] = None
    car_make: Optional[str] = None
    car_model: Optional[str] = None
    car_engine: Optional[str] = None
    conversation_history: Optional[List[MessageHistory]] = Field(default=None, max_length=20)
    is_followup: Optional[bool] = False
    # Quote analysis goes through this endpoint too; the app sets kind="quote" so it counts against the quote allowance.
    kind: Literal["diagnosis", "quote"] = "diagnosis"

@router.post("/diagnose", dependencies=[Depends(diagnose_per_minute), Depends(diagnose_per_hour)])
def diagnose(request: DiagnoseRequest, http_request: Request, store=Depends(get_store_if_enforced)):
    if request.kind == "quote":
        usage_kind = "quote"
    else:
        usage_kind = "followup" if request.is_followup else "diagnosis"
    reservation = reserve_usage(http_request, store, usage_kind)
    try:
        return _run_diagnosis(request)
    except Exception:
        release_usage(store, reservation)
        raise


def _run_diagnosis(request: DiagnoseRequest):
    image_data = None
    if request.image_base64:
        image_data = base64.b64decode(request.image_base64)

    recall_info = None
    if request.car_year and request.car_make and request.car_model and not request.is_followup:
        recalls = get_recalls(request.car_year, request.car_make, request.car_model)
        recall_info = format_recalls_for_claude(recalls)

    conversation_history = None
    if request.conversation_history:
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

    result = diagnose_car(
        text=request.text,
        image_data=image_data,
        image_type=request.image_type,
        car_info=f"{request.car_year} {request.car_make} {request.car_model} {request.car_engine or ''}".strip() if request.car_year else None,
        recall_info=recall_info,
        conversation_history=conversation_history,
        is_followup=request.is_followup
    )

    videos = []
    if not request.is_followup:
        videos = get_repair_videos(
            diagnosis=request.text or "car repair",
            car_year=request.car_year,
            car_make=request.car_make,
            car_model=request.car_model
        )

    save_diagnosis(
        problem_text=request.text or "Image uploaded",
        diagnosis=result
    )

    return {
        "diagnosis": result,
        "recalls": recall_info,
        "videos": videos
    }