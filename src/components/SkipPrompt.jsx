/**
 * Skip Prompt
 *
 * Renders a tiny "press [Space / tap] to skip" hint and listens for
 * keyboard / pointer events. Calls onSkip when the user requests skip.
 * Active only when `enabled` is true (caller controls visibility per phase).
 */

import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function SkipPrompt({ enabled, onSkip, label = 'SKIP' }) {
    const setInput = useGameStore((s) => s.setInput);

    useEffect(() => {
        if (!enabled) return;

        const doSkip = () => {
            // Make sure no stale press flags leak into gameplay (e.g. the
            // very Space that triggered the skip would otherwise be read
            // by the player controller as a jump on the next frame).
            setInput({
                jumpPressed: false,
                shootPressed: false,
                shieldPressed: false,
                jump: false,
                shoot: false,
                shield: false,
            });
            onSkip();
        };

        const handleKey = (e) => {
            if (
                e.key === 'Escape' ||
                e.key === ' ' ||
                e.key === 'Enter' ||
                e.code === 'Space'
            ) {
                e.preventDefault();
                e.stopImmediatePropagation();
                doSkip();
            }
        };

        const handlePointer = (e) => {
            // Don't steal the pointerdown from MobileControls buttons /
            // other interactive UI; only swallow it for this purpose.
            e.stopPropagation();
            doSkip();
        };

        // Capture phase so we run before useInputSystem's listeners.
        window.addEventListener('keydown', handleKey, { capture: true });
        window.addEventListener('pointerdown', handlePointer, {
            capture: true,
        });
        return () => {
            window.removeEventListener('keydown', handleKey, {
                capture: true,
            });
            window.removeEventListener('pointerdown', handlePointer, {
                capture: true,
            });
        };
    }, [enabled, onSkip, setInput]);

    if (!enabled) return null;

    return (
        <div
            style={styles.hint}
            onClick={(e) => {
                e.stopPropagation();
                onSkip();
            }}
        >
            <span style={styles.key}>SPACE</span>
            <span style={styles.text}> / TAP </span>
            <span style={styles.label}>{label}</span>
        </div>
    );
}

const styles = {
    hint: {
        position: 'fixed',
        right: 16,
        bottom: 16,
        padding: '6px 12px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(0,255,255,0.5)',
        color: '#00ffff',
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        letterSpacing: 1.5,
        zIndex: 200,
        cursor: 'pointer',
        userSelect: 'none',
        backdropFilter: 'blur(6px)',
        animation: 'cyber-pulse 1.6s ease-in-out infinite',
    },
    key: {
        background: '#00ffff',
        color: '#000',
        padding: '1px 6px',
        marginRight: 4,
        fontWeight: 'bold',
    },
    text: { opacity: 0.7 },
    label: { fontWeight: 'bold' },
};
