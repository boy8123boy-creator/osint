import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Pay from './pages/Pay';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { getUserData, expandApp, ready, setHeaderColor, setBackgroundColor } from './utils/telegram';
import { initUser } from './utils/api';

const ADMIN_ID = 5944975917;

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export default function App() {
    const [showSplash, setShowSplash] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('home');
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [isAdmin, setIsAdmin] = React.useState(false);

    React.useEffect(() => {
        // Initialize Telegram WebApp
        expandApp();
        setHeaderColor('#0a0e17');
        setBackgroundColor('#0a0e17');
        ready();

        // Initialize user in backend
        const initializeUser = async () => {
            try {
                const tgUser = getUserData();
                const userData = await initUser({
                    telegram_id: tgUser.id,
                    username: tgUser.username || null,
                    first_name: tgUser.first_name || null,
                    last_name: tgUser.last_name || null,
                    photo_url: tgUser.photo_url || null,
                    language_code: tgUser.language_code || 'uz',
                });
                // Check if user is admin
                if (userData.is_admin || tgUser.id === ADMIN_ID) {
                    setIsAdmin(true);
                }
                setIsInitialized(true);
            } catch (err) {
                console.error('User init error:', err);
                // Check admin from telegram data directly
                const tgUser = getUserData();
                if (tgUser.id === ADMIN_ID) {
                    setIsAdmin(true);
                }
                setIsInitialized(true); // Continue anyway
            }
        };

        initializeUser();
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    const renderPage = () => {
        switch (activeTab) {
            case 'home': return <Home />;
            case 'pay': return <Pay />;
            case 'profile': return <Profile />;
            case 'admin': return isAdmin ? <Admin /> : <Home />;
            default: return <Home />;
        }
    };

    return (
        <div className="app">
            {/* Splash Screen */}
            <SplashScreen isVisible={showSplash} onComplete={handleSplashComplete} />

            {/* Main Content */}
            {!showSplash && (
                <>
                    <div className="app-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {renderPage()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Bottom Navigation */}
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
                </>
            )}
        </div>
    );
}
