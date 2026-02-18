# 🤖 Telegram Bot + Admin Panel

A full-featured Telegram bot with premium flow, UPI/Crypto payment handling, and a web-based admin panel.

## 📁 Project Structure

```
├── bot/                  # Telegram Bot (Python)
│   ├── main.py           # Entry point
│   ├── config.py         # Supabase client + config helpers
│   └── handlers/
│       ├── premium.py    # Welcome, Get Premium, UPI, Crypto flows
│       └── payment.py    # Screenshot collection + DB save
├── api/
│   └── main.py           # FastAPI backend (config CRUD + payment management)
├── admin/                # Next.js Admin Panel
│   ├── pages/            # login, dashboard, welcome, buttons, premium, upi, crypto, confirmation, users
│   ├── components/       # Layout sidebar
│   └── lib/api.js        # API client
├── supabase_schema.sql   # Run this in Supabase SQL Editor
├── Procfile              # Koyeb deployment
├── vercel.json           # Vercel deployment (admin panel)
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

---

## 🚀 Setup

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) → create a project
2. Open **SQL Editor** → paste and run `supabase_schema.sql`
3. Copy your **Project URL** and **anon/service_role key**

### 2. Environment Variables

Create a `.env` file in the root:

```env
BOT_TOKEN=your_telegram_bot_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
API_SECRET=any_random_secret_string
ADMIN_PASSWORD=your_admin_panel_password
```

For the admin panel, create `admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-koyeb-app.koyeb.app
NEXT_PUBLIC_BOT_TOKEN=your_telegram_bot_token
```

---

## 🏃 Running Locally

### Bot + API
```bash
pip install -r requirements.txt
# In one terminal:
uvicorn api.main:app --reload --port 8000
# In another terminal:
python -m bot.main
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
# Open http://localhost:3000
```

---

## ☁️ Deployment

### Bot + API → Koyeb
1. Push this repo to GitHub
2. Go to [koyeb.com](https://koyeb.com) → New App → GitHub
3. Select your repo
4. Set environment variables (BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY, API_SECRET, ADMIN_PASSWORD)
5. Koyeb will use the `Procfile` automatically
6. Copy your Koyeb app URL (e.g. `https://your-app.koyeb.app`)

### Admin Panel → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. Set **Root Directory** to `admin`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-app.koyeb.app`
4. Deploy!

---

## 🤖 Bot Features

| Feature | Description |
|---|---|
| `/start` | Welcome message with photo + 3 buttons |
| Get Premium | Shows premium photo + UPI/Crypto/Back buttons |
| PAY VIA UPI | Shows UPI QR + message + I HAVE PAID button |
| PAY VIA CRYPTO | Shows Crypto QR + message + I HAVE PAID button |
| I HAVE PAID | Asks user for screenshot → saves to DB |
| Message deletion | Every button tap deletes previous message |

## 🖥️ Admin Panel Sections

| Section | What you can do |
|---|---|
| Welcome Message | Edit text + change photo |
| Button Links | Set Demo and How To Use URLs |
| Premium Section | Change premium photo + caption |
| UPI Payment | Change QR code + payment instructions |
| Crypto Payment | Change QR code + payment instructions |
| Confirmation Msg | Set the message sent on payment approval |
| Users & Payments | View screenshots, confirm or reject payments |

---

## 🗄️ Database Tables

### `bot_config`
Stores all configurable content (welcome text, photo URLs, payment messages, etc.)

### `payments`
Stores all payment submissions with user info, payment type, screenshot file_id, and status.
