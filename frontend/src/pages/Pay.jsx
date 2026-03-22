import React from 'react';
import { motion } from 'framer-motion';
import { HiCheck, HiGift } from 'react-icons/hi2';
import { getTariffs, createInvoice } from '../utils/api';
import { getUserData, hapticFeedback, showAlert } from '../utils/telegram';

export default function Pay() {
    const [tariffs, setTariffs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [purchasing, setPurchasing] = React.useState(null);

    React.useEffect(() => { loadTariffs(); }, []);

    const loadTariffs = async () => {
        try {
            const data = await getTariffs();
            setTariffs(data.tariffs || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const handlePurchase = async (tariff) => {
        hapticFeedback('impact');
        setPurchasing(tariff.id);
        try {
            const userData = getUserData();
            const data = await createInvoice(userData.id, tariff.id);
            if (data.success && data.invoice) {
                const tg = window.Telegram?.WebApp;
                if (tg?.openInvoice) {
                    showAlert(
                        `${data.invoice.title}\n\n${data.invoice.description}\n\nNarx: ${tariff.price_stars} Stars\n\nTo'lov uchun botga /pay_${tariff.id} buyrug'ini yuboring.`
                    );
                } else {
                    showAlert(
                        `${tariff.name}\n💰 ${tariff.price_stars} Stars\n🔍 ${tariff.search_count} ta qidiruv\n\nTelegram ichida to'lov uchun botga yozing.`
                    );
                }
            }
        } catch (err) {
            showAlert('Xatolik: ' + (err.message || "To'lov yaratib bo'lmadi"));
        } finally {
            setPurchasing(null);
        }
    };

    const basePrice = React.useMemo(() => {
        const single = tariffs.find(t => t.search_count === 1);
        return single?.price_stars || 30;
    }, [tariffs]);

    if (loading) {
        return (
            <div className="empty-state">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#fff',
                    }}
                />
                <div className="empty-state-text">Tariflar yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Header ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 20 }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    Tariflar
                </h1>
                <p style={{
                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.35)', letterSpacing: '1px',
                }}>
                    Telegram Stars bilan to'lang
                </p>
            </motion.div>

            {/* ── Free banner ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{
                    padding: '14px 18px', marginBottom: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', gap: 12,
                }}
            >
                <HiGift style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <span style={{
                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.45)', lineHeight: 1.4
                }}>
                    Yangi foydalanuvchilar uchun 3 ta bepul qidiruv imkoniyati mavjud.
                </span>
            </motion.div>

            {/* ── Tariff grid ─────────────────────── */}
            <div className="tariff-grid">
                {tariffs.map((tariff, index) => {
                    const fullPrice = basePrice * tariff.search_count;
                    const discountPercent = tariff.search_count > 1
                        ? Math.round(((fullPrice - tariff.price_stars) / fullPrice) * 100)
                        : 0;
                    const isFeatured = index === 1;
                    const isPurchasing = purchasing === tariff.id;

                    return (
                        <motion.div
                            key={tariff.id}
                            className={`tariff-card ${isFeatured ? 'tariff-card-featured' : ''}`}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 * index }}
                            whileTap={{ scale: 0.99 }}
                        >
                            {/* Discount */}
                            {discountPercent > 0 && (
                                <div className="badge badge-discount">
                                    -{discountPercent}%
                                </div>
                            )}

                            {/* Featured label */}
                            {isFeatured && (
                                <div style={{
                                    position: 'absolute', top: 14, left: 14,
                                    fontFamily: 'Inter,sans-serif', fontSize: '0.58rem', fontWeight: 700,
                                    letterSpacing: '1px', padding: '3px 10px',
                                    borderRadius: 99, background: 'rgba(255,255,255,0.12)',
                                    color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
                                }}>
                                    Mashhur
                                </div>
                            )}

                            {/* Name & count */}
                            <div className="tariff-header" style={{ marginTop: isFeatured ? 22 : 0 }}>
                                <div>
                                    <div className="tariff-name">{tariff.name}</div>
                                    <div className="tariff-count">
                                        <HiCheck style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                        {tariff.search_count} ta qidiruv
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="tariff-price">
                                <span className="tariff-price-amount">{tariff.price_stars}</span>
                                <span className="tariff-price-currency">⭐ STARS</span>
                            </div>

                            <div className="tariff-unit-price">
                                ≈ {tariff.unit_price || Math.round(tariff.price_stars / tariff.search_count)} stars / qidiruv
                                {discountPercent > 0 && (
                                    <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>
                                        {basePrice} stars
                                    </span>
                                )}
                            </div>

                            {/* Features */}
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {[
                                    `${tariff.search_count} ta OSINT qidiruv`,
                                    'Sherlock 350+ sayt skanerlash',
                                    "Telegram profil ma'lumotlari",
                                    tariff.search_count >= 5 ? 'Batafsil hisobot' : null,
                                    tariff.search_count >= 15 ? 'Ustuvor qidiruv' : null,
                                ].filter(Boolean).map((feat, fi) => (
                                    <div key={fi} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                                        color: 'rgba(255,255,255,0.45)',
                                    }}>
                                        <HiCheck style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                        {feat}
                                    </div>
                                ))}
                            </div>

                            {/* Buy button */}
                            <motion.button
                                className="tariff-buy-btn"
                                onClick={() => handlePurchase(tariff)}
                                disabled={isPurchasing}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isPurchasing
                                    ? 'Yuklanmoqda...'
                                    : `⭐ ${tariff.price_stars} Stars — Sotib olish`
                                }
                            </motion.button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
