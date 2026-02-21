/**
 * FuturisticPlaza Component
 * Base for hologram
 */

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

export function FuturisticPlaza({ position, scale = 1, rotation = [0, 0, 0] }) {
    const { scene } = useGLTF('models/futuristic_plaza.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <group position={position} scale={scale} rotation={rotation}>
            <primitive object={clonedScene} />
        </group>
    );
}

// Preload
useGLTF.preload('models/futuristic_plaza.glb');
