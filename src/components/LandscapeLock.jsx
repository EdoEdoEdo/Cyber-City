/**
 * Landscape Lock Component
 * Shows overlay when device is in portrait mode
 */

import React, { useState, useEffect } from 'react';

export function LandscapeLock() {
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        };

        // Check orientation
        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        setIsMobile(checkMobile());
        checkOrientation();

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    // Only show on mobile in portrait
    if (!isMobile || !isPortrait) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.content}>
                <div style={styles.icon}>📱</div>
                <div style={styles.rotateIcon}>↻</div>
                <h2 style={styles.title}>RUOTA IL DISPOSITIVO</h2>
                <p style={styles.subtitle}>
                    Questo gioco è ottimizzato per landscape
                </p>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },

    content: {
        textAlign: 'center',
        color: '#00ffff',
        fontFamily: "'Courier New', monospace",
    },

    icon: {
        fontSize: '60px',
        marginBottom: '10px',
        animation: 'rotate 2s ease-in-out infinite',
    },

    rotateIcon: {
        fontSize: '40px',
        marginBottom: '20px',
        opacity: 0.7,
    },

    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        letterSpacing: '3px',
        marginBottom: '10px',
        textShadow: '0 0 10px #00ffff66',
    },

    subtitle: {
        fontSize: '12px',
        color: '#666680',
        letterSpacing: '1px',
    },
};
