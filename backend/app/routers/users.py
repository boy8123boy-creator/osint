"""
Users Router — User registration, profile, and balance management.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models import UserCreate, UserResponse, GrantSearchRequest
from app.database import users_collection
from app.services import telethon_service
from app.config import settings

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/init", response_model=UserResponse)
async def init_user(user_data: UserCreate):
    """
    Initialize or update user from Telegram WebApp data.
    Creates new user with 3 free searches if not exists.
    """
    existing = await users_collection.find_one({"telegram_id": user_data.telegram_id})
    
    if existing:
        # Update existing user info
        update_data = {
            "username": user_data.username,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "photo_url": user_data.photo_url,
            "last_seen": datetime.now(timezone.utc),
        }
        await users_collection.update_one(
            {"telegram_id": user_data.telegram_id},
            {"$set": update_data}
        )
        updated = await users_collection.find_one({"telegram_id": user_data.telegram_id})
        return _user_to_response(updated)
    
    # Create new user with free searches
    is_admin = user_data.telegram_id == settings.ADMIN_ID
    
    # Try to get bio from Telegram
    bio = ""
    try:
        if user_data.username:
            info = await telethon_service.get_user_info(user_data.username)
            if info:
                bio = info.get("bio", "")
    except Exception as e:
        print(f"⚠️ Could not fetch bio: {e}")
    
    new_user = {
        "telegram_id": user_data.telegram_id,
        "username": user_data.username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "photo_url": user_data.photo_url,
        "language_code": user_data.language_code,
        "bio": bio,
        "balance": 999999 if is_admin else settings.FREE_SEARCHES,
        "is_admin": is_admin,
        "total_searches": 0,
        "created_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    }
    
    await users_collection.insert_one(new_user)
    created = await users_collection.find_one({"telegram_id": user_data.telegram_id})
    return _user_to_response(created)


@router.get("/{telegram_id}", response_model=UserResponse)
async def get_user(telegram_id: int):
    """Get user profile and balance."""
    user = await users_collection.find_one({"telegram_id": telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return _user_to_response(user)


@router.get("/{telegram_id}/bio")
async def get_user_bio(telegram_id: int):
    """Get user bio from Telegram (via Telethon)."""
    user = await users_collection.find_one({"telegram_id": telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    bio = ""
    try:
        bio = await telethon_service.get_user_bio(telegram_id)
        # Update bio in DB
        if bio:
            await users_collection.update_one(
                {"telegram_id": telegram_id},
                {"$set": {"bio": bio}}
            )
    except Exception as e:
        print(f"⚠️ Bio fetch error: {e}")
        bio = user.get("bio", "")
    
    return {"bio": bio}


@router.post("/grant")
async def grant_searches(request: GrantSearchRequest):
    """
    Admin: Grant search balance to a user.
    Only admin (5944975917) can use this.
    """
    # Note: In production, verify admin from initData
    target = await users_collection.find_one({"telegram_id": request.target_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    await users_collection.update_one(
        {"telegram_id": request.target_user_id},
        {"$inc": {"balance": request.search_count}}
    )
    
    updated = await users_collection.find_one({"telegram_id": request.target_user_id})
    return {
        "success": True,
        "message": f"{request.search_count} ta qidiruv berildi",
        "new_balance": updated.get("balance", 0)
    }


@router.get("/admin/all-users")
async def get_all_users():
    """Admin: Get all users list."""
    cursor = users_collection.find({}).sort("created_at", -1)
    users = []
    async for user in cursor:
        users.append(_user_to_response(user))
    return {"users": users, "total": len(users)}


def _user_to_response(user: dict) -> UserResponse:
    """Convert MongoDB user document to UserResponse."""
    return UserResponse(
        telegram_id=user.get("telegram_id", 0),
        username=user.get("username"),
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
        photo_url=user.get("photo_url"),
        bio=user.get("bio"),
        balance=user.get("balance", 0),
        is_admin=user.get("is_admin", False),
        total_searches=user.get("total_searches", 0),
        created_at=user.get("created_at", "").isoformat() if user.get("created_at") else None,
    )
