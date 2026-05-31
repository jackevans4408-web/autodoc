from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
from backend.services.claude_service import diagnose_car
from backend.services.supabase_service import save_diagnosis

router = APIRouter()

class DiagnoseRequest(BaseModel):
    text: Optional[str] = None

@router.post("/diagnose")
async def diagnose(request: DiagnoseRequest):
    result = diagnose_car(text=request.text)
    
    save_diagnosis(
        problem_text=request.text or "No text provided",
        diagnosis=result
    )
    
    return {"diagnosis": result}