from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from backend.services.claude_service import diagnose_car
from backend.services.supabase_service import save_diagnosis
from backend.services.nhtsa_service import get_recalls, format_recalls_for_claude
from backend.services.youtube_service import get_repair_videos
import base64

router = APIRouter()

class DiagnoseRequest(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    image_type: Optional[str] = "image/jpeg"
    car_year: Optional[str] = None
    car_make: Optional[str] = None
    car_model: Optional[str] = None

@router.post("/diagnose")
async def diagnose(request: DiagnoseRequest):
    image_data = None
    if request.image_base64:
        image_data = base64.b64decode(request.image_base64)

    recall_info = None
    if request.car_year and request.car_make and request.car_model:
        recalls = get_recalls(request.car_year, request.car_make, request.car_model)
        recall_info = format_recalls_for_claude(recalls)

    result = diagnose_car(
        text=request.text,
        image_data=image_data,
        image_type=request.image_type,
        car_info=f"{request.car_year} {request.car_make} {request.car_model}" if request.car_year else None,
        recall_info=recall_info
    )

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