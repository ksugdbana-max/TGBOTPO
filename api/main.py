from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from bot.config import supabase, get_config, set_config, ADMIN_PASSWORD, API_SECRET, BOT_ID
import datetime
import telegram

app = FastAPI(title="TG Bot Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")


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


# ── Bot Info ──────────────────────────────────────────────────────────────────

@app.get("/info", dependencies=[Depends(verify_token)])
def get_info():
    """Return which BOT_ID this instance is running as."""
    return {"bot_id": BOT_ID}


# ── Config ────────────────────────────────────────────────────────────────────

class ConfigUpdate(BaseModel):
    value: str

@app.get("/config/{key}", dependencies=[Depends(verify_token)])
def get_config_endpoint(key: str):
    value = get_config(key)
    return {"key": key, "value": value}

@app.put("/config/{key}", dependencies=[Depends(verify_token)])
def update_config_endpoint(key: str, body: ConfigUpdate):
    set_config(key, body.value)
    return {"key": key, "value": body.value}

@app.get("/config", dependencies=[Depends(verify_token)])
def get_all_config():
    res = (
        supabase.table("bot_config")
        .select("key, value")
        .eq("bot_id", BOT_ID)
        .execute()
    )
    return {row["key"]: row["value"] for row in (res.data or [])}


# ── Payments ──────────────────────────────────────────────────────────────────

@app.get("/payments", dependencies=[Depends(verify_token)])
def get_payments():
    res = (
        supabase.table("payments")
        .select("*")
        .eq("bot_id", BOT_ID)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []

class PaymentAction(BaseModel):
    status: str  # "confirmed" or "rejected"

@app.patch("/payments/{payment_id}", dependencies=[Depends(verify_token)])
async def update_payment(payment_id: str, body: PaymentAction):
    if body.status not in ("confirmed", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'confirmed' or 'rejected'")

    # Fetch payment (scoped to this bot)
    res = (
        supabase.table("payments")
        .select("*")
        .eq("id", payment_id)
        .eq("bot_id", BOT_ID)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = res.data
    user_id = payment["user_id"]

    # Update status
    supabase.table("payments").update({
        "status": body.status,
        "updated_at": datetime.datetime.utcnow().isoformat(),
    }).eq("id", payment_id).execute()

    # Notify user via Telegram
    bot = telegram.Bot(token=BOT_TOKEN)
    try:
        if body.status == "confirmed":
            msg = get_config(
                "payment_confirmed_message",
                "🎉 <b>Payment Confirmed!</b>\n\nYour premium access has been activated. Welcome to the premium club! 🌟\n\nEnjoy all the exclusive features. Thank you for your trust! 🙏"
            )
        else:
            msg = (
                "❌ <b>Payment Rejected</b>\n\n"
                "Unfortunately, we could not verify your payment screenshot.\n"
                "Please make sure you send a clear screenshot showing the successful transaction.\n"
                "If you believe this is a mistake, please contact support.\n"
                "You can try again by sending /start. 🙏"
            )
        await bot.send_message(chat_id=user_id, text=msg, parse_mode="HTML")
    except Exception:
        pass

    return {"id": payment_id, "status": body.status}
