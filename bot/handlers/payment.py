from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from bot.config import supabase
import datetime

WAITING_SCREENSHOT_UPI = 1
WAITING_SCREENSHOT_CRYPTO = 2


async def paid_upi_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    try:
        await query.message.delete()
    except Exception:
        pass
    context.user_data["payment_type"] = "upi"
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="📸 <b>Please send your payment screenshot now.</b>\n\nWe will verify it and activate your premium access shortly.",
        parse_mode="HTML",
    )
    return WAITING_SCREENSHOT_UPI


async def paid_crypto_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    try:
        await query.message.delete()
    except Exception:
        pass
    context.user_data["payment_type"] = "crypto"
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text="📸 <b>Please send your payment screenshot now.</b>\n\nWe will verify it and activate your premium access shortly.",
        parse_mode="HTML",
    )
    return WAITING_SCREENSHOT_CRYPTO


async def receive_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    payment_type = context.user_data.get("payment_type", "upi")
    # Get the bot_id for this bot instance
    bot_id = context.bot_data.get("bot_id", "default")

    if not update.message.photo:
        await update.message.reply_text("❌ Please send a photo/screenshot of your payment.")
        return WAITING_SCREENSHOT_UPI if payment_type == "upi" else WAITING_SCREENSHOT_CRYPTO

    file_id = update.message.photo[-1].file_id

    try:
        supabase.table("payments").insert({
            "bot_id": bot_id,
            "user_id": user.id,
            "username": user.username or user.first_name or str(user.id),
            "payment_type": payment_type,
            "screenshot_file_id": file_id,
            "status": "pending",
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat(),
        }).execute()
    except Exception:
        await update.message.reply_text("⚠️ Something went wrong. Please try again later.")
        return ConversationHandler.END

    await update.message.reply_text(
        "✅ <b>Screenshot received!</b>\n\nOur admin will verify your payment shortly. You'll be notified once it's confirmed. Thank you! 🙏",
        parse_mode="HTML",
    )
    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("Cancelled.")
    return ConversationHandler.END
