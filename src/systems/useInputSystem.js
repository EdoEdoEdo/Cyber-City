/**
 * Input System
 * Handles keyboard input only
 * Mobile touch is handled by MobileControls component
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { INPUT } from '../constants/gameplayConstants';

export function useInputSystem() {
    const setInput = useGameStore((state) => state.setInput);
    const togglePause = useGameStore((state) => state.togglePause);

    const pressedRef = useRef({
        jump: false,
        shoot: false,
        shield: false,
    });

    // -----------------------------------------
    // KEYBOARD INPUT
    // -----------------------------------------

    const handleKeyDown = useCallback(
        (e) => {
            const key = e.code;

            if (
                [
                    ...INPUT.KEYS.JUMP,
                    ...INPUT.KEYS.LEFT,
                    ...INPUT.KEYS.RIGHT,
                ].includes(key)
            ) {
                e.preventDefault();
            }

            if (INPUT.KEYS.LEFT.includes(key)) {
                setInput({ left: true });
            }
            if (INPUT.KEYS.RIGHT.includes(key)) {
                setInput({ right: true });
            }

            if (INPUT.KEYS.JUMP.includes(key)) {
                setInput({ jump: true });
                if (!pressedRef.current.jump) {
                    setInput({ jumpPressed: true });
                    pressedRef.current.jump = true;
                }
            }

            if (INPUT.KEYS.SHOOT.includes(key)) {
                setInput({ shoot: true });
                if (!pressedRef.current.shoot) {
                    setInput({ shootPressed: true });
                    pressedRef.current.shoot = true;
                }
            }

            if (INPUT.KEYS.SHIELD.includes(key)) {
                if (!pressedRef.current.shield) {
                    setInput({ shield: true, shieldPressed: true });
                    pressedRef.current.shield = true;
                }
            }

            if (INPUT.KEYS.PAUSE.includes(key)) {
                togglePause();
            }
        },
        [setInput, togglePause],
    );

    const handleKeyUp = useCallback(
        (e) => {
            const key = e.code;

            if (INPUT.KEYS.LEFT.includes(key)) {
                setInput({ left: false });
            }
            if (INPUT.KEYS.RIGHT.includes(key)) {
                setInput({ right: false });
            }
            if (INPUT.KEYS.JUMP.includes(key)) {
                setInput({ jump: false });
                pressedRef.current.jump = false;
            }
            if (INPUT.KEYS.SHOOT.includes(key)) {
                setInput({ shoot: false });
                pressedRef.current.shoot = false;
            }
            if (INPUT.KEYS.SHIELD.includes(key)) {
                setInput({ shield: false });
                pressedRef.current.shield = false;
            }
        },
        [setInput],
    );

    // -----------------------------------------
    // SETUP LISTENERS (solo keyboard)
    // -----------------------------------------

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);
}
