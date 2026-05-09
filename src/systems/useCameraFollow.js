/**
 * Camera System
 * Smooth follow camera with look-ahead and bounds
 * Pauses during cutscene to allow CutsceneManager control
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
    useGameStore,
    selectIsPaused,
    selectGamePhase,
} from '../store/gameStore';
import { CAMERA, GAME_PHASES } from '../constants/gameplayConstants';
import { tickShake } from './cameraShake';
import { tickTimeScale, getTimeScale } from './timeScale';

export function useCameraFollow() {
    const { camera } = useThree();
    // Subscribe ONLY to gating state. player/camera positions are read via
    // getState() inside the frame loop to avoid 60 fps React re-renders of
    // GameSystems and the closures it captures.
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);
    const updateCamera = useGameStore((state) => state.updateCamera);

    const targetRef = useRef({ x: 0, y: CAMERA.VERTICAL_OFFSET });

    useFrame((_, delta) => {
        if (isPaused) return;

        const state = useGameStore.getState();
        const player = state.player;
        const cameraState = state.camera;

        const dt = Math.min(delta, 0.1);
        // Tick the global time-scale here (always runs, even during the
        // VICTORY / BOSS_DEATH gamePhases that early-return other systems).
        // Without this, the kill-cam slow-mo set by triggerKillCam() never
        // actually advances and feels skipped.
        tickTimeScale(dt);
        // Camera shake runs in real time so freeze frames still pop
        const shake = tickShake(dt);
        // ...but follow smoothing slows with the world for cinematic feel
        const followDt = dt * getTimeScale();

        // ========================================
        // DURANTE CUTSCENE: usa posizione dallo store
        // ========================================
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH ||
            gamePhase === GAME_PHASES.INTRO ||
            gamePhase === GAME_PHASES.OUTRO ||
            gamePhase === GAME_PHASES.VICTORY
        ) {
            // CutsceneManager controlla la camera tramite store
            camera.position.x = cameraState.position.x + shake.x;
            camera.position.y = cameraState.position.y + shake.y;
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

        // Calculate target position with look-ahead
        const lookAhead = player.facingRight
            ? CAMERA.LOOK_AHEAD
            : -CAMERA.LOOK_AHEAD;
        const targetX = player.position.x + lookAhead;
        const targetY = player.position.y + CAMERA.VERTICAL_OFFSET;

        // Clamp to level bounds
        const clampedX = Math.max(
            CAMERA.MIN_X,
            Math.min(targetX, CAMERA.MAX_X),
        );

        // Smooth interpolation
        targetRef.current.x +=
            (clampedX - targetRef.current.x) *
            CAMERA.FOLLOW_SMOOTHING *
            followDt;
        targetRef.current.y +=
            (targetY - targetRef.current.y) *
            CAMERA.FOLLOW_SMOOTHING *
            followDt;

        // Update Three.js camera (with shake offset)
        camera.position.x = targetRef.current.x + shake.x;
        camera.position.y = targetRef.current.y + shake.y;
        camera.position.z = CAMERA.Z_POSITION;

        // Look at target (no shake on lookAt = pure positional shake)
        camera.lookAt(targetRef.current.x, targetRef.current.y, 0);

        // Mirror the camera into the store IN PLACE without going through
        // set(): the only consumer (Background) reads via getState() inside
        // its own useFrame, so we don't need to notify any subscriber.
        // Avoids per-frame Zustand notifications and 2 fresh allocations.
        const camStore = useGameStore.getState().camera;
        camStore.position.x = camera.position.x;
        camStore.position.y = camera.position.y;
        camStore.position.z = camera.position.z;
        camStore.target.x = targetRef.current.x;
        camStore.target.y = targetRef.current.y;
        camStore.target.z = 0;
    });
}
