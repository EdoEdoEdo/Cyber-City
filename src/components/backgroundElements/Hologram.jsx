/**
 * Hologram Component
 * GLB model with holographic shader effect
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
    PALETTE,
    holographicVertexShader,
    holographicFragmentShader,
} from './constants';

export function Hologram({
    position,
    scale = 1,
    color = PALETTE.HOLOGRAM_COLOR,
    modelPath = 'models/leggings_girl.glb',
}) {
    const groupRef = useRef();
    const { scene } = useGLTF(modelPath);

    const holographicMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: holographicVertexShader,
            fragmentShader: holographicFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }, [color]);

    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = holographicMaterial;
            }
        });
        return clone;
    }, [scene, holographicMaterial]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y =
                Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
            groupRef.current.position.y =
                position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
        }
        holographicMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={clonedScene} />
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

// Preload default model
useGLTF.preload('models/leggings_girl.glb');
