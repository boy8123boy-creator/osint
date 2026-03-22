"""
Payments Router — Telegram Stars payment integration.
Creates invoices and processes successful payments.
"""

from fastapi import APIRouter, HTTPException, Request
from bson import ObjectId
from app.models import PaymentInvoiceRequest, PaymentConfirmation
from app.database import users_collection, tariffs_collection
from app.config import settings

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/invoice")
async def create_invoice(request: PaymentInvoiceRequest):
    """
    Create a Telegram Stars payment invoice.
    Returns invoice data for the frontend to open via Telegram.WebApp.
    """
    # Get tariff
    try:
        obj_id = ObjectId(request.tariff_id)
    except:
        raise HTTPException(status_code=400, detail="Noto'g'ri tariff ID")
    
    tariff = await tariffs_collection.find_one({"_id": obj_id, "is_active": True})
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarif topilmadi")
    
    # Get user
    user = await users_collection.find_one({"telegram_id": request.telegram_id})
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    # Build invoice payload for Telegram Stars
    invoice_payload = {
        "title": f"🔍 {tariff['name']} — {tariff['search_count']} ta qidiruv",
        "description": tariff.get("description", f"{tariff['search_count']} ta OSINT qidiruv imkoniyati"),
        "payload": f"tariff_{request.tariff_id}_{request.telegram_id}",
        "currency": "XTR",  # Telegram Stars currency code
        "prices": [
            {
                "label": f"{tariff['search_count']} ta qidiruv",
                "amount": tariff["price_stars"],
            }
        ],
        "provider_token": "",  # Empty for Telegram Stars
    }
    
    return {
        "success": True,
        "invoice": invoice_payload,
        "tariff": {
            "id": str(tariff["_id"]),
            "name": tariff["name"],
            "search_count": tariff["search_count"],
            "price_stars": tariff["price_stars"],
        }
    }


@router.post("/confirm")
async def confirm_payment(payment: PaymentConfirmation):
    """
    Confirm successful Telegram Stars payment.
    Adds search balance to user.
    """
    # Get tariff
    try:
        obj_id = ObjectId(payment.tariff_id)
    except:
        raise HTTPException(status_code=400, detail="Noto'g'ri tariff ID")
    
    tariff = await tariffs_collection.find_one({"_id": obj_id})
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarif topilmadi")
    
    # Add balance to user
    result = await users_collection.update_one(
        {"telegram_id": payment.telegram_id},
        {
            "$inc": {"balance": tariff["search_count"]},
            "$push": {
                "payments": {
                    "payment_id": payment.payment_id,
                    "tariff_id": payment.tariff_id,
                    "tariff_name": tariff["name"],
                    "search_count": tariff["search_count"],
                    "stars_amount": payment.stars_amount,
                    "timestamp": payment.payment_id,
                }
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    
    # Get updated balance
    user = await users_collection.find_one({"telegram_id": payment.telegram_id})
    
    return {
        "success": True,
        "message": f"✅ {tariff['search_count']} ta qidiruv qo'shildi!",
        "new_balance": user.get("balance", 0),
        "searches_added": tariff["search_count"],
    }
