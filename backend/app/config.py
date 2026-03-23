from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    BOT_TOKEN: str
    TELEGRAM_API_ID: int
    TELEGRAM_API_HASH: str
    MONGODB_URI: str
    ADMIN_ID: int = 5944975917
    WEBAPP_URL: str = "https://osint-mrrg.vercel.app"
    FREE_SEARCHES: int = 3
    DB_NAME: str = "osint_tma"


try:
    settings = Settings()
except Exception as e:
    print(f"❌ Configuration Error: {e}")
    # Fallback for local dev if .env is missing but we want limited startup
    class FallbackSettings:
        BOT_TOKEN = ""
        TELEGRAM_API_ID = 0
        TELEGRAM_API_HASH = ""
        MONGODB_URI = "mongodb://localhost:27017/osint_tma"
        ADMIN_ID = 5944975917
        WEBAPP_URL = "http://localhost:5173"
        FREE_SEARCHES = 3
        DB_NAME = "osint_tma"
    settings = FallbackSettings()
