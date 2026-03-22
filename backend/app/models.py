from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── User Models ──────────────────────────────────────────
class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    language_code: Optional[str] = None


class UserResponse(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    balance: int = 3
    is_admin: bool = False
    total_searches: int = 0
    created_at: Optional[str] = None


class GrantSearchRequest(BaseModel):
    target_user_id: int
    search_count: int


# ─── Tariff Models ────────────────────────────────────────
class TariffCreate(BaseModel):
    name: str
    search_count: int
    price_stars: int
    description: Optional[str] = None
    is_active: bool = True


class TariffUpdate(BaseModel):
    name: Optional[str] = None
    search_count: Optional[int] = None
    price_stars: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TariffResponse(BaseModel):
    id: str
    name: str
    search_count: int
    price_stars: int
    description: Optional[str] = None
    is_active: bool = True
    unit_price: float = 0
    discount_percent: float = 0


# ─── Search Models ────────────────────────────────────────
class SearchRequest(BaseModel):
    username: str
    telegram_id: int


class SherlockResult(BaseModel):
    site_name: str
    url: str
    status: str  # "found", "not_found", "error"


class TelegramUserInfo(BaseModel):
    user_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    is_bot: bool = False
    is_premium: Optional[bool] = None
    phone_hint: Optional[str] = None
    online_status: Optional[str] = None


class SearchResponse(BaseModel):
    target_username: str
    telegram_info: Optional[TelegramUserInfo] = None
    sherlock_results: List[SherlockResult] = []
    total_sites_found: int = 0
    search_timestamp: str = ""
    remaining_balance: int = 0


# ─── Payment Models ──────────────────────────────────────
class PaymentInvoiceRequest(BaseModel):
    telegram_id: int
    tariff_id: str


class PaymentConfirmation(BaseModel):
    telegram_id: int
    tariff_id: str
    payment_id: str
    stars_amount: int
