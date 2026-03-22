"""
OSINT Telegram Mini App — FastAPI Backend
Main application entry point.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    
    # Start bot polling in background
    await bot_app.initialize()
    await bot_app.start()
    await bot_app.updater.start_polling(drop_pending_updates=True)
    print("✅ Telegram Bot started")
    
    # Create photos directory
    photos_dir = os.path.join(os.path.dirname(__file__), "..", "photos")
    os.makedirs(photos_dir, exist_ok=True)
    
    print("✅ OSINT TMA Backend ready!")
    print(f"📡 API: http://localhost:8000")
    print(f"🤖 Bot: @{settings.BOT_TOKEN.split(':')[0]}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    if bot_app:
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


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
