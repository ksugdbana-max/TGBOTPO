-- ============================================================
-- Supabase SQL Schema for Telegram Bot
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Bot configuration table
CREATE TABLE IF NOT EXISTS bot_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Insert default config values
INSERT INTO bot_config (key, value) VALUES
  ('welcome_text',               '👋 <b>Welcome!</b>\n\nChoose an option below to get started.'),
  ('welcome_media_url',          ''),
  ('demo_button_url',            'https://t.me/'),
  ('how_to_use_button_url',      'https://t.me/'),
  ('premium_photo_url',          ''),
  ('premium_text',               '🌟 <b>Get Premium Access!</b>\n\nChoose your payment method below.'),
  ('upi_qr_url',                 ''),
  ('upi_message',                '💳 <b>Pay via UPI</b>\n\nScan the QR code above and complete your payment.\nAfter paying, tap the button below.'),
  ('crypto_qr_url',              ''),
  ('crypto_message',             '₿ <b>Pay via Crypto</b>\n\nSend payment to the wallet shown above.\nAfter paying, tap the button below.'),
  ('payment_confirmed_message',  '🎉 <b>Payment Confirmed!</b>\n\nYour premium access has been activated. Welcome to the premium club! 🌟\n\nEnjoy all the exclusive features. Thank you for your trust! 🙏')
ON CONFLICT (key) DO NOTHING;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             BIGINT NOT NULL,
  username            TEXT,
  payment_type        TEXT NOT NULL CHECK (payment_type IN ('upi', 'crypto')),
  screenshot_file_id  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments (status);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
