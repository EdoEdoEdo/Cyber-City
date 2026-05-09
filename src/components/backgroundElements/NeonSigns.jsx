/**
 * NeonSigns Components
 * All GLB neon sign models
 */

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { DRACO_DECODER_PATH } from '../../utils/gltf';

// Generic neon sign component (memoized: GLB clone is expensive)
const NeonGLB = React.memo(function NeonGLB({
    modelPath,
    position,
    scale = 1,
    rotation = [0, 0, 0],
}) {
    const { scene } = useGLTF(modelPath, DRACO_DECODER_PATH);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <group position={position} scale={scale} rotation={rotation}>
            <primitive object={clonedScene} />
        </group>
    );
});

// Individual exports
export function NeonFun({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/neon_fun.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonDragon({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/chinese_neon_dragon_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonSign1({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/neon_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonSign2({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/neon_sign_2.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonCassette({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/cassete_neon.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonRamen({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/neon_ramen_soup_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonEvil({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/evil_neon_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonRock({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/punk_rock_neon_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

export function NeonOpen({ position, scale = 1, rotation = [0, 0, 0] }) {
    return (
        <NeonGLB
            modelPath="models/neon_open_sign.glb"
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
}

// Preload all models
useGLTF.preload('models/neon_fun.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/chinese_neon_dragon_sign.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/neon_sign.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/neon_sign_2.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/cassete_neon.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/neon_ramen_soup_sign.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/evil_neon_sign.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/punk_rock_neon_sign.glb', DRACO_DECODER_PATH);
useGLTF.preload('models/neon_open_sign.glb', DRACO_DECODER_PATH);
