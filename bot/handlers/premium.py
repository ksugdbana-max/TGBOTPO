from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto
from telegram.ext import ContextTypes
from bot.config import get_config, supabase


async def delete_previous(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Delete the message that triggered the callback."""
    try:
        await update.callback_query.message.delete()
    except Exception:
        pass


async def send_welcome(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send the welcome message with media and buttons."""
    welcome_text = get_config("welcome_text", "👋 Welcome! Choose an option below.")
    welcome_media_url = get_config("welcome_media_url", "")
    demo_url = get_config("demo_button_url", "https://t.me/")
    how_to_url = get_config("how_to_use_button_url", "https://t.me/")

    keyboard = [
        [InlineKeyboardButton("💎 Get Premium", callback_data="get_premium")],
        [InlineKeyboardButton("🎥 Premium Demo ↗", url=demo_url)],
        [InlineKeyboardButton("✅ How To Get Premium? ↗", url=how_to_url)],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    chat_id = update.effective_chat.id

    if welcome_media_url:
        await context.bot.send_photo(
            chat_id=chat_id,
            photo=welcome_media_url,
            caption=welcome_text,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id,
            text=welcome_text,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await send_welcome(update, context)


async def get_premium_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle Get Premium button."""
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    premium_photo_url = get_config("premium_photo_url", "")
    premium_text = get_config("premium_text", "🌟 <b>Get Premium Access!</b>\n\nChoose your payment method below.")

    keyboard = [
        [InlineKeyboardButton("💳 PAY VIA UPI", callback_data="pay_upi")],
        [InlineKeyboardButton("₿ PAY VIA CRYPTO", callback_data="pay_crypto")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="back_home")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    chat_id = update.effective_chat.id

    if premium_photo_url:
        await context.bot.send_photo(
            chat_id=chat_id,
            photo=premium_photo_url,
            caption=premium_text,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id,
            text=premium_text,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )


async def pay_upi_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle PAY VIA UPI button."""
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    upi_qr_url = get_config("upi_qr_url", "")
    upi_message = get_config("upi_message", "💳 <b>Pay via UPI</b>\n\nScan the QR code above to complete your payment.")

    keyboard = [
        [InlineKeyboardButton("✅ I HAVE PAID", callback_data="paid_upi")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="get_premium")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    chat_id = update.effective_chat.id

    if upi_qr_url:
        await context.bot.send_photo(
            chat_id=chat_id,
            photo=upi_qr_url,
            caption=upi_message,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id,
            text=upi_message,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )


async def pay_crypto_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle PAY VIA CRYPTO button."""
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)

    crypto_qr_url = get_config("crypto_qr_url", "")
    crypto_message = get_config("crypto_message", "₿ <b>Pay via Crypto</b>\n\nScan the QR code above to complete your payment.")

    keyboard = [
        [InlineKeyboardButton("✅ I HAVE PAID", callback_data="paid_crypto")],
        [InlineKeyboardButton("⬅️ BACK", callback_data="get_premium")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    chat_id = update.effective_chat.id

    if crypto_qr_url:
        await context.bot.send_photo(
            chat_id=chat_id,
            photo=crypto_qr_url,
            caption=crypto_message,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )
    else:
        await context.bot.send_message(
            chat_id=chat_id,
            text=crypto_message,
            reply_markup=reply_markup,
            parse_mode="HTML",
        )


async def back_home_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle BACK to home button."""
    query = update.callback_query
    await query.answer()
    await delete_previous(update, context)
    await send_welcome(update, context)
