/**
 * Sparks renderer.
 *
 * Reads from the spark pool every frame and pushes per-instance matrices
 * + colors to a single InstancedMesh. Inactive sparks are scaled to 0.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    getSparkSlots,
    tickSparks,
    SPARK_POOL_SIZE,
    SPARK_LIFETIME,
} from '../systems/particlePool';
import { COLORS } from '../constants/gameplayConstants';
// Sparks live independently of gameplay slow-mo: they're a visual flourish
// and look better at full speed than getting stuck mid-air.

const TINTS = [
    new THREE.Color(COLORS.NEON_CYAN || '#00ffff'),
    new THREE.Color('#ff3a8a'),
    new THREE.Color('#ffffff'),
];

const tmpMatrix = new THREE.Matrix4();
const tmpColor = new THREE.Color();
const ZERO = new THREE.Vector3(0, -1000, 0); // park inactive sparks far away
const SCALE_ACTIVE = new THREE.Vector3(1, 1, 1);
const SCALE_HIDE = new THREE.Vector3(0, 0, 0);

export function Sparks() {
    const meshRef = useRef();
    const slots = getSparkSlots();

    // Geometry: tiny billboard quad
    const geom = useMemo(() => new THREE.PlaneGeometry(0.08, 0.08), []);
    const mat = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: '#ffffff',
                transparent: true,
                opacity: 1,
                depthWrite: false,
                toneMapped: false,
            }),
        [],
    );

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        tickSparks(dt);

        const mesh = meshRef.current;
        if (!mesh) return;

        for (let i = 0; i < SPARK_POOL_SIZE; i++) {
            const s = slots[i];
            if (!s.active) {
                tmpMatrix.compose(ZERO, new THREE.Quaternion(), SCALE_HIDE);
                mesh.setMatrixAt(i, tmpMatrix);
                continue;
            }
            const lifeT = 1 - s.age / (s.lifetime || SPARK_LIFETIME); // 1 -> 0
            const scale = s.size * (0.6 + lifeT * 0.6);
            tmpMatrix.compose(
                new THREE.Vector3(s.position.x, s.position.y, s.position.z),
                new THREE.Quaternion(),
                new THREE.Vector3(scale, scale, scale),
            );
            mesh.setMatrixAt(i, tmpMatrix);

            // Color tint with brightness fade
            const c = TINTS[s.tint] || TINTS[0];
            tmpColor.copy(c).multiplyScalar(0.7 + lifeT * 1.2);
            mesh.setColorAt(i, tmpColor);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[geom, mat, SPARK_POOL_SIZE]}
            frustumCulled={false}
        />
    );
}
