import React from 'react';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?';

/**
 * EncryptedText — Aceternity-style text reveal with gibberish scramble effect.
 * Props:
 *   text (string)         — target text to reveal
 *   revealDelayMs (number) — delay between revealing each character (default 50)
 *   flipDelayMs (number)   — delay between random flips (default 40)
 *   charset (string)       — character set for random chars
 *   className (string)     — wrapper class
 *   encryptedClassName     — class for encrypted chars
 *   revealedClassName      — class for revealed chars
 *   onComplete (function)  — callback when fully revealed
 *   trigger (boolean)      — when true, starts animation
 */
export default function EncryptedText({
    text = '',
    revealDelayMs = 50,
    flipDelayMs = 40,
    charset = DEFAULT_CHARSET,
    className = '',
    encryptedClassName = '',
    revealedClassName = '',
    onComplete,
    trigger = true,
}) {
    const [displayed, setDisplayed] = React.useState('');
    const [revealedCount, setRevealedCount] = React.useState(0);
    const flipInterval = React.useRef(null);
    const revealTimeout = React.useRef(null);

    React.useEffect(() => {
        if (!trigger || !text) {
            setDisplayed('');
            setRevealedCount(0);
            return;
        }

        // Start the animation
        let revealed = 0;

        // Random flip interval — scrambles unrevealed characters
        flipInterval.current = setInterval(() => {
            setDisplayed(() => {
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    if (i < revealed) {
                        result += text[i];
                    } else if (text[i] === ' ') {
                        result += ' ';
                    } else {
                        result += charset[Math.floor(Math.random() * charset.length)];
                    }
                }
                return result;
            });
        }, flipDelayMs);

        // Reveal interval — reveals one character at a time
        const revealNext = () => {
            if (revealed >= text.length) {
                clearInterval(flipInterval.current);
                setDisplayed(text);
                setRevealedCount(text.length);
                if (onComplete) onComplete();
                return;
            }
            revealed++;
            setRevealedCount(revealed);
            revealTimeout.current = setTimeout(revealNext, revealDelayMs);
        };

        revealTimeout.current = setTimeout(revealNext, revealDelayMs);

        return () => {
            clearInterval(flipInterval.current);
            clearTimeout(revealTimeout.current);
        };
    }, [trigger, text, revealDelayMs, flipDelayMs, charset]);

    if (!text) return null;

    return (
        <span className={className}>
            {displayed.split('').map((char, i) => (
                <span
                    key={i}
                    className={i < revealedCount ? revealedClassName : encryptedClassName}
                    style={{
                        display: 'inline-block',
                        minWidth: char === ' ' ? '0.3em' : undefined,
                        fontFamily: i < revealedCount ? undefined : '"JetBrains Mono", monospace',
                        opacity: i < revealedCount ? 1 : 0.5,
                        color: i < revealedCount ? 'inherit' : 'var(--accent, #00cfff)',
                        transition: 'opacity 0.15s ease, color 0.15s ease',
                    }}
                >
                    {char}
                </span>
            ))}
        </span>
    );
}
