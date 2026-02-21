/**
 * Boss AI System
 * Advanced AI with chase, attack, shield, and jump behaviors
 */

import { useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectPlayerPosition,
    selectPlayer,
    selectIsPaused,
    selectGamePhase,
    selectProjectiles,
    selectBoss,
    selectResetKey,
} from '../store/gameStore';
import {
    BOSS,
    BOSS_STATES,
    GAME_PHASES,
    LEVEL,
    WORLD,
} from '../constants/gameplayConstants';

export function useBossAI() {
    const boss = useGameStore(selectBoss);
    const playerPosition = useGameStore(selectPlayerPosition);
    const player = useGameStore(selectPlayer);
    const projectiles = useGameStore(selectProjectiles);
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);
    const resetKey = useGameStore(selectResetKey);

    const updateEnemy = useGameStore((state) => state.updateEnemy);
    const spawnProjectile = useGameStore((state) => state.spawnProjectile);
    const triggerBossCutscene = useGameStore(
        (state) => state.triggerBossCutscene,
    );
    const killEnemy = useGameStore((state) => state.killEnemy);

    const bossCutsceneTriggeredRef = useRef(false);
    const decisionTimerRef = useRef(0);
    const idleTimerRef = useRef(0);
    const lookAwayTimerRef = useRef(0);
    const isLookingAwayRef = useRef(false);

    // Reset refs quando resetKey cambia
    useEffect(() => {
        bossCutsceneTriggeredRef.current = false;
        decisionTimerRef.current = 0;
        idleTimerRef.current = 0;
        lookAwayTimerRef.current = 0;
        isLookingAwayRef.current = false;
    }, [resetKey]);

    const getDistanceToPlayer = useCallback(
        (bossPos) => {
            const dx = playerPosition.x - bossPos.x;
            const dy = playerPosition.y - bossPos.y;
            return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
        },
        [playerPosition],
    );

    const checkIncomingProjectiles = useCallback(
        (bossPos) => {
            return projectiles.some((proj) => {
                if (!proj.isPlayerProjectile) return false;

                const dx = proj.position.x - bossPos.x;
                const dy = proj.position.y - bossPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const isApproaching = proj.velocity.x > 0 ? dx < 0 : dx > 0;
                return distance < 5 && isApproaching && Math.abs(dy) < 2;
            });
        },
        [projectiles],
    );

    const isOnPlatform = useCallback((x, y) => {
        for (const platform of LEVEL.PLATFORMS) {
            const halfWidth = platform.width / 2;
            const platformLeft = platform.x - halfWidth;
            const platformRight = platform.x + halfWidth;
            const platformTop = platform.y + LEVEL.PLATFORM_HEIGHT;

            if (x >= platformLeft && x <= platformRight) {
                if (y >= platform.y && y <= platformTop + 0.3) {
                    return { grounded: true, groundY: platformTop };
                }
            }
        }
        return { grounded: false, groundY: null };
    }, []);

    useFrame((_, delta) => {
        if (isPaused || !boss || boss.isDead) return;
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH
        )
            return;
        if (
            gamePhase !== GAME_PHASES.BOSS_FIGHT &&
            gamePhase !== GAME_PHASES.PLAYING
        )
            return;

        const dt = Math.min(delta, 0.1);

        let { x, y, z } = boss.position;
        let velX = boss.velocity?.x || 0;
        let velY = boss.velocity?.y || 0;
        let {
            facingRight,
            state,
            aimTimer,
            shootCooldown,
            shieldCooldown,
            jumpCooldown,
            isShielding,
            isGrounded,
            patrolBounds,
        } = boss;

        // Death check
        if (y < WORLD.DEATH_Y) {
            killEnemy(boss.id);
            return;
        }

        // Decrement cooldowns
        shootCooldown = Math.max(0, shootCooldown - dt);
        shieldCooldown = Math.max(0, shieldCooldown - dt);
        jumpCooldown = Math.max(0, jumpCooldown - dt);
        decisionTimerRef.current += dt;
        idleTimerRef.current += dt;

        const { dx, dy, distance } = getDistanceToPlayer({ x, y });
        const incomingProjectile = checkIncomingProjectiles({ x, y });

        // Direzione verso il player
        const playerIsRight = dx > 0;

        // ===========================================
        // PRE-CUTSCENE: IDLE BEHAVIOR (fermo, guarda player)
        // ===========================================
        if (gamePhase === GAME_PHASES.PLAYING) {
            state = 'IDLE';
            velX = 0;

            // Gestione look away
            lookAwayTimerRef.current += dt;

            if (isLookingAwayRef.current) {
                // Sta guardando dall'altra parte per 1 secondo
                facingRight = !playerIsRight;

                if (lookAwayTimerRef.current >= 1.0) {
                    // Torna a guardare il player
                    isLookingAwayRef.current = false;
                    lookAwayTimerRef.current = 0;
                }
            } else {
                // Guarda il player
                facingRight = playerIsRight;

                // Ogni 2-3 secondi, gira la testa
                if (lookAwayTimerRef.current >= 2.5 + Math.random() * 0.5) {
                    isLookingAwayRef.current = true;
                    lookAwayTimerRef.current = 0;
                }
            }

            // Detect player
            if (
                distance < BOSS.DETECTION_RANGE &&
                !bossCutsceneTriggeredRef.current
            ) {
                // Il boss vede il player solo se lo sta guardando
                if (facingRight === playerIsRight) {
                    bossCutsceneTriggeredRef.current = true;
                    triggerBossCutscene({ x, y, z });
                    state = BOSS_STATES.ALERT;
                    velX = 0;
                }
            }
        }

        // ===========================================
        // BOSS FIGHT: ACTIVE COMBAT
        // ===========================================
        if (gamePhase === GAME_PHASES.BOSS_FIGHT) {
            facingRight = dx > 0;

            // Shield
            if (
                incomingProjectile &&
                shieldCooldown <= 0 &&
                !isShielding &&
                isGrounded
            ) {
                state = BOSS_STATES.SHIELD;
                isShielding = true;
                shieldCooldown = BOSS.SHIELD_COOLDOWN;
            }

            if (isShielding) {
                if (
                    shieldCooldown >
                    BOSS.SHIELD_COOLDOWN - BOSS.SHIELD_DURATION
                ) {
                    velX = 0;
                } else {
                    isShielding = false;
                    state = BOSS_STATES.CHASE;
                }
            }

            // Jump
            if (!isShielding && jumpCooldown <= 0 && isGrounded) {
                const shouldJump =
                    (dy > 2 && distance < 10) ||
                    (incomingProjectile && Math.random() > 0.7);

                if (shouldJump) {
                    velY = BOSS.JUMP_FORCE;
                    jumpCooldown = BOSS.JUMP_COOLDOWN;
                    isGrounded = false;
                    state = BOSS_STATES.JUMP;
                }
            }

            // Attack (anche in aria)
            if (!isShielding) {
                if (
                    distance <= BOSS.ATTACK_RANGE &&
                    distance > BOSS.OPTIMAL_DISTANCE * 0.3
                ) {
                    if (state !== BOSS_STATES.JUMP) {
                        state = BOSS_STATES.ATTACK;
                    }

                    if (shootCooldown <= 0) {
                        aimTimer += dt;
                    }

                    if (aimTimer >= BOSS.AIM_TIME && shootCooldown <= 0) {
                        shootCooldown = BOSS.SHOOT_COOLDOWN;
                        aimTimer = 0;

                        const shootDirX = dx > 0 ? 1 : -1;
                        const shootDirY =
                            Math.abs(dy) > 1 ? (dy > 0 ? 0.3 : -0.3) : 0;

                        spawnProjectile({
                            position: {
                                x: x + (facingRight ? 0.8 : -0.8),
                                y: y + 1.0,
                                z: 0,
                            },
                            velocity: {
                                x: shootDirX,
                                y: shootDirY,
                            },
                            isPlayerProjectile: false,
                            lifetime: 0,
                        });
                    }
                } else if (state !== BOSS_STATES.JUMP) {
                    state = BOSS_STATES.CHASE;
                    aimTimer = 0;

                    if (distance > BOSS.OPTIMAL_DISTANCE) {
                        velX = facingRight
                            ? BOSS.CHASE_SPEED
                            : -BOSS.CHASE_SPEED;
                    } else if (distance < BOSS.OPTIMAL_DISTANCE * 0.3) {
                        velX = facingRight ? -BOSS.MOVE_SPEED : BOSS.MOVE_SPEED;
                    } else {
                        if (decisionTimerRef.current > 0.5) {
                            decisionTimerRef.current = 0;
                            velX = (Math.random() - 0.5) * BOSS.MOVE_SPEED;
                        }
                    }
                }
            }

            // Air control
            if (state === BOSS_STATES.JUMP && !isShielding) {
                if (Math.abs(dx) > 1) {
                    velX =
                        dx > 0
                            ? BOSS.CHASE_SPEED * 0.7
                            : -BOSS.CHASE_SPEED * 0.7;
                }
            }

            x += velX * dt;
            x = Math.max(
                WORLD.LEVEL_START_X + 2,
                Math.min(x, WORLD.LEVEL_END_X - 2),
            );
        }

        // Physics
        if (!isGrounded) {
            velY -= BOSS.GRAVITY * dt;
            velY = Math.max(velY, -20);
        }

        y += velY * dt;

        const groundCheck = isOnPlatform(x, y);
        if (groundCheck.grounded && velY <= 0) {
            y = groundCheck.groundY;
            velY = 0;
            isGrounded = true;
            if (state === BOSS_STATES.JUMP) {
                state = BOSS_STATES.CHASE;
            }
        } else if (!groundCheck.grounded) {
            isGrounded = false;
        }

        updateEnemy(boss.id, {
            position: { x, y, z },
            velocity: { x: velX, y: velY },
            facingRight,
            state,
            aimTimer,
            shootCooldown,
            shieldCooldown,
            jumpCooldown,
            isShielding,
            isGrounded,
        });
    });
}
