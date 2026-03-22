import React from 'react';
import { motion } from 'framer-motion';
import { HiHome, HiCreditCard, HiUser } from 'react-icons/hi2';
import { hapticFeedback } from '../utils/telegram';

const tabs = [
    { id: 'home', label: 'Home', Icon: HiHome },
    { id: 'pay', label: 'Balans', Icon: HiCreditCard },
    { id: 'profile', label: 'Profil', Icon: HiUser },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="bottom-nav">
            {tabs.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                    <div
                        key={id}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => {
                            if (id !== activeTab) {
                                hapticFeedback('selection');
                                onTabChange(id);
                            }
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="nav-pill"
                                style={{
                                    position: 'absolute', inset: 0,
                                    borderRadius: 16,
                                    background: 'rgba(255,255,255,0.06)',
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}
                        <motion.div
                            className="nav-item-icon"
                            animate={isActive ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                            transition={{ duration: 0.22 }}
                        >
                            <Icon />
                        </motion.div>
                        <span className="nav-item-label">{label}</span>
                    </div>
                );
            })}
        </nav>
    );
}
