/**
 * Loading Screen Component
 * Shows real loading progress and start button
 */

import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

export function LoadingScreen({ onStart }) {
    const { progress, loaded, total } = useProgress();
    const [isReady, setIsReady] = useState(false);

    // FIX 3: Considera pronto quando progress >= 100
    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(() => setIsReady(true), 500);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    const handleStart = () => {
        onStart();
    };

    const displayProgress = Math.min(Math.floor(progress), 100);

    return (
        <div style={styles.container}>
            {/* Background Image */}
            <div style={styles.backgroundImage} />

            {/* Overlay scuro */}
            <div style={styles.overlay} />

            {/* Content */}
            <div style={styles.content}>
                {/* Loading / Start */}
                <div style={styles.loadingContainer}>
                    {!isReady ? (
                        <>
                            {/* Progress Bar */}
                            <div style={styles.progressContainer}>
                                <div
                                    style={{
                                        ...styles.progressBar,
                                        width: `${displayProgress}%`,
                                    }}
                                />
                            </div>
                            <p style={styles.loadingText}>
                                LOADING ASSETS... {displayProgress}%
                            </p>
                            <p style={styles.loadingDetail}>
                                {loaded} / {total || '?'} files
                            </p>
                        </>
                    ) : (
                        <button
                            style={styles.startButton}
                            onClick={handleStart}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleStart();
                            }}
                        >
                            ▶ START
                        </button>
                    )}
                </div>

                {/* Instructions */}
                <div style={styles.instructions}>
                    <p style={styles.instructionText}>
                        {isMobile()
                            ? 'JOYSTICK TO MOVE • SWIPE UP TO JUMP'
                            : 'WASD / ARROWS TO MOVE • SPACE TO JUMP'}
                    </p>
                    <p style={styles.instructionText}>
                        {isMobile()
                            ? 'SHOOT & SHIELD BUTTONS ON RIGHT'
                            : 'X TO SHOOT • Z TO SHIELD'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function isMobile() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(textures/loading-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },

    content: {
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '20px',
    },

    loadingContainer: {
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },

    progressContainer: {
        width: '280px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '15px',
    },

    progressBar: {
        height: '100%',
        backgroundColor: '#00ffff',
        boxShadow: '0 0 10px #00ffff',
        transition: 'width 0.3s ease-out',
    },

    loadingText: {
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        color: '#00ffff',
        letterSpacing: '3px',
        marginBottom: '5px',
    },

    loadingDetail: {
        fontFamily: "'Courier New', monospace",
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: '1px',
    },

    startButton: {
        fontFamily: "'Courier New', monospace",
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#00ffff',
        backgroundColor: 'transparent',
        border: '2px solid #00ffff',
        padding: '18px 50px',
        letterSpacing: '6px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 20px #00ffff44, inset 0 0 20px #00ffff22',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
    },

    instructions: {
        marginTop: '50px',
    },

    instructionText: {
        fontFamily: "'Courier New', monospace",
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '2px',
        marginBottom: '8px',
    },
};
