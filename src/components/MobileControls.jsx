/**
 * Mobile Controls Component
 * Joystick left + Action buttons right
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

// Detect mobile
const isMobile = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Joystick Component
function Joystick({ onMove, onJump }) {
    const containerRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const touchIdRef = useRef(null);
    const centerRef = useRef({ x: 0, y: 0 });
    const hasJumpedRef = useRef(false);

    const JOYSTICK_SIZE = 120;
    const KNOB_SIZE = 50;
    const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;
    const JUMP_THRESHOLD = -0.5; // Soglia per il salto (verso l'alto)

    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (touchIdRef.current !== null) return;

        const touch = e.changedTouches[0];
        const rect = containerRef.current.getBoundingClientRect();

        centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };

        touchIdRef.current = touch.identifier;
        setIsActive(true);
        hasJumpedRef.current = false;

        // Calcola posizione iniziale
        updatePosition(touch.clientX, touch.clientY);
    }, []);

    const updatePosition = useCallback(
        (clientX, clientY) => {
            const dx = clientX - centerRef.current.x;
            const dy = clientY - centerRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Limita al raggio massimo
            const clampedDistance = Math.min(distance, MAX_DISTANCE);
            const angle = Math.atan2(dy, dx);

            const x = (clampedDistance * Math.cos(angle)) / MAX_DISTANCE;
            const y = (clampedDistance * Math.sin(angle)) / MAX_DISTANCE;

            setPosition({ x, y });

            // Movimento orizzontale
            onMove(x);

            // Salto quando si va verso l'alto
            if (y < JUMP_THRESHOLD && !hasJumpedRef.current) {
                onJump();
                hasJumpedRef.current = true;
            }

            // Reset jump quando si torna giù
            if (y > JUMP_THRESHOLD - 0.1) {
                hasJumpedRef.current = false;
            }
        },
        [onMove, onJump, MAX_DISTANCE, JUMP_THRESHOLD],
    );

    const handleTouchMove = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();

            const touch = Array.from(e.changedTouches).find(
                (t) => t.identifier === touchIdRef.current,
            );
            if (!touch) return;

            updatePosition(touch.clientX, touch.clientY);
        },
        [updatePosition],
    );

    const handleTouchEnd = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();

            const touch = Array.from(e.changedTouches).find(
                (t) => t.identifier === touchIdRef.current,
            );
            if (!touch) return;

            touchIdRef.current = null;
            setIsActive(false);
            setPosition({ x: 0, y: 0 });
            onMove(0);
        },
        [onMove],
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, {
            passive: false,
        });
        container.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
        container.addEventListener('touchend', handleTouchEnd, {
            passive: false,
        });
        container.addEventListener('touchcancel', handleTouchEnd, {
            passive: false,
        });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div
            ref={containerRef}
            style={{
                ...styles.joystickContainer,
                width: JOYSTICK_SIZE,
                height: JOYSTICK_SIZE,
                opacity: isActive ? 1 : 0.6,
            }}
        >
            {/* Base */}
            <div style={styles.joystickBase} />

            {/* Knob */}
            <div
                style={{
                    ...styles.joystickKnob,
                    width: KNOB_SIZE,
                    height: KNOB_SIZE,
                    transform: `translate(${position.x * MAX_DISTANCE}px, ${position.y * MAX_DISTANCE}px)`,
                }}
            />

            {/* Up indicator */}
            <div style={styles.jumpIndicator}>↑</div>
        </div>
    );
}

// Action Button Component
function ActionButton({ label, color, onPress, onRelease }) {
    const handleTouchStart = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            onPress();
        },
        [onPress],
    );

    const handleTouchEnd = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            onRelease();
        },
        [onRelease],
    );

    return (
        <div
            style={{
                ...styles.actionButton,
                borderColor: color,
                boxShadow: `0 0 15px ${color}44, inset 0 0 10px ${color}22`,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <span style={{ ...styles.buttonLabel, color }}>{label}</span>
        </div>
    );
}

// Main Mobile Controls Component
export function MobileControls() {
    const setInput = useGameStore((state) => state.setInput);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    useEffect(() => {
        setIsMobileDevice(isMobile());
    }, []);

    const handleMove = useCallback(
        (x) => {
            if (x < -0.3) {
                setInput({ left: true, right: false });
            } else if (x > 0.3) {
                setInput({ left: false, right: true });
            } else {
                setInput({ left: false, right: false });
            }
        },
        [setInput],
    );

    const handleJump = useCallback(() => {
        setInput({ jumpPressed: true, jump: true });
        setTimeout(() => setInput({ jump: false }), 100);
    }, [setInput]);

    const handleShootPress = useCallback(() => {
        setInput({ shootPressed: true, shoot: true });
    }, [setInput]);

    const handleShootRelease = useCallback(() => {
        setInput({ shoot: false });
    }, [setInput]);

    const handleShieldPress = useCallback(() => {
        setInput({ shieldPressed: true, shield: true });
    }, [setInput]);

    const handleShieldRelease = useCallback(() => {
        setInput({ shield: false });
    }, [setInput]);

    if (!isMobileDevice) return null;

    return (
        <div style={styles.container}>
            {/* Left side - Joystick */}
            <div style={styles.leftZone}>
                <Joystick onMove={handleMove} onJump={handleJump} />
            </div>

            {/* Right side - Action buttons */}
            <div style={styles.rightZone}>
                <ActionButton
                    label="SHOOT"
                    color="#00ffff"
                    onPress={handleShootPress}
                    onRelease={handleShootRelease}
                />
                <ActionButton
                    label="SHIELD"
                    color="#ff0080"
                    onPress={handleShieldPress}
                    onRelease={handleShieldRelease}
                />
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px 20px 20px',
        pointerEvents: 'none',
        zIndex: 200,
    },

    leftZone: {
        pointerEvents: 'auto',
    },

    rightZone: {
        display: 'flex',
        gap: '15px',
        pointerEvents: 'auto',
    },

    joystickContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s',
    },

    joystickBase: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(0, 255, 255, 0.3)',
    },

    joystickKnob: {
        position: 'absolute',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 255, 255, 0.4)',
        border: '2px solid #00ffff',
        boxShadow: '0 0 10px #00ffff44',
        transition: 'transform 0.05s ease-out',
    },

    jumpIndicator: {
        position: 'absolute',
        top: '-25px',
        color: '#00ffff',
        fontSize: '14px',
        fontFamily: "'Courier New', monospace",
        opacity: 0.5,
    },

    actionButton: {
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
    },

    buttonLabel: {
        fontSize: '10px',
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
};
