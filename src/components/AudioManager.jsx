/**
 * Audio Manager Component
 * Handles all game audio: rain, music, and sound effects
 */

import { useEffect, useRef } from 'react';
import {
    useGameStore,
    selectAudio,
    selectProjectiles,
} from '../store/gameStore';

export function AudioManager({
    musicSrc = 'audio/boss_music.mp3',
    enabled = false,
}) {
    const audio = useGameStore(selectAudio);
    const projectiles = useGameStore(selectProjectiles);

    const rainRef = useRef(null);
    const musicRef = useRef(null);
    const pistolRef = useRef(null);
    const shotgunRef = useRef(null);
    const initializedRef = useRef(false);

    const lastProjectileCountRef = useRef(0);

    // Initialize audio elements when enabled
    useEffect(() => {
        if (!enabled || initializedRef.current) return;

        initializedRef.current = true;

        // Rain
        rainRef.current = new Audio('audio/rain_loop.mp3');
        rainRef.current.loop = true;
        rainRef.current.volume = audio.rainVolume;

        // Music
        musicRef.current = new Audio(musicSrc);
        musicRef.current.loop = true;
        musicRef.current.volume = audio.musicVolume;

        // Sound effects
        pistolRef.current = new Audio('audio/pistol.mp3');
        pistolRef.current.volume = 0.4;

        shotgunRef.current = new Audio('audio/shotgun.mp3');
        shotgunRef.current.volume = 0.5;

        // FIX 2: Start rain immediately - user already clicked START
        const timer = setTimeout(() => {
            if (rainRef.current) {
                rainRef.current.play().catch((err) => {
                    console.log('Rain audio blocked:', err);
                });
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            rainRef.current?.pause();
            musicRef.current?.pause();
            rainRef.current = null;
            musicRef.current = null;
            pistolRef.current = null;
            shotgunRef.current = null;
            initializedRef.current = false;
        };
    }, [enabled, musicSrc]);

    // Update rain volume
    useEffect(() => {
        if (rainRef.current) {
            rainRef.current.volume = audio.rainVolume;
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

    // Play shooting sounds when new projectiles are spawned
    useEffect(() => {
        if (!enabled) return;

        if (projectiles.length > lastProjectileCountRef.current) {
            const newProjectiles = projectiles.slice(
                lastProjectileCountRef.current,
            );

            newProjectiles.forEach((proj) => {
                if (proj.isPlayerProjectile) {
                    if (pistolRef.current) {
                        pistolRef.current.currentTime = 0;
                        pistolRef.current.play().catch(() => {});
                    }
                } else {
                    if (shotgunRef.current) {
                        shotgunRef.current.currentTime = 0;
                        shotgunRef.current.play().catch(() => {});
                    }
                }
            });
        }

        lastProjectileCountRef.current = projectiles.length;
    }, [projectiles, enabled]);

    return null;
}
