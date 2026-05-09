/**
 * OutroManager — in-engine debrief cinematic
 *
 * Plays right after the boss death cutscene. Mirrors IntroManager:
 *
 *   0-2.0s   SETTLE       : camera glides from wherever the death cutscene
 *                           ended to a low street framing on the player.
 *   2.0-9.0s DIALOGUE     : 4 OPERATOR/OPERATOR/AGENT/OPERATOR messages,
 *                           camera holds low.
 *   9.0-11.0s DEMATERIALIZE : player flickers + shrinks Y while sparks
 *                             disperse outward (mirror of intro converge).
 *   11.0-13.5s PULL UP    : camera rises from street to a close-up on the
 *                           hologram head (reverse of intro descent).
 *   13.5-14.5s HOLD       : brief hold on the hologram before the VICTORY
 *                           modal takes over.
 *
 * 14.5s total. Player is visible through DEMATERIALIZE, fully gone after.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectOutro,
    selectGamePhase,
    selectResetKey,
} from '../store/gameStore';
import { GAME_PHASES, CAMERA } from '../constants/gameplayConstants';
import { spawnDispersingSpark } from '../systems/particlePool';
import { OUTRO_MESSAGES } from '../constants/outroMessages';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInCubic = (t) => t * t * t;

// Beat times (seconds)
const T_SETTLE_END = 2.0;
const T_DIALOGUE_END = 9.0;
const T_DEMAT_END = 11.0;
const T_PULLUP_END = 13.5;
const T_END = 14.5;

const SPARK_RATE = 90;

// Mirror of IntroManager: hologram base + head Y.
const HOLO_POS = { x: 8, y: 2, z: -5 };
const HOLO_HEAD_Y = 20.0;

export function OutroManager() {
    const outro = useGameStore(selectOutro);
    const gamePhase = useGameStore(selectGamePhase);
    const resetKey = useGameStore(selectResetKey);

    const updateOutro = useGameStore((state) => state.updateOutro);
    const endOutro = useGameStore((state) => state.endOutro);

    const startTimeRef = useRef(null);
    const sparkAccumRef = useRef(0);
    // Capture the camera position at outro start so SETTLE blends from wherever
    // the boss death cutscene left us.
    const fromCamRef = useRef(null);
    // Capture the player position at outro start so the dematerialize anchors
    // on the actual spot where the player stood.
    const playerAnchorRef = useRef(null);

    useEffect(() => {
        startTimeRef.current = null;
        sparkAccumRef.current = 0;
        fromCamRef.current = null;
        playerAnchorRef.current = null;
    }, [resetKey]);

    useFrame((state, delta) => {
        if (!outro.active || gamePhase !== GAME_PHASES.OUTRO) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
            const storeState = useGameStore.getState();
            const cam = storeState.camera;
            fromCamRef.current = {
                pos: {
                    x: cam.position.x,
                    y: cam.position.y,
                    z: cam.position.z,
                },
                tgt: { x: cam.target.x, y: cam.target.y, z: cam.target.z },
            };
            const p = storeState.player.position;
            playerAnchorRef.current = { x: p.x, y: p.y, z: p.z };
        }

        const t = state.clock.elapsedTime - startTimeRef.current;
        const progress = clamp01(t / T_END);

        const playerX = playerAnchorRef.current.x;
        const playerY = playerAnchorRef.current.y;

        // Camera keyframes ------------------------------------------------
        // A) STREET: low, near the player, looking up/forward.
        const camStreet = {
            pos: { x: playerX - 1.0, y: playerY + 0.25, z: 5.0 },
            tgt: { x: playerX + 0.4, y: playerY + 0.9, z: 0 },
        };
        // B) HOLO HEAD: tight close-up on the hologram dancer's head
        //    (matches the intro starting frame).
        const camHolo = {
            pos: {
                x: HOLO_POS.x - 0.6,
                y: HOLO_HEAD_Y + 0.4,
                z: HOLO_POS.z + 2.2,
            },
            tgt: { x: HOLO_POS.x, y: HOLO_HEAD_Y, z: HOLO_POS.z },
        };

        let camPos, camTgt;
        if (t < T_SETTLE_END) {
            // Glide from cutscene-end framing into the street framing.
            const k = easeInOutCubic(t / T_SETTLE_END);
            const from = fromCamRef.current;
            camPos = {
                x: lerp(from.pos.x, camStreet.pos.x, k),
                y: lerp(from.pos.y, camStreet.pos.y, k),
                z: lerp(from.pos.z, camStreet.pos.z, k),
            };
            camTgt = {
                x: lerp(from.tgt.x, camStreet.tgt.x, k),
                y: lerp(from.tgt.y, camStreet.tgt.y, k),
                z: lerp(from.tgt.z, camStreet.tgt.z, k),
            };
        } else if (t < T_DEMAT_END) {
            // Hold low street framing through dialogue + dematerialize.
            camPos = camStreet.pos;
            camTgt = camStreet.tgt;
        } else if (t < T_PULLUP_END) {
            // Pull up to hologram head close-up. ease-in: slow start, then
            // accelerates upward (mirror of intro's ease-in dive).
            const k = easeInCubic(
                (t - T_DEMAT_END) / (T_PULLUP_END - T_DEMAT_END),
            );
            camPos = {
                x: lerp(camStreet.pos.x, camHolo.pos.x, k),
                y: lerp(camStreet.pos.y, camHolo.pos.y, k),
                z: lerp(camStreet.pos.z, camHolo.pos.z, k),
            };
            camTgt = {
                x: lerp(camStreet.tgt.x, camHolo.tgt.x, k),
                y: lerp(camStreet.tgt.y, camHolo.tgt.y, k),
                z: lerp(camStreet.tgt.z, camHolo.tgt.z, k),
            };
        } else {
            // Hold on hologram before the VICTORY modal appears.
            camPos = camHolo.pos;
            camTgt = camHolo.tgt;
        }

        // Mirror into store IN PLACE (Background reads via getState()).
        const camStore = useGameStore.getState().camera;
        camStore.position.x = camPos.x;
        camStore.position.y = camPos.y;
        camStore.position.z = camPos.z;
        camStore.target.x = camTgt.x;
        camStore.target.y = camTgt.y;
        camStore.target.z = camTgt.z;

        // Phase + materialize --------------------------------------------
        // Phases drive ChatBubble visibility + Player dematerialize logic.
        let phase = 0;
        let materialize = 1;
        if (t >= T_PULLUP_END) {
            phase = 4; // hold on hologram, modal incoming
            materialize = 0;
        } else if (t >= T_DEMAT_END) {
            phase = 3; // pull-up, player gone
            materialize = 0;
        } else if (t >= T_DIALOGUE_END) {
            phase = 2; // dematerialize
            materialize =
                1 -
                clamp01((t - T_DIALOGUE_END) / (T_DEMAT_END - T_DIALOGUE_END));
        } else if (t >= T_SETTLE_END) {
            phase = 1; // dialogue
            materialize = 1;
        } else {
            phase = 0; // settle
            materialize = 1;
        }

        // Chat messages: figure out which beat is active by elapsed time.
        let currentMessage = -1;
        for (let i = OUTRO_MESSAGES.length - 1; i >= 0; i--) {
            if (t >= OUTRO_MESSAGES[i].time) {
                currentMessage = i;
                break;
            }
        }
        // Hide chat once dematerialize starts (player attention shifts).
        if (t >= T_DEMAT_END) currentMessage = -1;

        if (
            outro.phase !== phase ||
            outro.currentMessage !== currentMessage ||
            Math.abs((outro.materialize ?? 1) - materialize) > 0.01
        ) {
            updateOutro({ progress, phase, materialize, currentMessage });
        } else if (Math.abs(outro.progress - progress) > 0.01) {
            updateOutro({ progress });
        }

        // Dispersing sparks during dematerialize -------------------------
        if (phase === 2) {
            sparkAccumRef.current +=
                delta * SPARK_RATE * (0.4 + (1 - materialize) * 0.8);
            const origin = { x: playerX, y: playerY + 1.0, z: 0 };
            while (sparkAccumRef.current >= 1) {
                spawnDispersingSpark(origin, 0.6, 0.7, 0);
                sparkAccumRef.current -= 1;
            }
        }

        if (t >= T_END) {
            endOutro();
            startTimeRef.current = null;
            sparkAccumRef.current = 0;
            fromCamRef.current = null;
            playerAnchorRef.current = null;
        }
    });

    return null;
}
