/**
 * FuturisticPlaza Component
 * Base for hologram
 */

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { DRACO_DECODER_PATH } from '../../utils/gltf';

export function FuturisticPlaza({ position, scale = 1, rotation = [0, 0, 0] }) {
    const { scene } = useGLTF(
        'models/futuristic_plaza.glb',
        DRACO_DECODER_PATH,
    );
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <group position={position} scale={scale} rotation={rotation}>
            <primitive object={clonedScene} />
        </group>
    );
}

// Preload
useGLTF.preload('models/futuristic_plaza.glb', DRACO_DECODER_PATH);
