-- ============================================================
-- Supabase SQL Schema for Telegram Bot (Multi-Bot / BOT_ID support)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Bot configuration table (one row per bot_id + key)
CREATE TABLE IF NOT EXISTS bot_config (
  bot_id TEXT NOT NULL DEFAULT 'default',
  key    TEXT NOT NULL,
  value  TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (bot_id, key)
);

-- Insert default config for bot1, bot2, bot3
DO $$
DECLARE
  bots TEXT[] := ARRAY['bot1', 'bot2', 'bot3'];
  b TEXT;
BEGIN
  FOREACH b IN ARRAY bots LOOP
    INSERT INTO bot_config (bot_id, key, value) VALUES
      (b, 'welcome_text',              '👋 <b>Welcome!</b>\n\nChoose an option below to get started.'),
      (b, 'welcome_media_url',         ''),
      (b, 'demo_button_url',           'https://t.me/'),
      (b, 'how_to_use_button_url',     'https://t.me/'),
      (b, 'premium_photo_url',         ''),
      (b, 'premium_text',              '🌟 <b>Get Premium Access!</b>\n\nChoose your payment method below.'),
      (b, 'upi_qr_url',               ''),
      (b, 'upi_message',              '💳 <b>Pay via UPI</b>\n\nScan the QR code above and complete your payment.\nAfter paying, tap the button below.'),
      (b, 'crypto_qr_url',            ''),
      (b, 'crypto_message',           '₿ <b>Pay via Crypto</b>\n\nSend payment to the wallet shown above.\nAfter paying, tap the button below.'),
      (b, 'payment_confirmed_message', '🎉 <b>Payment Confirmed!</b>\n\nYour premium access has been activated. Welcome! 🌟\n\nThank you for your trust! 🙏')
    ON CONFLICT (bot_id, key) DO NOTHING;
  END LOOP;
END $$;

-- Payments table (each row tagged with bot_id)
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id              TEXT NOT NULL DEFAULT 'default',
  user_id             BIGINT NOT NULL,
  username            TEXT,
  payment_type        TEXT NOT NULL CHECK (payment_type IN ('upi', 'crypto')),
  screenshot_file_id  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_bot_id  ON payments (bot_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments (status);

-- Bot Users table (Store ALL users who interact with the bot)
CREATE TABLE IF NOT EXISTS bot_users (
  bot_id      TEXT NOT NULL DEFAULT 'default',
  user_id     BIGINT NOT NULL,
  username    TEXT,
  first_name  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (bot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_users_bot  ON bot_users (bot_id);
