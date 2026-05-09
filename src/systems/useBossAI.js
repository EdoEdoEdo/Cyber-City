/**
 * Boss AI System
 * Advanced AI with chase, attack, shield, and jump behaviors
 */

import { useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIsPaused,
    selectGamePhase,
    selectResetKey,
} from '../store/gameStore';
import {
    BOSS,
    BOSS_STATES,
    GAME_PHASES,
    LEVEL,
    WORLD,
} from '../constants/gameplayConstants';
import { forEachActive } from './projectilePool';
import { getTimeScale } from './timeScale';

export function useBossAI() {
    // Subscribe ONLY to gating state.
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

    const getDistanceToPlayer = useCallback((bossPos, playerPosition) => {
        const dx = playerPosition.x - bossPos.x;
        const dy = playerPosition.y - bossPos.y;
        return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
    }, []);

    const checkIncomingProjectiles = useCallback((bossPos) => {
        let incoming = false;
        forEachActive((proj) => {
            if (incoming) return;
            if (!proj.isPlayerProjectile) return;

            const dx = proj.position.x - bossPos.x;
            const dy = proj.position.y - bossPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const isApproaching = proj.velocity.x > 0 ? dx < 0 : dx > 0;
            if (distance < 5 && isApproaching && Math.abs(dy) < 2) {
                incoming = true;
            }
        });
        return incoming;
    }, []);

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
        if (isPaused) return;
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH ||
            gamePhase === GAME_PHASES.OUTRO
        )
            return;
        if (
            gamePhase !== GAME_PHASES.BOSS_FIGHT &&
            gamePhase !== GAME_PHASES.PLAYING
        )
            return;

        const storeState = useGameStore.getState();
        const boss = storeState.enemies.find((e) => e.isBoss);
        if (!boss || boss.isDead) return;
        const playerPosition = storeState.player.position;

        const dt = Math.min(delta, 0.1) * getTimeScale();

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
        let stunTimer = boss.stunTimer || 0;
        let stunResistTimer = boss.stunResistTimer || 0;
        let comboType = boss.comboType || null;
        let comboStep = boss.comboStep || 0;
        let comboTimer = boss.comboTimer || 0;

        // Phase 2 multipliers (kicks in once boss.phase === 2)
        const isPhase2 = boss.phase === 2;
        const speedMult = isPhase2 ? BOSS.PHASE_2_SPEED_MULT : 1;
        const cooldownMult = isPhase2 ? BOSS.PHASE_2_COOLDOWN_MULT : 1;

        // Death check
        if (y < WORLD.DEATH_Y) {
            killEnemy(boss.id);
            return;
        }

        // Decrement cooldowns
        shootCooldown = Math.max(0, shootCooldown - dt);
        shieldCooldown = Math.max(0, shieldCooldown - dt);
        jumpCooldown = Math.max(0, jumpCooldown - dt);
        stunTimer = Math.max(0, stunTimer - dt);
        stunResistTimer = Math.max(0, stunResistTimer - dt);
        comboTimer = Math.max(0, comboTimer - dt);
        decisionTimerRef.current += dt;
        idleTimerRef.current += dt;

        const { dx, dy, distance } = getDistanceToPlayer(
            { x, y },
            playerPosition,
        );
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

            // Hit stun: brief freeze on damage. Skip all combat actions but
            // still apply gravity / position update at the bottom.
            if (stunTimer > 0) {
                velX = 0;
                aimTimer = 0;
                // jump out of all the combat logic
            } else {
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

                        // Pick a combo type when wind-up starts (no combo locked)
                        if (aimTimer > 0 && !comboType) {
                            const r = Math.random();
                            if (isPhase2 && r < 0.4) comboType = 'BURST';
                            else if (r < 0.3) comboType = 'BURST';
                            else if (r < 0.55) comboType = 'DASH_SHOT';
                            else comboType = 'SINGLE';
                            comboStep = 0;
                        }

                        if (
                            aimTimer >= BOSS.AIM_TIME * cooldownMult &&
                            shootCooldown <= 0
                        ) {
                            const shootDirX = dx > 0 ? 1 : -1;
                            const shootDirY =
                                Math.abs(dy) > 1 ? (dy > 0 ? 0.3 : -0.3) : 0;

                            spawnProjectile({
                                position: {
                                    x: x + (facingRight ? 0.8 : -0.8),
                                    y: y + 1.0,
                                    z: 0,
                                },
                                velocity: { x: shootDirX, y: shootDirY },
                                isPlayerProjectile: false,
                                lifetime: 0,
                            });

                            comboStep += 1;

                            if (
                                comboType === 'BURST' &&
                                comboStep < BOSS.COMBO_BURST_SHOTS
                            ) {
                                // Chain quickly: tiny inter-shot cooldown, no full re-aim
                                shootCooldown = BOSS.COMBO_BURST_INTERVAL;
                                aimTimer = BOSS.AIM_TIME * cooldownMult; // keep ready for next chain
                            } else if (
                                comboType === 'DASH_SHOT' &&
                                comboStep < 2
                            ) {
                                // Lunge a step toward the player, then shoot again
                                velX = facingRight
                                    ? BOSS.CHASE_SPEED * speedMult * 1.6
                                    : -BOSS.CHASE_SPEED * speedMult * 1.6;
                                shootCooldown = 0.25;
                                aimTimer = BOSS.AIM_TIME * cooldownMult;
                            } else {
                                // End of combo: regular cooldown
                                shootCooldown =
                                    BOSS.SHOOT_COOLDOWN * cooldownMult;
                                aimTimer = 0;
                                comboType = null;
                                comboStep = 0;
                            }
                        }
                    } else if (state !== BOSS_STATES.JUMP) {
                        state = BOSS_STATES.CHASE;
                        aimTimer = 0;
                        comboType = null;
                        comboStep = 0;

                        if (distance > BOSS.OPTIMAL_DISTANCE) {
                            velX = facingRight
                                ? BOSS.CHASE_SPEED * speedMult
                                : -BOSS.CHASE_SPEED * speedMult;
                        } else if (distance < BOSS.OPTIMAL_DISTANCE * 0.3) {
                            velX = facingRight
                                ? -BOSS.MOVE_SPEED * speedMult
                                : BOSS.MOVE_SPEED * speedMult;
                        } else {
                            if (decisionTimerRef.current > 0.5) {
                                decisionTimerRef.current = 0;
                                velX =
                                    (Math.random() - 0.5) *
                                    BOSS.MOVE_SPEED *
                                    speedMult;
                            }
                        }
                    }
                }

                // Air control
                if (state === BOSS_STATES.JUMP && !isShielding) {
                    if (Math.abs(dx) > 1) {
                        velX =
                            dx > 0
                                ? BOSS.CHASE_SPEED * speedMult * 0.7
                                : -BOSS.CHASE_SPEED * speedMult * 0.7;
                    }
                }
            } // end of !stunTimer branch

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
            stunTimer,
            stunResistTimer,
            comboType,
            comboStep,
            comboTimer,
        });
    });
}
