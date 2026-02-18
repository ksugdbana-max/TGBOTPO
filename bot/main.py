import logging
import asyncio
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ConversationHandler,
    MessageHandler,
    filters,
)
from bot.config import BOT_TOKEN
from bot.handlers.premium import (
    start_command,
    get_premium_callback,
    pay_upi_callback,
    pay_crypto_callback,
    back_home_callback,
)
from bot.handlers.payment import (
    paid_upi_callback,
    paid_crypto_callback,
    receive_screenshot,
    cancel,
    WAITING_SCREENSHOT_UPI,
    WAITING_SCREENSHOT_CRYPTO,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main():
    app = Application.builder().token(BOT_TOKEN).build()

    # Payment conversation handler (must be registered before generic callback handlers)
    payment_conv = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(paid_upi_callback, pattern="^paid_upi$"),
            CallbackQueryHandler(paid_crypto_callback, pattern="^paid_crypto$"),
        ],
        states={
            WAITING_SCREENSHOT_UPI: [
                MessageHandler(filters.PHOTO, receive_screenshot),
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_screenshot),
            ],
            WAITING_SCREENSHOT_CRYPTO: [
                MessageHandler(filters.PHOTO, receive_screenshot),
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_screenshot),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        per_user=True,
        per_chat=True,
    )

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(payment_conv)
    app.add_handler(CallbackQueryHandler(get_premium_callback, pattern="^get_premium$"))
    app.add_handler(CallbackQueryHandler(pay_upi_callback, pattern="^pay_upi$"))
    app.add_handler(CallbackQueryHandler(pay_crypto_callback, pattern="^pay_crypto$"))
    app.add_handler(CallbackQueryHandler(back_home_callback, pattern="^back_home$"))

    logger.info("Bot started polling...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
