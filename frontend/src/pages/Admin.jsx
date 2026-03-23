import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiChartBar, HiUsers, HiCurrencyDollar, HiMagnifyingGlass,
    HiPlus, HiPencil, HiTrash, HiCheck, HiXMark, HiGift,
    HiArrowPath, HiShieldCheck,
} from 'react-icons/hi2';
import {
    getAdminStats, getAllUsers, getAllSearchHistory,
    getAllTariffs, createTariff, updateTariff, deleteTariff,
    grantSearches,
} from '../utils/api';
import { getUserData, hapticFeedback, showAlert } from '../utils/telegram';

const TABS = [
    { id: 'stats', label: 'Statistika', Icon: HiChartBar },
    { id: 'tariffs', label: 'Tariflar', Icon: HiCurrencyDollar },
    { id: 'users', label: 'Foydalanuvchilar', Icon: HiUsers },
    { id: 'history', label: 'Qidiruvlar', Icon: HiMagnifyingGlass },
];

export default function Admin() {
    const [activeTab, setActiveTab] = React.useState('stats');
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState(null);
    const [users, setUsers] = React.useState([]);
    const [history, setHistory] = React.useState([]);
    const [tariffs, setTariffs] = React.useState([]);
    const [editingTariff, setEditingTariff] = React.useState(null);
    const [showNewTariff, setShowNewTariff] = React.useState(false);
    const [grantModal, setGrantModal] = React.useState(null);
    const [grantCount, setGrantCount] = React.useState('5');

    const adminId = getUserData().id;

    React.useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, usersData, historyData, tariffsData] = await Promise.allSettled([
                getAdminStats(adminId),
                getAllUsers(adminId),
                getAllSearchHistory(adminId),
                getAllTariffs(adminId),
            ]);
            if (statsData.status === 'fulfilled') setStats(statsData.value);
            if (usersData.status === 'fulfilled') setUsers(usersData.value.users || []);
            if (historyData.status === 'fulfilled') setHistory(historyData.value.history || []);
            if (tariffsData.status === 'fulfilled') setTariffs(tariffsData.value.tariffs || []);
        } catch (err) {
            console.error('Admin load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTariff = async (tariffData, isNew) => {
        hapticFeedback('impact');
        try {
            if (isNew) {
                await createTariff(adminId, tariffData);
                showAlert('✅ Yangi tarif qo\'shildi!');
            } else {
                await updateTariff(adminId, tariffData.id, tariffData);
                showAlert('✅ Tarif yangilandi!');
            }
            setEditingTariff(null);
            setShowNewTariff(false);
            await loadData();
        } catch (err) {
            showAlert('❌ Xatolik: ' + (err.message || 'Tarif saqlanmadi'));
        }
    };

    const handleDeleteTariff = async (tariffId) => {
        hapticFeedback('impact');
        try {
            await deleteTariff(adminId, tariffId);
            showAlert('✅ Tarif o\'chirildi!');
            await loadData();
        } catch (err) {
            showAlert('❌ Xatolik: ' + (err.message || 'Tarif o\'chirilmadi'));
        }
    };

    const handleGrantSearches = async (userId) => {
        hapticFeedback('impact');
        const count = parseInt(grantCount);
        if (!count || count <= 0) {
            showAlert('❌ Qidiruv sonini kiriting');
            return;
        }
        try {
            await grantSearches(userId, count);
            showAlert(`✅ ${count} ta qidiruv berildi!`);
            setGrantModal(null);
            await loadData();
        } catch (err) {
            showAlert('❌ Xatolik: ' + (err.message || 'Qidiruv berilmadi'));
        }
    };

    if (loading) {
        return (
            <div className="empty-state">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff' }}
                />
                <div className="empty-state-text">Admin panel yuklanmoqda...</div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Header ─────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <HiShieldCheck style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Admin Panel
                    </h1>
                </div>
                <p style={{
                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.35)', letterSpacing: '1px',
                }}>
                    Boshqaruv paneli
                </p>
            </motion.div>

            {/* ── Tab Navigation ──────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="admin-tabs"
            >
                {TABS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        className={`admin-tab ${activeTab === id ? 'admin-tab-active' : ''}`}
                        onClick={() => { setActiveTab(id); hapticFeedback('selection'); }}
                    >
                        <Icon />
                        <span>{label}</span>
                    </button>
                ))}
            </motion.div>

            {/* ── Refresh Button ──────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}
            >
                <button
                    onClick={() => { loadData(); hapticFeedback('impact'); }}
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 10, padding: '6px 14px',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                    }}
                >
                    <HiArrowPath /> Yangilash
                </button>
            </motion.div>

            {/* ── Content ─────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'stats' && <StatsTab stats={stats} />}
                    {activeTab === 'tariffs' && (
                        <TariffsTab
                            tariffs={tariffs}
                            editingTariff={editingTariff}
                            setEditingTariff={setEditingTariff}
                            showNewTariff={showNewTariff}
                            setShowNewTariff={setShowNewTariff}
                            onSave={handleSaveTariff}
                            onDelete={handleDeleteTariff}
                        />
                    )}
                    {activeTab === 'users' && (
                        <UsersTab
                            users={users}
                            grantModal={grantModal}
                            setGrantModal={setGrantModal}
                            grantCount={grantCount}
                            setGrantCount={setGrantCount}
                            onGrant={handleGrantSearches}
                        />
                    )}
                    {activeTab === 'history' && <HistoryTab history={history} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ── Stats Tab ──────────────────────────── */
function StatsTab({ stats }) {
    if (!stats) return <div className="empty-state-text">Statistika yuklanmadi</div>;

    const cards = [
        { val: stats.total_users, label: 'Jami foydalanuvchilar', emoji: '👥' },
        { val: stats.total_searches, label: 'Jami qidiruvlar', emoji: '🔍' },
        { val: stats.active_users, label: 'Aktiv foydalanuvchilar', emoji: '✅' },
    ];

    return (
        <div>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {cards.map(({ val, label, emoji }, i) => (
                    <motion.div
                        key={i}
                        className="stat-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.08 * i, type: 'spring' }}
                    >
                        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{emoji}</div>
                        <div className="stat-value" style={{ fontSize: '1.3rem' }}>{val}</div>
                        <div className="stat-label">{label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Top Users */}
            {stats.top_users?.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ marginBottom: 12 }}>🏆 Top qidiruvchilar</h3>
                    {stats.top_users.map((u, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: i < stats.top_users.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.7rem',
                                    color: 'rgba(255,255,255,0.3)', width: 20,
                                }}>{i + 1}.</span>
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                                        {u.first_name} {u.last_name}
                                    </div>
                                    {u.username && (
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: '"JetBrains Mono",monospace' }}>
                                            @{u.username}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span style={{
                                fontFamily: '"JetBrains Mono",monospace', fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.7)', fontWeight: 700,
                            }}>{u.total_searches} 🔍</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Searches */}
            {stats.recent_searches?.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: 12 }}>🕒 Oxirgi qidiruvlar</h3>
                    {stats.recent_searches.map((s, i) => (
                        <div key={i} style={{
                            padding: '8px 0',
                            borderBottom: i < stats.recent_searches.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                        {s.user_name}
                                    </span>
                                    {s.user_username && (
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginLeft: 6, fontFamily: '"JetBrains Mono",monospace' }}>
                                            @{s.user_username}
                                        </span>
                                    )}
                                </div>
                                <span style={{
                                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                                    color: '#fff', fontWeight: 600,
                                }}>→ @{s.target_username}</span>
                            </div>
                            {s.created_at && (
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: 2, fontFamily: '"JetBrains Mono",monospace' }}>
                                    {new Date(s.created_at).toLocaleString('uz-UZ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Tariffs Tab ──────────────────────────────── */
function TariffsTab({ tariffs, editingTariff, setEditingTariff, showNewTariff, setShowNewTariff, onSave, onDelete }) {
    return (
        <div>
            {/* Add Tariff Button */}
            <motion.button
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setShowNewTariff(true)}
                whileTap={{ scale: 0.97 }}
            >
                <HiPlus /> Yangi tarif qo'shish
            </motion.button>

            {/* New Tariff Form */}
            <AnimatePresence>
                {showNewTariff && (
                    <TariffForm
                        onSave={(data) => onSave(data, true)}
                        onCancel={() => setShowNewTariff(false)}
                    />
                )}
            </AnimatePresence>

            {/* Tariff List */}
            {tariffs.map((tariff, i) => (
                <motion.div
                    key={tariff.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                >
                    {editingTariff === tariff.id ? (
                        <TariffForm
                            tariff={tariff}
                            onSave={(data) => onSave({ ...data, id: tariff.id }, false)}
                            onCancel={() => setEditingTariff(null)}
                        />
                    ) : (
                        <div className="card" style={{
                            marginBottom: 10,
                            opacity: tariff.is_active ? 1 : 0.5,
                            border: tariff.is_active ? undefined : '1px solid rgba(255,80,80,0.2)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                                        {tariff.is_active ? '✅' : '❌'} {tariff.name}
                                    </div>
                                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                                        🔍 {tariff.search_count} ta qidiruv
                                    </div>
                                    <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                                        ⭐ {tariff.price_stars} stars ({tariff.unit_price || Math.round(tariff.price_stars / tariff.search_count)} / qidiruv)
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => setEditingTariff(tariff.id)}
                                        className="admin-icon-btn"
                                    >
                                        <HiPencil />
                                    </button>
                                    <button
                                        onClick={() => onDelete(tariff.id)}
                                        className="admin-icon-btn admin-icon-btn-danger"
                                    >
                                        <HiTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

/* ── Tariff Form ──────────────────────────── */
function TariffForm({ tariff, onSave, onCancel }) {
    const [name, setName] = React.useState(tariff?.name || '');
    const [searchCount, setSearchCount] = React.useState(String(tariff?.search_count || ''));
    const [priceStars, setPriceStars] = React.useState(String(tariff?.price_stars || ''));
    const [description, setDescription] = React.useState(tariff?.description || '');
    const [isActive, setIsActive] = React.useState(tariff?.is_active ?? true);

    const handleSubmit = () => {
        if (!name || !searchCount || !priceStars) {
            showAlert('Barcha maydonlarni to\'ldiring');
            return;
        }
        onSave({
            name,
            search_count: parseInt(searchCount),
            price_stars: parseInt(priceStars),
            description: description || null,
            is_active: isActive,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.8 }}
            className="card"
            style={{ marginBottom: 12 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                    className="input admin-input"
                    placeholder="Tarif nomi (masalan: Pro)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className="input admin-input"
                        placeholder="Qidiruvlar soni"
                        type="number"
                        value={searchCount}
                        onChange={(e) => setSearchCount(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <input
                        className="input admin-input"
                        placeholder="Narxi (Stars)"
                        type="number"
                        value={priceStars}
                        onChange={(e) => setPriceStars(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>
                <input
                    className="input admin-input"
                    placeholder="Tavsif (ixtiyoriy)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <label style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.5)',
                }}>
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ accentColor: '#fff' }}
                    />
                    Faol
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onClick={handleSubmit}
                    >
                        <HiCheck /> Saqlash
                    </button>
                    <button
                        className="admin-cancel-btn"
                        onClick={onCancel}
                    >
                        <HiXMark /> Bekor
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ── Users Tab ──────────────────────────── */
function UsersTab({ users, grantModal, setGrantModal, grantCount, setGrantCount, onGrant }) {
    return (
        <div>
            <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.35)', marginBottom: 12,
            }}>
                Jami: {users.length} ta foydalanuvchi
            </div>

            {users.map((user, i) => (
                <motion.div
                    key={user.telegram_id}
                    className="card"
                    style={{ marginBottom: 8 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                                {user.first_name} {user.last_name || ''}
                                {user.is_admin && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>👑 Admin</span>}
                            </div>
                            {user.username && (
                                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                                    @{user.username}
                                </div>
                            )}
                            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>
                                ID: {user.telegram_id}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
                                💰 {user.balance}
                            </div>
                            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                                🔍 {user.total_searches}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                            className="admin-action-btn"
                            onClick={() => { setGrantModal(user.telegram_id); setGrantCount('5'); }}
                        >
                            <HiGift /> Qidiruv berish
                        </button>
                    </div>

                    {/* Grant Modal */}
                    <AnimatePresence>
                        {grantModal === user.telegram_id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}
                            >
                                <input
                                    className="input admin-input"
                                    type="number"
                                    value={grantCount}
                                    onChange={(e) => setGrantCount(e.target.value)}
                                    placeholder="Son"
                                    style={{ width: 80 }}
                                />
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '8px 14px', fontSize: '0.72rem' }}
                                    onClick={() => onGrant(user.telegram_id)}
                                >
                                    <HiCheck /> Berish
                                </button>
                                <button
                                    className="admin-cancel-btn"
                                    style={{ padding: '8px 10px' }}
                                    onClick={() => setGrantModal(null)}
                                >
                                    <HiXMark />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
}

/* ── History Tab ──────────────────────────── */
function HistoryTab({ history }) {
    if (history.length === 0) {
        return <div className="empty-state-text">Qidiruv tarixi bo'sh</div>;
    }

    return (
        <div>
            <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.35)', marginBottom: 12,
            }}>
                Jami: {history.length} ta qidiruv
            </div>

            {history.map((item, i) => (
                <motion.div
                    key={item.id}
                    className="card"
                    style={{ marginBottom: 8 }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                                {item.user_name}
                                {item.user_username && (
                                    <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: '"JetBrains Mono",monospace' }}>
                                        @{item.user_username}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                                fontFamily: '"JetBrains Mono",monospace',
                            }}>
                                🔍 → @{item.target_username}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                fontFamily: '"JetBrains Mono",monospace', fontSize: '0.62rem',
                                color: 'rgba(255,255,255,0.25)',
                            }}>
                                {item.results_summary?.total_sites_found ?? 0} sayt
                            </div>
                            {item.created_at && (
                                <div style={{
                                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.58rem',
                                    color: 'rgba(255,255,255,0.2)', marginTop: 2,
                                }}>
                                    {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
