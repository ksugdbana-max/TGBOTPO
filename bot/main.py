import asyncio
import logging
from telegram import Update
from telegram.error import Conflict, NetworkError, TimedOut, TelegramError
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, ConversationHandler,
    MessageHandler, filters,
)
from bot.config import get_all_bot_tokens
from bot.handlers.premium import (
    start_command, get_premium_callback, pay_upi_callback,
    pay_crypto_callback, back_home_callback,
)
from bot.handlers.payment import (
    paid_upi_callback, paid_crypto_callback, receive_screenshot, cancel,
    WAITING_SCREENSHOT_UPI, WAITING_SCREENSHOT_CRYPTO,
)
from bot.handlers.admin import admin_command

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def error_handler(update: object, context) -> None:
    """Global error handler — logs all errors, never crashes the bot."""
    err = context.error
    if isinstance(err, Conflict):
        # Another instance is polling — this resolves itself on redeploy
        logger.warning(f"[{context.bot_data.get('bot_id')}] Conflict: another instance polling. Will retry...")
        return
    if isinstance(err, (NetworkError, TimedOut)):
        logger.warning(f"[{context.bot_data.get('bot_id')}] Network issue: {err}. Auto-retrying...")
        return
    # For any other error — log but DO NOT crash
    logger.error(f"[{context.bot_data.get('bot_id')}] Handler error: {err}", exc_info=err)


def build_app(token: str, bot_id: str) -> Application:
    """Build a fully configured Application for a single bot instance."""
    app = Application.builder().token(token).build()
    app.bot_data["bot_id"] = bot_id
    app.add_error_handler(error_handler)

    payment_conv = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(paid_upi_callback,    pattern="^paid_upi$"),
            CallbackQueryHandler(paid_crypto_callback, pattern="^paid_crypto$"),
        ],
        states={
            WAITING_SCREENSHOT_UPI: [
                MessageHandler(filters.PHOTO | filters.Document.IMAGE, receive_screenshot)
            ],
            WAITING_SCREENSHOT_CRYPTO: [
                MessageHandler(filters.PHOTO | filters.Document.IMAGE, receive_screenshot)
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(payment_conv)
    app.add_handler(CallbackQueryHandler(get_premium_callback,  pattern="^get_premium$"))
    app.add_handler(CallbackQueryHandler(pay_upi_callback,      pattern="^pay_upi$"))
    app.add_handler(CallbackQueryHandler(pay_crypto_callback,   pattern="^pay_crypto$"))
    app.add_handler(CallbackQueryHandler(back_home_callback,    pattern="^back_home$"))

    return app


async def run_bot(token: str, bot_id: str):
    """Run a single bot with auto-restart on any crash."""
    RETRY_DELAY = 5  # seconds between retries

    while True:  # outer loop — auto-restart if anything goes wrong
        app = None
        try:
            logger.info(f"[{bot_id}] Starting...")
            app = build_app(token, bot_id)
            await app.initialize()
            await app.start()
            await app.updater.start_polling(
                drop_pending_updates=True,
                allowed_updates=Update.ALL_TYPES,
            )
            logger.info(f"[{bot_id}] ✅ Running!")
            await asyncio.Event().wait()  # keep alive forever

        except Conflict:
            # Another instance is running (happens during Render redeploy)
            # Wait and let the new deployment take over
            logger.warning(f"[{bot_id}] Conflict — another instance running. Waiting {RETRY_DELAY}s...")
            await asyncio.sleep(RETRY_DELAY)

        except (NetworkError, TimedOut) as e:
            logger.warning(f"[{bot_id}] Network error: {e}. Retrying in {RETRY_DELAY}s...")
            await asyncio.sleep(RETRY_DELAY)

        except Exception as e:
            logger.error(f"[{bot_id}] Unexpected crash: {e}. Restarting in {RETRY_DELAY}s...")
            await asyncio.sleep(RETRY_DELAY)

        finally:
            # Always clean up before restarting
            if app:
                try:
                    if app.updater and app.updater.running:
                        await app.updater.stop()
                    if app.running:
                        await app.stop()
                    await app.shutdown()
                except Exception:
                    pass


async def main():
    bot_tokens = get_all_bot_tokens()
    if not bot_tokens:
        logger.error("No bot tokens found! Set BOT_TOKEN_1, BOT_TOKEN_2 etc. in env.")
        return

    logger.info(f"Starting {len(bot_tokens)} bot(s): {list(bot_tokens.keys())}")
    # Run all bots concurrently — each has its own crash-proof retry loop
    await asyncio.gather(
        *[run_bot(token, bot_id) for bot_id, token in bot_tokens.items()]
    )


if __name__ == "__main__":
    asyncio.run(main())
