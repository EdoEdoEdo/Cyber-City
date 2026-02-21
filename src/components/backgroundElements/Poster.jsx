/**
 * Poster Component
 * Image poster with optional neon frame
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

export function Poster({
    position,
    width = 3,
    height = 4,
    imageSrc,
    rotation = [0, 0, 0],
    frameColor = '#ff0080',
    showFrame = true,
}) {
    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(imageSrc);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [imageSrc]);

    const frameThickness = 0.08;

    return (
        <group position={position} rotation={rotation}>
            {/* Back panel */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[width + 0.2, height + 0.2]} />
                <meshBasicMaterial color="#0a0a0a" />
            </mesh>

            {/* Poster image */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} />
            </mesh>

            {/* Neon frame */}
            {showFrame && (
                <>
                    {/* Top */}
                    <mesh position={[0, height / 2 + frameThickness / 2, 0.01]}>
                        <planeGeometry args={[width + frameThickness * 2, frameThickness]} />
                        <meshBasicMaterial color={frameColor} />
                    </mesh>
                    {/* Bottom */}
                    <mesh position={[0, -height / 2 - frameThickness / 2, 0.01]}>
                        <planeGeometry args={[width + frameThickness * 2, frameThickness]} />
                        <meshBasicMaterial color={frameColor} />
                    </mesh>
                    {/* Left */}
                    <mesh position={[-width / 2 - frameThickness / 2, 0, 0.01]}>
                        <planeGeometry args={[frameThickness, height]} />
                        <meshBasicMaterial color={frameColor} />
                    </mesh>
                    {/* Right */}
                    <mesh position={[width / 2 + frameThickness / 2, 0, 0.01]}>
                        <planeGeometry args={[frameThickness, height]} />
                        <meshBasicMaterial color={frameColor} />
                    </mesh>
                </>
            )}
        </group>
    );
}
