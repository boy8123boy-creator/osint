import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ isVisible, onComplete }) {
    const [loopCount, setLoopCount] = React.useState(0);
    const [isFadingOut, setIsFadingOut] = React.useState(false);
    const videoRef = React.useRef(null);
    const LOOP_TARGET = 3; // play video 3 times as requested (increased duration)

    React.useEffect(() => {
        if (!isVisible) return;
        if (videoRef.current) {
            videoRef.current.play().catch(() => onComplete?.());
        }
    }, [isVisible]);

    const handleVideoEnd = () => {
        const next = loopCount + 1;
        setLoopCount(next);
        if (next < LOOP_TARGET) {
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => onComplete?.());
            }
        } else {
            // All loops done — start fade out
            setIsFadingOut(true);
            setTimeout(() => {
                onComplete?.();
            }, 1000); // 1 second fade out duration
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: isFadingOut ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: '#000',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    {/* ── Video (looped 3x, centered, smaller, NO BORDER) ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: isFadingOut ? 0 : 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: '80vw', maxWidth: 320,
                            position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <video
                            ref={videoRef}
                            src="/intro.mp4"
                            muted
                            playsInline
                            onEnded={handleVideoEnd}
                            style={{
                                width: '100%', height: '100%',
                                objectFit: 'contain', display: 'block',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
