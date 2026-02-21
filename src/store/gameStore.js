/**
 * Game Store (Zustand)
 * Centralized state management for all game logic
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
    GAME_PHASES,
    PLAYER,
    LEVEL,
    BOSS,
    HEALTH,
} from '../constants/gameplayConstants';

// ===========================================
// INITIAL STATES
// ===========================================

const initialPlayerState = {
    position: { x: PLAYER.START_X, y: PLAYER.START_Y, z: PLAYER.START_Z },
    velocity: { x: 0, y: 0 },
    facingRight: true,
    isGrounded: false,
    isJumping: false,
    isShooting: false,
    isShielding: false,
    shieldCooldown: 0,
    shieldActive: false,
    isDead: false,
    health: HEALTH.PLAYER_MAX,
    maxHealth: HEALTH.PLAYER_MAX,
};

const createInitialEnemyState = (spawn, id) => ({
    id,
    position: { x: spawn.x, y: spawn.y, z: 0 },
    velocity: { x: 0, y: 0 },
    facingRight: false,
    state: 'IDLE',
    patrolBounds: { left: spawn.patrolLeft, right: spawn.patrolRight },
    alertTimer: 0,
    aimTimer: 0,
    shootCooldown: 0,
    isDead: false,
    isBoss: spawn.isBoss || false,
    accentColor: spawn.isBoss ? BOSS.ACCENT_IDLE : '#ff3366',
    health: spawn.isBoss ? HEALTH.BOSS_MAX : 1,
    maxHealth: spawn.isBoss ? HEALTH.BOSS_MAX : 1,
    isShielding: false,
    shieldCooldown: 0,
    jumpCooldown: 0,
    isGrounded: true,
    isInvulnerable: spawn.isBoss ? true : false,
});

// ===========================================
// STORE DEFINITION
// ===========================================

export const useGameStore = create(
    subscribeWithSelector((set, get) => ({
        // -----------------------------------------
        // GAME STATE
        // -----------------------------------------
        gamePhase: GAME_PHASES.INTRO,
        isPaused: false,
        gameTime: 0,

        setGamePhase: (phase) => set({ gamePhase: phase }),
        togglePause: () =>
            set((state) => ({
                isPaused: !state.isPaused,
                gamePhase: state.isPaused
                    ? GAME_PHASES.PLAYING
                    : GAME_PHASES.PAUSED,
            })),

        // -----------------------------------------
        // INTRO STATE
        // -----------------------------------------
        intro: {
            active: true,
            progress: 0,
            currentMessage: 0,
        },

        startIntro: () =>
            set({
                intro: {
                    active: true,
                    progress: 0,
                    currentMessage: 0,
                },
                gamePhase: GAME_PHASES.INTRO,
            }),

        updateIntro: (updates) =>
            set((state) => ({
                intro: { ...state.intro, ...updates },
            })),

        endIntro: () =>
            set({
                intro: {
                    active: false,
                    progress: 1,
                    currentMessage: -1,
                },
                gamePhase: GAME_PHASES.PLAYING,
            }),

        // -----------------------------------------
        // CUTSCENE STATE
        // -----------------------------------------
        cutscene: {
            active: false,
            progress: 0,
            bossPosition: null,
            shakeIntensity: 0,
            type: 'intro',
            showExplosion: false,
            hideBoss: false,
        },

        triggerBossCutscene: (bossPos) =>
            set((state) => ({
                cutscene: {
                    active: true,
                    progress: 0,
                    bossPosition: bossPos,
                    shakeIntensity: 0,
                    type: 'intro',
                    showExplosion: false,
                    hideBoss: false,
                },
                gamePhase: GAME_PHASES.CUTSCENE,
                enemies: state.enemies.map((enemy) =>
                    enemy.isBoss ? { ...enemy, isInvulnerable: false } : enemy,
                ),
            })),

        triggerBossDeathCutscene: (bossPos) =>
            set({
                cutscene: {
                    active: true,
                    progress: 0,
                    bossPosition: bossPos,
                    shakeIntensity: 0,
                    type: 'death',
                    showExplosion: false,
                    hideBoss: false,
                },
                gamePhase: GAME_PHASES.BOSS_DEATH,
            }),

        updateCutscene: (updates) =>
            set((state) => ({
                cutscene: { ...state.cutscene, ...updates },
            })),

        endCutscene: () =>
            set((state) => ({
                cutscene: {
                    active: false,
                    progress: 1,
                    bossPosition: null,
                    shakeIntensity: 0,
                    type: 'intro',
                    showExplosion: false,
                    hideBoss: false,
                },
                gamePhase: GAME_PHASES.BOSS_FIGHT,
                enemies: state.enemies.map((enemy) =>
                    enemy.isBoss
                        ? {
                              ...enemy,
                              state: 'CHASE',
                              accentColor: BOSS.ACCENT_ALERT,
                          }
                        : enemy,
                ),
            })),

        endDeathCutscene: () =>
            set((state) => ({
                cutscene: {
                    active: false,
                    progress: 1,
                    bossPosition: null,
                    shakeIntensity: 0,
                    type: 'intro',
                    showExplosion: false,
                    hideBoss: false,
                },
                gamePhase: GAME_PHASES.VICTORY,
                enemies: state.enemies.map((enemy) =>
                    enemy.isBoss
                        ? { ...enemy, isDead: true, state: 'DEAD' }
                        : enemy,
                ),
            })),

        // -----------------------------------------
        // PLAYER STATE
        // -----------------------------------------
        player: { ...initialPlayerState },

        updatePlayer: (updates) =>
            set((state) => ({
                player: { ...state.player, ...updates },
            })),

        setPlayerPosition: (position) =>
            set((state) => ({
                player: { ...state.player, position },
            })),

        setPlayerVelocity: (velocity) =>
            set((state) => ({
                player: { ...state.player, velocity },
            })),

        damagePlayer: (amount) =>
            set((state) => {
                if (state.player.isShielding) return state;
                const newHealth = Math.max(0, state.player.health - amount);
                return {
                    player: {
                        ...state.player,
                        health: newHealth,
                        isDead: newHealth <= 0,
                    },
                    gamePhase:
                        newHealth <= 0
                            ? GAME_PHASES.GAME_OVER
                            : state.gamePhase,
                };
            }),

        healPlayer: (amount) =>
            set((state) => ({
                player: {
                    ...state.player,
                    health: Math.min(
                        state.player.maxHealth,
                        state.player.health + amount,
                    ),
                },
            })),

        killPlayer: () =>
            set((state) => ({
                player: { ...state.player, isDead: true, health: 0 },
                gamePhase: GAME_PHASES.GAME_OVER,
            })),

        respawnPlayer: () =>
            set({
                player: { ...initialPlayerState },
                gamePhase: GAME_PHASES.PLAYING,
            }),

        // -----------------------------------------
        // ENEMIES STATE
        // -----------------------------------------
        enemies: LEVEL.ENEMY_SPAWNS.map((spawn, i) =>
            createInitialEnemyState(spawn, `enemy_${i}`),
        ),

        updateEnemy: (id, updates) =>
            set((state) => ({
                enemies: state.enemies.map((enemy) =>
                    enemy.id === id ? { ...enemy, ...updates } : enemy,
                ),
            })),

        damageEnemy: (id, amount) =>
            set((state) => {
                const enemy = state.enemies.find((e) => e.id === id);
                if (
                    !enemy ||
                    enemy.isShielding ||
                    enemy.isInvulnerable ||
                    enemy.isDead
                )
                    // ← Aggiungi enemy.isDead
                    return state;

                const newHealth = Math.max(0, enemy.health - amount);
                const shouldDie = newHealth <= 0; // ← Cambia da <= 0 a < 1

                if (shouldDie && enemy.isBoss) {
                    setTimeout(() => {
                        get().triggerBossDeathCutscene(enemy.position);
                    }, 0);

                    return {
                        enemies: state.enemies.map(
                            (e) =>
                                e.id === id
                                    ? {
                                          ...e,
                                          health: 0,
                                          isDead: true,
                                          state: 'DEAD',
                                      }
                                    : e, // ← Aggiungi isDead: true, state: 'DEAD'
                        ),
                    };
                }

                return {
                    enemies: state.enemies.map((e) =>
                        e.id === id
                            ? {
                                  ...e,
                                  health: newHealth,
                                  isDead: shouldDie,
                                  state: shouldDie ? 'DEAD' : e.state,
                              }
                            : e,
                    ),
                    gamePhase:
                        shouldDie && enemy.isBoss
                            ? GAME_PHASES.VICTORY
                            : state.gamePhase,
                };
            }),

        killEnemy: (id) =>
            set((state) => {
                const enemy = state.enemies.find((e) => e.id === id);

                if (enemy?.isBoss && !enemy.isDead) {
                    setTimeout(() => {
                        get().triggerBossDeathCutscene(enemy.position);
                    }, 0);
                    return state;
                }

                return {
                    enemies: state.enemies.map((e) =>
                        e.id === id
                            ? { ...e, isDead: true, state: 'DEAD', health: 0 }
                            : e,
                    ),
                };
            }),

        resetEnemies: () =>
            set({
                enemies: LEVEL.ENEMY_SPAWNS.map((spawn, i) =>
                    createInitialEnemyState(spawn, `enemy_${i}`),
                ),
            }),

        setBossAccentColor: (color) =>
            set((state) => ({
                enemies: state.enemies.map((enemy) =>
                    enemy.isBoss ? { ...enemy, accentColor: color } : enemy,
                ),
            })),

        // -----------------------------------------
        // PROJECTILES STATE
        // -----------------------------------------
        projectiles: [],
        nextProjectileId: 0,

        spawnProjectile: (projectile) =>
            set((state) => ({
                projectiles: [
                    ...state.projectiles,
                    { ...projectile, id: `proj_${state.nextProjectileId}` },
                ],
                nextProjectileId: state.nextProjectileId + 1,
            })),

        updateProjectile: (id, updates) =>
            set((state) => ({
                projectiles: state.projectiles.map((proj) =>
                    proj.id === id ? { ...proj, ...updates } : proj,
                ),
            })),

        removeProjectile: (id) =>
            set((state) => ({
                projectiles: state.projectiles.filter((proj) => proj.id !== id),
            })),

        clearProjectiles: () => set({ projectiles: [] }),

        // -----------------------------------------
        // INPUT STATE
        // -----------------------------------------
        input: {
            left: false,
            right: false,
            jump: false,
            jumpPressed: false,
            shoot: false,
            shootPressed: false,
            shield: false,
            shieldPressed: false,
        },

        setInput: (inputUpdates) =>
            set((state) => ({
                input: { ...state.input, ...inputUpdates },
            })),

        // -----------------------------------------
        // CAMERA STATE
        // -----------------------------------------
        camera: {
            position: { x: PLAYER.START_X, y: 2, z: 8 },
            target: { x: PLAYER.START_X, y: 2, z: 0 },
            shake: { x: 0, y: 0 },
        },

        updateCamera: (updates) =>
            set((state) => ({
                camera: { ...state.camera, ...updates },
            })),

        // -----------------------------------------
        // AUDIO STATE
        // -----------------------------------------
        audio: {
            rainVolume: 0.4,
            musicVolume: 0,
            musicPlaying: false,
        },

        updateAudio: (updates) =>
            set((state) => ({
                audio: { ...state.audio, ...updates },
            })),

        // -----------------------------------------
        // RESET KEY
        // -----------------------------------------
        resetKey: 0,

        // -----------------------------------------
        // GAME RESTART (completo)
        // -----------------------------------------
        resetGame: () =>
            set((state) => ({
                resetKey: state.resetKey + 1,
                gamePhase: GAME_PHASES.INTRO,
                isPaused: false,
                gameTime: 0,
                player: { ...initialPlayerState },
                enemies: LEVEL.ENEMY_SPAWNS.map((spawn, i) =>
                    createInitialEnemyState(spawn, `enemy_${i}`),
                ),
                projectiles: [],
                nextProjectileId: 0,
                intro: {
                    active: true,
                    progress: 0,
                    currentMessage: 0,
                },
                cutscene: {
                    active: false,
                    progress: 0,
                    bossPosition: null,
                    shakeIntensity: 0,
                    type: 'intro',
                    showExplosion: false,
                    hideBoss: false,
                },
                audio: {
                    rainVolume: 0.4,
                    musicVolume: 0,
                    musicPlaying: false,
                },
                camera: {
                    position: { x: PLAYER.START_X, y: 2, z: 8 },
                    target: { x: PLAYER.START_X, y: 2, z: 0 },
                    shake: { x: 0, y: 0 },
                },
            })),

        // -----------------------------------------
        // DEBUG
        // -----------------------------------------
        debug: false,
        toggleDebug: () => set((state) => ({ debug: !state.debug })),
    })),
);

// ===========================================
// SELECTORS
// ===========================================

export const selectPlayer = (state) => state.player;
export const selectPlayerPosition = (state) => state.player.position;
export const selectEnemies = (state) => state.enemies;
export const selectAliveEnemies = (state) =>
    state.enemies.filter((e) => !e.isDead);
export const selectBoss = (state) => state.enemies.find((e) => e.isBoss);
export const selectProjectiles = (state) => state.projectiles;
export const selectGamePhase = (state) => state.gamePhase;
export const selectIsPaused = (state) => state.isPaused;
export const selectInput = (state) => state.input;
export const selectCamera = (state) => state.camera;
export const selectCutscene = (state) => state.cutscene;
export const selectAudio = (state) => state.audio;
export const selectResetKey = (state) => state.resetKey;
export const selectIntro = (state) => state.intro;
