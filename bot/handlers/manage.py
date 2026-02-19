"""
Bot-native admin panel — /manage command (admin only).

Each bot manages ITSELF. Admin sends /manage to bot1 to configure bot1, etc.
Photos stored as Telegram file_ids.

Features:
  - Welcome / Premium / UPI / Crypto config (text + photo)
  - Button Links
  - Pending Payments (approve / reject with user notification)
  - User List (approved users only)
  - Stats
  - Broadcast to all approved users
"""
import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ContextTypes, ConversationHandler, CommandHandler,
    CallbackQueryHandler, MessageHandler, filters,
)
from bot.config import get_config, set_config, supabase

logger = logging.getLogger(__name__)


def _admin_id() -> int:
    try:
        return int(os.getenv("ADMIN_TELEGRAM_ID", "0"))
    except Exception:
        return 0


def is_admin(user_id: int, bot_id: str = "default") -> bool:
    """Check primary admin OR extra admins stored in Supabase."""
    if user_id == _admin_id():
        return True
    try:
        raw = get_config("extra_admins", bot_id, "")
        if raw:
            ids = [int(x.strip()) for x in raw.split(",") if x.strip().isdigit()]
            return user_id in ids
    except Exception:
        pass
    return False


# ─── States ───────────────────────────────────────────────────────────────────
(
    MAIN_MENU,
    AWAIT_WELCOME_TEXT, AWAIT_WELCOME_PHOTO,
    AWAIT_PREMIUM_TEXT, AWAIT_PREMIUM_PHOTO,
    AWAIT_UPI_QR, AWAIT_UPI_MSG,
    AWAIT_CRYPTO_QR, AWAIT_CRYPTO_MSG,
    AWAIT_DEMO_URL, AWAIT_HOW_TO_URL,
    AWAIT_CONFIRMED_MSG,
    AWAIT_BROADCAST,
    AWAIT_ADD_ADMIN,
) = range(14)


# ─── Keyboards ────────────────────────────────────────────────────────────────
def _main_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("👋 Welcome",       callback_data="mgr_welcome"),
         InlineKeyboardButton("💎 Premium",       callback_data="mgr_premium")],
        [InlineKeyboardButton("💳 UPI Pay",       callback_data="mgr_upi"),
         InlineKeyboardButton("₿ Crypto Pay",    callback_data="mgr_crypto")],
        [InlineKeyboardButton("🔗 Button Links",  callback_data="mgr_buttons")],
        [InlineKeyboardButton("📋 Payments",      callback_data="mgr_payments"),
         InlineKeyboardButton("👥 Users",         callback_data="mgr_users")],
        [InlineKeyboardButton("📊 Stats",         callback_data="mgr_stats"),
         InlineKeyboardButton("📢 Broadcast",     callback_data="mgr_broadcast")],
        [InlineKeyboardButton("🎉 Confirm Msg",   callback_data="mgr_confirmed_msg")],
        [InlineKeyboardButton("👤 Admin Control", callback_data="mgr_admin_control")],
    ])


def _back_kb(cb="mgr_main"):
    return InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Main Menu", callback_data=cb)]])


def _welcome_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("✏️ Set Text",        callback_data="mgr_set_welcome_text"),
         InlineKeyboardButton("🖼 Set Photo",       callback_data="mgr_set_welcome_photo")],
        [InlineKeyboardButton("🗑 Remove Photo",    callback_data="mgr_del_welcome_photo")],
        [InlineKeyboardButton("⬅️ Back",            callback_data="mgr_main")],
    ])


def _premium_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("✏️ Set Text",        callback_data="mgr_set_premium_text"),
         InlineKeyboardButton("🖼 Set Photo",       callback_data="mgr_set_premium_photo")],
        [InlineKeyboardButton("🗑 Remove Photo",    callback_data="mgr_del_premium_photo")],
        [InlineKeyboardButton("⬅️ Back",            callback_data="mgr_main")],
    ])


def _upi_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🖼 Set QR Photo",    callback_data="mgr_set_upi_qr"),
         InlineKeyboardButton("✏️ Set Message",     callback_data="mgr_set_upi_msg")],
        [InlineKeyboardButton("🗑 Remove QR",       callback_data="mgr_del_upi_qr")],
        [InlineKeyboardButton("⬅️ Back",            callback_data="mgr_main")],
    ])


def _crypto_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🖼 Set QR Photo",    callback_data="mgr_set_crypto_qr"),
         InlineKeyboardButton("✏️ Set Message",     callback_data="mgr_set_crypto_msg")],
        [InlineKeyboardButton("🗑 Remove QR",       callback_data="mgr_del_crypto_qr")],
        [InlineKeyboardButton("⬅️ Back",            callback_data="mgr_main")],
    ])


def _buttons_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎥 Set Demo URL",     callback_data="mgr_set_demo_url")],
        [InlineKeyboardButton("✅ Set How-To URL",   callback_data="mgr_set_howto_url")],
        [InlineKeyboardButton("⬅️ Back",             callback_data="mgr_main")],
    ])


# ─── Helpers ─────────────────────────────────────────────────────────────────
async def _edit_or_send(update: Update, text: str, kb: InlineKeyboardMarkup):
    try:
        await update.callback_query.edit_message_text(text, reply_markup=kb, parse_mode="HTML")
    except Exception:
        try:
            await update.effective_chat.send_message(text, reply_markup=kb, parse_mode="HTML")
        except Exception as e:
            logger.error(f"_edit_or_send error: {e}")


async def _confirm(update: Update, context: ContextTypes.DEFAULT_TYPE, msg: str):
    try:
        await update.effective_chat.send_message(f"✅ <b>{msg}</b>", parse_mode="HTML")
    except Exception:
        pass
    return await _show_main(update, context)


def _fix_url(url: str) -> str:
    if not url or not url.strip():
        return "https://t.me/"
    url = url.strip()
    if url.startswith("@"):
        return f"https://t.me/{url[1:]}"
    if not url.startswith(("http://", "https://")):
        return f"https://{url}"
    return url


# ─── Main menu ───────────────────────────────────────────────────────────────
async def _show_main(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_id = context.bot_data.get("bot_id", "default")
    text = f"⚙️ <b>Admin Panel — {bot_id.upper()}</b>\n\nChoose a section to manage:"
    if update.callback_query:
        await _edit_or_send(update, text, _main_kb())
    else:
        try:
            await update.effective_chat.send_message(text, reply_markup=_main_kb(), parse_mode="HTML")
        except Exception as e:
            logger.error(f"_show_main error: {e}")
    return MAIN_MENU


async def manage_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_id = context.bot_data.get("bot_id", "default")
    if not is_admin(update.effective_user.id, bot_id):
        try:
            await update.message.reply_text("⛔ You are not authorized to use this command.")
        except Exception:
            pass
        return ConversationHandler.END
    return await _show_main(update, context)


async def cb_main(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    return await _show_main(update, context)


# ─── Section: Welcome ────────────────────────────────────────────────────────
async def cb_welcome(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    cur_text = get_config("welcome_text", bot_id, "(not set)")
    cur_photo = get_config("welcome_media_url", bot_id, "")
    await _edit_or_send(update,
        f"👋 <b>Welcome Settings</b>\n\n"
        f"<b>Photo:</b> {'✅ Set' if cur_photo else '❌ None'}\n\n"
        f"<b>Text:</b>\n<i>{cur_text[:300]}</i>",
        _welcome_kb())
    return MAIN_MENU


# ─── Section: Premium ─────────────────────────────────────────────────────────
async def cb_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    cur_text = get_config("premium_text", bot_id, "(not set)")
    cur_photo = get_config("premium_photo_url", bot_id, "")
    await _edit_or_send(update,
        f"💎 <b>Premium Settings</b>\n\n"
        f"<b>Photo:</b> {'✅ Set' if cur_photo else '❌ None'}\n\n"
        f"<b>Text:</b>\n<i>{cur_text[:300]}</i>",
        _premium_kb())
    return MAIN_MENU


# ─── Section: UPI ─────────────────────────────────────────────────────────────
async def cb_upi(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    cur_msg = get_config("upi_message", bot_id, "(not set)")
    cur_qr = get_config("upi_qr_url", bot_id, "")
    await _edit_or_send(update,
        f"💳 <b>UPI Payment Settings</b>\n\n"
        f"<b>QR Photo:</b> {'✅ Set' if cur_qr else '❌ None'}\n\n"
        f"<b>Message:</b>\n<i>{cur_msg[:300]}</i>",
        _upi_kb())
    return MAIN_MENU


# ─── Section: Crypto ──────────────────────────────────────────────────────────
async def cb_crypto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    cur_msg = get_config("crypto_message", bot_id, "(not set)")
    cur_qr = get_config("crypto_qr_url", bot_id, "")
    await _edit_or_send(update,
        f"₿ <b>Crypto Payment Settings</b>\n\n"
        f"<b>QR Photo:</b> {'✅ Set' if cur_qr else '❌ None'}\n\n"
        f"<b>Message:</b>\n<i>{cur_msg[:300]}</i>",
        _crypto_kb())
    return MAIN_MENU


# ─── Section: Button Links ────────────────────────────────────────────────────
async def cb_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    demo = get_config("demo_button_url", bot_id, "(not set)")
    howto = get_config("how_to_use_button_url", bot_id, "(not set)")
    await _edit_or_send(update,
        f"🔗 <b>Button Links</b>\n\n"
        f"<b>🎥 Demo URL:</b>\n<code>{demo}</code>\n\n"
        f"<b>✅ How-To URL:</b>\n<code>{howto}</code>",
        _buttons_kb())
    return MAIN_MENU


# ─── Section: Stats ───────────────────────────────────────────────────────────
async def cb_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try:
        all_p = supabase.table("payments").select("status").eq("bot_id", bot_id).execute().data or []
        total    = len(all_p)
        pending  = sum(1 for p in all_p if p["status"] == "pending")
        approved = sum(1 for p in all_p if p["status"] == "confirmed")
        rejected = sum(1 for p in all_p if p["status"] == "rejected")
    except Exception as e:
        logger.error(f"cb_stats error: {e}")
        total = pending = approved = rejected = 0

    await _edit_or_send(update,
        f"📊 <b>Stats — {bot_id.upper()}</b>\n\n"
        f"💰 Total Payments: <b>{total}</b>\n"
        f"⏳ Pending:  <b>{pending}</b>\n"
        f"✅ Approved: <b>{approved}</b>\n"
        f"❌ Rejected: <b>{rejected}</b>",
        _back_kb())
    return MAIN_MENU


# ─── Section: User List (Approved only) ──────────────────────────────────────
async def cb_users(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try:
        res = (supabase.table("payments")
               .select("user_id, username, payment_type, created_at")
               .eq("bot_id", bot_id)
               .eq("status", "confirmed")
               .order("created_at", desc=True)
               .execute())
        users = res.data or []
    except Exception as e:
        logger.error(f"cb_users error: {e}")
        users = []

    if not users:
        await _edit_or_send(update,
            "👥 <b>Approved Users</b>\n\n❌ No approved users yet.",
            _back_kb())
        return MAIN_MENU

    # Deduplicate by user_id (keep latest)
    seen = set()
    unique = []
    for u in users:
        if u["user_id"] not in seen:
            seen.add(u["user_id"])
            unique.append(u)

    lines = [f"👥 <b>Approved Users — {bot_id.upper()} ({len(unique)})</b>\n"]
    for i, u in enumerate(unique[:50], 1):
        uname = f"@{u['username']}" if u.get("username") else str(u["user_id"])
        ptype = u.get("payment_type", "?").upper()
        date  = str(u.get("created_at", ""))[:10]
        lines.append(f"{i}. {uname} | {ptype} | {date}")

    await _edit_or_send(update, "\n".join(lines), _back_kb())
    return MAIN_MENU


# ─── Section: Payments (Pending) ─────────────────────────────────────────────
async def cb_payments(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try:
        res = (supabase.table("payments")
               .select("*")
               .eq("bot_id", bot_id)
               .eq("status", "pending")
               .order("created_at", desc=False)
               .limit(10)
               .execute())
        payments = res.data or []
    except Exception as e:
        logger.error(f"cb_payments error: {e}")
        payments = []

    if not payments:
        await _edit_or_send(update,
            "📋 <b>Pending Payments</b>\n\n✅ No pending payments!",
            _back_kb())
        return MAIN_MENU

    try:
        await update.callback_query.edit_message_text(
            f"📋 <b>Pending Payments ({len(payments)})</b>\n\nSending cards...",
            parse_mode="HTML"
        )
    except Exception:
        pass

    for p in payments:
        pid   = p["id"]
        uname = p.get("username", "Unknown")
        uid   = p.get("user_id", "?")
        ptype = p.get("payment_type", "?").upper()
        time_str = str(p.get("created_at", ""))[:19].replace("T", " ")
        file_id  = p.get("screenshot_file_id", "")

        caption = (
            f"💰 <b>PAYMENT REQUEST</b>\n\n"
            f"👤 User: @{uname}\n"
            f"🆔 ID: <code>{uid}</code>\n"
            f"💳 Method: <b>{ptype}</b>\n"
            f"🕒 Time: {time_str}\n\n"
            f"<i>First admin action will be final.</i>"
        )
        kb = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ APPROVE", callback_data=f"mgr_approve_{pid}"),
            InlineKeyboardButton("❌ REJECT",  callback_data=f"mgr_reject_{pid}"),
        ]])
        try:
            if file_id:
                await update.effective_chat.send_photo(
                    photo=file_id, caption=caption, reply_markup=kb, parse_mode="HTML"
                )
            else:
                await update.effective_chat.send_message(
                    caption, reply_markup=kb, parse_mode="HTML"
                )
        except Exception as e:
            logger.error(f"send payment card error: {e}")

    try:
        await update.effective_chat.send_message(
            "👆 Use the buttons above to approve or reject.\nSend /manage to return to main menu.",
        )
    except Exception:
        pass
    return MAIN_MENU


# ─── Approve / Reject ─────────────────────────────────────────────────────────
async def cb_approve(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer("Processing...")
    payment_id = update.callback_query.data.replace("mgr_approve_", "")
    bot_id = context.bot_data.get("bot_id", "default")
    try:
        res = supabase.table("payments").select("*").eq("id", payment_id).single().execute()
        p = res.data
        supabase.table("payments").update({"status": "confirmed"}).eq("id", payment_id).execute()
        msg = get_config(
            "payment_confirmed_message", bot_id,
            "🎉 <b>Payment Confirmed!</b>\n\nYour premium access has been activated. Thank you! 🙏"
        )
        try:
            await context.bot.send_message(chat_id=p["user_id"], text=msg, parse_mode="HTML")
        except Exception as e:
            logger.warning(f"Could not notify user {p['user_id']}: {e}")

        try:
            await update.callback_query.edit_message_caption(
                caption=f"✅ <b>APPROVED</b> — @{p.get('username','?')} ({p.get('payment_type','?').upper()})",
                parse_mode="HTML",
                reply_markup=None,
            )
        except Exception:
            await update.effective_chat.send_message("✅ Payment approved.")
    except Exception as e:
        logger.error(f"approve error: {e}")
    return MAIN_MENU


async def cb_reject(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer("Processing...")
    payment_id = update.callback_query.data.replace("mgr_reject_", "")
    try:
        res = supabase.table("payments").select("*").eq("id", payment_id).single().execute()
        p = res.data
        supabase.table("payments").update({"status": "rejected"}).eq("id", payment_id).execute()
        try:
            await context.bot.send_message(
                chat_id=p["user_id"],
                text="❌ <b>Payment Rejected</b>\n\nYour payment could not be verified. Please contact support.",
                parse_mode="HTML",
            )
        except Exception as e:
            logger.warning(f"Could not notify user {p['user_id']}: {e}")

        try:
            await update.callback_query.edit_message_caption(
                caption=f"❌ <b>REJECTED</b> — @{p.get('username','?')} ({p.get('payment_type','?').upper()})",
                parse_mode="HTML",
                reply_markup=None,
            )
        except Exception:
            await update.effective_chat.send_message("❌ Payment rejected.")
    except Exception as e:
        logger.error(f"reject error: {e}")
    return MAIN_MENU


# ─── Section: Admin Control ──────────────────────────────────────────────────
async def cb_admin_control(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    raw = get_config("extra_admins", bot_id, "")
    extra_ids = [x.strip() for x in raw.split(",") if x.strip().isdigit()] if raw else []

    lines = [f"👤 <b>Admin Control — {bot_id.upper()}</b>\n"]
    lines.append(f"<b>Primary Admin:</b> <code>{_admin_id()}</code>\n")
    if extra_ids:
        lines.append("<b>Extra Admins:</b>")
        for uid in extra_ids:
            lines.append(f"  • <code>{uid}</code>")
    else:
        lines.append("<b>Extra Admins:</b> None")

    # Build keyboard: remove buttons for each extra admin + add button
    rows = []
    for uid in extra_ids:
        rows.append([InlineKeyboardButton(f"➖ Remove {uid}", callback_data=f"mgr_rmadmin_{uid}")])
    rows.append([InlineKeyboardButton("➕ Add Admin", callback_data="mgr_add_admin")])
    rows.append([InlineKeyboardButton("⬅️ Back", callback_data="mgr_main")])

    await _edit_or_send(update, "\n".join(lines), InlineKeyboardMarkup(rows))
    return MAIN_MENU


async def cb_add_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await _edit_or_send(update,
        "➕ <b>Add Admin</b>\n\n"
        "Send the <b>@username</b> (must have used this bot) or the numeric <b>User ID</b> of the person to promote.\n\n"
        "/cancel to abort.",
        _back_kb())
    return AWAIT_ADD_ADMIN


async def recv_add_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_id = context.bot_data.get("bot_id", "default")
    text = update.message.text.strip().lstrip("@")
    new_id = None

    # Try numeric ID first
    if text.isdigit():
        new_id = int(text)
    else:
        # Search by username in payments table
        try:
            res = (supabase.table("payments")
                   .select("user_id")
                   .eq("bot_id", bot_id)
                   .ilike("username", text)
                   .limit(1)
                   .execute())
            if res.data:
                new_id = res.data[0]["user_id"]
        except Exception as e:
            logger.error(f"recv_add_admin lookup error: {e}")

    if not new_id:
        await update.message.reply_text(
            "❌ User not found. Make sure they have used this bot before, or send their numeric Telegram ID.")
        return AWAIT_ADD_ADMIN

    # Don't double-add
    raw = get_config("extra_admins", bot_id, "")
    ids = [x.strip() for x in raw.split(",") if x.strip().isdigit()] if raw else []
    if str(new_id) not in ids:
        ids.append(str(new_id))
        set_config("extra_admins", ",".join(ids), bot_id)

    await update.message.reply_text(
        f"✅ <b>Admin added!</b> User <code>{new_id}</code> can now use /manage on this bot.",
        parse_mode="HTML")
    return await _confirm(update, context, f"Admin {new_id} added!")


async def cb_remove_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer("Removing...")
    bot_id = context.bot_data.get("bot_id", "default")
    rm_id = update.callback_query.data.replace("mgr_rmadmin_", "").strip()
    raw = get_config("extra_admins", bot_id, "")
    ids = [x.strip() for x in raw.split(",") if x.strip().isdigit() and x.strip() != rm_id] if raw else []
    set_config("extra_admins", ",".join(ids), bot_id)
    return await cb_admin_control(update, context)


# ─── Section: Broadcast ───────────────────────────────────────────────────────
async def cb_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await _edit_or_send(update,
        "📢 <b>Broadcast Message</b>\n\n"
        "Send the message you want to broadcast to <b>all approved users</b> of this bot.\n"
        "HTML formatting supported.\n\n"
        "Send /cancel to abort.",
        _back_kb())
    return AWAIT_BROADCAST


async def recv_broadcast(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_id = context.bot_data.get("bot_id", "default")
    text = update.message.text
    try:
        res = (supabase.table("payments")
               .select("user_id")
               .eq("bot_id", bot_id)
               .eq("status", "confirmed")
               .execute())
        rows = res.data or []
    except Exception as e:
        logger.error(f"broadcast fetch error: {e}")
        await update.message.reply_text("❌ Failed to fetch users.")
        return ConversationHandler.END

    # Unique user IDs
    user_ids = list({r["user_id"] for r in rows})
    sent = failed = 0
    status_msg = await update.message.reply_text(
        f"📢 Broadcasting to {len(user_ids)} users...", parse_mode="HTML"
    )
    for uid in user_ids:
        try:
            await context.bot.send_message(chat_id=uid, text=text, parse_mode="HTML")
            sent += 1
        except Exception:
            failed += 1

    try:
        await status_msg.edit_text(
            f"📢 <b>Broadcast Complete!</b>\n\n✅ Sent: {sent}\n❌ Failed: {failed}",
            parse_mode="HTML"
        )
    except Exception:
        pass
    return await _confirm(update, context, f"Broadcast done — {sent} sent, {failed} failed.")


# ─── Section: Confirmed Message ───────────────────────────────────────────────
async def cb_confirmed_msg(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    cur = get_config("payment_confirmed_message", bot_id, "(not set)")
    await _edit_or_send(update,
        f"🎉 <b>Payment Confirmed Message</b>\n\n<i>{cur[:300]}</i>\n\n"
        "Send the new message (HTML supported). Send /cancel to abort.",
        _back_kb())
    return AWAIT_CONFIRMED_MSG


# ─── "Ask for input" shorthands ───────────────────────────────────────────────
async def _ask(update, context, prompt, state):
    await update.callback_query.answer()
    await _edit_or_send(update, prompt, _back_kb())
    return state


async def cb_set_welcome_text(u, c):
    return await _ask(u, c, "✏️ <b>Welcome Text</b>\n\nSend the new welcome message. HTML supported.\n/cancel to abort.", AWAIT_WELCOME_TEXT)
async def cb_set_welcome_photo(u, c):
    return await _ask(u, c, "🖼 <b>Welcome Photo</b>\n\nSend the photo to use. /cancel to abort.", AWAIT_WELCOME_PHOTO)
async def cb_set_premium_text(u, c):
    return await _ask(u, c, "✏️ <b>Premium Text</b>\n\nSend the new premium message. HTML supported.\n/cancel to abort.", AWAIT_PREMIUM_TEXT)
async def cb_set_premium_photo(u, c):
    return await _ask(u, c, "🖼 <b>Premium Photo</b>\n\nSend the photo. /cancel to abort.", AWAIT_PREMIUM_PHOTO)
async def cb_set_upi_qr(u, c):
    return await _ask(u, c, "🖼 <b>UPI QR Code</b>\n\nSend the UPI QR photo. /cancel to abort.", AWAIT_UPI_QR)
async def cb_set_upi_msg(u, c):
    return await _ask(u, c, "✏️ <b>UPI Message</b>\n\nSend the UPI message. HTML supported.\n/cancel to abort.", AWAIT_UPI_MSG)
async def cb_set_crypto_qr(u, c):
    return await _ask(u, c, "🖼 <b>Crypto QR Code</b>\n\nSend the crypto QR photo. /cancel to abort.", AWAIT_CRYPTO_QR)
async def cb_set_crypto_msg(u, c):
    return await _ask(u, c, "✏️ <b>Crypto Message</b>\n\nSend the crypto message. HTML supported.\n/cancel to abort.", AWAIT_CRYPTO_MSG)
async def cb_set_demo_url(u, c):
    return await _ask(u, c, "🎥 <b>Demo Button URL</b>\n\nSend the URL (or @username). /cancel to abort.", AWAIT_DEMO_URL)
async def cb_set_howto_url(u, c):
    return await _ask(u, c, "✅ <b>How-To Button URL</b>\n\nSend the URL (or @username). /cancel to abort.", AWAIT_HOW_TO_URL)


# ─── Delete-photo callbacks ───────────────────────────────────────────────────
async def cb_del_welcome_photo(update, context):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try: set_config("welcome_media_url", "", bot_id)
    except Exception as e: logger.error(e)
    return await _confirm(update, context, "Welcome photo removed!")

async def cb_del_premium_photo(update, context):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try: set_config("premium_photo_url", "", bot_id)
    except Exception as e: logger.error(e)
    return await _confirm(update, context, "Premium photo removed!")

async def cb_del_upi_qr(update, context):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try: set_config("upi_qr_url", "", bot_id)
    except Exception as e: logger.error(e)
    return await _confirm(update, context, "UPI QR removed!")

async def cb_del_crypto_qr(update, context):
    await update.callback_query.answer()
    bot_id = context.bot_data.get("bot_id", "default")
    try: set_config("crypto_qr_url", "", bot_id)
    except Exception as e: logger.error(e)
    return await _confirm(update, context, "Crypto QR removed!")


# ─── Message receivers ────────────────────────────────────────────────────────
def _photo_id(msg):
    if msg.photo:
        return msg.photo[-1].file_id
    if msg.document:
        return msg.document.file_id
    return None


async def recv_welcome_text(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    try:    set_config("welcome_text", update.message.text, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_WELCOME_TEXT
    return await _confirm(update, context, "Welcome text updated!")

async def recv_welcome_photo(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    fid = _photo_id(update.message)
    if not fid: await update.message.reply_text("❌ Send a photo."); return AWAIT_WELCOME_PHOTO
    try:    set_config("welcome_media_url", fid, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_WELCOME_PHOTO
    return await _confirm(update, context, "Welcome photo updated!")

async def recv_premium_text(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    try:    set_config("premium_text", update.message.text, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_PREMIUM_TEXT
    return await _confirm(update, context, "Premium text updated!")

async def recv_premium_photo(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    fid = _photo_id(update.message)
    if not fid: await update.message.reply_text("❌ Send a photo."); return AWAIT_PREMIUM_PHOTO
    try:    set_config("premium_photo_url", fid, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_PREMIUM_PHOTO
    return await _confirm(update, context, "Premium photo updated!")

async def recv_upi_qr(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    fid = _photo_id(update.message)
    if not fid: await update.message.reply_text("❌ Send a photo."); return AWAIT_UPI_QR
    try:    set_config("upi_qr_url", fid, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_UPI_QR
    return await _confirm(update, context, "UPI QR updated!")

async def recv_upi_msg(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    try:    set_config("upi_message", update.message.text, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_UPI_MSG
    return await _confirm(update, context, "UPI message updated!")

async def recv_crypto_qr(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    fid = _photo_id(update.message)
    if not fid: await update.message.reply_text("❌ Send a photo."); return AWAIT_CRYPTO_QR
    try:    set_config("crypto_qr_url", fid, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_CRYPTO_QR
    return await _confirm(update, context, "Crypto QR updated!")

async def recv_crypto_msg(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    try:    set_config("crypto_message", update.message.text, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_CRYPTO_MSG
    return await _confirm(update, context, "Crypto message updated!")

async def recv_demo_url(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    url = _fix_url(update.message.text)
    try:    set_config("demo_button_url", url, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_DEMO_URL
    await update.message.reply_text(f"✅ Saved: <code>{url}</code>", parse_mode="HTML")
    return await _confirm(update, context, "Demo URL updated!")

async def recv_howto_url(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    url = _fix_url(update.message.text)
    try:    set_config("how_to_use_button_url", url, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_HOW_TO_URL
    await update.message.reply_text(f"✅ Saved: <code>{url}</code>", parse_mode="HTML")
    return await _confirm(update, context, "How-To URL updated!")

async def recv_confirmed_msg(update, context):
    bot_id = context.bot_data.get("bot_id", "default")
    try:    set_config("payment_confirmed_message", update.message.text, bot_id)
    except Exception as e:
        logger.error(e); await update.message.reply_text("❌ Save failed."); return AWAIT_CONFIRMED_MSG
    return await _confirm(update, context, "Confirmed message updated!")


# ─── Cancel ───────────────────────────────────────────────────────────────────
async def cancel_manage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try: await update.message.reply_text("❌ Cancelled. Send /manage anytime to open the panel.")
    except Exception: pass
    return ConversationHandler.END


# ─── Build handler ────────────────────────────────────────────────────────────
def build_manage_handler() -> ConversationHandler:
    photo_filter = filters.PHOTO | filters.Document.IMAGE

    return ConversationHandler(
        entry_points=[CommandHandler("manage", manage_command)],
        states={
            MAIN_MENU: [
                # Nav
                CallbackQueryHandler(cb_main,              pattern="^mgr_main$"),
                CallbackQueryHandler(cb_welcome,           pattern="^mgr_welcome$"),
                CallbackQueryHandler(cb_premium,           pattern="^mgr_premium$"),
                CallbackQueryHandler(cb_upi,               pattern="^mgr_upi$"),
                CallbackQueryHandler(cb_crypto,            pattern="^mgr_crypto$"),
                CallbackQueryHandler(cb_buttons,           pattern="^mgr_buttons$"),
                CallbackQueryHandler(cb_payments,          pattern="^mgr_payments$"),
                CallbackQueryHandler(cb_users,             pattern="^mgr_users$"),
                CallbackQueryHandler(cb_stats,             pattern="^mgr_stats$"),
                CallbackQueryHandler(cb_broadcast,         pattern="^mgr_broadcast$"),
                CallbackQueryHandler(cb_confirmed_msg,     pattern="^mgr_confirmed_msg$"),
                CallbackQueryHandler(cb_admin_control,     pattern="^mgr_admin_control$"),
                CallbackQueryHandler(cb_add_admin,         pattern="^mgr_add_admin$"),
                CallbackQueryHandler(cb_remove_admin,      pattern=r"^mgr_rmadmin_.+$"),
                # Set prompts
                CallbackQueryHandler(cb_set_welcome_text,  pattern="^mgr_set_welcome_text$"),
                CallbackQueryHandler(cb_set_welcome_photo, pattern="^mgr_set_welcome_photo$"),
                CallbackQueryHandler(cb_set_premium_text,  pattern="^mgr_set_premium_text$"),
                CallbackQueryHandler(cb_set_premium_photo, pattern="^mgr_set_premium_photo$"),
                CallbackQueryHandler(cb_set_upi_qr,        pattern="^mgr_set_upi_qr$"),
                CallbackQueryHandler(cb_set_upi_msg,       pattern="^mgr_set_upi_msg$"),
                CallbackQueryHandler(cb_set_crypto_qr,     pattern="^mgr_set_crypto_qr$"),
                CallbackQueryHandler(cb_set_crypto_msg,    pattern="^mgr_set_crypto_msg$"),
                CallbackQueryHandler(cb_set_demo_url,      pattern="^mgr_set_demo_url$"),
                CallbackQueryHandler(cb_set_howto_url,     pattern="^mgr_set_howto_url$"),
                # Delete
                CallbackQueryHandler(cb_del_welcome_photo, pattern="^mgr_del_welcome_photo$"),
                CallbackQueryHandler(cb_del_premium_photo, pattern="^mgr_del_premium_photo$"),
                CallbackQueryHandler(cb_del_upi_qr,        pattern="^mgr_del_upi_qr$"),
                CallbackQueryHandler(cb_del_crypto_qr,     pattern="^mgr_del_crypto_qr$"),
                # Payments
                CallbackQueryHandler(cb_approve, pattern=r"^mgr_approve_.+$"),
                CallbackQueryHandler(cb_reject,  pattern=r"^mgr_reject_.+$"),
            ],
            AWAIT_WELCOME_TEXT:  [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_welcome_text)],
            AWAIT_WELCOME_PHOTO: [MessageHandler(photo_filter, recv_welcome_photo)],
            AWAIT_PREMIUM_TEXT:  [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_premium_text)],
            AWAIT_PREMIUM_PHOTO: [MessageHandler(photo_filter, recv_premium_photo)],
            AWAIT_UPI_QR:        [MessageHandler(photo_filter, recv_upi_qr)],
            AWAIT_UPI_MSG:       [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_upi_msg)],
            AWAIT_CRYPTO_QR:     [MessageHandler(photo_filter, recv_crypto_qr)],
            AWAIT_CRYPTO_MSG:    [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_crypto_msg)],
            AWAIT_DEMO_URL:      [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_demo_url)],
            AWAIT_HOW_TO_URL:    [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_howto_url)],
            AWAIT_CONFIRMED_MSG: [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_confirmed_msg)],
            AWAIT_BROADCAST:     [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_broadcast)],
            AWAIT_ADD_ADMIN:     [MessageHandler(filters.TEXT & ~filters.COMMAND, recv_add_admin)],
        },
        fallbacks=[CommandHandler("cancel", cancel_manage)],
        allow_reentry=True,
        per_chat=True,
    )
