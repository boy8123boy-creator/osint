"""
Search Router — OSINT search endpoint.
Handles username search with balance checking.
Robust error handling for production.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.models import SearchRequest, SearchResponse
from app.database import users_collection, search_history_collection
from app.services import osint_aggregator
from app.config import settings

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("/", response_model=SearchResponse)
async def search_username(request: SearchRequest):
    """
    Search for a username across OSINT sources.
    Deducts 1 from balance (free for admin, free first 3 for new users).
    """
    # Get user
    user = await users_collection.find_one({"telegram_id": request.telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi. Avval /start bosing.")
    
    is_admin = request.telegram_id == settings.ADMIN_ID
    
    # Check balance (admin has unlimited)
    if not is_admin:
        if user.get("balance", 0) <= 0:
            raise HTTPException(
                status_code=402,
                detail="Balans yetarli emas. Iltimos, qidiruv sotib oling."
            )
        
        # Deduct 1 search from balance
        await users_collection.update_one(
            {"telegram_id": request.telegram_id},
            {
                "$inc": {"balance": -1, "total_searches": 1}
            }
        )
    else:
        # Admin: just increment search count
        await users_collection.update_one(
            {"telegram_id": request.telegram_id},
            {"$inc": {"total_searches": 1}}
        )
    
    # Run OSINT search with error handling
    try:
        results = await osint_aggregator.aggregate_search(request.username)
    except Exception as e:
        print(f"❌ Search aggregator failed: {e}")
        # Refund the search if it failed completely
        if not is_admin:
            await users_collection.update_one(
                {"telegram_id": request.telegram_id},
                {"$inc": {"balance": 1, "total_searches": -1}}
            )
        raise HTTPException(
            status_code=500,
            detail=f"Qidiruv xatosi: {str(e)}"
        )
    
    # Save search history
    search_record = {
        "user_id": request.telegram_id,
        "target_username": request.username,
        "results_summary": {
            "total_sites_found": results.get("total_sites_found", 0),
            "has_telegram": results.get("telegram_info") is not None,
        },
        "created_at": datetime.now(timezone.utc),
    }
    try:
        await search_history_collection.insert_one(search_record)
    except Exception as e:
        print(f"⚠️ Could not save search history: {e}")
    
    # Get updated balance
    updated_user = await users_collection.find_one({"telegram_id": request.telegram_id})
    remaining = updated_user.get("balance", 0) if not is_admin else 999999
    
    return SearchResponse(
        target_username=results.get("target_username", request.username),
        telegram_info=results.get("telegram_info"),
        sherlock_results=results.get("sherlock_results", []),
        total_sites_found=results.get("total_sites_found", 0),
        search_timestamp=results.get("search_timestamp", ""),
        remaining_balance=remaining,
    )


@router.get("/history/{telegram_id}")
async def get_search_history(telegram_id: int):
    """Get search history for a user."""
    user = await users_collection.find_one({"telegram_id": telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    cursor = search_history_collection.find(
        {"user_id": telegram_id}
    ).sort("created_at", -1).limit(50)
    
    history = []
    async for record in cursor:
        history.append({
            "id": str(record["_id"]),
            "target_username": record.get("target_username", ""),
            "results_summary": record.get("results_summary", {}),
            "created_at": record.get("created_at", "").isoformat() if record.get("created_at") else "",
        })
    
    return {"history": history}


@router.get("/history/all")
async def get_all_search_history(admin_id: int = 0):
    """Admin: Get all users' search history."""
    if admin_id != settings.ADMIN_ID:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    
    cursor = search_history_collection.find({}).sort("created_at", -1).limit(200)
    
    history = []
    async for record in cursor:
        # Get the user info for display
        user = await users_collection.find_one({"telegram_id": record.get("user_id")})
        history.append({
            "id": str(record["_id"]),
            "user_id": record.get("user_id"),
            "user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else "Noma'lum",
            "user_username": user.get("username", "") if user else "",
            "target_username": record.get("target_username", ""),
            "results_summary": record.get("results_summary", {}),
            "created_at": record.get("created_at", "").isoformat() if record.get("created_at") else "",
        })
    
    return {"history": history}
