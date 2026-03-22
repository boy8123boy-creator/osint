# 🛡️ OSINT Intelligence Scanner — Telegram Mini App

Foydalanuvchi haqida ochiq manbalardan (Sherlock, Telegram API, TOSINT) ma'lumot yig'uvchi kiber-xavfsizlik Telegram Mini App.

## 🚀 Features

- **OSINT Qidiruv** — Sherlock orqali 350+ saytda username qidiruv
- **Telegram Intelligence** — Telethon orqali profil, bio, online status
- **Cyberpunk UI** — Dark mode, neon glow, scan animatsiyalari
- **Telegram Stars** — To'lov tizimi integratsiyasi
- **Admin Panel** — Tariflar boshqaruvi, foydalanuvchilarga qidiruv berish
- **MongoDB** — Foydalanuvchilar, tariflar, qidiruv tarixi

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Framer Motion |
| Backend | Python FastAPI + Motor (async MongoDB) |
| Database | MongoDB Atlas |
| OSINT | Sherlock + Telethon + TOSINT-inspired |
| Bot | python-telegram-bot v21 |
| Payments | Telegram Stars API |

## 🛠️ Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
# .env faylini sozlang (qarang: .env.example)
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (.env)

```env
BOT_TOKEN=your_bot_token
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
MONGODB_URI=mongodb+srv://your_connection
ADMIN_ID=5944975917
WEBAPP_URL=http://localhost:5173
```

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Bot boshlanishi + Mini App tugmasi |
| `/admin` | Admin panel (faqat admin uchun) |
| `/grant {user_id} {count}` | Foydalanuvchiga qidiruv berish |
| `/stats` | Statistika |

## 📱 Mini App Pages

1. **Home** — Username qidiruv, skan animatsiya, natijalar
2. **Pay** — Tariflar, chegirma hisoblash, Stars to'lov
3. **Profile** — Profil, balans, qidiruv tarixi

## 👑 Admin (ID: 5944975917)

- Cheksiz qidiruv imkoniyati
- Tariflarni boshqarish
- Foydalanuvchilarga qidiruv berish (5ta, 10ta, ...)
- Statistika ko'rish

## 📄 License

MIT
