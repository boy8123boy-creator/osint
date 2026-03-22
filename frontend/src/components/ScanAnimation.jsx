import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck, HiMagnifyingGlass, HiDevicePhoneMobile, HiGlobeAlt, HiDocumentText, HiCubeTransparent } from 'react-icons/hi2';

const scanStages = [
    { id: 'telegram', label: 'Telegram profili tahlili', Icon: HiDevicePhoneMobile },
    { id: 'sherlock', label: 'Sherlock sayt skanerlash', Icon: HiMagnifyingGlass },
    { id: 'social', label: 'Ijtimoiy tarmoqlar qidiruvi', Icon: HiGlobeAlt },
    { id: 'osint', label: 'OSINT ma\'lumotlar yig\'indisi', Icon: HiCubeTransparent },
    { id: 'report', label: 'Hisobot tayyorlash', Icon: HiDocumentText },
];

export default function ScanAnimation({ isScanning, targetUsername }) {
    const [activeStage, setActiveStage] = React.useState(0);

    React.useEffect(() => {
        if (!isScanning) {
            setActiveStage(0);
            return;
        }

        const interval = setInterval(() => {
            setActiveStage(prev => {
                if (prev >= scanStages.length - 1) return prev;
                return prev + 1;
            });
        }, 1800);

        return () => clearInterval(interval);
    }, [isScanning]);

    return (
        <AnimatePresence>
            {isScanning && (
                <motion.div
                    className="scan-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 5000,
                        background: 'rgba(0,0,0,0.95)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 24, padding: 24,
                    }}
                >
                    {/* Pulsing Target */}
                    <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1.5px solid rgba(255,255,255,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    border: '2px solid transparent',
                                    borderTopColor: '#fff',
                                }}
                            />
                        </div>
                    </div>

                    {/* Target username */}
                    <motion.div
                        style={{
                            fontFamily: '"JetBrains Mono",monospace',
                            fontSize: '1rem',
                            color: '#fff',
                            letterSpacing: '3px',
                            fontWeight: 600,
                        }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        @{targetUsername?.toUpperCase()}
                    </motion.div>

                    {/* Progress list */}
                    <div style={{
                        width: '100%', maxWidth: 280,
                        display: 'flex', flexDirection: 'column', gap: 12,
                    }}>
                        {scanStages.map((stage, i) => {
                            const Icon = stage.Icon;
                            const isActive = i === activeStage;
                            const isDone = i < activeStage;

                            return (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px',
                                        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                        borderRadius: 12,
                                        border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Icon style={{
                                        width: 16, height: 16,
                                        color: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'
                                    }} />
                                    <span style={{
                                        fontFamily: 'Inter,sans-serif',
                                        fontSize: '0.72rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? '#fff' : isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                                        flex: 1
                                    }}>
                                        {stage.label}
                                    </span>
                                    {isDone && <HiCheck style={{ color: 'rgba(255,255,255,0.5)', width: 14, height: 14 }} />}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Hint */}
                    <p style={{
                        position: 'absolute', bottom: 40,
                        fontFamily: '"JetBrains Mono",monospace',
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)',
                        textAlign: 'center', padding: '0 40px',
                    }}>
                        Tizim ochiq ma'lumotlar manbalarini skanerlamoqda. Bu bir necha soniya vaqt olishi mumkin.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
