import asyncio
import logging
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


def build_app(token: str, bot_id: str) -> Application:
    """Build a fully configured Application for a single bot instance."""
    app = Application.builder().token(token).build()

    # Store bot_id in bot_data so handlers can access it
    app.bot_data["bot_id"] = bot_id

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
    """Run a single bot with polling."""
    logger.info(f"Starting bot: {bot_id}")
    app = build_app(token, bot_id)
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    logger.info(f"Bot {bot_id} is running!")
    # Keep running forever
    await asyncio.Event().wait()


async def main():
    bot_tokens = get_all_bot_tokens()
    if not bot_tokens:
        logger.error("No bot tokens found! Set BOT_TOKEN_1, BOT_TOKEN_2 etc. in env.")
        return

    logger.info(f"Starting {len(bot_tokens)} bot(s): {list(bot_tokens.keys())}")
    # Run all bots concurrently
    await asyncio.gather(
        *[run_bot(token, bot_id) for bot_id, token in bot_tokens.items()]
    )


if __name__ == "__main__":
    asyncio.run(main())
