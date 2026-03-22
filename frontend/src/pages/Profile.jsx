import React from 'react';
import { motion } from 'framer-motion';
import {
    HiShieldCheck, HiMagnifyingGlass, HiClock,
    HiIdentification, HiUser, HiCalendarDays,
} from 'react-icons/hi2';
import { getUser, getUserBio, getSearchHistory } from '../utils/api';
import { getUserData } from '../utils/telegram';

export default function Profile() {
    const [user, setUser] = React.useState(null);
    const [bio, setBio] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const tgUser = getUserData();
            const userData = await getUser(tgUser.id);
            setUser(userData);
            try { const b = await getUserBio(tgUser.id); setBio(b.bio || ''); } catch { }
            try { const h = await getSearchHistory(tgUser.id); setHistory(h.history || []); } catch { }
        } catch {
            const tg = getUserData();
            setUser({ telegram_id: tg.id, first_name: tg.first_name, last_name: tg.last_name, username: tg.username, photo_url: tg.photo_url, balance: 0, total_searches: 0 });
        } finally { setLoading(false); }
    };

    const tgUser = getUserData();

    if (loading) {
        return (
            <div className="empty-state">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff' }}
                />
                <div className="empty-state-text">Profil yuklanmoqda...</div>
            </div>
        );
    }

    const displayName = user?.first_name || tgUser.first_name || 'Agent';
    const displayLastName = user?.last_name || tgUser.last_name || '';
    const displayUsername = user?.username || tgUser.username || '';
    const photoUrl = user?.photo_url || tgUser.photo_url || null;
    const displayBio = bio || user?.bio || '';
    const initial = displayName[0]?.toUpperCase() || '?';

    const infoRows = [
        { label: 'Telegram ID', value: String(user?.telegram_id || tgUser.id), Icon: HiIdentification },
        { label: 'Username', value: displayUsername ? `@${displayUsername}` : '—', Icon: HiUser },
        { label: 'Status', value: user?.is_admin ? 'Admin' : 'Scanner', Icon: HiShieldCheck },
        { label: "A'zo bo'lgan", value: user?.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ') : 'Bugun', Icon: HiCalendarDays },
    ];

    return (
        <div>
            {/* ── Avatar + Name ────────────────────── */}
            <motion.div
                className="profile-header"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    className="profile-avatar-wrapper"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                >
                    {photoUrl
                        ? <img src={photoUrl} alt="Avatar" className="profile-avatar" />
                        : <div className="profile-avatar-placeholder">{initial}</div>
                    }

                </motion.div>

                <motion.div className="profile-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    {displayName} {displayLastName}
                </motion.div>

                {displayUsername && (
                    <motion.div className="profile-username" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        @{displayUsername}
                    </motion.div>
                )}

                {displayBio && (
                    <motion.div className="profile-bio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        {displayBio}
                    </motion.div>
                )}

                {user?.is_admin && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 14px', borderRadius: 99,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            fontFamily: 'Inter,sans-serif', fontSize: '0.62rem',
                            fontWeight: 700, letterSpacing: '1px',
                            color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
                        }}
                    >
                        <HiShieldCheck /> ADMIN
                    </motion.div>
                )}
            </motion.div>

            {/* ── Stats ───────────────────────────── */}
            <motion.div
                className="profile-stats"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {[
                    { val: user?.is_admin ? '∞' : (user?.balance ?? 0), label: "Qolgan qidiruvlar" },
                    { val: user?.total_searches ?? 0, label: "Jami qidiruvlar" },
                ].map(({ val, label }, i) => (
                    <motion.div
                        key={i} className="stat-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.08, type: 'spring' }}
                    >
                        <div className="stat-value">{val}</div>
                        <div className="stat-label">{label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Account Info ─────────────────────── */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ marginTop: 18 }}
            >
                <h3 style={{ marginBottom: 16 }}>Hisob ma'lumotlari</h3>
                {infoRows.map(({ label, value, Icon }, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '11px 0',
                            borderBottom: i < infoRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'rgba(255,255,255,0.35)', fontFamily: '"JetBrains Mono",monospace', fontSize: '0.7rem' }}>
                            <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                            {label}
                        </div>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '0.76rem', color: '#fff', fontWeight: 600 }}>
                            {value}
                        </span>
                    </div>
                ))}
            </motion.div>

            {/* ── History ─────────────────────────── */}
            {history.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginTop: 22 }}
                >
                    <div className="result-section-title">
                        <HiClock /> Qidiruv tarixi
                    </div>
                    {history.slice(0, 10).map((item, i) => (
                        <motion.div
                            key={item.id}
                            className="result-item"
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * i }}
                        >
                            <div className="result-item-icon">
                                <HiMagnifyingGlass />
                            </div>
                            <div className="result-item-info">
                                <div className="result-item-name">@{item.target_username}</div>
                                <div className="result-item-url">
                                    {item.results_summary?.total_sites_found ?? 0} ta sayt
                                    {item.created_at && ` • ${new Date(item.created_at).toLocaleDateString('uz-UZ')}`}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <div style={{ height: 16 }} />
        </div>
    );
}
