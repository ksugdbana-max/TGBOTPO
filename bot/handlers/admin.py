from telegram import Update
from telegram.ext import ContextTypes
from bot.config import get_all_bot_tokens
import os

ADMIN_TELEGRAM_ID = int(os.getenv("ADMIN_TELEGRAM_ID", "0"))
ADMIN_PANEL_URL = os.getenv("ADMIN_PANEL_URL", "https://your-admin-panel.vercel.app")


async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /admin command — only accessible by the admin Telegram ID."""
    user = update.effective_user

    if ADMIN_TELEGRAM_ID == 0:
        await update.message.reply_text("⚠️ Admin ID not configured.")
        return

    if user.id != ADMIN_TELEGRAM_ID:
        await update.message.reply_text("❌ You are not authorized to use this command.")
        return

    bot_id = context.bot_data.get("bot_id", "default")
    await update.message.reply_text(
        f"🔐 <b>Admin Panel Access</b>\n\n"
        f"🤖 Bot: <code>{bot_id}</code>\n"
        f"🔗 Panel: {ADMIN_PANEL_URL}\n\n"
        f"<i>Keep this link private!</i>",
        parse_mode="HTML",
        disable_web_page_preview=False,
    )
