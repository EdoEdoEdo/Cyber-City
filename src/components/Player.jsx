/**
 * Player Component
 * Pure visual representation - no gameplay logic.
 *
 * IMPORTANT: this component does NOT subscribe to `state.player`. The
 * controller calls `updatePlayer({...})` every frame with a fresh object
 * reference, which would force a 60 fps React reconciliation of ~15 meshes
 * + their conditionals (muzzle flash, shield, shadow). Instead we read the
 * latest player snapshot via `useGameStore.getState()` inside the frame
 * loop and drive everything imperatively through refs. We only subscribe
 * to coarse, low-frequency state: `isDead`, `gamePhase`, `intro` (changes
 * are diff-guarded by IntroManager).
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIntro,
    selectOutro,
    selectGamePhase,
} from '../store/gameStore';
import { PLAYER, COLORS, GAME_PHASES } from '../constants/gameplayConstants';

const selectIsDead = (state) => state.player.isDead;

export function Player() {
    const isDead = useGameStore(selectIsDead);
    const intro = useGameStore(selectIntro);
    const outro = useGameStore(selectOutro);
    const gamePhase = useGameStore(selectGamePhase);

    const groupRef = useRef();
    const innerGroupRef = useRef();
    const shieldRef = useRef();
    const shieldGroupRef = useRef();
    const flashMatRef = useRef();
    const dashTrailRef = useRef();
    const muzzleRef = useRef();
    const shadowRef = useRef();

    useFrame((state) => {
        const player = useGameStore.getState().player;
        if (!groupRef.current) return;

        // ---- Position ----
        groupRef.current.position.set(
            player.position.x,
            player.position.y,
            player.position.z,
        );

        // ---- Intro hologram materialization ----
        if (gamePhase === GAME_PHASES.INTRO) {
            if (intro.phase < 2) {
                groupRef.current.visible = false;
            } else if (intro.phase === 2 && intro.materialize < 1) {
                const m = intro.materialize;
                const visibleChance = 0.25 + m * 0.7;
                groupRef.current.visible = Math.random() < visibleChance;
                const sy = 0.4 + m * 0.6;
                groupRef.current.scale.set(1, sy, 1);
            } else {
                groupRef.current.visible = true;
                groupRef.current.scale.set(1, 1, 1);
            }
        } else if (gamePhase === GAME_PHASES.OUTRO) {
            // Mirror of intro: dematerialize during phase 2, fully gone
            // from phase 3 onwards. Stay solid through SETTLE + DIALOGUE.
            if (outro.phase < 2) {
                groupRef.current.visible = true;
                groupRef.current.scale.set(1, 1, 1);
            } else if (outro.phase === 2 && outro.materialize > 0) {
                const m = outro.materialize; // 1 → 0
                const visibleChance = 0.2 + m * 0.7;
                groupRef.current.visible = Math.random() < visibleChance;
                const sy = 0.3 + m * 0.7;
                groupRef.current.scale.set(1, sy, 1);
            } else {
                groupRef.current.visible = false;
            }
        } else if (!groupRef.current.visible) {
            groupRef.current.visible = true;
            groupRef.current.scale.set(1, 1, 1);
        }

        // ---- Hit flash + scale punch ----
        const now = performance.now();
        const last = player.lastHitTime || 0;
        const flashDt = (now - last) / 1000;
        const FLASH_DURATION = 0.14;
        const inFlash = flashDt >= 0 && flashDt < FLASH_DURATION;
        const facingScale = player.facingRight ? 1 : -1;
        if (inFlash) {
            const t = 1 - flashDt / FLASH_DURATION;
            if (flashMatRef.current) flashMatRef.current.opacity = t * 0.9;
            if (innerGroupRef.current) {
                const punch = 1 + t * 0.1;
                innerGroupRef.current.scale.set(facingScale * punch, punch, 1);
            }
        } else {
            if (flashMatRef.current && flashMatRef.current.opacity !== 0)
                flashMatRef.current.opacity = 0;
            if (innerGroupRef.current) {
                innerGroupRef.current.scale.set(facingScale, 1, 1);
            }
        }

        // ---- Shield ----
        if (shieldGroupRef.current) {
            shieldGroupRef.current.visible = !!player.isShielding;
            if (player.isShielding) {
                shieldGroupRef.current.position.x = player.facingRight
                    ? 0.15
                    : -0.15;
                if (shieldRef.current) {
                    shieldRef.current.material.opacity =
                        0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
                }
            }
        }

        // ---- Muzzle flash ----
        if (muzzleRef.current) {
            muzzleRef.current.visible = !!player.isShooting;
        }

        // ---- Ground shadow ----
        if (shadowRef.current) {
            shadowRef.current.visible = !!player.isGrounded;
        }

        // ---- Dash trail ----
        if (dashTrailRef.current) {
            const showTrail = player.isDashing || player.isInvulnerable;
            dashTrailRef.current.visible = !!showTrail;
            if (showTrail) {
                dashTrailRef.current.material.opacity =
                    0.1 + Math.sin(state.clock.elapsedTime * 35) * 0.06;
            }
        }
    });

    if (isDead) return null;

    return (
        <group ref={groupRef}>
            {/* Body - main silhouette */}
            <group ref={innerGroupRef}>
                {/* Torso */}
                <mesh position={[0, 1.0, 0]}>
                    <boxGeometry args={[PLAYER.WIDTH, 0.8, 0.3]} />
                    <meshStandardMaterial color={COLORS.PLAYER_BODY} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.6, 0]}>
                    <boxGeometry args={[0.35, 0.35, 0.3]} />
                    <meshStandardMaterial color={COLORS.PLAYER_BODY} />
                </mesh>

                {/* Legs */}
                <mesh position={[-0.12, 0.35, 0]}>
                    <boxGeometry args={[0.18, 0.7, 0.2]} />
                    <meshStandardMaterial color={COLORS.PLAYER_BODY} />
                </mesh>
                <mesh position={[0.12, 0.35, 0]}>
                    <boxGeometry args={[0.18, 0.7, 0.2]} />
                    <meshStandardMaterial color={COLORS.PLAYER_BODY} />
                </mesh>

                {/* Arm / Gun */}
                <mesh position={[0.35, 1.0, 0]}>
                    <boxGeometry args={[0.4, 0.15, 0.15]} />
                    <meshStandardMaterial color={COLORS.PLAYER_BODY} />
                </mesh>

                {/* Neon accent lines */}
                <mesh position={[0, 1.0, 0.16]}>
                    <boxGeometry args={[0.05, 0.6, 0.02]} />
                    <meshStandardMaterial
                        color={COLORS.PLAYER_ACCENT}
                        emissive={COLORS.PLAYER_ACCENT}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Eye visor */}
                <mesh position={[0.1, 1.62, 0.16]}>
                    <boxGeometry args={[0.2, 0.08, 0.02]} />
                    <meshStandardMaterial
                        color={COLORS.PLAYER_ACCENT}
                        emissive={COLORS.PLAYER_ACCENT}
                        emissiveIntensity={1}
                    />
                </mesh>

                {/* Muzzle flash (always mounted, toggled via ref.visible) */}
                <mesh ref={muzzleRef} position={[0.7, 1.0, 0]} visible={false}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshStandardMaterial
                        color={COLORS.MUZZLE_FLASH}
                        emissive={COLORS.PLAYER_ACCENT}
                        emissiveIntensity={2}
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* Hit flash overlay */}
                <mesh position={[0, 1.0, 0.2]} renderOrder={10}>
                    <boxGeometry args={[PLAYER.WIDTH + 0.25, 1.85, 0.05]} />
                    <meshBasicMaterial
                        ref={flashMatRef}
                        color="#ffffff"
                        transparent
                        opacity={0}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>

                {/* Dash trail */}
                <mesh
                    ref={dashTrailRef}
                    position={[-0.55, 1.0, -0.05]}
                    visible={false}
                >
                    <boxGeometry args={[0.55, 1.7, 0.04]} />
                    <meshBasicMaterial
                        color={COLORS.NEON_CYAN}
                        transparent
                        opacity={0.12}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            </group>

            {/* Shield (always mounted, toggled via ref.visible) */}
            <group ref={shieldGroupRef} visible={false}>
                <mesh ref={shieldRef} position={[0, 1.0, 0]}>
                    <cylinderGeometry args={[0.7, 0.7, 1.8, 16, 1, true]} />
                    <meshStandardMaterial
                        color={COLORS.SHIELD_COLOR}
                        emissive={COLORS.SHIELD_COLOR}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                        side={2}
                    />
                </mesh>
            </group>

            {/* Ground shadow (always mounted, toggled via ref.visible) */}
            <mesh
                ref={shadowRef}
                position={[0, 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
            >
                <planeGeometry args={[0.8, 0.4]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}
