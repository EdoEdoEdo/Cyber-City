/**
 * StreetBelow Component
 * Cyberpunk pedestrian street with lamps
 */

import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGameStore, selectCamera } from '../../store/gameStore';

// ScifiLamp sub-component
function ScifiLamp({ position, scale = 1 }) {
    const { scene } = useGLTF('models/scifi_lamp.glb');
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
        <group position={position} scale={scale}>
            <primitive object={clonedScene} />
        </group>
    );
}

export function StreetBelow() {
    const cameraPos = useGameStore(selectCamera);
    const ref = useRef();

    useFrame(() => {
        if (ref.current) {
            ref.current.position.x = cameraPos.position.x * 0.3;
        }
    });

    const streetY = -5;
    const streetZ = -5;
    const streetLength = 200;
    const streetWidth = 10;
    const lampSpacing = 15;
    const lampCount = Math.floor(streetLength / lampSpacing);

    return (
        <group ref={ref} position={[0, streetY, streetZ]}>
            {/* Main street surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[streetLength, streetWidth]} />
                <meshStandardMaterial
                    color="#0a0a12"
                    metalness={0.6}
                    roughness={0.3}
                />
            </mesh>

            {/* Outer LED lines (bright white) */}
            {/* Left edge - main */}
            <mesh
                position={[0, 0.02, -streetWidth / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.15]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Left edge - glow */}
            <mesh
                position={[0, 0.1, -streetWidth / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.4]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
            {/* Right edge - main */}
            <mesh
                position={[0, 0.02, streetWidth / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.15]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Right edge - glow */}
            <mesh
                position={[0, 0.1, streetWidth / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.4]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>

            {/* Inner guide lines (dimmer) */}
            <mesh
                position={[0, 0.02, -streetWidth / 4]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.05]} />
                <meshBasicMaterial color="#666688" transparent opacity={0.6} />
            </mesh>
            <mesh
                position={[0, 0.02, streetWidth / 4]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.05]} />
                <meshBasicMaterial color="#666688" transparent opacity={0.6} />
            </mesh>

            {/* Center line - dashed */}
            {Array.from({ length: 40 }).map((_, i) => (
                <mesh
                    key={`dash-${i}`}
                    position={[-95 + i * 5, 0.02, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[2, 0.08]} />
                    <meshBasicMaterial
                        color="#444466"
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            ))}

            {/* Cross lines (subtle grid) */}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh
                    key={`cross-${i}`}
                    position={[-95 + i * 10, 0.015, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[0.05, streetWidth * 0.8]} />
                    <meshBasicMaterial
                        color="#333344"
                        transparent
                        opacity={0.3}
                    />
                </mesh>
            ))}

            {/* Reflection layer */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <planeGeometry args={[streetLength, streetWidth * 0.9]} />
                <meshBasicMaterial color="#1a1a2a" transparent opacity={0.4} />
            </mesh>

            {/* Lampioni (alternated) */}
            <Suspense fallback={null}>
                {Array.from({ length: lampCount }).map((_, i) => (
                    <React.Fragment key={`lamp-${i}`}>
                        {/* Left side - only even indices */}
                        {i % 2 === 0 && (
                            <ScifiLamp
                                position={[
                                    -90 + i * lampSpacing,
                                    0,
                                    -streetWidth / 2 - 1,
                                ]}
                                scale={0.8}
                            />
                        )}
                        {/* Right side - only odd indices */}
                        {i % 2 === 1 && (
                            <ScifiLamp
                                position={[
                                    -90 + i * lampSpacing,
                                    0,
                                    streetWidth / 2 + 1,
                                ]}
                                scale={0.8}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Suspense>

            {/* Light reflections (alternated) */}
            {Array.from({ length: lampCount }).map((_, i) => (
                <React.Fragment key={`reflection-${i}`}>
                    {/* Left reflection - even indices */}
                    {i % 2 === 0 && (
                        <mesh
                            position={[
                                -90 + i * lampSpacing,
                                0.02,
                                -streetWidth / 4,
                            ]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <circleGeometry args={[2.5, 16]} />
                            <meshBasicMaterial
                                color="#aaccff"
                                transparent
                                opacity={0.2}
                            />
                        </mesh>
                    )}
                    {/* Right reflection - odd indices */}
                    {i % 2 === 1 && (
                        <mesh
                            position={[
                                -90 + i * lampSpacing,
                                0.02,
                                streetWidth / 4,
                            ]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <circleGeometry args={[2.5, 16]} />
                            <meshBasicMaterial
                                color="#aaccff"
                                transparent
                                opacity={0.2}
                            />
                        </mesh>
                    )}
                </React.Fragment>
            ))}

            {/* Accent neon strips (colored) */}
            {/* Pink accent near left edge */}
            <mesh
                position={[0, 0.03, -streetWidth / 2 + 0.5]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.08]} />
                <meshBasicMaterial color="#ff0080" transparent opacity={0.6} />
            </mesh>
            {/* Cyan accent near right edge */}
            <mesh
                position={[0, 0.03, streetWidth / 2 - 0.5]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[streetLength, 0.08]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

// Preload
useGLTF.preload('models/scifi_lamp.glb');
