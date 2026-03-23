"""
Telethon Service — Telegram user intelligence via MTProto API.
Fetches user profile info, bio, photos, online status, common chats, and stories.
With reconnection support and robust error handling.
"""

from telethon import TelegramClient
from telethon.tl.functions.users import GetFullUserRequest
from telethon.tl.functions.photos import GetUserPhotosRequest
from telethon.tl.functions.messages import GetCommonChatsRequest
from telethon.tl.types import (
    UserStatusOnline, UserStatusRecently, UserStatusOffline,
    Channel, Chat, ChatForbidden, ChannelForbidden,
)
from app.config import settings
import asyncio
import os

# Telethon client (session stored locally)
_client = None
_client_lock = asyncio.Lock()


async def get_client() -> TelegramClient:
    """Get or create Telethon client with reconnection support."""
    global _client
    async with _client_lock:
        if _client is None or not _client.is_connected():
            try:
                session_path = os.path.join(os.path.dirname(__file__), "..", "..", "telethon_session")
                _client = TelegramClient(
                    session_path,
                    settings.TELEGRAM_API_ID,
                    settings.TELEGRAM_API_HASH
                )
                await _client.start(bot_token=settings.BOT_TOKEN)
                print("✅ Telethon client connected")
            except Exception as e:
                print(f"❌ Telethon client connection failed: {e}")
                _client = None
                raise
    return _client


async def get_user_info(username: str) -> dict:
    """
    Get full user information from Telegram by username.
    Returns dict with user details including bio.
    """
    try:
        client = await get_client()
        
        # Resolve username to user entity
        entity = await client.get_entity(username)
        
        # Get full user info (includes bio)
        full_user = await client(GetFullUserRequest(entity))
        
        # Determine online status
        online_status = "unknown"
        if hasattr(entity, 'status'):
            if isinstance(entity.status, UserStatusOnline):
                online_status = "online"
            elif isinstance(entity.status, UserStatusRecently):
                online_status = "recently"
            elif isinstance(entity.status, UserStatusOffline):
                if entity.status.was_online:
                    online_status = f"last seen {entity.status.was_online}"
                else:
                    online_status = "offline"
        
        # Build result
        result = {
            "user_id": entity.id,
            "first_name": entity.first_name or "",
            "last_name": entity.last_name or "",
            "username": entity.username or "",
            "bio": full_user.full_user.about or "",
            "is_bot": entity.bot if hasattr(entity, 'bot') else False,
            "is_premium": getattr(entity, 'premium', None),
            "phone_hint": getattr(entity, 'phone', None),
            "online_status": online_status,
            "photo_url": None,
        }
        
        # Try to get profile photo
        if entity.photo:
            try:
                photos_dir = os.path.join(os.path.dirname(__file__), "..", "..", "photos")
                os.makedirs(photos_dir, exist_ok=True)
                photo_path = await client.download_profile_photo(
                    entity, 
                    file=os.path.join(photos_dir, f"{entity.id}.jpg")
                )
                if photo_path:
                    result["photo_url"] = f"/api/photos/{entity.id}.jpg"
            except Exception as e:
                print(f"⚠️ Could not download photo: {e}")
        
        return result
        
    except ValueError as e:
        print(f"❌ User not found: {username} — {e}")
        return None
    except ConnectionError as e:
        print(f"❌ Telethon connection error for {username}: {e}")
        # Reset client so it reconnects next time
        global _client
        _client = None
        return None
    except Exception as e:
        print(f"❌ Telethon error for {username}: {e}")
        return None


async def get_user_bio(user_id: int) -> str:
    """Get just the bio for a Telegram user by ID."""
    try:
        client = await get_client()
        entity = await client.get_entity(user_id)
        full_user = await client(GetFullUserRequest(entity))
        return full_user.full_user.about or ""
    except Exception as e:
        print(f"❌ Could not get bio for {user_id}: {e}")
        return ""


async def get_user_by_id(user_id: int) -> dict:
    """Get user info by Telegram user ID."""
    try:
        client = await get_client()
        entity = await client.get_entity(user_id)
        full_user = await client(GetFullUserRequest(entity))
        
        return {
            "user_id": entity.id,
            "first_name": entity.first_name or "",
            "last_name": entity.last_name or "",
            "username": entity.username or "",
            "bio": full_user.full_user.about or "",
            "is_bot": entity.bot if hasattr(entity, 'bot') else False,
            "is_premium": getattr(entity, 'premium', None),
        }
    except Exception as e:
        print(f"❌ Could not get user {user_id}: {e}")
        return None


async def get_common_chats(user_id: int) -> list:
    """
    Get common chats (groups/channels) between the bot and the target user.
    Uses GetCommonChatsRequest from Telethon MTProto API.
    Returns list of dicts with chat info.
    """
    chats = []
    try:
        client = await get_client()
        entity = await client.get_entity(user_id)
        
        result = await client(GetCommonChatsRequest(
            user_id=entity,
            max_id=0,
            limit=100
        ))
        
        for chat in result.chats:
            chat_type = "unknown"
            if isinstance(chat, Channel):
                chat_type = "channel" if chat.broadcast else "supergroup"
            elif isinstance(chat, Chat):
                chat_type = "group"
            elif isinstance(chat, (ChatForbidden, ChannelForbidden)):
                continue
            
            chats.append({
                "id": chat.id,
                "title": getattr(chat, 'title', 'Unknown'),
                "type": chat_type,
                "username": getattr(chat, 'username', None),
                "members_count": getattr(chat, 'participants_count', None),
            })
        
    except Exception as e:
        print(f"⚠️ Could not get common chats for {user_id}: {e}")
    
    return chats


async def get_user_stories(user_id: int) -> list:
    """
    Get user's profile stories via Telethon MTProto API.
    Downloads story media and returns list of story info dicts.
    """
    stories = []
    try:
        client = await get_client()
        entity = await client.get_entity(user_id)
        
        # Try to get stories using the stories API
        try:
            from telethon.tl.functions.stories import GetPeerStoriesRequest
            result = await client(GetPeerStoriesRequest(peer=entity))
            
            if result and hasattr(result, 'stories') and result.stories:
                story_items = result.stories.stories if hasattr(result.stories, 'stories') else []
                
                photos_dir = os.path.join(os.path.dirname(__file__), "..", "..", "photos")
                os.makedirs(photos_dir, exist_ok=True)
                
                for i, story in enumerate(story_items[:10]):  # Max 10 stories
                    story_info = {
                        "id": getattr(story, 'id', i),
                        "date": str(getattr(story, 'date', '')),
                        "media_url": None,
                        "views": getattr(story, 'views', None),
                    }
                    
                    # Try to download story media
                    if hasattr(story, 'media') and story.media:
                        try:
                            file_name = f"story_{user_id}_{story_info['id']}.jpg"
                            file_path = os.path.join(photos_dir, file_name)
                            await client.download_media(story.media, file=file_path)
                            story_info["media_url"] = f"/api/photos/{file_name}"
                        except Exception as me:
                            print(f"⚠️ Could not download story media: {me}")
                    
                    stories.append(story_info)
                    
        except ImportError:
            print("⚠️ Stories API not available in this Telethon version")
        except Exception as e:
            print(f"⚠️ Stories API error: {e}")
    
    except Exception as e:
        print(f"⚠️ Could not get stories for {user_id}: {e}")
    
    return stories

