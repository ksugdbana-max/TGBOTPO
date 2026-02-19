import logging
import datetime
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from bot.config import supabase

logger = logging.getLogger(__name__)

WAITING_SCREENSHOT_UPI = 1
WAITING_SCREENSHOT_CRYPTO = 2


async def paid_upi_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    try:
        await query.answer()
    except Exception:
        pass
    try:
        await query.message.delete()
    except Exception:
        pass
    context.user_data["payment_type"] = "upi"
    try:
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text="📸 <b>Please send your payment screenshot now.</b>\n\nWe will verify it and activate your premium access shortly.",
            parse_mode="HTML",
        )
    except Exception as e:
        logger.error(f"paid_upi_callback send error: {e}")
    return WAITING_SCREENSHOT_UPI


async def paid_crypto_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    try:
        await query.answer()
    except Exception:
        pass
    try:
        await query.message.delete()
    except Exception:
        pass
    context.user_data["payment_type"] = "crypto"
    try:
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text="📸 <b>Please send your payment screenshot now.</b>\n\nWe will verify it and activate your premium access shortly.",
            parse_mode="HTML",
        )
    except Exception as e:
        logger.error(f"paid_crypto_callback send error: {e}")
    return WAITING_SCREENSHOT_CRYPTO


async def receive_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    payment_type = context.user_data.get("payment_type", "upi")
    bot_id = context.bot_data.get("bot_id", "default")

    # Handle document images too
    if update.message.photo:
        file_id = update.message.photo[-1].file_id
    elif update.message.document:
        file_id = update.message.document.file_id
    else:
        try:
            await update.message.reply_text("❌ Please send a photo/screenshot of your payment.")
        except Exception:
            pass
        return WAITING_SCREENSHOT_UPI if payment_type == "upi" else WAITING_SCREENSHOT_CRYPTO

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
        logger.info(f"[{bot_id}] Payment saved for user {user.id} ({payment_type})")
    except Exception as e:
        logger.error(f"[{bot_id}] Supabase insert failed: {e}")
        try:
            await update.message.reply_text(
                "⚠️ We received your screenshot but had a temporary issue saving it. "
                "Please try again in a moment."
            )
        except Exception:
            pass
        return ConversationHandler.END

    try:
        await update.message.reply_text(
            "✅ <b>Screenshot received!</b>\n\nOur admin will verify your payment shortly. "
            "You'll be notified once it's confirmed. Thank you! 🙏",
            parse_mode="HTML",
        )
    except Exception as e:
        logger.error(f"reply_text error: {e}")

    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    try:
        await update.message.reply_text("Cancelled. Send /start to begin again.")
    except Exception:
        pass
    return ConversationHandler.END
