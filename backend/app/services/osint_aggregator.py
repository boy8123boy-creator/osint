"""
OSINT Aggregator — Combines all OSINT services (Sherlock + Telethon + TOSINT).
Runs searches in parallel for maximum speed.
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.services import sherlock_service, telethon_service, tosint_service


async def aggregate_search(username: str) -> Dict[str, Any]:
    """
    Run all OSINT searches in parallel for a username.
    Returns combined results from Sherlock, Telethon, and TOSINT-inspired checks.
    """
    # Clean username (remove @ if present)
    username = username.lstrip("@").strip()
    
    if not username:
        return {"error": "Username bo'sh bo'lmasligi kerak"}
    
    # Run all searches in parallel
    sherlock_task = asyncio.create_task(
        _safe_sherlock_search(username)
    )
    telethon_task = asyncio.create_task(
        _safe_telethon_search(username)
    )
    photos_task = asyncio.create_task(
        _safe_get_photos(username)
    )
    
    # Wait for all results
    sherlock_results, telegram_info, photos = await asyncio.gather(
        sherlock_task, telethon_task, photos_task
    )
    
    # Build aggregated result
    result = {
        "target_username": username,
        "telegram_info": telegram_info,
        "sherlock_results": sherlock_results,
        "profile_photos": photos,
        "total_sites_found": len([r for r in sherlock_results if r.get("status") == "found"]),
        "search_timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    return result


async def _safe_sherlock_search(username: str) -> list:
    """Sherlock search with error handling."""
    try:
        results = await sherlock_service.search_username(username)
        return results
    except Exception as e:
        print(f"❌ Sherlock aggregator error: {e}")
        return []


async def _safe_telethon_search(username: str) -> Optional[dict]:
    """Telethon search with error handling."""
    try:
        info = await telethon_service.get_user_info(username)
        return info
    except Exception as e:
        print(f"❌ Telethon aggregator error: {e}")
        return None


async def _safe_get_photos(username: str) -> list:
    """Get profile photos with error handling."""
    try:
        # First resolve username to user_id via Telethon
        info = await telethon_service.get_user_info(username)
        if info and info.get("user_id"):
            photos = await tosint_service.get_user_profile_photos(info["user_id"])
            return photos
    except Exception as e:
        print(f"❌ Photos aggregator error: {e}")
    return []
