/**
 * Enemy Component
 * Visual representation with state-based animations
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, selectCutscene } from '../store/gameStore';
import {
    ENEMY,
    ENEMY_STATES,
    COLORS,
    BOSS,
    BOSS_STATES,
} from '../constants/gameplayConstants';

export function Enemy({ enemyId }) {
    const enemy = useGameStore((state) =>
        state.enemies.find((e) => e.id === enemyId),
    );
    const cutscene = useGameStore(selectCutscene);

    const groupRef = useRef();
    const alertLightRef = useRef();
    const shieldRef = useRef();

    // Animate alert light and shield
    useFrame((state) => {
        if (!enemy) return;

        // Alert light pulse
        if (alertLightRef.current) {
            const isAlert =
                enemy.state === ENEMY_STATES.ALERT ||
                enemy.state === ENEMY_STATES.ATTACK ||
                enemy.state === BOSS_STATES.CHASE ||
                enemy.state === BOSS_STATES.ATTACK;
            if (isAlert) {
                alertLightRef.current.material.emissiveIntensity =
                    1 + Math.sin(state.clock.elapsedTime * 8) * 0.5;
            }
        }

        // Shield pulse
        if (shieldRef.current && enemy.isShielding) {
            shieldRef.current.material.opacity =
                0.4 + Math.sin(state.clock.elapsedTime * 12) * 0.2;
        }
    });

    if (!enemy) return null;

    // Se il boss deve essere nascosto durante l'esplosione grande
    if (enemy.isBoss && cutscene.hideBoss) {
        return <BossDeathExplosion position={enemy.position} />;
    }

    // Se il nemico NON boss è morto, mostra esplosione normale
    // Il boss rimane visibile durante la death cutscene (glitch effect)
    if (enemy.isDead && !enemy.isBoss) {
        return <DeathEffect position={enemy.position} isBoss={false} />;
    }

    const { position, facingRight, state, accentColor, isBoss, isShielding } =
        enemy;

    // Check for alert/attack states (including boss states)
    const isAlert =
        state === ENEMY_STATES.ALERT ||
        state === ENEMY_STATES.ATTACK ||
        state === BOSS_STATES.CHASE ||
        state === BOSS_STATES.ATTACK ||
        state === BOSS_STATES.SHIELD;
    const isAttacking =
        state === ENEMY_STATES.ATTACK || state === BOSS_STATES.ATTACK;

    // Use dynamic accent color (changes during cutscene for boss)
    const currentAccentColor = accentColor || COLORS.ENEMY_ACCENT;

    // Boss is slightly larger
    const scale = isBoss ? 1.2 : 1;

    return (
        <group
            ref={groupRef}
            position={[position.x, position.y, position.z]}
            scale={scale}
        >
            <group scale={[facingRight ? 1 : -1, 1, 1]}>
                {/* Torso */}
                <mesh position={[0, 1.0, 0]}>
                    <boxGeometry args={[ENEMY.WIDTH + 0.1, 0.85, 0.35]} />
                    <meshStandardMaterial color={COLORS.ENEMY_BODY} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.6, 0]}>
                    <boxGeometry args={[0.4, 0.38, 0.32]} />
                    <meshStandardMaterial color={COLORS.ENEMY_BODY} />
                </mesh>

                {/* Legs */}
                <mesh position={[-0.15, 0.35, 0]}>
                    <boxGeometry args={[0.2, 0.7, 0.22]} />
                    <meshStandardMaterial color={COLORS.ENEMY_BODY} />
                </mesh>
                <mesh position={[0.15, 0.35, 0]}>
                    <boxGeometry args={[0.2, 0.7, 0.22]} />
                    <meshStandardMaterial color={COLORS.ENEMY_BODY} />
                </mesh>

                {/* Arm / Weapon */}
                <mesh position={[0.4, 1.0, 0]}>
                    <boxGeometry args={[0.5, 0.18, 0.18]} />
                    <meshStandardMaterial color={COLORS.ENEMY_BODY} />
                </mesh>

                {/* Enemy accent stripe - DYNAMIC COLOR */}
                <mesh position={[0, 1.0, 0.18]}>
                    <boxGeometry args={[0.08, 0.65, 0.02]} />
                    <meshStandardMaterial
                        color={currentAccentColor}
                        emissive={currentAccentColor}
                        emissiveIntensity={isAlert ? 1.5 : 0.5}
                    />
                </mesh>

                {/* Eye - DYNAMIC COLOR */}
                <mesh ref={alertLightRef} position={[0.12, 1.65, 0.17]}>
                    <boxGeometry args={[0.18, 0.1, 0.02]} />
                    <meshStandardMaterial
                        color={currentAccentColor}
                        emissive={currentAccentColor}
                        emissiveIntensity={isAlert ? 1.5 : 0.5}
                    />
                </mesh>

                {/* BOSS SHIELD */}
                {isBoss && isShielding && (
                    <mesh ref={shieldRef} position={[0.6, 1.0, 0]}>
                        <boxGeometry args={[0.15, 1.6, 1.2]} />
                        <meshStandardMaterial
                            color={BOSS.SHIELD_COLOR}
                            emissive={BOSS.SHIELD_COLOR}
                            emissiveIntensity={2}
                            transparent
                            opacity={0.5}
                        />
                    </mesh>
                )}

                {/* Aiming indicator - ACCORCIATO */}
                {isAttacking && (
                    <mesh position={[0.8, 1.0, 0]}>
                        <boxGeometry args={[0.8, 0.02, 0.02]} />
                        <meshStandardMaterial
                            color={currentAccentColor}
                            emissive={currentAccentColor}
                            emissiveIntensity={0.8}
                            transparent
                            opacity={0.5}
                        />
                    </mesh>
                )}

                {/* Muzzle flash when shooting */}
                {isAttacking && enemy.aimTimer >= BOSS.AIM_TIME * 0.9 && (
                    <mesh position={[0.8, 1.0, 0]}>
                        <sphereGeometry args={[0.12, 8, 8]} />
                        <meshStandardMaterial
                            color={COLORS.MUZZLE_FLASH}
                            emissive={currentAccentColor}
                            emissiveIntensity={2}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                )}
            </group>

            {/* Alert indicator above head */}
            {isAlert && !isShielding && (
                <mesh position={[0, 2.1, 0]}>
                    <boxGeometry args={[0.15, 0.25, 0.1]} />
                    <meshStandardMaterial
                        color={currentAccentColor}
                        emissive={currentAccentColor}
                        emissiveIntensity={1}
                    />
                </mesh>
            )}

            {/* Shield indicator above head when shielding */}
            {isShielding && (
                <mesh position={[0, 2.1, 0]}>
                    <boxGeometry args={[0.3, 0.15, 0.1]} />
                    <meshStandardMaterial
                        color={BOSS.SHIELD_COLOR}
                        emissive={BOSS.SHIELD_COLOR}
                        emissiveIntensity={2}
                    />
                </mesh>
            )}

            {/* Ground shadow */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.9, 0.5]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

// Boss death explosion - più grande e più lenta
function BossDeathExplosion({ position }) {
    const [scale, setScale] = React.useState(0.5);
    const [opacity, setOpacity] = React.useState(1);

    useFrame((_, delta) => {
        setScale((s) => Math.min(s + delta * 2.5, 5));
        setOpacity((o) => Math.max(0, o - delta * 0.8));
    });

    if (opacity <= 0) return null;

    return (
        <group position={[position.x, position.y + 1, position.z]}>
            {/* Core explosion */}
            <mesh scale={[scale, scale, scale]}>
                <sphereGeometry args={[0.6, 16, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={3}
                    transparent
                    opacity={opacity}
                />
            </mesh>

            {/* Outer ring */}
            <mesh scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
                <sphereGeometry args={[0.5, 12, 12]} />
                <meshStandardMaterial
                    color="#ff3366"
                    emissive="#ff3366"
                    emissiveIntensity={2}
                    transparent
                    opacity={opacity * 0.6}
                />
            </mesh>

            {/* Particles */}
            {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * scale * 0.8;
                const y = Math.sin(angle) * scale * 0.5;
                return (
                    <mesh key={i} position={[x, y, 0]} scale={[0.2, 0.2, 0.2]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial
                            color="#ff6600"
                            emissive="#ff6600"
                            emissiveIntensity={2}
                            transparent
                            opacity={opacity * 0.8}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

// Normal death explosion effect
function DeathEffect({ position, isBoss }) {
    const [scale, setScale] = React.useState(1);
    const [opacity, setOpacity] = React.useState(1);

    const maxScale = isBoss ? 3 : 1.5;
    const speed = isBoss ? 3 : 5;

    useFrame((_, delta) => {
        setScale((s) => Math.min(s + delta * speed, maxScale));
        setOpacity((o) => Math.max(0, o - delta * (isBoss ? 1.5 : 3)));
    });

    if (opacity <= 0) return null;

    return (
        <mesh
            position={[position.x, position.y + 0.9, position.z]}
            scale={[scale, scale, scale]}
        >
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial
                color={COLORS.ENEMY_ACCENT}
                emissive={COLORS.ENEMY_ACCENT}
                emissiveIntensity={2}
                transparent
                opacity={opacity}
            />
        </mesh>
    );
}

// Wrapper to render all enemies
export function Enemies() {
    const enemies = useGameStore((state) => state.enemies);

    return (
        <>
            {enemies.map((enemy) => (
                <Enemy key={enemy.id} enemyId={enemy.id} />
            ))}
        </>
    );
}
