from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from bot.config import get_config, supabase


async def delete_previous(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        await update.callback_query.message.delete()
    except Exception:
        pass


async def send_welcome(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_id = context.bot_data.get("bot_id", "default")
    welcome_text = get_config("welcome_text", bot_id, "👋 Welcome! Choose an option below.")
    welcome_media_url = get_config("welcome_media_url", bot_id, "")
    demo_url = get_config("demo_button_url", bot_id, "https://t.me/")
    how_to_url = get_config("how_to_use_button_url", bot_id, "https://t.me/")

    keyboard = [
        [InlineKeyboardButton("💎 Get Premium", callback_data="get_premium")],
        [InlineKeyboardButton("🎥 Premium Demo ↗", url=demo_url)],
        [InlineKeyboardButton("✅ How To Get Premium? ↗", url=how_to_url)],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    chat_id = update.effective_chat.id

    if welcome_media_url:
        await context.bot.send_photo(
            chat_id=chat_id, photo=welcome_media_url,
            caption=welcome_text, reply_markup=reply_markup, parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id, text=welcome_text,
            reply_markup=reply_markup, parse_mode="HTML",
        )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await send_welcome(update, context)


async def get_premium_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    bot_id = context.bot_data.get("bot_id", "default")
    premium_photo_url = get_config("premium_photo_url", bot_id, "")
    premium_text = get_config("premium_text", bot_id, "🌟 <b>Get Premium Access!</b>\n\nChoose your payment method below.")

    keyboard = [
        [InlineKeyboardButton("💳 PAY VIA UPI", callback_data="pay_upi")],
        [InlineKeyboardButton("₿ PAY VIA CRYPTO", callback_data="pay_crypto")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="back_home")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    chat_id = update.effective_chat.id

    if premium_photo_url:
        await context.bot.send_photo(
            chat_id=chat_id, photo=premium_photo_url,
            caption=premium_text, reply_markup=reply_markup, parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id, text=premium_text,
            reply_markup=reply_markup, parse_mode="HTML",
        )


async def pay_upi_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    bot_id = context.bot_data.get("bot_id", "default")
    upi_qr_url = get_config("upi_qr_url", bot_id, "")
    upi_message = get_config("upi_message", bot_id, "💳 <b>Pay via UPI</b>\n\nScan the QR code above.")

    keyboard = [
        [InlineKeyboardButton("✅ I HAVE PAID", callback_data="paid_upi")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="get_premium")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    chat_id = update.effective_chat.id

    if upi_qr_url:
        await context.bot.send_photo(
            chat_id=chat_id, photo=upi_qr_url,
            caption=upi_message, reply_markup=reply_markup, parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id, text=upi_message,
            reply_markup=reply_markup, parse_mode="HTML",
        )


async def pay_crypto_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    bot_id = context.bot_data.get("bot_id", "default")
    crypto_qr_url = get_config("crypto_qr_url", bot_id, "")
    crypto_message = get_config("crypto_message", bot_id, "₿ <b>Pay via Crypto</b>\n\nScan the QR code above.")

    keyboard = [
        [InlineKeyboardButton("✅ I HAVE PAID", callback_data="paid_crypto")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="get_premium")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    chat_id = update.effective_chat.id

    if crypto_qr_url:
        await context.bot.send_photo(
            chat_id=chat_id, photo=crypto_qr_url,
            caption=crypto_message, reply_markup=reply_markup, parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id, text=crypto_message,
            reply_markup=reply_markup, parse_mode="HTML",
        )


async def back_home_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)
    await send_welcome(update, context)
