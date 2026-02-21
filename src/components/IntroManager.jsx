/**
 * IntroManager Component
 * Handles intro cutscene with camera zoom and dialogue
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIntro,
    selectGamePhase,
    selectPlayerPosition,
    selectResetKey,
} from '../store/gameStore';
import { GAME_PHASES, PLAYER, CAMERA } from '../constants/gameplayConstants';

const lerp = (start, end, t) => start + (end - start) * t;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutQuad = (t) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Timeline: 6 secondi totali
const INTRO_DURATION = 9.0;
const ZOOM_OUT_START = 8.0;

// Messaggi e timing
export const INTRO_MESSAGES = [
    {
        time: 0.5,
        sender: 'operator',
        text: 'Our intel says the Cyberpsycho is nearby.',
    },
    {
        time: 2.5,
        sender: 'agent',
        text: 'Roger! I can see the traces of his passage.',
    },
    {
        time: 4.5,
        sender: 'operator',
        text: 'Be careful! He’s a butcher...',
    },
    {
        time: 6.5,
        sender: 'agent',
        text: 'Just another Tuesday.',
    },
];

export function IntroManager() {
    const intro = useGameStore(selectIntro);
    const gamePhase = useGameStore(selectGamePhase);
    const playerPosition = useGameStore(selectPlayerPosition);
    const resetKey = useGameStore(selectResetKey);

    const updateIntro = useGameStore((state) => state.updateIntro);
    const endIntro = useGameStore((state) => state.endIntro);
    const updateCamera = useGameStore((state) => state.updateCamera);

    const startTimeRef = useRef(null);

    // Reset quando resetKey cambia
    useEffect(() => {
        startTimeRef.current = null;
    }, [resetKey]);

    useFrame((state) => {
        if (!intro.active || gamePhase !== GAME_PHASES.INTRO) return;

        // Inizializza timer
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const progress = Math.min(elapsed / INTRO_DURATION, 1);

        updateIntro({ progress });

        // Calcola quale messaggio mostrare
        let currentMessage = -1;
        for (let i = INTRO_MESSAGES.length - 1; i >= 0; i--) {
            if (elapsed >= INTRO_MESSAGES[i].time) {
                currentMessage = i;
                break;
            }
        }

        // Nascondi messaggi durante zoom out
        if (elapsed >= ZOOM_OUT_START - 0.3) {
            currentMessage = -1;
        }

        updateIntro({ currentMessage });

        const playerX = PLAYER.START_X;
        const playerY = PLAYER.START_Y;

        // Camera zoommata sul player (Z = 8 invece di 15)
        const zoomedZ = 8;
        const normalZ = CAMERA.Z_POSITION;

        if (elapsed < ZOOM_OUT_START) {
            // Camera zoommata sul player
            updateCamera({
                position: {
                    x: playerX,
                    y: playerY + 1.5,
                    z: zoomedZ,
                },
                target: {
                    x: playerX,
                    y: playerY + 1,
                    z: 0,
                },
            });
        } else {
            // Zoom out
            const zoomOutProgress = easeOutExpo(
                (elapsed - ZOOM_OUT_START) / (INTRO_DURATION - ZOOM_OUT_START),
            );

            updateCamera({
                position: {
                    x: playerX,
                    y: lerp(
                        playerY + 1.5,
                        CAMERA.VERTICAL_OFFSET,
                        zoomOutProgress,
                    ),
                    z: lerp(zoomedZ, normalZ, zoomOutProgress),
                },
                target: {
                    x: playerX,
                    y: lerp(
                        playerY + 1,
                        CAMERA.VERTICAL_OFFSET,
                        zoomOutProgress,
                    ),
                    z: 0,
                },
            });
        }

        // Fine intro
        if (elapsed >= INTRO_DURATION) {
            endIntro();
            startTimeRef.current = null;
        }
    });

    return null;
}
