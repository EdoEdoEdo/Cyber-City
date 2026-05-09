/**
 * Pickups renderer.
 *
 * Imperative renderer over the pickup pool. Pre-allocates one group per slot
 * and toggles visibility / position each frame.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getPickupSlots, PICKUP_POOL_SIZE } from '../systems/pickupPool';
import { COLORS } from '../constants/gameplayConstants';

export function Pickups() {
    const slots = getPickupSlots();
    const groupRefs = useRef([]);
    const meshRefs = useRef([]);

    const indices = useMemo(
        () => Array.from({ length: PICKUP_POOL_SIZE }, (_, i) => i),
        [],
    );

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        const pulse = 1 + Math.sin(t * 6) * 0.25;
        const bobY = Math.sin(t * 4) * 0.08;

        for (let i = 0; i < PICKUP_POOL_SIZE; i++) {
            const slot = slots[i];
            const g = groupRefs.current[i];
            const m = meshRefs.current[i];
            if (!g) continue;
            if (!slot.active) {
                if (g.visible) g.visible = false;
                continue;
            }
            if (!g.visible) g.visible = true;
            g.position.set(
                slot.position.x,
                slot.position.y + (slot.grounded ? bobY + 0.4 : 0),
                slot.position.z,
            );
            g.rotation.y = t * 2;
            if (m) m.material.emissiveIntensity = pulse;
        }
    });

    return (
        <group>
            {indices.map((i) => (
                <group
                    key={i}
                    ref={(el) => (groupRefs.current[i] = el)}
                    visible={false}
                >
                    <mesh ref={(el) => (meshRefs.current[i] = el)}>
                        <octahedronGeometry args={[0.25, 0]} />
                        <meshStandardMaterial
                            color={COLORS.SHIELD_COLOR || '#ff0080'}
                            emissive={COLORS.SHIELD_COLOR || '#ff0080'}
                            emissiveIntensity={1.5}
                            toneMapped={false}
                        />
                    </mesh>
                    {/* Outer halo */}
                    <mesh scale={[1.6, 1.6, 1.6]}>
                        <octahedronGeometry args={[0.25, 0]} />
                        <meshBasicMaterial
                            color={COLORS.SHIELD_COLOR || '#ff0080'}
                            transparent
                            opacity={0.18}
                            depthWrite={false}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
