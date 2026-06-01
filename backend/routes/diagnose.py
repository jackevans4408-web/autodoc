from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from backend.services.claude_service import diagnose_car
from backend.services.supabase_service import save_diagnosis
import base64

router = APIRouter()

class DiagnoseRequest(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    image_type: Optional[str] = "image/jpeg"

@router.post("/diagnose")
async def diagnose(request: DiagnoseRequest):
    image_data = None
    if request.image_base64:
        image_data = base64.b64decode(request.image_base64)
    
    result = diagnose_car(
        text=request.text,
        image_data=image_data,
        image_type=request.image_type
    )
    
    save_diagnosis(
        problem_text=request.text or "Image uploaded",
        diagnosis=result
    )
    
    return {"diagnosis": result}