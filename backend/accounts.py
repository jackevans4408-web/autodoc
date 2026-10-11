import os

from supabase import create_client


def delete_user_account(user_id: str) -> None:
    """Permanently delete a user's saved diagnoses and their login. Safe to call again if a previous attempt failed halfway.

    Uses the service-role key (the user's own token cannot delete the auth user). Subscription and usage rows are removed
    by the foreign-key cascade when the auth user is deleted.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to delete accounts")
    client = create_client(url, key)
    client.table("diagnoses").delete().eq("user_id", user_id).execute()
    client.auth.admin.delete_user(user_id)
