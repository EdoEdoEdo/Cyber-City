/**
 * UI Overlay Component
 * Minimal HUD and game state screens
 */

import React from 'react';
import {
    useGameStore,
    selectGamePhase,
    selectIsPaused,
    selectPlayer,
    selectBoss,
} from '../store/gameStore';
import { GAME_PHASES, PLAYER } from '../constants/gameplayConstants';

// Health Bar Component
function HealthBar({ current, max, label, color, position }) {
    const percentage = Math.max(0, (current / max) * 100);

    return (
        <div
            style={{
                position: 'absolute',
                ...position,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                pointerEvents: 'none',
            }}
        >
            <span
                style={{
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: "'Courier New', monospace",
                    textShadow: '1px 1px 2px #000',
                    letterSpacing: '2px',
                }}
            >
                {label}: {current}/{max}
            </span>
            <div
                style={{
                    width: '200px',
                    height: '16px',
                    backgroundColor: '#1a1a2a',
                    border: `2px solid ${color}44`,
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}, inset 0 0 5px rgba(255,255,255,0.3)`,
                        transition: 'width 0.3s ease',
                    }}
                />
            </div>
        </div>
    );
}

// Shield Bar Component
function ShieldBar({ isShielding, cooldown, position }) {
    let percentage = 100;
    let color = '#00ffff';
    let label = 'SHIELD';

    if (isShielding) {
        percentage =
            (1 - (PLAYER.SHIELD_COOLDOWN - cooldown) / PLAYER.SHIELD_DURATION) *
            100;
        percentage = Math.max(0, Math.min(100, percentage));
        color = '#00ffff';
        label = 'SHIELD [ACTIVE]';
    } else if (cooldown > 0) {
        percentage =
            ((PLAYER.SHIELD_COOLDOWN - cooldown) / PLAYER.SHIELD_COOLDOWN) *
            100;
        color = '#00aaaa';
        label = 'SHIELD [CHARGING]';
    } else {
        percentage = 100;
        color = '#00ffff';
        label = 'SHIELD [READY]';
    }

    return (
        <div
            style={{
                position: 'absolute',
                ...position,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                pointerEvents: 'none',
            }}
        >
            <span
                style={{
                    color: cooldown > 0 && !isShielding ? '#00aaaa' : '#00ffff',
                    fontSize: '10px',
                    fontFamily: "'Courier New', monospace",
                    textShadow: '1px 1px 2px #000',
                    letterSpacing: '1px',
                }}
            >
                {label}
            </span>
            <div
                style={{
                    width: '150px',
                    height: '8px',
                    backgroundColor: '#1a1a2a',
                    border: `1px solid ${color}44`,
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: color,
                        boxShadow: `0 0 5px ${color}`,
                        transition: isShielding ? 'none' : 'width 0.1s linear',
                    }}
                />
            </div>
        </div>
    );
}

// Controls hint - Desktop only
function ControlsHint() {
    const [visible, setVisible] = React.useState(true);
    const [opacity, setOpacity] = React.useState(1);

    React.useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setOpacity(0);
        }, 9000);

        const hideTimer = setTimeout(() => {
            setVisible(false);
        }, 10000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!visible) return null;

    // Non mostrare su mobile (ha controlli visibili)
    const isMobile = 'ontouchstart' in window;
    if (isMobile) return null;

    return (
        <div
            style={{
                ...styles.controlsHint,
                opacity,
                transition: 'opacity 1s ease-out',
            }}
        >
            <span>
                A/D or ←/→: Move • W/↑/Space: Jump • X: Shoot • Z: Shield • ESC:
                Pause
            </span>
        </div>
    );
}

export function UIOverlay() {
    const gamePhase = useGameStore(selectGamePhase);
    const isPaused = useGameStore(selectIsPaused);
    const player = useGameStore(selectPlayer);
    const boss = useGameStore(selectBoss);
    const resetGame = useGameStore((state) => state.resetGame);
    const togglePause = useGameStore((state) => state.togglePause);

    const showBossHealth =
        gamePhase === GAME_PHASES.BOSS_FIGHT ||
        gamePhase === GAME_PHASES.CUTSCENE ||
        gamePhase === GAME_PHASES.BOSS_DEATH;

    const showPlayerUI =
        gamePhase === GAME_PHASES.PLAYING ||
        gamePhase === GAME_PHASES.BOSS_FIGHT ||
        gamePhase === GAME_PHASES.CUTSCENE ||
        gamePhase === GAME_PHASES.BOSS_DEATH;

    return (
        <div style={styles.container}>
            {/* Agent Health - Top Left */}
            {showPlayerUI && (
                <HealthBar
                    current={player.health}
                    max={player.maxHealth}
                    label="AGENT"
                    color="#00ffff"
                    position={{ top: '20px', left: '20px' }}
                />
            )}

            {/* Shield Bar - Below Health */}
            {showPlayerUI && (
                <ShieldBar
                    isShielding={player.isShielding}
                    cooldown={player.shieldCooldown}
                    position={{ top: '65px', left: '20px' }}
                />
            )}

            {/* Boss Health - Top Right */}
            {showBossHealth && boss && !boss.isDead && (
                <HealthBar
                    current={boss.health}
                    max={boss.maxHealth}
                    label="BOSS"
                    color="#ff0033"
                    position={{ top: '20px', right: '20px' }}
                />
            )}

            {/* Pause Screen */}
            {isPaused && gamePhase === GAME_PHASES.PAUSED && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h1 style={styles.title}>PAUSED</h1>
                        <button
                            style={styles.button}
                            onClick={togglePause}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                togglePause();
                            }}
                        >
                            RESUME
                        </button>
                        <button
                            style={styles.button}
                            onClick={resetGame}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                resetGame();
                            }}
                        >
                            RESTART
                        </button>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gamePhase === GAME_PHASES.GAME_OVER && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h1 style={{ ...styles.title, color: '#ff3366' }}>
                            TERMINATED
                        </h1>
                        <p style={styles.subtitle}>Agent down</p>
                        <button
                            style={styles.button}
                            onClick={resetGame}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                resetGame();
                            }}
                        >
                            RESTART
                        </button>
                    </div>
                </div>
            )}

            {/* Victory Screen */}
            {gamePhase === GAME_PHASES.VICTORY && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h1 style={{ ...styles.title, color: '#00ffff' }}>
                            VICTORY
                        </h1>
                        <p style={styles.subtitle}>Target eliminated</p>
                        <button
                            style={styles.button}
                            onClick={resetGame}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                resetGame();
                            }}
                        >
                            RESTART
                        </button>
                    </div>
                </div>
            )}

            {/* Controls hint - Desktop only */}
            <ControlsHint />
        </div>
    );
}

// Styles
const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        fontFamily: "'Courier New', monospace",
        zIndex: 100,
    },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
    },

    modal: {
        textAlign: 'center',
        padding: 40,
    },

    title: {
        color: '#00ffff',
        fontSize: 48,
        fontWeight: 'bold',
        letterSpacing: 8,
        marginBottom: 20,
        textShadow: '0 0 20px #00ffff66',
    },

    subtitle: {
        color: '#666680',
        fontSize: 14,
        letterSpacing: 4,
        marginBottom: 40,
        textTransform: 'uppercase',
    },

    button: {
        display: 'block',
        width: 200,
        margin: '10px auto',
        padding: '15px 30px',
        backgroundColor: 'transparent',
        border: '1px solid #00ffff',
        color: '#00ffff',
        fontSize: 14,
        letterSpacing: 4,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: "'Courier New', monospace",
    },

    controlsHint: {
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#666680',
        fontSize: 11,
        letterSpacing: 1,
        textAlign: 'center',
        whiteSpace: 'nowrap',
    },
};
