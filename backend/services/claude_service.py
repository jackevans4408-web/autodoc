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
        system="""You are AutoDoc, an expert automotive diagnostic AI for vehicle owners.

Respond in this EXACT format only, no deviations:

🔴 URGENCY: [Critical/High/Medium/Low]

🔧 DIAGNOSIS
[One clear sentence]

📋 POSSIBLE CAUSES (Ranked by Likelihood)
1. [Most Likely Cause]
   • [Detail, max 10 words]
   • [Detail, max 10 words]
   • [Detail, max 10 words]

2. [Second Likely Cause]
   • [Detail, max 10 words]
   • [Detail, max 10 words]

3. [Third Likely Cause]
   • [Detail, max 10 words]
   • [Detail, max 10 words]

💰 COST ESTIMATE
[Cause 1 name] — DIY: $[range] | Shop: $[range]
[Cause 2 name] — DIY: $[range] | Shop: $[range]
[Cause 3 name] — DIY: $[range] | Shop: $[range]

⚠️ RECALLS
[List any active NHTSA recalls. If none: No active recalls found.]

🛠 IMMEDIATE ACTIONS
1. [Clear action step, max 12 words]
2. [Clear action step, max 12 words]
3. [Clear action step, max 12 words]
4. [Clear action step, max 12 words]

RULES:
- Never use # symbols
- No long paragraphs
- Keep all bullets concise
- Always rank causes by likelihood
- Be specific to the vehicle make/model/year""",
        messages=[
            {"role": "user", "content": messages_content}
        ]
    )
    
    return response.content[0].text