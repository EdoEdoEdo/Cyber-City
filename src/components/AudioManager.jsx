/**
 * Audio Manager Component
 * Handles all game audio: rain (gapless via Web Audio), music, and SFX.
 */

import { useEffect, useRef } from 'react';
import { useGameStore, selectAudio, selectIsPaused } from '../store/gameStore';
import { onProjectileSpawn } from '../systems/projectilePool';

// Crop the tail of the rain mp3 (in seconds). MP3 decoders add a small
// silence pad at the end of every file → using HTMLAudioElement.loop causes
// an audible gap. Web Audio + loopEnd skips the pad and gives a true
// gapless loop.
const RAIN_TAIL_TRIM = 1.0;

export function AudioManager({
    musicSrc = 'audio/boss_music.mp3',
    enabled = false,
}) {
    const audio = useGameStore(selectAudio);
    const isPaused = useGameStore(selectIsPaused);

    // Rain (Web Audio for gapless loop)
    const audioCtxRef = useRef(null);
    const rainBufferRef = useRef(null);
    const rainSourceRef = useRef(null);
    const rainGainRef = useRef(null);
    const rainPlayingRef = useRef(false);

    // Music + SFX (HTMLAudioElement)
    const musicRef = useRef(null);
    const pistolRef = useRef(null);
    const shotgunRef = useRef(null);
    const initializedRef = useRef(false);

    const startRain = () => {
        const ctx = audioCtxRef.current;
        const buffer = rainBufferRef.current;
        const gain = rainGainRef.current;
        if (!ctx || !buffer || !gain) return;
        if (rainPlayingRef.current) return;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = 0;
        source.loopEnd = Math.max(0.1, buffer.duration - RAIN_TAIL_TRIM);
        source.connect(gain);
        source.start(0);
        rainSourceRef.current = source;
        rainPlayingRef.current = true;
    };

    const stopRain = () => {
        const source = rainSourceRef.current;
        if (!source) return;
        try {
            source.stop();
        } catch {
            /* already stopped */
        }
        try {
            source.disconnect();
        } catch {
            /* noop */
        }
        rainSourceRef.current = null;
        rainPlayingRef.current = false;
    };

    // Initialize audio when enabled.
    useEffect(() => {
        if (!enabled || initializedRef.current) return;

        initializedRef.current = true;
        let cancelled = false;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
            const ctx = new Ctx();
            const gain = ctx.createGain();
            gain.gain.value = audio.rainVolume;
            gain.connect(ctx.destination);
            audioCtxRef.current = ctx;
            rainGainRef.current = gain;

            fetch('audio/rain_loop.mp3')
                .then((r) => r.arrayBuffer())
                .then((buf) => ctx.decodeAudioData(buf))
                .then((decoded) => {
                    if (cancelled) return;
                    rainBufferRef.current = decoded;
                    startRain();
                })
                .catch((err) => {
                    console.log('Rain audio load failed:', err);
                });
        }

        // Music
        musicRef.current = new Audio(musicSrc);
        musicRef.current.loop = true;
        musicRef.current.volume = audio.musicVolume;

        // SFX
        pistolRef.current = new Audio('audio/pistol.mp3');
        pistolRef.current.volume = 0.4;

        shotgunRef.current = new Audio('audio/shotgun.mp3');
        shotgunRef.current.volume = 0.5;

        return () => {
            cancelled = true;
            stopRain();
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
            rainBufferRef.current = null;
            rainGainRef.current = null;
            musicRef.current?.pause();
            musicRef.current = null;
            pistolRef.current = null;
            shotgunRef.current = null;
            initializedRef.current = false;
        };
    }, [enabled, musicSrc]);

    // Update rain volume
    useEffect(() => {
        if (rainGainRef.current) {
            rainGainRef.current.gain.value = audio.rainVolume;
        }
    }, [audio.rainVolume]);

    // Update music
    useEffect(() => {
        if (musicRef.current) {
            musicRef.current.volume = audio.musicVolume;

            if (audio.musicPlaying && musicRef.current.paused) {
                musicRef.current.play().catch(() => {});
            }
        }
    }, [audio.musicVolume, audio.musicPlaying]);

    // Play shooting sounds when new projectiles are spawned (pool listener)
    useEffect(() => {
        if (!enabled) return;

        const off = onProjectileSpawn((slot) => {
            const sfx = slot.isPlayerProjectile
                ? pistolRef.current
                : shotgunRef.current;
            if (!sfx) return;
            sfx.currentTime = 0;
            sfx.play().catch(() => {});
        });

        return off;
    }, [enabled]);

    // Pause / resume looping audio (rain + music) when the game is paused.
    useEffect(() => {
        if (!enabled || !initializedRef.current) return;
        if (isPaused) {
            stopRain();
            musicRef.current?.pause();
        } else {
            startRain();
            if (audio.musicPlaying) {
                musicRef.current?.play().catch(() => {});
            }
        }
    }, [isPaused, enabled, audio.musicPlaying]);

    return null;
}
