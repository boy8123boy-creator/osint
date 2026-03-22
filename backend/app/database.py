import motor.motor_asyncio
from app.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
tariffs_collection = db["tariffs"]
search_history_collection = db["search_history"]


async def init_db():
    """Initialize database indexes and default data."""
    # Create indexes
    await users_collection.create_index("telegram_id", unique=True)
    await tariffs_collection.create_index("is_active")
    await search_history_collection.create_index("user_id")
    await search_history_collection.create_index("created_at")

    # Insert default tariffs if none exist
    count = await tariffs_collection.count_documents({})
    if count == 0:
        default_tariffs = [
            {
                "name": "Starter",
                "search_count": 1,
                "price_stars": 30,
                "is_active": True,
                "description": "1 ta OSINT qidiruv",
            },
            {
                "name": "Basic",
                "search_count": 5,
                "price_stars": 130,
                "is_active": True,
                "description": "5 ta OSINT qidiruv",
            },
            {
                "name": "Pro",
                "search_count": 15,
                "price_stars": 350,
                "is_active": True,
                "description": "15 ta OSINT qidiruv",
            },
            {
                "name": "Ultra",
                "search_count": 50,
                "price_stars": 999,
                "is_active": True,
                "description": "50 ta OSINT qidiruv",
            },
        ]
        await tariffs_collection.insert_many(default_tariffs)
        print("✅ Default tariffs inserted")

    print("✅ Database initialized successfully")
