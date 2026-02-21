/**
 * Game Component
 * Main game assembly - combines all components and systems
 */

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { Player } from './Player';
import { Enemies } from './Enemy';
import { Projectiles } from './Projectiles';
import { Level } from './Level';
import { Background } from './Background';
import { GameSystems } from './GameSystems';
import { UIOverlay } from './UIOverlay';
import { CutsceneManager } from './CutsceneManager';
import { IntroManager } from './IntroManager';
import { IntroUI } from './IntroUI';
import { MobileControls } from './MobileControls';
import { LandscapeLock } from './LandscapeLock';
import { LoadingScreen } from './LoadingScreen';
import { DamageNumbers } from './DamageNumbers';
import { useInputSystem } from '../systems/useInputSystem';
import { CAMERA, COLORS } from '../constants/gameplayConstants';
import { AudioManager } from './AudioManager';

// Scene lighting setup
function Lighting() {
    return (
        <>
            <ambientLight intensity={0.5} color="#aaccff" />
            <directionalLight
                position={[10, 20, 10]}
                intensity={0.4}
                color="#aaccff"
            />
            <pointLight
                position={[0, -2, 5]}
                intensity={0.3}
                color={COLORS.NEON_CYAN}
                distance={20}
            />
            <pointLight
                position={[-10, 5, -5]}
                intensity={0.2}
                color={COLORS.NEON_PINK}
                distance={30}
            />
        </>
    );
}

// Main scene content
function Scene() {
    return (
        <>
            <GameSystems />
            <Lighting />
            <Background />
            <Level />
            <Player />
            <Enemies />
            <Projectiles />
            <DamageNumbers />
            <Preload all />
        </>
    );
}

// Check if mobile
function isMobile() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Check if landscape
function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

// Main Game component
export function Game() {
    const [started, setStarted] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [canShow, setCanShow] = useState(false);

    useInputSystem();

    // Check orientation on mobile
    useEffect(() => {
        const checkOrientation = () => {
            if (!isMobile() || isLandscape()) {
                setCanShow(true);
            } else {
                setCanShow(false);
            }
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    const handleStart = () => {
        // Trick per sbloccare audio su iOS/mobile
        try {
            const AudioContext =
                window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                ctx.resume();
            }

            // Pre-play silenzioso per sbloccare
            const rain = new Audio('audio/rain_loop.mp3');
            rain.volume = 0.001;
            rain.play()
                .then(() => {
                    rain.pause();
                })
                .catch(() => {});
        } catch (e) {
            console.log('Audio unlock failed:', e);
        }

        setStarted(true);
        setAudioEnabled(true);
        console.log('🎮 Game started - Audio enabled');
    };

    // FIX 1: Se mobile e portrait, mostra SOLO LandscapeLock (prima di tutto)
    if (isMobile() && !canShow) {
        return (
            <div style={styles.gameContainer}>
                <LandscapeLock />
            </div>
        );
    }

    return (
        <div style={styles.gameContainer}>
            {/* FIX 2: Audio parte solo dopo start */}
            {started && (
                <AudioManager
                    musicSrc="audio/boss_music.mp3"
                    enabled={audioEnabled}
                />
            )}

            {/* FIX 3: Canvas sempre montato per preload reale */}
            <Canvas
                camera={{
                    fov: CAMERA.FOV,
                    near: CAMERA.NEAR,
                    far: CAMERA.FAR,
                    position: [0, CAMERA.VERTICAL_OFFSET, CAMERA.Z_POSITION],
                }}
                gl={{
                    antialias: true,
                    alpha: false,
                }}
                style={{
                    ...styles.canvas,
                    opacity: started ? 1 : 0,
                    pointerEvents: started ? 'auto' : 'none',
                }}
            >
                <color attach="background" args={[COLORS.DARK_BG]} />
                <fog attach="fog" args={[COLORS.DARK_BG, 30, 100]} />
                <Scene />
                {started && <CutsceneManager />}
                {started && <IntroManager />}
            </Canvas>

            {/* UI solo dopo start */}
            {started && (
                <>
                    <UIOverlay />
                    <IntroUI />
                    <MobileControls />
                    <LandscapeLock />
                </>
            )}

            {/* Loading Screen sopra tutto */}
            {!started && <LoadingScreen onStart={handleStart} />}
        </div>
    );
}

const styles = {
    gameContainer: {
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: COLORS.DARK_BG,
    },
    canvas: {
        width: '100%',
        height: '100%',
        transition: 'opacity 0.5s ease',
    },
};
