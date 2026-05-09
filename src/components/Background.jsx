/**
 * Background Component - Blade Runner Style
 * Uses modular components from backgroundElements
 */

import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { WORLD } from '../constants/gameplayConstants';
import { getRainCount } from '../utils/device';

// Import components from backgroundElements
import { ScifiBuilding } from './backgroundElements/ScifiBuilding';
import { Hologram } from './backgroundElements/Hologram';
import { LedWall } from './backgroundElements/LedWall';
import { FuturisticPlaza } from './backgroundElements/FuturisticPlaza';
import { NeonText } from './backgroundElements/NeonText';
import { Poster } from './backgroundElements/Poster';
import { StreetBelow } from './backgroundElements/StreetBelow';
import { RainLines } from './backgroundElements/Rain';
import {
    NeonFun,
    NeonDragon,
    NeonSign1,
    NeonSign2,
    NeonCassette,
    NeonRamen,
    NeonEvil,
    NeonRock,
} from './backgroundElements/NeonSigns';

// Color palette
const PALETTE = {
    NEON_CYAN: '#00ffff',
    NEON_PINK: '#ff0080',
    HOLOGRAM_COLOR: '#00ffff',
};

// ============================================
// MAIN BACKGROUND EXPORT
// ============================================

export function Background() {
    const buildingsRef = useRef();
    const rainRef = useRef();
    const rainCount = getRainCount();

    // Read camera position via getState() inside the frame loop instead of
    // subscribing to selectCamera. updateCamera() is called every frame by
    // useCameraFollow with a fresh object reference — subscribing here would
    // re-render the whole Background tree (posters, neon, hologram, …) 60
    // times per second and cause stutter while moving.
    useFrame(() => {
        const camPos = useGameStore.getState().camera.position;
        if (buildingsRef.current) {
            buildingsRef.current.position.x = camPos.x * 0.15;
        }
        if (rainRef.current) {
            rainRef.current.position.x = camPos.x;
        }
    });

    return (
        <group>
            <StreetBelow />
            <group ref={rainRef}>
                <RainLines count={rainCount} />
            </group>

            {/* Main buildings group with parallax */}
            <group ref={buildingsRef} position={[0, 0, WORLD.PARALLAX.MID_BG]}>
                <Suspense fallback={null}>
                    {/* LEFT BUILDING */}
                    <Poster
                        position={[-35, -2, 5]}
                        width={4}
                        height={6}
                        imageSrc="textures/poster-1.webp"
                        showFrame={false}
                    />
                    <Poster
                        position={[-30, -2, 5]}
                        width={4}
                        height={6}
                        imageSrc="textures/poster-2.webp"
                        showFrame={false}
                    />
                    <Poster
                        position={[-25, -2, 5]}
                        width={4}
                        height={6}
                        imageSrc="textures/poster-3.webp"
                        showFrame={false}
                    />
                    <Poster
                        position={[-20, -2, 5]}
                        width={4}
                        height={6}
                        imageSrc="textures/poster-4.webp"
                        showFrame={false}
                    />

                    <ScifiBuilding
                        position={[-30, -5, -20]}
                        scale={5}
                        rotation={[0, Math.PI, 0]}
                    />

                    {/* RIGHT BUILDING */}
                    <ScifiBuilding
                        position={[50, -5, -20]}
                        scale={5}
                        rotation={[0, -Math.PI, 0]}
                    />
                    <ScifiBuilding
                        position={[10, -5, -40]}
                        scale={5}
                        rotation={[0, -Math.PI, 0]}
                    />

                    {/* LED WALL */}
                    <LedWall position={[40, 1, 5]} width={14} height={9} />

                    <Poster
                        position={[52, 0, 5]}
                        width={7}
                        height={7}
                        imageSrc="textures/poster-11.webp"
                        showFrame={false}
                    />
                    <Poster
                        position={[60, 0, 5]}
                        width={7}
                        height={7}
                        imageSrc="textures/poster-22.webp"
                        showFrame={false}
                    />

                    {/* NEON TEXT */}
                    <NeonText
                        position={[-27, 4, 5]}
                        text="サイバーシティ"
                        color="#ff0080"
                        fontSize={3}
                    />

                    {/* NEON SIGNS */}
                    <NeonRock
                        position={[-2, 4, -15]}
                        scale={1.3}
                        rotation={[0, Math.PI + 1.5, 0]}
                    />
                    <NeonFun position={[22, 3, 4]} scale={1} />
                    <NeonRamen position={[-6, 3, -6]} scale={3} />
                    <NeonCassette position={[16, 2, -15]} scale={0.5} />
                    <NeonSign2
                        position={[22, 3, -6]}
                        scale={0.2}
                        rotation={[0, Math.PI + 1.5, 0]}
                    />
                    <NeonEvil position={[29, -1.5, 5]} scale={4} />
                    <NeonSign1
                        position={[25.5, 2.5, 5]}
                        scale={1.5}
                        rotation={[0, Math.PI, 0]}
                    />
                    <NeonDragon position={[-6, -1, 4]} scale={45} />

                    {/* HOLOGRAM */}
                    <Hologram
                        position={[8, 2, -5]}
                        scale={25}
                        color={PALETTE.HOLOGRAM_COLOR}
                    />

                    {/* PLAZA */}
                    <FuturisticPlaza
                        position={[8, -5, -5]}
                        scale={0.25}
                        rotation={[0, 0, 0]}
                    />
                </Suspense>
            </group>

            {/* Ambient light */}
            <ambientLight intensity={0.3} color="#1a1a3a" />

            {/* Colored accent lights */}
            <pointLight
                position={[-20, 30, 10]}
                intensity={0.4}
                color={PALETTE.NEON_PINK}
                distance={60}
            />
            <pointLight
                position={[30, 25, 10]}
                intensity={0.4}
                color={PALETTE.NEON_CYAN}
                distance={60}
            />
        </group>
    );
}
