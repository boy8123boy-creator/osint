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
    
    # Get photos separately (depends on telegram_info)
    photos = []
    if telegram_info and telegram_info.get("user_id"):
        photos = await _safe_get_photos(telegram_info["user_id"])
    
    # Build aggregated result
    result = {
        "target_username": username,
        "telegram_info": telegram_info,
        "sherlock_results": sherlock_results if isinstance(sherlock_results, list) else [],
        "profile_photos": photos,
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
