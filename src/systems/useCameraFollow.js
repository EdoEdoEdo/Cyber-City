/**
 * Camera System
 * Smooth follow camera with look-ahead and bounds
 * Pauses during cutscene to allow CutsceneManager control
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
    useGameStore,
    selectPlayerPosition,
    selectPlayer,
    selectIsPaused,
    selectGamePhase,
    selectCamera,
} from '../store/gameStore';
import { CAMERA, GAME_PHASES } from '../constants/gameplayConstants';

export function useCameraFollow() {
    const { camera } = useThree();
    const playerPosition = useGameStore(selectPlayerPosition);
    const player = useGameStore(selectPlayer);
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);
    const cameraState = useGameStore(selectCamera);
    const updateCamera = useGameStore((state) => state.updateCamera);

    const targetRef = useRef({ x: 0, y: CAMERA.VERTICAL_OFFSET });

    useFrame((_, delta) => {
        if (isPaused) return;

        // ========================================
        // DURANTE CUTSCENE: usa posizione dallo store
        // ========================================
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH ||
            gamePhase === GAME_PHASES.INTRO
        ) {
            // CutsceneManager controlla la camera tramite store
            camera.position.x = cameraState.position.x;
            camera.position.y = cameraState.position.y;
            camera.position.z = cameraState.position.z;

            // Guarda il target impostato dalla cutscene
            camera.lookAt(
                cameraState.target?.x || cameraState.position.x,
                cameraState.target?.y || cameraState.position.y,
                cameraState.target?.z || 0,
            );

            // Aggiorna targetRef per smooth transition dopo cutscene
            targetRef.current.x = cameraState.position.x;
            targetRef.current.y = cameraState.position.y;

            return;
        }

        // ========================================
        // GAMEPLAY NORMALE: segue il player
        // ========================================
        const dt = Math.min(delta, 0.1);

        // Calculate target position with look-ahead
        const lookAhead = player.facingRight
            ? CAMERA.LOOK_AHEAD
            : -CAMERA.LOOK_AHEAD;
        const targetX = playerPosition.x + lookAhead;
        const targetY = playerPosition.y + CAMERA.VERTICAL_OFFSET;

        // Clamp to level bounds
        const clampedX = Math.max(
            CAMERA.MIN_X,
            Math.min(targetX, CAMERA.MAX_X),
        );

        // Smooth interpolation
        targetRef.current.x +=
            (clampedX - targetRef.current.x) * CAMERA.FOLLOW_SMOOTHING * dt;
        targetRef.current.y +=
            (targetY - targetRef.current.y) * CAMERA.FOLLOW_SMOOTHING * dt;

        // Update Three.js camera
        camera.position.x = targetRef.current.x;
        camera.position.y = targetRef.current.y;
        camera.position.z = CAMERA.Z_POSITION;

        // Look at target
        camera.lookAt(targetRef.current.x, targetRef.current.y, 0);

        // Update store for other systems
        updateCamera({
            position: {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z,
            },
            target: {
                x: targetRef.current.x,
                y: targetRef.current.y,
                z: 0,
            },
        });
    });
}
