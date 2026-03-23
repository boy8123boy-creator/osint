import React from 'react';
import { motion } from 'framer-motion';
import { HiHome, HiCreditCard, HiUser, HiCog6Tooth } from 'react-icons/hi2';

const baseTabs = [
    { id: 'home', label: 'Qidiruv', Icon: HiHome },
    { id: 'pay', label: 'Tariflar', Icon: HiCreditCard },
    { id: 'profile', label: 'Profil', Icon: HiUser },
];

const adminTab = { id: 'admin', label: 'Admin', Icon: HiCog6Tooth };

export default function BottomNav({ activeTab, onTabChange, isAdmin }) {
    const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

    return (
        <nav className="bottom-nav">
            {tabs.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                    <button
                        key={id}
                        className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                        onClick={() => onTabChange(id)}
                    >
                        <Icon className="nav-icon" />
                        <span className="nav-label">{label}</span>
                        {isActive && (
                            <motion.div
                                className="nav-indicator"
                                layoutId="nav-indicator"
                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
