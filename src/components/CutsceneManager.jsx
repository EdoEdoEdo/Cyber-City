/**
 * CutsceneManager Component
 * Handles boss intro and death cutscene timelines
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectCutscene,
    selectBoss,
    selectGamePhase,
    selectResetKey,
    selectCamera,
} from '../store/gameStore';
import { BOSS, GAME_PHASES } from '../constants/gameplayConstants';

const lerp = (start, end, t) => start + (end - start) * t;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function CutsceneManager() {
    const cutscene = useGameStore(selectCutscene);
    const boss = useGameStore(selectBoss);
    const gamePhase = useGameStore(selectGamePhase);
    const resetKey = useGameStore(selectResetKey);
    const camera = useGameStore(selectCamera);

    const updateCutscene = useGameStore((state) => state.updateCutscene);
    const endCutscene = useGameStore((state) => state.endCutscene);
    const endDeathCutscene = useGameStore((state) => state.endDeathCutscene);
    const setBossAccentColor = useGameStore(
        (state) => state.setBossAccentColor,
    );
    const updateCamera = useGameStore((state) => state.updateCamera);
    const updateAudio = useGameStore((state) => state.updateAudio);
    const updateEnemy = useGameStore((state) => state.updateEnemy);

    const startTimeRef = useRef(null);
    const initialCameraRef = useRef(null);
    const bossOriginalPosRef = useRef(null);

    // Reset refs quando resetKey cambia
    useEffect(() => {
        startTimeRef.current = null;
        initialCameraRef.current = null;
        bossOriginalPosRef.current = null;
    }, [resetKey]);

    useFrame((state, delta) => {
        // ===========================================
        // INTRO CUTSCENE
        // ===========================================
        if (
            cutscene.active &&
            cutscene.type === 'intro' &&
            gamePhase === GAME_PHASES.CUTSCENE
        ) {
            if (startTimeRef.current === null) {
                startTimeRef.current = state.clock.elapsedTime;
                initialCameraRef.current = { ...state.camera.position };
                if (boss) {
                    bossOriginalPosRef.current = { ...boss.position };
                }
            }

            const elapsed = state.clock.elapsedTime - startTimeRef.current;
            updateCutscene({
                progress: Math.min(elapsed / BOSS.CUTSCENE_DURATION, 1),
            });

            const bossX =
                bossOriginalPosRef.current?.x || cutscene.bossPosition?.x || 25;
            const bossY =
                bossOriginalPosRef.current?.y ||
                cutscene.bossPosition?.y ||
                0.3;
            const bossZ = bossOriginalPosRef.current?.z || 0;

            const ZOOM_DURATION = 1.2;

            // Phase 1: ZOOM IN
            if (elapsed < ZOOM_DURATION) {
                const zoomProgress = easeOutExpo(elapsed / ZOOM_DURATION);
                updateCamera({
                    position: {
                        x: lerp(
                            initialCameraRef.current?.x || 0,
                            bossX,
                            zoomProgress,
                        ),
                        y: lerp(2, bossY + 1.5, zoomProgress),
                        z: lerp(15, 6, zoomProgress),
                    },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 2: COLOR + GLITCH
            if (elapsed >= ZOOM_DURATION && elapsed < 3.0) {
                const colorProgress =
                    (elapsed - ZOOM_DURATION) / (3.0 - ZOOM_DURATION);
                const r = 255;
                const g = Math.round(lerp(102, 0, colorProgress));
                const b = Math.round(lerp(0, 51, colorProgress));
                setBossAccentColor(`rgb(${r}, ${g}, ${b})`);

                const glitchIntensity = 0.08;
                if (Math.random() > 0.2 && boss) {
                    updateEnemy(boss.id, {
                        position: {
                            x: bossX + (Math.random() - 0.5) * glitchIntensity,
                            y: bossY,
                            z:
                                bossZ +
                                (Math.random() - 0.5) * glitchIntensity * 0.5,
                        },
                    });
                } else if (boss) {
                    updateEnemy(boss.id, {
                        position: { x: bossX, y: bossY, z: bossZ },
                    });
                }

                updateCamera({
                    position: { x: bossX, y: bossY + 1.5, z: 6 },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 3: AUDIO
            if (elapsed >= 0.5 && elapsed < 2.5) {
                const audioProgress = (elapsed - 0.5) / 2.0;
                updateAudio({
                    rainVolume: lerp(0.4, 0.1, audioProgress),
                    musicVolume: lerp(0, 0.4, audioProgress),
                    musicPlaying: true,
                });
            }

            // Phase 4: HOLD
            if (elapsed >= 3.0 && elapsed < 4.0) {
                if (boss) {
                    updateEnemy(boss.id, {
                        position: { x: bossX, y: bossY, z: bossZ },
                    });
                }
                updateCamera({
                    position: { x: bossX, y: bossY + 1.5, z: 6 },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 5: ZOOM OUT
            if (elapsed >= 4.0 && elapsed < BOSS.CUTSCENE_DURATION) {
                const zoomOutProgress = easeOutExpo(
                    (elapsed - 4.0) / ZOOM_DURATION,
                );
                updateCamera({
                    position: {
                        x: bossX,
                        y: lerp(bossY + 1.5, 2, zoomOutProgress),
                        z: lerp(6, 15, zoomOutProgress),
                    },
                    target: { x: bossX, y: 2, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // End
            if (elapsed >= BOSS.CUTSCENE_DURATION) {
                if (boss && bossOriginalPosRef.current) {
                    updateEnemy(boss.id, {
                        position: bossOriginalPosRef.current,
                    });
                }
                updateCamera({ shake: { x: 0, y: 0 } });
                endCutscene();
                startTimeRef.current = null;
                initialCameraRef.current = null;
                bossOriginalPosRef.current = null;
            }
        }

        // ===========================================
        // DEATH CUTSCENE (6.5 secondi totali)
        // ===========================================
        if (
            cutscene.active &&
            cutscene.type === 'death' &&
            gamePhase === GAME_PHASES.BOSS_DEATH
        ) {
            if (startTimeRef.current === null) {
                startTimeRef.current = state.clock.elapsedTime;
                initialCameraRef.current = {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z,
                };
                if (cutscene.bossPosition) {
                    bossOriginalPosRef.current = { ...cutscene.bossPosition };
                } else if (boss) {
                    bossOriginalPosRef.current = { ...boss.position };
                }
            }

            const elapsed = state.clock.elapsedTime - startTimeRef.current;
            const duration = 6.5; // Durata totale

            updateCutscene({ progress: Math.min(elapsed / duration, 1) });

            const bossX = bossOriginalPosRef.current?.x || 35;
            const bossY = bossOriginalPosRef.current?.y || 0.3;
            const bossZ = bossOriginalPosRef.current?.z || 0;

            // Phase 1: ZOOM IN (0 - 1.2s)
            if (elapsed < 1.2) {
                const zoomProgress = easeOutExpo(elapsed / 1.2);
                updateCamera({
                    position: {
                        x: lerp(
                            initialCameraRef.current?.x || bossX,
                            bossX,
                            zoomProgress,
                        ),
                        y: lerp(
                            initialCameraRef.current?.y || 2,
                            bossY + 1.5,
                            zoomProgress,
                        ),
                        z: lerp(
                            initialCameraRef.current?.z || 15,
                            5,
                            zoomProgress,
                        ),
                    },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 2: RED TO WHITE + GLITCH (1.2 - 3.5s)
            if (elapsed >= 1.2 && elapsed < 3.5) {
                const colorProgress = (elapsed - 1.2) / 2.3;
                const r = 255;
                const g = Math.round(lerp(0, 255, colorProgress));
                const b = Math.round(lerp(51, 255, colorProgress));
                setBossAccentColor(`rgb(${r}, ${g}, ${b})`);

                // Glitch sempre più intenso
                const glitchIntensity = 0.1 + colorProgress * 0.2;
                if (Math.random() > 0.1 && boss) {
                    updateEnemy(boss.id, {
                        position: {
                            x: bossX + (Math.random() - 0.5) * glitchIntensity,
                            y:
                                bossY +
                                (Math.random() - 0.5) * glitchIntensity * 0.3,
                            z: bossZ + (Math.random() - 0.5) * glitchIntensity,
                        },
                    });
                }

                updateCamera({
                    position: { x: bossX, y: bossY + 1.5, z: 5 },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 3: FLASH WHITE (3.5 - 4.0s)
            if (elapsed >= 3.5 && elapsed < 4.0) {
                setBossAccentColor('#ffffff');
                if (boss) {
                    updateEnemy(boss.id, {
                        position: { x: bossX, y: bossY, z: bossZ },
                    });
                }

                updateCamera({
                    position: { x: bossX, y: bossY + 1.5, z: 5 },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 4: EXPLOSION (4.0 - 6.0s) - Nascondi boss, mostra esplosione
            if (elapsed >= 4.0 && elapsed < 6.0) {
                // Attiva esplosione e nascondi boss
                if (!cutscene.showExplosion) {
                    updateCutscene({ showExplosion: true, hideBoss: true });
                }

                // Camera si allontana leggermente durante esplosione
                const explosionProgress = (elapsed - 4.0) / 2.0;
                updateCamera({
                    position: {
                        x: bossX,
                        y: lerp(bossY + 1.5, bossY + 2.5, explosionProgress),
                        z: lerp(5, 10, explosionProgress),
                    },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // Phase 5: HOLD (6.0 - 6.5s)
            if (elapsed >= 6.0 && elapsed < duration) {
                updateCamera({
                    position: { x: bossX, y: bossY + 2.5, z: 10 },
                    target: { x: bossX, y: bossY + 1, z: 0 },
                    shake: { x: 0, y: 0 },
                });
            }

            // End death cutscene
            if (elapsed >= duration) {
                updateCamera({ shake: { x: 0, y: 0 } });
                updateCutscene({ showExplosion: false, hideBoss: false });
                endDeathCutscene();
                startTimeRef.current = null;
                initialCameraRef.current = null;
                bossOriginalPosRef.current = null;
            }
        }
    });

    return null;
}
