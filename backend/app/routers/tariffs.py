"""
Tariffs Router — Dynamic tariff/pricing management.
Admin can create, update, delete tariffs.
"""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.models import TariffCreate, TariffUpdate, TariffResponse
from app.database import tariffs_collection

router = APIRouter(prefix="/api/tariffs", tags=["tariffs"])


@router.get("/")
async def get_tariffs():
    """Get all active tariffs."""
    cursor = tariffs_collection.find({"is_active": True}).sort("price_stars", 1)
    tariffs = []
    
    async for tariff in cursor:
        # Calculate unit price and discount
        search_count = tariff.get("search_count", 1)
        price_stars = tariff.get("price_stars", 0)
        
        # Find the base unit price (cheapest single search tariff)
        base_tariff = await tariffs_collection.find_one(
            {"is_active": True, "search_count": 1}
        )
        base_unit_price = base_tariff.get("price_stars", 30) if base_tariff else 30
        
        # Calculate discount
        full_price = base_unit_price * search_count
        unit_price = price_stars / search_count if search_count > 0 else 0
        discount_percent = ((full_price - price_stars) / full_price * 100) if full_price > 0 and search_count > 1 else 0
        
        tariffs.append(TariffResponse(
            id=str(tariff["_id"]),
            name=tariff.get("name", ""),
            search_count=search_count,
            price_stars=price_stars,
            description=tariff.get("description"),
            is_active=tariff.get("is_active", True),
            unit_price=round(unit_price, 1),
            discount_percent=round(discount_percent, 1),
        ))
    
    return {"tariffs": tariffs}


@router.post("/")
async def create_tariff(tariff: TariffCreate):
    """Admin: Create a new tariff."""
    tariff_doc = tariff.model_dump()
    result = await tariffs_collection.insert_one(tariff_doc)
    
    created = await tariffs_collection.find_one({"_id": result.inserted_id})
    return {
        "success": True,
        "tariff": {
            "id": str(created["_id"]),
            **{k: v for k, v in created.items() if k != "_id"}
        }
    }


@router.put("/{tariff_id}")
async def update_tariff(tariff_id: str, tariff: TariffUpdate):
    """Admin: Update an existing tariff."""
    try:
        obj_id = ObjectId(tariff_id)
    except:
        raise HTTPException(status_code=400, detail="Noto'g'ri tariff ID")
    
    existing = await tariffs_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tarif topilmadi")
    
    update_data = {k: v for k, v in tariff.model_dump().items() if v is not None}
    if update_data:
        await tariffs_collection.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
    
    updated = await tariffs_collection.find_one({"_id": obj_id})
    return {
        "success": True,
        "tariff": {
            "id": str(updated["_id"]),
            **{k: v for k, v in updated.items() if k != "_id"}
        }
    }


@router.delete("/{tariff_id}")
async def delete_tariff(tariff_id: str):
    """Admin: Soft delete a tariff (set is_active to False)."""
    try:
        obj_id = ObjectId(tariff_id)
    except:
        raise HTTPException(status_code=400, detail="Noto'g'ri tariff ID")
    
    existing = await tariffs_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tarif topilmadi")
    
    await tariffs_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Tarif o'chirildi"}
