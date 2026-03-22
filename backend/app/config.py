import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    TELEGRAM_API_ID: int = int(os.getenv("TELEGRAM_API_ID", "0"))
    TELEGRAM_API_HASH: str = os.getenv("TELEGRAM_API_HASH", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/osint_tma")
    ADMIN_ID: int = int(os.getenv("ADMIN_ID", "5944975917"))
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "http://localhost:5173")
    FREE_SEARCHES: int = 3
    DB_NAME: str = "osint_tma"

    class Config:
        env_file = ".env"


settings = Settings()
