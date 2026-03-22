"""
Telegram Bot Handlers — Admin commands and Mini App integration.
Admin ID: 5944975917
"""

from telegram import (
    Update, 
    InlineKeyboardButton, 
    InlineKeyboardMarkup,
    WebAppInfo,
    LabeledPrice,
)
from telegram.ext import (
    Application, 
    CommandHandler, 
    CallbackQueryHandler,
    PreCheckoutQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)
from app.config import settings
from app.database import users_collection, tariffs_collection, search_history_collection
from datetime import datetime, timezone


def is_admin(user_id: int) -> bool:
    return user_id == settings.ADMIN_ID


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command — show Mini App button."""
    user = update.effective_user
    
    # Create/update user in DB
    existing = await users_collection.find_one({"telegram_id": user.id})
    if not existing:
        new_user = {
            "telegram_id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "balance": 999999 if is_admin(user.id) else settings.FREE_SEARCHES,
            "is_admin": is_admin(user.id),
            "total_searches": 0,
            "created_at": datetime.now(timezone.utc),
        }
        await users_collection.insert_one(new_user)
    
    # Mini App button
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🔍 OSINT Scanner'ni ochish",
            web_app=WebAppInfo(url=settings.WEBAPP_URL)
        )],
    ])
    
    welcome = (
        "🛡️ <b>OSINT Intelligence Scanner</b>\n\n"
        "🔎 Username bo'yicha <b>350+ sayt</b>dan qidiruv\n"
        "📱 Telegram profil ma'lumotlari\n"
        "🌐 Ijtimoiy tarmoqlar tahlili\n\n"
        f"🎁 Sizga <b>{settings.FREE_SEARCHES} ta bepul</b> qidiruv berildi!\n\n"
        "👇 Boshlash uchun quyidagi tugmani bosing:"
    )
    
    await update.message.reply_text(
        welcome,
        reply_markup=keyboard,
        parse_mode="HTML"
    )


async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /admin command — show admin panel."""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("⛔ Sizda admin huquqi yo'q.")
        return
    
    # Get stats
    total_users = await users_collection.count_documents({})
    total_searches = await search_history_collection.count_documents({})
    
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("👥 Foydalanuvchilar", callback_data="admin_users"),
            InlineKeyboardButton("💰 Tariflar", callback_data="admin_tariffs"),
        ],
        [
            InlineKeyboardButton("📊 Statistika", callback_data="admin_stats"),
            InlineKeyboardButton("🎁 Qidiruv berish", callback_data="admin_grant"),
        ],
    ])
    
    text = (
        "⚙️ <b>Admin Panel</b>\n\n"
        f"👥 Jami foydalanuvchilar: <b>{total_users}</b>\n"
        f"🔍 Jami qidiruvlar: <b>{total_searches}</b>\n\n"
        "Quyidagi tugmalardan birini tanlang:"
    )
    
    await update.message.reply_text(text, reply_markup=keyboard, parse_mode="HTML")


async def grant_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /grant {user_id} {count} — grant searches to user."""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("⛔ Sizda admin huquqi yo'q.")
        return
    
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "📝 Foydalanish: /grant {user_id} {count}\n"
            "Masalan: /grant 123456789 5"
        )
        return
    
    try:
        target_id = int(args[0])
        count = int(args[1])
    except ValueError:
        await update.message.reply_text("❌ User ID va count raqam bo'lishi kerak!")
        return
    
    user = await users_collection.find_one({"telegram_id": target_id})
    if not user:
        await update.message.reply_text(f"❌ Foydalanuvchi topilmadi: {target_id}")
        return
    
    await users_collection.update_one(
        {"telegram_id": target_id},
        {"$inc": {"balance": count}}
    )
    
    updated = await users_collection.find_one({"telegram_id": target_id})
    await update.message.reply_text(
        f"✅ <b>{count}</b> ta qidiruv berildi!\n"
        f"👤 Foydalanuvchi: {user.get('first_name', '')} (@{user.get('username', 'N/A')})\n"
        f"💰 Yangi balans: <b>{updated.get('balance', 0)}</b>",
        parse_mode="HTML"
    )


async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stats — show statistics."""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("⛔ Sizda admin huquqi yo'q.")
        return
    
    total_users = await users_collection.count_documents({})
    total_searches = await search_history_collection.count_documents({})
    active_users = await users_collection.count_documents({"total_searches": {"$gt": 0}})
    
    # Top searchers
    cursor = users_collection.find({"total_searches": {"$gt": 0}}).sort("total_searches", -1).limit(5)
    top_users = []
    async for user in cursor:
        top_users.append(
            f"  • {user.get('first_name', 'N/A')} (@{user.get('username', 'N/A')}): "
            f"{user.get('total_searches', 0)} qidiruv"
        )
    
    text = (
        "📊 <b>Statistika</b>\n\n"
        f"👥 Jami foydalanuvchilar: <b>{total_users}</b>\n"
        f"🔍 Jami qidiruvlar: <b>{total_searches}</b>\n"
        f"✅ Aktiv foydalanuvchilar: <b>{active_users}</b>\n\n"
        f"🏆 <b>Top qidiruvchilar:</b>\n" +
        ("\n".join(top_users) if top_users else "  Hali yo'q")
    )
    
    await update.message.reply_text(text, parse_mode="HTML")


async def admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle admin panel inline keyboard callbacks."""
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id):
        await query.edit_message_text("⛔ Sizda admin huquqi yo'q.")
        return
    
    if query.data == "admin_users":
        cursor = users_collection.find({}).sort("created_at", -1).limit(20)
        users_text = "👥 <b>Foydalanuvchilar:</b>\n\n"
        async for user in cursor:
            admin_badge = " 👑" if user.get("is_admin") else ""
            users_text += (
                f"• {user.get('first_name', 'N/A')} (@{user.get('username', 'N/A')}){admin_badge}\n"
                f"  ID: <code>{user.get('telegram_id')}</code> | "
                f"💰 Balans: {user.get('balance', 0)} | "
                f"🔍 Qidiruvlar: {user.get('total_searches', 0)}\n\n"
            )
        await query.edit_message_text(users_text, parse_mode="HTML")
    
    elif query.data == "admin_tariffs":
        cursor = tariffs_collection.find({}).sort("price_stars", 1)
        text = "💰 <b>Tariflar:</b>\n\n"
        async for tariff in cursor:
            status = "✅" if tariff.get("is_active") else "❌"
            text += (
                f"{status} <b>{tariff.get('name')}</b>\n"
                f"  🔍 {tariff.get('search_count')} ta qidiruv | "
                f"⭐ {tariff.get('price_stars')} stars\n\n"
            )
        await query.edit_message_text(text, parse_mode="HTML")
    
    elif query.data == "admin_stats":
        total_users = await users_collection.count_documents({})
        total_searches = await search_history_collection.count_documents({})
        text = (
            f"📊 <b>Statistika</b>\n\n"
            f"👥 Foydalanuvchilar: {total_users}\n"
            f"🔍 Qidiruvlar: {total_searches}"
        )
        await query.edit_message_text(text, parse_mode="HTML")
    
    elif query.data == "admin_grant":
        text = (
            "🎁 <b>Qidiruv berish</b>\n\n"
            "Foydalanish:\n"
            "<code>/grant {user_id} {count}</code>\n\n"
            "Masalan:\n"
            "<code>/grant 123456789 5</code> — 5 ta qidiruv berish\n"
            "<code>/grant 123456789 10</code> — 10 ta qidiruv berish"
        )
        await query.edit_message_text(text, parse_mode="HTML")


async def pre_checkout_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle pre-checkout query for Telegram Stars."""
    query = update.pre_checkout_query
    await query.answer(ok=True)


async def successful_payment_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle successful Telegram Stars payment."""
    payment = update.message.successful_payment
    user_id = update.effective_user.id
    
    # Parse payload to get tariff
    payload = payment.invoice_payload
    parts = payload.split("_")
    
    if len(parts) >= 2:
        tariff_id = parts[1]
        try:
            from bson import ObjectId
            tariff = await tariffs_collection.find_one({"_id": ObjectId(tariff_id)})
            if tariff:
                # Add balance
                await users_collection.update_one(
                    {"telegram_id": user_id},
                    {"$inc": {"balance": tariff["search_count"]}}
                )
                
                user = await users_collection.find_one({"telegram_id": user_id})
                await update.message.reply_text(
                    f"✅ To'lov muvaffaqiyatli!\n\n"
                    f"🔍 +{tariff['search_count']} ta qidiruv qo'shildi\n"
                    f"💰 Yangi balans: <b>{user.get('balance', 0)}</b>",
                    parse_mode="HTML"
                )
                return
        except Exception as e:
            print(f"❌ Payment processing error: {e}")
    
    await update.message.reply_text("✅ To'lov qabul qilindi! Balans yangilandi.")


def setup_bot(app: Application):
    """Register all bot handlers."""
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("grant", grant_command))
    app.add_handler(CommandHandler("stats", stats_command))
    app.add_handler(CallbackQueryHandler(admin_callback, pattern="^admin_"))
    app.add_handler(PreCheckoutQueryHandler(pre_checkout_handler))
    app.add_handler(
        MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_handler)
    )
