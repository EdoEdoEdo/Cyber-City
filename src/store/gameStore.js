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
import {
    spawnProjectile as poolSpawn,
    clearProjectiles as poolClear,
} from '../systems/projectilePool';
import { triggerShake } from '../systems/cameraShake';
import { triggerKillCam, resetTimeScale } from '../systems/timeScale';
import { clearSparks } from '../systems/particlePool';
import { clearPickups } from '../systems/pickupPool';

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
    isDashing: false,
    isInvulnerable: false,
    lastHitTime: 0,
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
    stunTimer: 0,
    stunResistTimer: 0,
    phase: 1,
    lastHitTime: 0,
    comboType: null,
    comboStep: 0,
    comboTimer: 0,
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
        // phase: 0=connecting (low cam), 1=city reveal, 2=materialize, 3=ready
        // materialize: 0..1 progress of the agent hologram fade-in
        // -----------------------------------------
        intro: {
            active: true,
            progress: 0,
            phase: 0,
            materialize: 0,
        },

        startIntro: () =>
            set({
                intro: {
                    active: true,
                    progress: 0,
                    phase: 0,
                    materialize: 0,
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
                    phase: 3,
                    materialize: 1,
                },
                gamePhase: GAME_PHASES.PLAYING,
            }),

        // -----------------------------------------
        // OUTRO STATE
        // Mirrors INTRO: a 4-message debrief + dematerialize cinematic
        // that plays after BOSS_DEATH and before the VICTORY modal.
        // phase: 0=settle (cam glides to player), 1=dialogue,
        //        2=dematerialize, 3=pull-up to hologram, 4=ready (modal)
        // materialize: 1..0 (player fades out as it goes to 0)
        // -----------------------------------------
        outro: {
            active: false,
            progress: 0,
            phase: 0,
            materialize: 1,
            currentMessage: -1,
        },

        triggerOutro: () =>
            set({
                outro: {
                    active: true,
                    progress: 0,
                    phase: 0,
                    materialize: 1,
                    currentMessage: -1,
                },
                gamePhase: GAME_PHASES.OUTRO,
            }),

        updateOutro: (updates) =>
            set((state) => ({
                outro: { ...state.outro, ...updates },
            })),

        endOutro: () =>
            set({
                outro: {
                    active: false,
                    progress: 1,
                    phase: 4,
                    materialize: 0,
                    currentMessage: -1,
                },
                gamePhase: GAME_PHASES.VICTORY,
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
            set((state) => {
                // Don't override a terminal phase. If the player died on the
                // exact frame the boss spotted them, we'd otherwise resurrect
                // the run into a CUTSCENE and the boss would keep playing.
                if (
                    state.gamePhase === GAME_PHASES.GAME_OVER ||
                    state.gamePhase === GAME_PHASES.VICTORY ||
                    state.gamePhase === GAME_PHASES.BOSS_DEATH
                ) {
                    return state;
                }
                return {
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
                        enemy.isBoss
                            ? { ...enemy, isInvulnerable: false }
                            : enemy,
                    ),
                };
            }),

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
                // Hand off to the OUTRO cinematic (debrief chat + player
                // dematerialize + pull up to hologram). OutroManager
                // promotes us to VICTORY when its timeline ends.
                gamePhase: GAME_PHASES.OUTRO,
                outro: {
                    active: true,
                    progress: 0,
                    phase: 0,
                    materialize: 1,
                    currentMessage: -1,
                },
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
                if (state.player.isInvulnerable) return state;
                const newHealth = Math.max(0, state.player.health - amount);
                const willDie = newHealth <= 0 && !state.player.isDead;
                triggerShake(0.22, 0.25);
                // On lethal damage, freeze the world. Without this, in-flight
                // boss projectiles + sparks kept hitting the screen behind
                // the GAME_OVER overlay and made the boss look alive.
                if (willDie) {
                    poolClear();
                    clearSparks();
                    clearPickups();
                    resetTimeScale();
                }
                return {
                    player: {
                        ...state.player,
                        health: newHealth,
                        isDead: newHealth <= 0,
                        lastHitTime: performance.now(),
                    },
                    gamePhase:
                        newHealth <= 0
                            ? GAME_PHASES.GAME_OVER
                            : state.gamePhase,
                };
            }),

        refillShield: () =>
            set((state) => ({
                player: {
                    ...state.player,
                    shieldCooldown: 0,
                    health: Math.min(
                        state.player.maxHealth,
                        state.player.health + 5,
                    ),
                },
            })),

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
            set((state) => {
                if (!state.player.isDead) {
                    poolClear();
                    clearSparks();
                    clearPickups();
                    resetTimeScale();
                }
                return {
                    player: { ...state.player, isDead: true, health: 0 },
                    gamePhase: GAME_PHASES.GAME_OVER,
                };
            }),

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
                    return state;

                const newHealth = Math.max(0, enemy.health - amount);
                const shouldDie = newHealth <= 0;
                const now = performance.now();

                // Camera shake: bigger on boss death.
                if (shouldDie && enemy.isBoss) {
                    triggerShake(0.7, 0.55);
                    triggerKillCam();
                } else if (shouldDie) {
                    triggerShake(0.25, 0.25);
                } else {
                    triggerShake(enemy.isBoss ? 0.12 : 0.08, 0.12);
                }

                // Boss phase change at <= PHASE_2_HP_RATIO * max
                let nextPhase = enemy.phase || 1;
                let nextAccent = enemy.accentColor;
                if (
                    enemy.isBoss &&
                    nextPhase === 1 &&
                    newHealth > 0 &&
                    newHealth <= enemy.maxHealth * BOSS.PHASE_2_HP_RATIO
                ) {
                    nextPhase = 2;
                    nextAccent = BOSS.PHASE_2_ACCENT;
                    triggerShake(0.35, 0.35);
                }

                if (shouldDie && enemy.isBoss) {
                    setTimeout(() => {
                        get().triggerBossDeathCutscene(enemy.position);
                    }, 800); // wait for the full freeze + slow-mo to play out

                    return {
                        enemies: state.enemies.map((e) =>
                            e.id === id
                                ? {
                                      ...e,
                                      health: 0,
                                      isDead: true,
                                      state: 'DEAD',
                                      lastHitTime: now,
                                  }
                                : e,
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
                                  lastHitTime: now,
                                  // Only stun if not already stun-resistant.
                                  // This stops infinite stun-locks: a single
                                  // hit punches, follow-ups still damage but
                                  // don't interrupt the boss's combo.
                                  stunTimer:
                                      shouldDie || (e.stunResistTimer || 0) > 0
                                          ? e.stunTimer || 0
                                          : BOSS.HIT_STUN,
                                  stunResistTimer:
                                      shouldDie || (e.stunResistTimer || 0) > 0
                                          ? e.stunResistTimer || 0
                                          : BOSS.STUN_RESIST,
                                  aimTimer:
                                      shouldDie || (e.stunResistTimer || 0) > 0
                                          ? e.aimTimer
                                          : 0,
                                  phase: nextPhase,
                                  accentColor: nextAccent,
                              }
                            : e,
                    ),
                    // gamePhase intentionally unchanged: the boss-kill path
                    // returns above via the setTimeout branch; here we only
                    // hit non-lethal damage or non-boss kills.
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
        // PROJECTILES (backed by pool, no array in store)
        // -----------------------------------------
        // Bumped on spawn/clear so the renderer can re-mount slot trees.
        projectilesVersion: 0,

        spawnProjectile: (projectile) => {
            poolSpawn(projectile);
            // Do NOT bump version on spawn: the renderer iterates the pool
            // every frame and reads slot.active. Re-rendering on every shot
            // would defeat the purpose of the pool.
        },

        // Kept for API compatibility. The pool auto-despawns by lifetime;
        // explicit removal happens in the combat system via direct slot
        // mutation (slot.active = false), not through the store.
        updateProjectile: () => {},
        removeProjectile: () => {},

        clearProjectiles: () =>
            set((state) => {
                poolClear();
                return { projectilesVersion: state.projectilesVersion + 1 };
            }),

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
            dash: false,
            dashPressed: false,
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
            set((state) => {
                poolClear();
                clearSparks();
                clearPickups();
                resetTimeScale();
                return {
                    resetKey: state.resetKey + 1,
                    gamePhase: GAME_PHASES.INTRO,
                    isPaused: false,
                    gameTime: 0,
                    player: { ...initialPlayerState },
                    enemies: LEVEL.ENEMY_SPAWNS.map((spawn, i) =>
                        createInitialEnemyState(spawn, `enemy_${i}`),
                    ),
                    projectilesVersion: state.projectilesVersion + 1,
                    intro: {
                        active: true,
                        progress: 0,
                        phase: 0,
                        materialize: 0,
                    },
                    outro: {
                        active: false,
                        progress: 0,
                        phase: 0,
                        materialize: 1,
                        currentMessage: -1,
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
                };
            }),

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
export const selectProjectilesVersion = (state) => state.projectilesVersion;
// Kept for backward compat. Returns an empty array since projectiles are
// no longer stored in Zustand. New code should consume the pool directly
// via systems/projectilePool.js.
export const selectProjectiles = () => EMPTY_PROJECTILES;
const EMPTY_PROJECTILES = [];
export const selectGamePhase = (state) => state.gamePhase;
export const selectIsPaused = (state) => state.isPaused;
export const selectInput = (state) => state.input;
export const selectCamera = (state) => state.camera;
export const selectCutscene = (state) => state.cutscene;
export const selectAudio = (state) => state.audio;
export const selectResetKey = (state) => state.resetKey;
export const selectIntro = (state) => state.intro;
export const selectOutro = (state) => state.outro;
