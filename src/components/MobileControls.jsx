/**
 * Mobile Controls Component
 * Joystick left (movement only) + 3 Action buttons right (Jump, Shoot, Shield)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

// Detect mobile
const isMobile = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Joystick Component - SOLO movimento orizzontale
function Joystick({ onMove }) {
    const containerRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isActive, setIsActive] = useState(false);
    const touchIdRef = useRef(null);
    const centerRef = useRef({ x: 0, y: 0 });

    const JOYSTICK_SIZE = 120;
    const KNOB_SIZE = 50;
    const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

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

        updatePosition(touch.clientX, touch.clientY);
    }, []);

    const updatePosition = useCallback(
        (clientX, clientY) => {
            const dx = clientX - centerRef.current.x;
            const dy = clientY - centerRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const clampedDistance = Math.min(distance, MAX_DISTANCE);
            const angle = Math.atan2(dy, dx);

            const x = (clampedDistance * Math.cos(angle)) / MAX_DISTANCE;
            const y = (clampedDistance * Math.sin(angle)) / MAX_DISTANCE;

            setPosition({ x, y });

            // Solo movimento orizzontale
            onMove(x);
        },
        [onMove, MAX_DISTANCE],
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
        </div>
    );
}

// Action Button Component - Con touch ID tracking per precisione
function ActionButton({ label, color, icon, onPress, onRelease, size = 70 }) {
    const touchIdRef = useRef(null);
    const buttonRef = useRef(null);
    const [isPressed, setIsPressed] = useState(false);

    const handleTouchStart = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (touchIdRef.current !== null) return;

            touchIdRef.current = e.changedTouches[0].identifier;
            setIsPressed(true);
            onPress();
        },
        [onPress],
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
            setIsPressed(false);
            onRelease();
        },
        [onRelease],
    );

    useEffect(() => {
        const button = buttonRef.current;
        if (!button) return;

        button.addEventListener('touchstart', handleTouchStart, {
            passive: false,
        });
        button.addEventListener('touchend', handleTouchEnd, { passive: false });
        button.addEventListener('touchcancel', handleTouchEnd, {
            passive: false,
        });

        return () => {
            button.removeEventListener('touchstart', handleTouchStart);
            button.removeEventListener('touchend', handleTouchEnd);
            button.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchEnd]);

    return (
        <div
            ref={buttonRef}
            style={{
                ...styles.actionButton,
                width: size,
                height: size,
                borderColor: color,
                boxShadow: isPressed
                    ? `0 0 25px ${color}, inset 0 0 20px ${color}44`
                    : `0 0 15px ${color}44, inset 0 0 10px ${color}22`,
                backgroundColor: isPressed
                    ? `${color}33`
                    : 'rgba(0, 0, 0, 0.5)',
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            }}
        >
            {icon && (
                <span style={{ ...styles.buttonIcon, color }}>{icon}</span>
            )}
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

    // Joystick - solo movimento
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

    // Jump button
    const handleJumpPress = useCallback(() => {
        setInput({ jumpPressed: true, jump: true });
    }, [setInput]);

    const handleJumpRelease = useCallback(() => {
        setInput({ jump: false });
    }, [setInput]);

    // Shoot button
    const handleShootPress = useCallback(() => {
        setInput({ shootPressed: true, shoot: true });
    }, [setInput]);

    const handleShootRelease = useCallback(() => {
        setInput({ shoot: false });
    }, [setInput]);

    // Shield button
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
                <Joystick onMove={handleMove} />
            </div>

            {/* Right side - 3 Action buttons */}
            <div style={styles.rightZone}>
                {/* Top row: Jump */}
                <div style={styles.topButton}>
                    <ActionButton
                        label="JUMP"
                        icon="↑"
                        color="#ffff00"
                        onPress={handleJumpPress}
                        onRelease={handleJumpRelease}
                        size={60}
                    />
                </div>

                {/* Bottom row: Shoot + Shield */}
                <div style={styles.bottomButtons}>
                    <ActionButton
                        label="SHOOT"
                        icon="●"
                        color="#00ffff"
                        onPress={handleShootPress}
                        onRelease={handleShootRelease}
                        size={70}
                    />
                    <ActionButton
                        label="SHIELD"
                        icon="◆"
                        color="#ff0080"
                        onPress={handleShieldPress}
                        onRelease={handleShieldRelease}
                        size={70}
                    />
                </div>
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
        height: '200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 20px 20px 20px',
        pointerEvents: 'none',
        zIndex: 200,
    },

    leftZone: {
        pointerEvents: 'auto',
        touchAction: 'none',
    },

    rightZone: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        pointerEvents: 'auto',
        touchAction: 'none',
    },

    topButton: {
        marginBottom: '5px',
    },

    bottomButtons: {
        display: 'flex',
        gap: '15px',
    },

    joystickContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s',
        touchAction: 'none',
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

    actionButton: {
        borderRadius: '50%',
        border: '2px solid',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        transition: 'all 0.1s ease',
    },

    buttonIcon: {
        fontSize: '18px',
        marginBottom: '2px',
    },

    buttonLabel: {
        fontSize: '8px',
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        letterSpacing: '1px',
    },
};
