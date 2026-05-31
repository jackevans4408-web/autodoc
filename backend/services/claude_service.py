import anthropic
import base64
from dotenv import load_dotenv
import os

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("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"))

def diagnose_car(text: str = None, image_data: bytes = None, image_type: str = None):
    
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
    
    if text:
        messages_content.append({
            "type": "text",
            "text": text
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
        Be specific, practical, and easy to understand for non-mechanics.""",
        messages=[
            {"role": "user", "content": messages_content}
        ]
    )
    
    return response.content[0].text