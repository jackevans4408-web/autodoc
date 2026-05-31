from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from backend.services.claude_service import diagnose_car

router = APIRouter()

@router.post("/diagnose")
async def diagnose(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    image_data = None
    image_type = None
    
    if image:
        image_data = await image.read()
        image_type = image.content_type
    
    result = diagnose_car(text=text, image_data=image_data, image_type=image_type)
    
    return {"diagnosis": result}