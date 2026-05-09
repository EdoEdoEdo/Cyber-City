/**
 * IntroManager — in-engine cinematic
 *
 * 14-second sequence with no external assets. Three camera keyframes:
 *
 *   0-3.5s   HOLOGRAM   : tight shot on the central hologram (the dancer
 *                         silhouette is the iconic Blade Runner cue) while
 *                         the operator opens the comm.
 *   3.5-7s   DOLLY DOWN : camera dives down and pulls back, revealing the
 *                         wet street and the city behind. Agent answers.
 *   7-10.5s  STREET     : low ground framing. Operator warns. Sparks start
 *                         converging at the spawn point.
 *   10.5-12.5s MATERIALIZE : agent fades-in glitch hologram. Last quip.
 *   12.5-14s READY      : settle into gameplay framing, // READY blink.
 *
 * The 4 OPERATOR/AGENT lines are kept verbatim and beat-matched. Camera
 * position is written to the store every frame; useCameraFollow picks it
 * up because gamePhase === INTRO.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIntro,
    selectGamePhase,
    selectResetKey,
} from '../store/gameStore';
import { GAME_PHASES, PLAYER, CAMERA } from '../constants/gameplayConstants';
import { spawnConvergingSpark } from '../systems/particlePool';
import { INTRO_MESSAGES } from '../constants/introMessages';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInCubic = (t) => t * t * t; // slow start, accelerates → for the dive
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Beat times (seconds)
//   0      → HOLO_END    : tight close-up on hologram head
//   HOLO   → DOLLY_END   : camera dives down to street
//   DOLLY  → STREET_END  : brief street hold (sparks ramp)
//   STREET → MAT_END     : player materializes (ready pose)
//   MAT    → MSG_END     : 4 OPERATOR/AGENT messages, camera holds low
//   MSG    → SETTLE_END  : zoom out to gameplay framing
//   SETTLE → END         : brief settle, hand off to gameplay
const T_HOLO_END = 4.0;
const T_DOLLY_END = 7.5;
const T_STREET_END = 8.0;
const T_MATERIALIZE_END = 10.0;
const T_MESSAGES_END = 17.0;
const T_SETTLE_END = 18.5;
const T_END = 19.0;

const SPARK_RATE = 80;

// Hologram world position (mirrors Background.jsx: position={[8, 2, -5]},
// scale 25 → the dancer's head sits high above the base.
const HOLO_POS = { x: 8, y: 2, z: -5 };
const HOLO_HEAD_Y = 20.0;

export function IntroManager() {
    const intro = useGameStore(selectIntro);
    const gamePhase = useGameStore(selectGamePhase);
    const resetKey = useGameStore(selectResetKey);

    const updateIntro = useGameStore((state) => state.updateIntro);
    const endIntro = useGameStore((state) => state.endIntro);
    const updateCamera = useGameStore((state) => state.updateCamera);

    const startTimeRef = useRef(null);
    const sparkAccumRef = useRef(0);

    useEffect(() => {
        startTimeRef.current = null;
        sparkAccumRef.current = 0;
    }, [resetKey]);

    useFrame((state, delta) => {
        if (!intro.active || gamePhase !== GAME_PHASES.INTRO) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const t = state.clock.elapsedTime - startTimeRef.current;
        const progress = clamp01(t / T_END);

        const playerX = PLAYER.START_X;
        const playerY = PLAYER.START_Y;

        // Camera keyframes ------------------------------------------------
        // A) HOLO HEAD: very tight close-up on the hologram dancer's head.
        //    Camera sits just in front (slight side angle) so the face fills
        //    the frame.
        const camHolo = {
            pos: {
                x: HOLO_POS.x - 0.6,
                y: HOLO_HEAD_Y + 0.4,
                z: HOLO_POS.z + 2.2,
            },
            tgt: { x: HOLO_POS.x, y: HOLO_HEAD_Y, z: HOLO_POS.z },
        };
        // B) STREET: low, near the spawn, looking up/forward at the city.
        const camStreet = {
            pos: { x: playerX - 1.0, y: playerY + 0.25, z: 5.0 },
            tgt: { x: playerX + 0.4, y: playerY + 0.9, z: 0 },
        };
        // C) GAMEPLAY: standard framing.
        const camGameplay = {
            pos: {
                x: playerX,
                y: playerY + CAMERA.VERTICAL_OFFSET,
                z: CAMERA.Z_POSITION,
            },
            tgt: { x: playerX, y: playerY + CAMERA.VERTICAL_OFFSET, z: 0 },
        };

        let camPos, camTgt;
        if (t < T_HOLO_END) {
            // Tiny drift on the head — alive but not noisy.
            const k = t / T_HOLO_END;
            camPos = {
                x: camHolo.pos.x + Math.sin(k * Math.PI) * 0.15,
                y: camHolo.pos.y - k * 0.3, // start to descend slowly already
                z: camHolo.pos.z - k * 0.2, // micro push-in
            };
            camTgt = {
                x: camHolo.tgt.x,
                y: camHolo.tgt.y - k * 0.4,
                z: camHolo.tgt.z,
            };
        } else if (t < T_DOLLY_END) {
            // Dive down + pull back. ease-in: slow start → accelerates.
            const k = easeInCubic(
                (t - T_HOLO_END) / (T_DOLLY_END - T_HOLO_END),
            );
            camPos = {
                x: lerp(camHolo.pos.x, camStreet.pos.x, k),
                y: lerp(camHolo.pos.y - 0.3, camStreet.pos.y, k),
                z: lerp(camHolo.pos.z - 0.2, camStreet.pos.z, k),
            };
            camTgt = {
                x: lerp(camHolo.tgt.x, camStreet.tgt.x, k),
                y: lerp(camHolo.tgt.y - 0.4, camStreet.tgt.y, k),
                z: lerp(camHolo.tgt.z, camStreet.tgt.z, k),
            };
        } else if (t < T_MATERIALIZE_END) {
            // Hold low street framing through the materialize.
            camPos = camStreet.pos;
            camTgt = camStreet.tgt;
        } else if (t < T_MESSAGES_END) {
            // Hold low street framing while messages play — player is on screen.
            camPos = camStreet.pos;
            camTgt = camStreet.tgt;
        } else if (t < T_SETTLE_END) {
            // Zoom out to gameplay framing once dialogue is done.
            const k = easeOutCubic(
                (t - T_MESSAGES_END) / (T_SETTLE_END - T_MESSAGES_END),
            );
            camPos = {
                x: lerp(camStreet.pos.x, camGameplay.pos.x, k),
                y: lerp(camStreet.pos.y, camGameplay.pos.y, k),
                z: lerp(camStreet.pos.z, camGameplay.pos.z, k),
            };
            camTgt = {
                x: lerp(camStreet.tgt.x, camGameplay.tgt.x, k),
                y: lerp(camStreet.tgt.y, camGameplay.tgt.y, k),
                z: lerp(camStreet.tgt.z, camGameplay.tgt.z, k),
            };
        } else {
            // Hold gameplay framing while messages play out.
            camPos = camGameplay.pos;
            camTgt = camGameplay.tgt;
        }
        updateCamera({ position: camPos, target: camTgt });

        // Phase + materialize --------------------------------------------
        // Phases drive the terminal HUD overlay (corner brackets, // READY).
        // Chat messages are driven independently below by `currentMessage`.
        let phase = 0;
        let materialize = 0;
        if (t >= T_SETTLE_END) {
            phase = 3;
            materialize = 1;
        } else if (t >= T_STREET_END) {
            phase = 2;
            materialize = clamp01(
                (t - T_STREET_END) / (T_MATERIALIZE_END - T_STREET_END),
            );
        } else if (t >= T_HOLO_END) {
            phase = 1;
        } else {
            phase = 0;
        }

        // Chat messages: figure out which beat is active by elapsed time.
        // Messages are timed to start AFTER the player has materialized.
        let currentMessage = -1;
        for (let i = INTRO_MESSAGES.length - 1; i >= 0; i--) {
            if (t >= INTRO_MESSAGES[i].time) {
                currentMessage = i;
                break;
            }
        }

        if (
            intro.phase !== phase ||
            intro.currentMessage !== currentMessage ||
            Math.abs((intro.materialize || 0) - materialize) > 0.01
        ) {
            updateIntro({ progress, phase, materialize, currentMessage });
        } else if (Math.abs(intro.progress - progress) > 0.01) {
            updateIntro({ progress });
        }

        // Converging sparks during materialize ----------------------------
        // Only spawn while the player is actually materializing — once
        // materialize completes (t >= T_MATERIALIZE_END) we stop emitting
        // and let the in-flight particles fade out (~0.6s lifetime) so the
        // dialogue starts on a clean frame.
        if (phase === 2 && t < T_MATERIALIZE_END) {
            sparkAccumRef.current +=
                delta * SPARK_RATE * (0.6 + materialize * 0.6);
            const target = { x: playerX, y: playerY + 1.0, z: 0 };
            while (sparkAccumRef.current >= 1) {
                spawnConvergingSpark(target, 2.5, 0.6, 0);
                sparkAccumRef.current -= 1;
            }
        }

        if (t >= T_END) {
            endIntro();
            startTimeRef.current = null;
            sparkAccumRef.current = 0;
        }
    });

    return null;
}
