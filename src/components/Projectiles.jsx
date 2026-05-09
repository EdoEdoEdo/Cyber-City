/**
 * Projectiles renderer.
 *
 * Reads directly from the mutable projectile pool and updates Three.js
 * objects in useFrame. No React re-renders happen on spawn/move/despawn —
 * we toggle `mesh.visible` and assign positions imperatively.
 *
 * Two InstancedMeshes (one per "team") would be more optimal, but using
 * <group> + meshes per slot keeps the per-projectile pulsing material
 * working without writing a custom shader.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PROJECTILE, COLORS } from '../constants/gameplayConstants';
import { getSlots, PROJECTILE_POOL_SIZE } from '../systems/projectilePool';

const PLAYER_COLOR = new THREE.Color(COLORS.NEON_CYAN);
const ENEMY_COLOR = new THREE.Color(COLORS.ENEMY_ACCENT);

export function Projectiles() {
    const groupRef = useRef();
    const slotRefs = useRef([]);
    const slots = getSlots();

    // Build mesh tree once. After this, all updates are imperative.
    const meshes = useMemo(() => {
        const arr = [];
        for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            arr.push(i);
        }
        return arr;
    }, []);

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const pulse = 1 + Math.sin(t * 20) * 0.3;

        for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            const slot = slots[i];
            const refs = slotRefs.current[i];
            if (!refs) continue;

            const { group, core } = refs;
            if (!group) continue;

            if (!slot.active) {
                if (group.visible) group.visible = false;
                continue;
            }

            if (!group.visible) {
                group.visible = true;
                // Re-assign color in case the slot switched team
                const color = slot.isPlayerProjectile
                    ? PLAYER_COLOR
                    : ENEMY_COLOR;
                if (refs.core) {
                    refs.core.material.color.copy(color);
                    refs.core.material.emissive.copy(color);
                }
                if (refs.trail1) {
                    refs.trail1.material.color.copy(color);
                    refs.trail1.material.emissive.copy(color);
                }
                if (refs.trail2) {
                    refs.trail2.material.color.copy(color);
                    refs.trail2.material.emissive.copy(color);
                }
            }

            group.position.set(
                slot.position.x,
                slot.position.y,
                slot.position.z,
            );

            if (refs.trail1) {
                refs.trail1.position.x = -slot.velocity.x * 0.3;
            }
            if (refs.trail2) {
                refs.trail2.position.x = -slot.velocity.x * 0.5;
            }

            if (core) core.material.emissiveIntensity = pulse;
        }
    });

    return (
        <group ref={groupRef}>
            {meshes.map((i) => (
                <ProjectileSlot
                    key={i}
                    refsObj={(refs) => {
                        slotRefs.current[i] = refs;
                    }}
                />
            ))}
        </group>
    );
}

function ProjectileSlot({ refsObj }) {
    const groupRef = useRef();
    const coreRef = useRef();
    const trail1Ref = useRef();
    const trail2Ref = useRef();

    React.useEffect(() => {
        refsObj({
            group: groupRef.current,
            core: coreRef.current,
            trail1: trail1Ref.current,
            trail2: trail2Ref.current,
        });
        // Start hidden; the pool drives visibility.
        if (groupRef.current) groupRef.current.visible = false;
    }, [refsObj]);

    return (
        <group ref={groupRef} visible={false}>
            <mesh ref={coreRef}>
                <boxGeometry
                    args={[PROJECTILE.WIDTH, PROJECTILE.HEIGHT, 0.1]}
                />
                <meshStandardMaterial
                    color={COLORS.NEON_CYAN}
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={1}
                />
            </mesh>
            <mesh ref={trail1Ref}>
                <boxGeometry
                    args={[
                        PROJECTILE.WIDTH * 0.8,
                        PROJECTILE.HEIGHT * 0.6,
                        0.05,
                    ]}
                />
                <meshStandardMaterial
                    color={COLORS.NEON_CYAN}
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.5}
                />
            </mesh>
            <mesh ref={trail2Ref}>
                <boxGeometry
                    args={[
                        PROJECTILE.WIDTH * 0.5,
                        PROJECTILE.HEIGHT * 0.3,
                        0.03,
                    ]}
                />
                <meshStandardMaterial
                    color={COLORS.NEON_CYAN}
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </group>
    );
}
