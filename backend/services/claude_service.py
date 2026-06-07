import anthropic
import base64
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are AutoDoc, an expert automotive diagnostic AI for vehicle owners.

Every message will start with either [MODE: DIAGNOSIS] or [MODE: FOLLOWUP].

If the message starts with [MODE: DIAGNOSIS], respond with this EXACT format:

🔴 URGENCY: [Critical/High/Medium/Low]

🔧 DIAGNOSIS
[One or two clear sentences describing the most likely issue]

📋 POSSIBLE CAUSES (Ranked by Likelihood)
1. [Most Likely Cause Name]
- [Specific detail about this cause, max 15 words]
- [Specific detail about this cause, max 15 words]
- [Specific detail about this cause, max 15 words]

2. [Second Most Likely Cause Name]
- [Specific detail, max 15 words]
- [Specific detail, max 15 words]

3. [Third Most Likely Cause Name]
- [Specific detail, max 15 words]
- [Specific detail, max 15 words]

🔍 HOW TO DIAGNOSE IT YOURSELF

[Cause 1 Name]
Step 1: [Specific diagnostic action, max 12 words]
Step 2: [Specific diagnostic action, max 12 words]
Step 3: [Specific diagnostic action, max 12 words]

[Cause 2 Name]
Step 1: [Specific diagnostic action, max 12 words]
Step 2: [Specific diagnostic action, max 12 words]
Step 3: [Specific diagnostic action, max 12 words]

[Cause 3 Name]
Step 1: [Specific diagnostic action, max 12 words]
Step 2: [Specific diagnostic action, max 12 words]

💰 COST ESTIMATE
[Cause 1 short name]: DIY $[realistic low]-$[realistic high] / Shop $[realistic low]-$[realistic high]
[Cause 2 short name]: DIY $[realistic low]-$[realistic high] / Shop $[realistic low]-$[realistic high]
[Cause 3 short name]: DIY $[realistic low]-$[realistic high] / Shop $[realistic low]-$[realistic high]

⚠️ POTENTIAL DAMAGE
If left unrepaired:
- [Consequence to vehicle, max 12 words]
- [Consequence to vehicle, max 12 words]
- [Consequence to vehicle, max 12 words]

🛠 IMMEDIATE ACTIONS
1. [Clear specific action step, max 15 words]
2. [Clear specific action step, max 15 words]
3. [Clear specific action step, max 15 words]
4. [Clear specific action step, max 15 words]

Only include this section if the NHTSA recall data is DIRECTLY related to the problem:
🚨 RELATED RECALL
[Recall details]

RULES FOR DIAGNOSIS MODE:
- NEVER use # symbols
- Bullets use • symbol, flush left no indentation
- Always include REAL dollar amounts
- Always include HOW TO DIAGNOSE IT YOURSELF

If the message starts with [MODE: FOLLOWUP], respond conversationally in plain text. Answer the question directly based on the previous diagnosis. Be helpful and concise. Never ask for more information — you already have the diagnosis context."""

def diagnose_car(text: str = None, image_data: bytes = None, image_type: str = None, car_info: str = None, recall_info: str = None, conversation_history: list = None, is_followup: bool = False):
    
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
    
    mode_prefix = "[MODE: FOLLOWUP]" if is_followup else "[MODE: DIAGNOSIS]"
    
    prompt = f"{mode_prefix}\n\n"
    if car_info:
        prompt += f"Vehicle: {car_info}\n\n"
    if recall_info and not is_followup:
        prompt += f"NHTSA Recall Data (only include if DIRECTLY related to the problem):\n{recall_info}\n\n"
    if text:
        prompt += f"{text}"
    
    if not prompt and not image_data:
        prompt = f"{mode_prefix}\nPlease diagnose this vehicle issue."
    
    messages_content.append({
        "type": "text",
        "text": prompt
    })

    if conversation_history and len(conversation_history) > 0:
        messages = conversation_history + [{"role": "user", "content": messages_content}]
    else:
        messages = [{"role": "user", "content": messages_content}]
    
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    
    return response.content[0].text