"""
OSINT Telegram Mini App — FastAPI Backend
Main application entry point.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from telegram import Update
from telegram.ext import Application

from app.config import settings
from app.database import init_db
from app.routers import search, users, tariffs, payments
from app.bot.handlers import setup_bot


# Telegram Bot application
bot_app = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown."""
    global bot_app
    
    print("🚀 Starting OSINT TMA Backend...")
    
    # Initialize database
    await init_db()
    print("✅ Database connected")
    
    # Initialize Telegram bot
    bot_app = Application.builder().token(settings.BOT_TOKEN).build()
    setup_bot(bot_app)
    
    # Start bot
    await bot_app.initialize()
    await bot_app.start()
    
    # Check for webhook vs polling
    # Railway usually provides a public URL or we can use the domain
    public_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", os.getenv("PUBLIC_URL"))
    
    if public_url:
        webhook_path = f"/api/bot/webhook/{settings.BOT_TOKEN.split(':')[0]}"
        webhook_url = f"https://{public_url}{webhook_path}"
        await bot_app.bot.set_webhook(url=webhook_url, drop_pending_updates=True)
        print(f"✅ Telegram Bot started (Webhook: {webhook_url})")
    else:
        # Polling (can cause Conflict during redeploys)
        await bot_app.updater.start_polling(drop_pending_updates=True)
        print("✅ Telegram Bot started (Polling)")
    
    # Create photos directory
    photos_dir = os.path.join(os.path.dirname(__file__), "..", "photos")
    os.makedirs(photos_dir, exist_ok=True)
    
    print("✅ OSINT TMA Backend ready!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    if bot_app:
        if not public_url:
            await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()
    print("👋 Goodbye!")


# Create FastAPI app
app = FastAPI(
    title="OSINT Mini App API",
    description="Telegram Mini App backend for OSINT intelligence gathering",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for profile photos
photos_dir = os.path.join(os.path.dirname(__file__), "..", "photos")
os.makedirs(photos_dir, exist_ok=True)
app.mount("/api/photos", StaticFiles(directory=photos_dir), name="photos")

# Include routers
app.include_router(search.router)
app.include_router(users.router)
app.include_router(tariffs.router)
app.include_router(payments.router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "OSINT TMA Backend",
        "version": "1.0.0",
    }


@app.post("/api/bot/webhook/{token_prefix}")
async def telegram_webhook(token_prefix: str, request: Request):
    """Handle incoming Telegram updates via webhook."""
    if not bot_app:
        return {"status": "error", "message": "Bot not initialized"}
        
    if token_prefix != settings.BOT_TOKEN.split(':')[0]:
        return {"status": "unauthorized"}
    
    try:
        data = await request.json()
        update = Update.de_json(data, bot_app.bot)
        await bot_app.update_queue.put(update)
    except Exception as e:
        print(f"❌ Webhook Error: {e}")
        
    return {"status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
