import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN: str = os.environ["BOT_TOKEN"]
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]
API_SECRET: str = os.getenv("API_SECRET", "changeme")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

# Unique identifier for this bot instance (e.g. "bot1", "bot2", "bot3")
# Set a different BOT_ID for each Koyeb deployment
BOT_ID: str = os.getenv("BOT_ID", "default")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_config(key: str, default=None):
    """Fetch a single config value scoped to this BOT_ID."""
    try:
        res = (
            supabase.table("bot_config")
            .select("value")
            .eq("bot_id", BOT_ID)
            .eq("key", key)
            .single()
            .execute()
        )
        return res.data["value"] if res.data else default
    except Exception:
        return default


def set_config(key: str, value: str):
    """Upsert a config value scoped to this BOT_ID."""
    supabase.table("bot_config").upsert(
        {"bot_id": BOT_ID, "key": key, "value": value}
    ).execute()
