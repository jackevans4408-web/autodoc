import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def save_diagnosis(problem_text: str, diagnosis: str, user_id: str = "anonymous"):
    data = {
        "user_id": user_id,
        "problem_text": problem_text,
        "diagnosis": diagnosis
    }
    result = supabase.table("diagnoses").insert(data).execute()
    return result

def get_diagnoses(user_id: str = "anonymous"):
    result = supabase.table("diagnoses").select("*").eq("user_id", user_id).execute()
    return result.data