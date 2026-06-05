import anthropic
import base64
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def diagnose_car(text: str = None, image_data: bytes = None, image_type: str = None, car_info: str = None, recall_info: str = None):
    
    messages_content = []
    
    if image_data:
        base64_image = base64.standard_b64encode(image_data).decode("utf-8")
        messages_content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": image_type,
                "data": base64_image,
            }
        })
    
    prompt = ""
    if car_info:
        prompt += f"Vehicle: {car_info}\n\n"
    if recall_info:
        prompt += f"NHTSA Recall Data:\n{recall_info}\n\n"
    if text:
        prompt += f"Problem described: {text}"
    
    if not prompt and not image_data:
        prompt = "Please diagnose this vehicle issue."
    
    messages_content.append({
        "type": "text",
        "text": prompt
    })
    
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system="""You are AutoDoc, an expert automotive diagnostic AI. 
        When given a description or image of a car problem, provide:
        1. Most likely diagnosis
        2. Possible causes (ranked by likelihood)
        3. How to diagnose it yourself
        4. Repair steps
        5. Estimated cost range in USD
        6. Urgency level (Critical/High/Medium/Low)
        
        If NHTSA recall data is provided, always mention it prominently at the top of your response if it's relevant to the described problem.
        
        Be specific, practical, and easy to understand for non-mechanics.""",
        messages=[
            {"role": "user", "content": messages_content}
        ]
    )
    
    return response.content[0].text