import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMagnifyingGlass, HiGlobeAlt, HiUserGroup, HiCamera } from 'react-icons/hi2';
import { FaInstagram } from 'react-icons/fa';
import ScanAnimation from '../components/ScanAnimation';
import EncryptedText from '../components/EncryptedText';
import { searchUsername } from '../utils/api';
import { getUserData, hapticFeedback } from '../utils/telegram';

export default function Home() {
    const [query, setQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [results, setResults] = React.useState(null);
    const [error, setError] = React.useState('');

    const handleSearch = async () => {
        const username = query.trim().replace('@', '');
        if (!username) return;
        hapticFeedback('impact');
        setError('');
        setIsSearching(true);
        setResults(null);
        try {
            const userData = getUserData();
            const data = await searchUsername(username, userData.id);
            setResults(data);
            hapticFeedback('notification');
        } catch (err) {
            setError(err.message || 'Qidiruv xatosi');
            hapticFeedback('impact');
        } finally {
            setIsSearching(false);
        }
    };

    const isEmpty = !results && !isSearching;

    // Chat type emoji mapping
    const chatTypeEmoji = {
        channel: '📢',
        supergroup: '👥',
        group: '💬',
        unknown: '📋',
    };

    const chatTypeLabel = {
        channel: 'Kanal',
        supergroup: 'Superguruh',
        group: 'Guruh',
        unknown: 'Chat',
    };

    return (
        <div>
            {/* ── Header ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24 }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                    <EncryptedText
                        text="OSINT Scanner"
                        revealDelayMs={60}
                        flipDelayMs={35}
                        trigger={true}
                        revealedClassName="encrypted-revealed"
                    />
                </h1>
                <p style={{
                    fontFamily: '"JetBrains Mono",monospace', fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.35)', letterSpacing: '1px',
                }}>
                    <EncryptedText
                        text="Username bo'yicha razvedka qidiruv"
                        revealDelayMs={30}
                        flipDelayMs={25}
                        trigger={true}
                    />
                </p>
            </motion.div>

            {/* ── Search ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: 18 }}
            >
                <div className="input-group">
                    <input
                        className="input"
                        type="text"
                        placeholder="@username kiriting..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={isSearching}
                        autoComplete="off"
                        autoCapitalize="off"
                    />
                    <HiMagnifyingGlass className="input-icon" />
                </div>
            </motion.div>

            {/* ── Search Button ───────────────────── */}
            <motion.button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ width: '100%' }}
            >
                {isSearching
                    ? 'Skanerlanmoqda...'
                    : 'Qidiruvni boshlash'
                }
            </motion.button>

            {/* ── Error ──────────────────────────── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            marginTop: 12, padding: '12px 16px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 14, color: 'rgba(255,255,255,0.7)',
                            fontFamily: '"JetBrains Mono",monospace', fontSize: '0.76rem',
                        }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Scan Overlay ────────────────────── */}
            <ScanAnimation isScanning={isSearching} targetUsername={query.replace('@', '')} />

            {/* ── Empty State — GIF loop icon ─────── */}
            <AnimatePresence>
                {isEmpty && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', paddingTop: 36, gap: 16,
                        }}
                    >
                        {/* GIF looping — NO CLIPPING */}
                        <div style={{
                            width: 100, height: 100,
                            position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <video
                                src="/intro.mp4"
                                muted
                                autoPlay
                                loop
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            />
                        </div>

                        <p style={{
                            fontFamily: 'Inter,sans-serif', fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.3)', textAlign: 'center',
                            lineHeight: 1.8, letterSpacing: '0.2px',
                        }}>
                            <EncryptedText
                                text="Username kiriting va OSINT razvedkani boshlang"
                                revealDelayMs={40}
                                flipDelayMs={30}
                                trigger={true}
                            />
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Results ────────────────────────── */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        style={{ marginTop: 24 }}
                    >
                        {/* Telegram Info */}
                        {results.telegram_info && (
                            <motion.div
                                className="result-section"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="result-section-title">
                                    📱{' '}
                                    <EncryptedText
                                        text="Telegram"
                                        revealDelayMs={60}
                                        flipDelayMs={30}
                                        trigger={!!results}
                                    />
                                </div>
                                <div className="tg-info-card">
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.10)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'Inter,sans-serif', fontSize: '1.3rem', fontWeight: 800,
                                        color: '#fff', flexShrink: 0,
                                    }}>
                                        {results.telegram_info.first_name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="tg-info-details">
                                        <div className="tg-info-name">
                                            <EncryptedText
                                                text={`${results.telegram_info.first_name || ''} ${results.telegram_info.last_name || ''}`.trim()}
                                                revealDelayMs={50}
                                                flipDelayMs={30}
                                                trigger={!!results}
                                            />
                                        </div>
                                        {results.telegram_info.username && (
                                            <div className="tg-info-username">@{results.telegram_info.username}</div>
                                        )}
                                        {results.telegram_info.bio && (
                                            <div className="tg-info-bio">{results.telegram_info.bio}</div>
                                        )}
                                        <div className="tg-info-meta">
                                            {results.telegram_info.is_premium && <span className="tg-info-tag">⭐ Premium</span>}
                                            {results.telegram_info.is_bot && <span className="tg-info-tag">🤖 Bot</span>}
                                            {results.telegram_info.online_status && (
                                                <span className="tg-info-tag">
                                                    {results.telegram_info.online_status === 'online' ? '🟢' : '⚫'}{' '}
                                                    {results.telegram_info.online_status}
                                                </span>
                                            )}
                                            {results.telegram_info.user_id && (
                                                <span className="tg-info-tag">ID: {results.telegram_info.user_id}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Common Chats (Groups & Channels) ── */}
                        {results.common_chats?.length > 0 && (
                            <motion.div
                                className="result-section"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="result-section-title">
                                    <HiUserGroup />
                                    <EncryptedText
                                        text={`Guruhlar va Kanallar (${results.common_chats.length})`}
                                        revealDelayMs={40}
                                        flipDelayMs={25}
                                        trigger={!!results}
                                    />
                                </div>
                                <div className="common-chats-grid">
                                    {results.common_chats.map((chat, idx) => (
                                        <motion.div
                                            key={chat.id || idx}
                                            className="chat-card"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * idx }}
                                        >
                                            <div className="chat-card-icon">
                                                {chatTypeEmoji[chat.type] || '📋'}
                                            </div>
                                            <div className="chat-card-info">
                                                <div className="chat-card-title">{chat.title}</div>
                                                <div className="chat-card-meta">
                                                    <span className="chat-card-type">
                                                        {chatTypeLabel[chat.type] || 'Chat'}
                                                    </span>
                                                    {chat.username && (
                                                        <a
                                                            href={`https://t.me/${chat.username}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="chat-card-link"
                                                        >
                                                            @{chat.username}
                                                        </a>
                                                    )}
                                                    {chat.members_count && (
                                                        <span className="chat-card-members">
                                                            👤 {chat.members_count.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── Stories ── */}
                        {results.stories?.length > 0 && (
                            <motion.div
                                className="result-section"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <div className="result-section-title">
                                    <HiCamera />
                                    <EncryptedText
                                        text={`Stories (${results.stories.length})`}
                                        revealDelayMs={40}
                                        flipDelayMs={25}
                                        trigger={!!results}
                                    />
                                </div>
                                <div className="stories-grid">
                                    {results.stories.map((story, idx) => (
                                        <motion.div
                                            key={story.id || idx}
                                            className="story-card"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.06 * idx }}
                                        >
                                            {story.media_url ? (
                                                <img
                                                    src={story.media_url}
                                                    alt={`Story ${story.id}`}
                                                    className="story-card-media"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="story-card-placeholder">
                                                    <HiCamera style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }} />
                                                </div>
                                            )}
                                            <div className="story-card-footer">
                                                {story.date && (
                                                    <span className="story-card-date">
                                                        {new Date(story.date).toLocaleDateString('uz-UZ', {
                                                            day: '2-digit', month: 'short',
                                                        })}
                                                    </span>
                                                )}
                                                {story.views != null && (
                                                    <span className="story-card-views">
                                                        👁 {story.views}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── Instagram Section ── */}
                        {(() => {
                            const instagramResult = results.sherlock_results?.find(r =>
                                r.site_name.toLowerCase().includes('instagram') ||
                                r.url.toLowerCase().includes('instagram.com')
                            );
                            if (!instagramResult) return null;

                            return (
                                <motion.div
                                    className="result-section"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.18 }}
                                >
                                    <div className="result-section-title">
                                        <FaInstagram />
                                        <EncryptedText
                                            text="Instagram"
                                            revealDelayMs={60}
                                            flipDelayMs={30}
                                            trigger={!!results}
                                        />
                                    </div>
                                    <motion.a
                                        href={instagramResult.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="result-item"
                                        style={{ borderLeft: '3px solid #E1306C' }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="result-item-icon" style={{ color: '#E1306C' }}>
                                            <FaInstagram />
                                        </div>
                                        <div className="result-item-info">
                                            <div className="result-item-name">Instagram Profil</div>
                                            <div className="result-item-url">{instagramResult.url}</div>
                                        </div>
                                        <span className="badge badge-found" style={{ color: '#E1306C', borderColor: 'rgba(225, 48, 108, 0.3)' }}>Found</span>
                                    </motion.a>
                                </motion.div>
                            );
                        })()}

                        {/* Sherlock Results */}
                        {results.sherlock_results?.filter(r =>
                            !r.site_name.toLowerCase().includes('instagram') &&
                            !r.url.toLowerCase().includes('instagram.com')
                        ).length > 0 && (
                                <motion.div
                                    className="result-section"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="result-section-title">
                                        <HiGlobeAlt />
                                        <EncryptedText
                                            text={`Topilgan boshqa saytlar (${results.total_sites_found - (results.sherlock_results?.some(r => r.site_name.toLowerCase().includes('instagram')) ? 1 : 0)})`}
                                            revealDelayMs={35}
                                            flipDelayMs={25}
                                            trigger={!!results}
                                        />
                                    </div>
                                    {results.sherlock_results
                                        ? results.sherlock_results
                                            .filter(r =>
                                                !r.site_name.toLowerCase().includes('instagram') &&
                                                !r.url.toLowerCase().includes('instagram.com')
                                            )
                                            .map((result, index) => (
                                                <motion.a
                                                    key={index}
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="result-item"
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.04 * index }}
                                                >
                                                    <div className="result-item-icon">
                                                        <HiGlobeAlt />
                                                    </div>
                                                    <div className="result-item-info">
                                                        <div className="result-item-name">{result.site_name}</div>
                                                        <div className="result-item-url">{result.url}</div>
                                                    </div>
                                                    <span className="badge badge-found">Found</span>
                                                </motion.a>
                                            )) : null}
                                </motion.div>
                            )}

                        {/* Balance */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                marginTop: 16, padding: '12px 16px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 14, textAlign: 'center',
                                fontFamily: '"JetBrains Mono",monospace', fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.4)',
                            }}
                        >
                            Qolgan qidiruvlar:{' '}
                            <span style={{ color: '#fff', fontWeight: 700 }}>
                                {results.remaining_balance}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
