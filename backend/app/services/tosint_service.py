"""
TOSINT-inspired Service — Telegram Bot & Chat intelligence.
Inspired by https://github.com/drego85/tosint
Extracts bot info, chat metadata, admin lists through Bot API.
"""

import httpx
from typing import Optional, Dict, List, Any
from app.config import settings


BASE_URL = f"https://api.telegram.org/bot{settings.BOT_TOKEN}"


async def analyze_bot_token(token: str) -> Dict[str, Any]:
    """
    Analyze a Telegram bot token to extract intelligence.
    Similar to TOSINT's bot analysis feature.
    """
    bot_url = f"https://api.telegram.org/bot{token}"
    result = {
        "bot_info": None,
        "bot_description": None,
        "bot_short_description": None,
        "default_admin_rights_groups": None,
        "default_admin_rights_channels": None,
    }
    
    async with httpx.AsyncClient(timeout=15) as client:
        # Get bot info
        try:
            resp = await client.get(f"{bot_url}/getMe")
            data = resp.json()
            if data.get("ok"):
                result["bot_info"] = data["result"]
        except Exception as e:
            print(f"❌ getMe error: {e}")
        
        # Get bot description
        try:
            resp = await client.get(f"{bot_url}/getMyDescription")
            data = resp.json()
            if data.get("ok"):
                result["bot_description"] = data["result"].get("description", "")
        except:
            pass
        
        # Get short description
        try:
            resp = await client.get(f"{bot_url}/getMyShortDescription")
            data = resp.json()
            if data.get("ok"):
                result["bot_short_description"] = data["result"].get("short_description", "")
        except:
            pass
        
        # Default admin rights for groups
        try:
            resp = await client.get(f"{bot_url}/getMyDefaultAdministratorRights")
            data = resp.json()
            if data.get("ok"):
                result["default_admin_rights_groups"] = data["result"]
        except:
            pass
        
        # Default admin rights for channels
        try:
            resp = await client.get(f"{bot_url}/getMyDefaultAdministratorRights", params={"for_channels": True})
            data = resp.json()
            if data.get("ok"):
                result["default_admin_rights_channels"] = data["result"]
        except:
            pass
    
    return result


async def analyze_chat(chat_id: str) -> Dict[str, Any]:
    """
    Analyze a Telegram chat/channel/group to extract intelligence.
    Uses Bot API methods similar to TOSINT.
    """
    result = {
        "chat_info": None,
        "member_count": None,
        "administrators": [],
        "invite_link": None,
    }
    
    async with httpx.AsyncClient(timeout=15) as client:
        # Get chat info
        try:
            resp = await client.get(f"{BASE_URL}/getChat", params={"chat_id": chat_id})
            data = resp.json()
            if data.get("ok"):
                chat = data["result"]
                result["chat_info"] = {
                    "id": chat.get("id"),
                    "title": chat.get("title"),
                    "type": chat.get("type"),
                    "username": chat.get("username"),
                    "description": chat.get("description"),
                    "has_visible_history": chat.get("has_visible_history"),
                    "has_hidden_members": chat.get("has_hidden_members"),
                    "has_protected_content": chat.get("has_protected_content"),
                    "join_by_request": chat.get("join_by_request"),
                    "slow_mode_delay": chat.get("slow_mode_delay"),
                    "linked_chat_id": chat.get("linked_chat_id"),
                    "invite_link": chat.get("invite_link"),
                }
        except Exception as e:
            print(f"❌ getChat error: {e}")
        
        # Get member count
        try:
            resp = await client.get(f"{BASE_URL}/getChatMemberCount", params={"chat_id": chat_id})
            data = resp.json()
            if data.get("ok"):
                result["member_count"] = data["result"]
        except:
            pass
        
        # Get administrators
        try:
            resp = await client.get(f"{BASE_URL}/getChatAdministrators", params={"chat_id": chat_id})
            data = resp.json()
            if data.get("ok"):
                for admin in data["result"]:
                    user = admin.get("user", {})
                    result["administrators"].append({
                        "user_id": user.get("id"),
                        "first_name": user.get("first_name"),
                        "username": user.get("username"),
                        "is_bot": user.get("is_bot"),
                        "status": admin.get("status"),
                        "custom_title": admin.get("custom_title"),
                        "is_anonymous": admin.get("is_anonymous"),
                    })
        except:
            pass
    
    return result


async def get_user_profile_photos(user_id: int) -> List[str]:
    """Get user profile photos via Bot API."""
    photos = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASE_URL}/getUserProfilePhotos",
                params={"user_id": user_id, "limit": 5}
            )
            data = resp.json()
            if data.get("ok"):
                for photo_set in data["result"].get("photos", []):
                    if photo_set:
                        # Get the largest photo
                        largest = max(photo_set, key=lambda p: p.get("file_size", 0))
                        file_id = largest.get("file_id")
                        if file_id:
                            # Get file path
                            file_resp = await client.get(
                                f"{BASE_URL}/getFile",
                                params={"file_id": file_id}
                            )
                            file_data = file_resp.json()
                            if file_data.get("ok"):
                                file_path = file_data["result"].get("file_path")
                                photo_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}"
                                photos.append(photo_url)
    except Exception as e:
        print(f"❌ Profile photos error: {e}")
    
    return photos
