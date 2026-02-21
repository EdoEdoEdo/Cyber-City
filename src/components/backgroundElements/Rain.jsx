/**
 * RainLines Component
 * Instanced mesh rain effect
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RainLines({ count = 400 }) {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const { speeds, initialY } = useMemo(() => {
        const spd = new Float32Array(count);
        const initY = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            spd[i] = 20 + Math.random() * 15;
            initY[i] = Math.random() * 50;
        }
        return { speeds: spd, initialY: initY };
    }, [count]);

    const positions = useMemo(() => {
        const pos = [];
        for (let i = 0; i < count; i++) {
            pos.push({
                x: (Math.random() - 0.5) * 150,
                y: initialY[i],
                z: (Math.random() - 0.5) * 30,
            });
        }
        return pos;
    }, [count, initialY]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        for (let i = 0; i < count; i++) {
            positions[i].y -= speeds[i] * delta;
            if (positions[i].y < -10) positions[i].y = 45;

            dummy.position.set(positions[i].x, positions[i].y, positions[i].z);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <planeGeometry args={[0.02, 0.5]} />
            <meshBasicMaterial
                color="#99bbee"
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
}
