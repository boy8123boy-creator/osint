"""
OSINT Aggregator — Combines all OSINT services (Sherlock + Telethon + TOSINT).
Runs searches in parallel for maximum speed.
Each service has individual timeout protection.
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.services import sherlock_service, telethon_service, tosint_service


async def aggregate_search(username: str) -> Dict[str, Any]:
    """
    Run all OSINT searches in parallel for a username.
    Returns combined results from Sherlock, Telethon, and TOSINT-inspired checks.
    Each service is independently protected with timeouts.
    """
    # Clean username (remove @ if present)
    username = username.lstrip("@").strip()
    
    if not username:
        return {"error": "Username bo'sh bo'lmasligi kerak"}
    
    # Run all searches in parallel with individual timeouts
    sherlock_task = asyncio.create_task(
        _safe_sherlock_search(username)
    )
    telethon_task = asyncio.create_task(
        _safe_telethon_search(username)
    )
    
    # Wait for all results (each has its own timeout)
    sherlock_results, telegram_info = await asyncio.gather(
        sherlock_task, telethon_task,
        return_exceptions=True
    )
    
    # Handle exceptions from gather
    if isinstance(sherlock_results, Exception):
        print(f"❌ Sherlock gather exception: {sherlock_results}")
        sherlock_results = []
    if isinstance(telegram_info, Exception):
        print(f"❌ Telethon gather exception: {telegram_info}")
        telegram_info = None
    
    # Get photos, common chats, and stories separately (depends on telegram_info)
    photos = []
    common_chats = []
    stories = []
    if telegram_info and telegram_info.get("user_id"):
        user_id = telegram_info["user_id"]
        # Run all three in parallel
        photos_task = asyncio.create_task(_safe_get_photos(user_id))
        chats_task = asyncio.create_task(_safe_get_common_chats(user_id))
        stories_task = asyncio.create_task(_safe_get_stories(user_id))
        
        photos, common_chats, stories = await asyncio.gather(
            photos_task, chats_task, stories_task,
            return_exceptions=True
        )
        
        if isinstance(photos, Exception):
            print(f"❌ Photos gather exception: {photos}")
            photos = []
        if isinstance(common_chats, Exception):
            print(f"❌ Common chats gather exception: {common_chats}")
            common_chats = []
        if isinstance(stories, Exception):
            print(f"❌ Stories gather exception: {stories}")
            stories = []
    
    # Build aggregated result
    result = {
        "target_username": username,
        "telegram_info": telegram_info,
        "sherlock_results": sherlock_results if isinstance(sherlock_results, list) else [],
        "profile_photos": photos,
        "common_chats": common_chats if isinstance(common_chats, list) else [],
        "stories": stories if isinstance(stories, list) else [],
        "total_sites_found": len([r for r in (sherlock_results if isinstance(sherlock_results, list) else []) if r.get("status") == "found"]),
        "search_timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    return result


async def _safe_sherlock_search(username: str) -> list:
    """Sherlock search with error handling and timeout."""
    try:
        results = await asyncio.wait_for(
            sherlock_service.search_username(username),
            timeout=90  # 90 second timeout for sherlock
        )
        return results
    except asyncio.TimeoutError:
        print(f"⏰ Sherlock search timed out for {username}")
        return []
    except Exception as e:
        print(f"❌ Sherlock aggregator error: {e}")
        return []


async def _safe_telethon_search(username: str) -> Optional[dict]:
    """Telethon search with error handling and timeout."""
    try:
        info = await asyncio.wait_for(
            telethon_service.get_user_info(username),
            timeout=30  # 30 second timeout for telethon
        )
        return info
    except asyncio.TimeoutError:
        print(f"⏰ Telethon search timed out for {username}")
        return None
    except Exception as e:
        print(f"❌ Telethon aggregator error: {e}")
        return None


async def _safe_get_photos(user_id: int) -> list:
    """Get profile photos with error handling and timeout."""
    try:
        photos = await asyncio.wait_for(
            tosint_service.get_user_profile_photos(user_id),
            timeout=15  # 15 second timeout for photos
        )
        return photos
    except asyncio.TimeoutError:
        print(f"⏰ Photos fetch timed out for {user_id}")
        return []
    except Exception as e:
        print(f"❌ Photos aggregator error: {e}")
    return []


async def _safe_get_common_chats(user_id: int) -> list:
    """Get common chats/groups/channels with error handling and timeout."""
    try:
        chats = await asyncio.wait_for(
            telethon_service.get_common_chats(user_id),
            timeout=15  # 15 second timeout
        )
        return chats
    except asyncio.TimeoutError:
        print(f"⏰ Common chats fetch timed out for {user_id}")
        return []
    except Exception as e:
        print(f"❌ Common chats aggregator error: {e}")
        return []


async def _safe_get_stories(user_id: int) -> list:
    """Get user stories with error handling and timeout."""
    try:
        stories = await asyncio.wait_for(
            telethon_service.get_user_stories(user_id),
            timeout=20  # 20 second timeout for stories
        )
        return stories
    except asyncio.TimeoutError:
        print(f"⏰ Stories fetch timed out for {user_id}")
        return []
    except Exception as e:
        print(f"❌ Stories aggregator error: {e}")
        return []

