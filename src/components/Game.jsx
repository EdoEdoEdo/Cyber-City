/**
 * Game Component
 * Main game assembly - combines all components and systems
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { Player } from './Player';
import { Enemies } from './Enemy';
import { Projectiles } from './Projectiles';
import { Sparks } from './Sparks';
import { Pickups } from './Pickups';
import { Level } from './Level';
import { Background } from './Background';
import { GameSystems } from './GameSystems';
import { UIOverlay } from './UIOverlay';
import { IntroUI } from './IntroUI';
import { OutroUI } from './OutroUI';
import { MobileControls } from './MobileControls';
import { LandscapeLock } from './LandscapeLock';
import { LoadingScreen } from './LoadingScreen';
import { DamageNumbers } from './DamageNumbers';
import { ErrorBoundary } from './ErrorBoundary';
import { PostFX } from './PostFX';
import { SkipPrompt } from './SkipPrompt';
import { useInputSystem } from '../systems/useInputSystem';
import { CAMERA, COLORS, GAME_PHASES } from '../constants/gameplayConstants';
import { AudioManager } from './AudioManager';
import { useGameStore, selectGamePhase } from '../store/gameStore';

// Lazy: caricati solo dopo lo start (riducono il chunk iniziale)
const CutsceneManager = lazy(() =>
    import('./CutsceneManager').then((m) => ({ default: m.CutsceneManager })),
);
const IntroManager = lazy(() =>
    import('./IntroManager').then((m) => ({ default: m.IntroManager })),
);
const OutroManager = lazy(() =>
    import('./OutroManager').then((m) => ({ default: m.OutroManager })),
);

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
            <Pickups />
            <Sparks />
            <DamageNumbers />
            <Preload all />
            <PostFX />
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
    const [showLoading, setShowLoading] = useState(true);
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
        // Keep LoadingScreen mounted so it can fade out smoothly,
        // then unmount once the canvas has had time to fade in.
        setTimeout(() => setShowLoading(false), 1100);
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
            <ErrorBoundary>
                <Canvas
                    camera={{
                        fov: CAMERA.FOV,
                        near: CAMERA.NEAR,
                        far: CAMERA.FAR,
                        position: [
                            0,
                            CAMERA.VERTICAL_OFFSET,
                            CAMERA.Z_POSITION,
                        ],
                    }}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                    }}
                    dpr={[1, 2]}
                    style={{
                        ...styles.canvas,
                        opacity: started ? 1 : 0,
                        transform: started ? 'scale(1)' : 'scale(1.04)',
                        transition:
                            'opacity 1200ms ease-out, transform 1600ms ease-out',
                        pointerEvents: started ? 'auto' : 'none',
                    }}
                >
                    <color attach="background" args={[COLORS.DARK_BG]} />
                    <fog attach="fog" args={[COLORS.DARK_BG, 30, 100]} />
                    <Scene />
                    {started && (
                        <Suspense fallback={null}>
                            <CutsceneManager />
                            <IntroManager />
                            <OutroManager />
                        </Suspense>
                    )}
                </Canvas>
            </ErrorBoundary>

            {/* UI solo dopo start */}
            {started && (
                <>
                    <UIOverlay />
                    <IntroUI />
                    <OutroUI />
                    <MobileControls />
                    <LandscapeLock />
                    <SkipController />
                </>
            )}

            {/* Loading Screen sopra tutto (resta montato durante il fade) */}
            {showLoading && (
                <LoadingScreen onStart={handleStart} exiting={started} />
            )}
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

// ---- Skip controller ----
// Chooses the right skip action per game phase. Lives outside Game()
// so it can subscribe to gamePhase without re-rendering the whole tree.
function SkipController() {
    const phase = useGameStore(selectGamePhase);
    const endIntro = useGameStore((s) => s.endIntro);
    const endCutscene = useGameStore((s) => s.endCutscene);
    const endOutro = useGameStore((s) => s.endOutro);

    const enabled =
        phase === GAME_PHASES.INTRO ||
        phase === GAME_PHASES.CUTSCENE ||
        phase === GAME_PHASES.OUTRO;

    const onSkip = React.useCallback(() => {
        if (phase === GAME_PHASES.INTRO) endIntro();
        else if (phase === GAME_PHASES.CUTSCENE) endCutscene();
        else if (phase === GAME_PHASES.OUTRO) endOutro();
    }, [phase, endIntro, endCutscene, endOutro]);

    return <SkipPrompt enabled={enabled} onSkip={onSkip} />;
}
