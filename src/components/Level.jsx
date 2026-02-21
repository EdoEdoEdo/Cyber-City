/**
 * Level Component - Another World Style
 * Flat colors with rim light accents for visibility
 */

import React from 'react';
import { LEVEL, COLORS, PLAYER } from '../constants/gameplayConstants';

// Color palette for level elements
const LEVEL_COLORS = {
    WALKWAY_SURFACE: '#12121f',
    WALKWAY_SIDE: '#0a0a14',
    WALKWAY_SUPPORT: '#08080f',
    RIM_LIGHT: '#00ffff',
    RIM_LIGHT_SECONDARY: '#0088aa',
    FLOATING_PLATFORM: '#14142a',
    FLOATING_GLOW: '#ff0080',
    PROP_DARK: '#0c0c18',
    LADDER: '#0a0a12',
};

// Metal walkway with rim lighting
function Walkway({ x, y, width }) {
    const halfWidth = width / 2;
    const pillarHeight = 12; // Altezza pilastri fino in fondo

    return (
        <group position={[x, y, 0]}>
            {/* Main platform surface */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT / 2, 0]}>
                <boxGeometry args={[width, LEVEL.PLATFORM_HEIGHT, 2]} />
                <meshBasicMaterial color={LEVEL_COLORS.WALKWAY_SURFACE} />
            </mesh>

            {/* === RIM LIGHTS === */}

            {/* Top front edge - main rim light (brightest) */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT + 0.02, 0.95]}>
                <boxGeometry args={[width, 0.04, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.RIM_LIGHT} />
            </mesh>

            {/* Top back edge */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT + 0.02, -0.95]}>
                <boxGeometry args={[width, 0.04, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.RIM_LIGHT_SECONDARY} />
            </mesh>

            {/* Left edge vertical */}
            <mesh
                position={[-halfWidth + 0.02, LEVEL.PLATFORM_HEIGHT / 2, 0.9]}
            >
                <boxGeometry args={[0.04, LEVEL.PLATFORM_HEIGHT, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.RIM_LIGHT} />
            </mesh>

            {/* Right edge vertical */}
            <mesh position={[halfWidth - 0.02, LEVEL.PLATFORM_HEIGHT / 2, 0.9]}>
                <boxGeometry args={[0.04, LEVEL.PLATFORM_HEIGHT, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.RIM_LIGHT} />
            </mesh>

            {/* === SUPPORT STRUCTURE - PILASTRI LUNGHI === */}

            {/* Support beams underneath - estesi fino in fondo */}
            {Array.from({ length: Math.floor(width / 5) }).map((_, i) => (
                <group
                    key={i}
                    position={[-halfWidth + 2.5 + i * 5, -pillarHeight / 2, 0]}
                >
                    {/* Vertical beam - lungo */}
                    <mesh>
                        <boxGeometry args={[0.3, pillarHeight, 0.3]} />
                        <meshBasicMaterial
                            color={LEVEL_COLORS.WALKWAY_SUPPORT}
                        />
                    </mesh>
                    {/* Diagonal support in alto */}
                    <mesh
                        position={[0.6, pillarHeight / 2 - 0.8, 0]}
                        rotation={[0, 0, Math.PI / 4]}
                    >
                        <boxGeometry args={[0.1, 1.8, 0.1]} />
                        <meshBasicMaterial
                            color={LEVEL_COLORS.WALKWAY_SUPPORT}
                        />
                    </mesh>
                    {/* Diagonal support opposta */}
                    <mesh
                        position={[-0.6, pillarHeight / 2 - 0.8, 0]}
                        rotation={[0, 0, -Math.PI / 4]}
                    >
                        <boxGeometry args={[0.1, 1.8, 0.1]} />
                        <meshBasicMaterial
                            color={LEVEL_COLORS.WALKWAY_SUPPORT}
                        />
                    </mesh>
                </group>
            ))}

            {/* Horizontal support beams */}
            {Array.from({ length: 3 }).map((_, i) => (
                <mesh key={`h-beam-${i}`} position={[0, -2 - i * 3.5, 0]}>
                    <boxGeometry args={[width * 0.95, 0.15, 0.15]} />
                    <meshBasicMaterial color={LEVEL_COLORS.WALKWAY_SUPPORT} />
                </mesh>
            ))}

            {/* Bottom glow line (reflected city light) */}
            <mesh position={[0, -0.1, 0.5]}>
                <boxGeometry args={[width * 0.9, 0.05, 0.3]} />
                <meshBasicMaterial
                    color={LEVEL_COLORS.RIM_LIGHT_SECONDARY}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* === RAILING === */}

            {/* Railing posts */}
            {Array.from({ length: Math.floor(width / 4) }).map((_, i) => (
                <group
                    key={`rail-${i}`}
                    position={[
                        -halfWidth + 2 + i * 4,
                        LEVEL.PLATFORM_HEIGHT,
                        -0.85,
                    ]}
                >
                    {/* Post */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.06, 1, 0.06]} />
                        <meshBasicMaterial color={LEVEL_COLORS.WALKWAY_SIDE} />
                    </mesh>
                </group>
            ))}

            {/* Railing top bar */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT + 1, -0.85]}>
                <boxGeometry args={[width - 0.5, 0.05, 0.05]} />
                <meshBasicMaterial color={LEVEL_COLORS.WALKWAY_SIDE} />
            </mesh>

            {/* Railing glow accent */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT + 1.02, -0.85]}>
                <boxGeometry args={[width - 0.5, 0.02, 0.02]} />
                <meshBasicMaterial color={LEVEL_COLORS.RIM_LIGHT_SECONDARY} />
            </mesh>
        </group>
    );
}

// Scala a pioli
function Ladder({ x, y, height = 8 }) {
    const rungCount = Math.floor(height / 0.5);

    return (
        <group position={[x, y, 0.5]}>
            {/* Montanti laterali */}
            <mesh position={[-0.25, -height / 2, 0]}>
                <boxGeometry args={[0.08, height, 0.08]} />
                <meshBasicMaterial color={LEVEL_COLORS.LADDER} />
            </mesh>
            <mesh position={[0.25, -height / 2, 0]}>
                <boxGeometry args={[0.08, height, 0.08]} />
                <meshBasicMaterial color={LEVEL_COLORS.LADDER} />
            </mesh>

            {/* Pioli */}
            {Array.from({ length: rungCount }).map((_, i) => (
                <mesh key={i} position={[0, -i * 0.5 - 0.25, 0]}>
                    <boxGeometry args={[0.5, 0.06, 0.06]} />
                    <meshBasicMaterial color={LEVEL_COLORS.LADDER} />
                </mesh>
            ))}
        </group>
    );
}

// Floating platform for jumping sections
function FloatingPlatform({ x, y, width }) {
    return (
        <group position={[x, y, 0]}>
            {/* Platform surface */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT / 2, 0]}>
                <boxGeometry args={[width, LEVEL.PLATFORM_HEIGHT, 1.5]} />
                <meshBasicMaterial color={LEVEL_COLORS.FLOATING_PLATFORM} />
            </mesh>

            {/* Neon edge - pink for floating platforms */}
            <mesh position={[0, LEVEL.PLATFORM_HEIGHT + 0.02, 0.7]}>
                <boxGeometry args={[width, 0.05, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.FLOATING_GLOW} />
            </mesh>

            {/* Side edges */}
            <mesh
                position={[-width / 2 + 0.02, LEVEL.PLATFORM_HEIGHT / 2, 0.65]}
            >
                <boxGeometry args={[0.04, LEVEL.PLATFORM_HEIGHT, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.FLOATING_GLOW} />
            </mesh>
            <mesh
                position={[width / 2 - 0.02, LEVEL.PLATFORM_HEIGHT / 2, 0.65]}
            >
                <boxGeometry args={[0.04, LEVEL.PLATFORM_HEIGHT, 0.1]} />
                <meshBasicMaterial color={LEVEL_COLORS.FLOATING_GLOW} />
            </mesh>

            {/* Underside glow */}
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[width * 0.7, 0.05, 0.8]} />
                <meshBasicMaterial
                    color={LEVEL_COLORS.FLOATING_GLOW}
                    transparent
                    opacity={0.4}
                />
            </mesh>
        </group>
    );
}

// Simple environment props
function EnvironmentProps() {
    return (
        <group>
            {/* Cover crates - simple dark silhouettes */}
            <mesh position={[10, 0.6, 0.5]}>
                <boxGeometry args={[1, 1.2, 1]} />
                <meshBasicMaterial color={LEVEL_COLORS.PROP_DARK} />
            </mesh>

            <mesh position={[28, 0.5, 0.3]}>
                <boxGeometry args={[0.8, 1, 0.8]} />
                <meshBasicMaterial color={LEVEL_COLORS.PROP_DARK} />
            </mesh>

            {/* Ventilation unit */}
            <group position={[40, 0.3, -0.5]}>
                <mesh position={[0, 0.4, 0]}>
                    <boxGeometry args={[2, 0.8, 1.5]} />
                    <meshBasicMaterial color={LEVEL_COLORS.PROP_DARK} />
                </mesh>
                {/* Small indicator light */}
                <mesh position={[0.8, 0.6, 0.76]}>
                    <planeGeometry args={[0.1, 0.1]} />
                    <meshBasicMaterial color="#ff3300" />
                </mesh>
            </group>
        </group>
    );
}

export function Level() {
    return (
        <group>
            {/* Render all platforms */}
            {LEVEL.PLATFORMS.map((platform, index) => {
                if (platform.type === 'walkway') {
                    return (
                        <Walkway
                            key={index}
                            x={platform.x}
                            y={platform.y}
                            width={platform.width}
                        />
                    );
                } else if (platform.type === 'floating') {
                    return (
                        <FloatingPlatform
                            key={index}
                            x={platform.x}
                            y={platform.y}
                            width={platform.width}
                        />
                    );
                }
                return null;
            })}

            {/* Scala a pioli vicino allo spawn del player */}
            <Ladder x={PLAYER.START_X - 1.5} y={0} height={10} />

            <EnvironmentProps />

            {/* Abyss below - darker than background */}
            <mesh position={[20, -10, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 25]} />
                <meshBasicMaterial color="#030308" />
            </mesh>
        </group>
    );
}
