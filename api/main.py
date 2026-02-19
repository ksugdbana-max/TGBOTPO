from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, datetime
import httpx
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
API_SECRET   = os.getenv("API_SECRET", "changeme")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Map BOT_ID → BOT_TOKEN from env
# Set BOT_TOKEN_1, BOT_TOKEN_2, BOT_TOKEN_3 in your env
BOT_TOKENS: dict[str, str] = {}
for i in range(1, 6):  # support up to 5 bots
    token = os.getenv(f"BOT_TOKEN_{i}", "")
    bot_id = os.getenv(f"BOT_ID_{i}", f"bot{i}")
    if token:
        BOT_TOKENS[bot_id] = token

app = FastAPI(title="TG Bot Admin API — Multi-Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str

@app.post("/auth/login")
def login(req: LoginRequest):
    if req.password == ADMIN_PASSWORD:
        return {"token": API_SECRET}
    raise HTTPException(status_code=401, detail="Invalid password")

def verify_token(x_api_key: str = Header(...)):
    if x_api_key != API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Bots ──────────────────────────────────────────────────────────────────────

@app.get("/bots", dependencies=[Depends(verify_token)])
async def list_bots():
    """Return list of configured bots with their Telegram username."""
    bots = []
    async with httpx.AsyncClient(timeout=8) as client:
        for bot_id, token in BOT_TOKENS.items():
            name_override = _get_config_raw(bot_id, "bot_display_name", "")
            try:
                r = await client.get(f"https://api.telegram.org/bot{token}/getMe")
                data = r.json().get("result", {})
                bots.append({
                    "bot_id": bot_id,
                    "username": data.get("username", "unknown"),
                    "first_name": data.get("first_name", "Bot"),
                    "display_name": name_override or data.get("first_name", "Bot"),
                })
            except Exception:
                bots.append({
                    "bot_id": bot_id,
                    "username": "unknown",
                    "first_name": "Bot",
                    "display_name": name_override or bot_id,
                })
    return bots


# ── Config helpers ────────────────────────────────────────────────────────────

def _get_config_raw(bot_id: str, key: str, default=""):
    try:
        res = (supabase.table("bot_config")
               .select("value").eq("bot_id", bot_id).eq("key", key)
               .single().execute())
        return res.data["value"] if res.data else default
    except Exception:
        return default

def _set_config_raw(bot_id: str, key: str, value: str):
    supabase.table("bot_config").upsert(
        {"bot_id": bot_id, "key": key, "value": value}
    ).execute()


# ── Config endpoints ──────────────────────────────────────────────────────────

class ConfigUpdate(BaseModel):
    value: str

@app.get("/bots/{bot_id}/config", dependencies=[Depends(verify_token)])
def get_all_config(bot_id: str):
    if bot_id not in BOT_TOKENS:
        raise HTTPException(status_code=404, detail="Bot not found")
    res = (supabase.table("bot_config").select("key, value")
           .eq("bot_id", bot_id).execute())
    return {row["key"]: row["value"] for row in (res.data or [])}

@app.get("/bots/{bot_id}/config/{key}", dependencies=[Depends(verify_token)])
def get_config(bot_id: str, key: str):
    if bot_id not in BOT_TOKENS:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"key": key, "value": _get_config_raw(bot_id, key)}

@app.put("/bots/{bot_id}/config/{key}", dependencies=[Depends(verify_token)])
def update_config(bot_id: str, key: str, body: ConfigUpdate):
    if bot_id not in BOT_TOKENS:
        raise HTTPException(status_code=404, detail="Bot not found")
    _set_config_raw(bot_id, key, body.value)
    return {"key": key, "value": body.value}


# ── Payments endpoints ────────────────────────────────────────────────────────

@app.get("/payments", dependencies=[Depends(verify_token)])
def get_all_payments():
    """Get payments from ALL bots."""
    res = (supabase.table("payments").select("*")
           .order("created_at", desc=True).execute())
    return res.data or []

@app.get("/bots/{bot_id}/payments", dependencies=[Depends(verify_token)])
def get_bot_payments(bot_id: str):
    """Get payments for a specific bot."""
    res = (supabase.table("payments").select("*")
           .eq("bot_id", bot_id)
           .order("created_at", desc=True).execute())
    return res.data or []

class PaymentAction(BaseModel):
    status: str  # "confirmed" or "rejected"

@app.patch("/payments/{payment_id}", dependencies=[Depends(verify_token)])
async def update_payment(payment_id: str, body: PaymentAction):
    if body.status not in ("confirmed", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")

    res = (supabase.table("payments").select("*")
           .eq("id", payment_id).single().execute())
    if not res.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = res.data
    bot_id  = payment["bot_id"]
    user_id = payment["user_id"]
    token   = BOT_TOKENS.get(bot_id, "")

    supabase.table("payments").update({
        "status": body.status,
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }).eq("id", payment_id).execute()

    if token:
        import telegram
        bot = telegram.Bot(token=token)
        try:
            if body.status == "confirmed":
                msg = _get_config_raw(
                    bot_id, "payment_confirmed_message",
                    "🎉 <b>Payment Confirmed!</b>\n\nYour premium access has been activated. Welcome! 🌟"
                )
            else:
                msg = (
                    "❌ <b>Payment Rejected</b>\n\n"
                    "Unfortunately, we could not verify your payment screenshot.\n"
                    "Please send a clear screenshot of the successful transaction.\n"
                    "If you believe this is a mistake, contact support.\n"
                    "Try again with /start. 🙏"
                )
            await bot.send_message(chat_id=user_id, text=msg, parse_mode="HTML")
        except Exception:
            pass

    return {"id": payment_id, "status": body.status}
