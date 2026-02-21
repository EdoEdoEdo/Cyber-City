/**
 * NeonSigns Components
 * All GLB neon sign models
 */

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

// Generic neon sign component
function NeonGLB({ modelPath, position, scale = 1, rotation = [0, 0, 0] }) {
    const { scene } = useGLTF(modelPath);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <group position={position} scale={scale} rotation={rotation}>
            <primitive object={clonedScene} />
        </group>
    );
}

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
useGLTF.preload('models/neon_fun.glb');
useGLTF.preload('models/chinese_neon_dragon_sign.glb');
useGLTF.preload('models/neon_sign.glb');
useGLTF.preload('models/neon_sign_2.glb');
useGLTF.preload('models/cassete_neon.glb');
useGLTF.preload('models/neon_ramen_soup_sign.glb');
useGLTF.preload('models/evil_neon_sign.glb');
useGLTF.preload('models/punk_rock_neon_sign.glb');
useGLTF.preload('models/neon_open_sign.glb');
