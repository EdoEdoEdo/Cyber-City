/**
 * Enemy AI System
 * Finite State Machine based AI for enemy behavior
 * States: IDLE, PATROL, ALERT, ATTACK, DEAD
 */

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectAliveEnemies,
    selectPlayerPosition,
    selectIsPaused,
    selectGamePhase,
    selectCutscene,
} from '../store/gameStore';
import {
    ENEMY,
    ENEMY_STATES,
    GAME_PHASES,
} from '../constants/gameplayConstants';

export function useEnemyAI() {
    const enemies = useGameStore(selectAliveEnemies);
    const playerPosition = useGameStore(selectPlayerPosition);
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);
    const cutscene = useGameStore(selectCutscene);

    const updateEnemy = useGameStore((state) => state.updateEnemy);
    const spawnProjectile = useGameStore((state) => state.spawnProjectile);
    const triggerBossCutscene = useGameStore(
        (state) => state.triggerBossCutscene,
    );

    // Track if boss cutscene has been triggered
    const bossCutsceneTriggeredRef = useRef(false);

    // Reset trigger when game resets
    useFrame(() => {
        if (
            gamePhase === GAME_PHASES.PLAYING &&
            bossCutsceneTriggeredRef.current
        ) {
            // Check if we're back to initial state (player respawned)
            const boss = enemies.find((e) => e.isBoss);
            if (boss && boss.state === 'PATROL') {
                bossCutsceneTriggeredRef.current = false;
            }
        }
    });

    // Check if player is in detection range
    const canSeePlayer = useCallback(
        (enemyPos, facingRight) => {
            const dx = playerPosition.x - enemyPos.x;
            const dy = playerPosition.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Too far
            if (distance > ENEMY.DETECTION_RANGE) return false;

            // Check facing direction
            const playerIsRight = dx > 0;
            if (facingRight !== playerIsRight) return false;

            // Vertical check (not too high/low)
            if (Math.abs(dy) > 3) return false;

            return true;
        },
        [playerPosition],
    );

    // Check if player is in attack range
    const canAttackPlayer = useCallback(
        (enemyPos) => {
            const dx = playerPosition.x - enemyPos.x;
            const dy = playerPosition.y - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance <= ENEMY.ATTACK_RANGE && Math.abs(dy) < 3;
        },
        [playerPosition],
    );

    // Main AI update loop
    useFrame((_, delta) => {
        if (isPaused) return;

        // During cutscene, enemies don't move
        if (gamePhase === GAME_PHASES.CUTSCENE) return;

        const dt = Math.min(delta, 0.1);

        enemies.forEach((enemy) => {
            if (enemy.isDead) return;

            let { x, y, z } = enemy.position;
            let {
                facingRight,
                state,
                alertTimer,
                aimTimer,
                shootCooldown,
                isBoss,
            } = enemy;
            const { patrolBounds } = enemy;
            let velX = 0;

            // Decrement cooldowns
            shootCooldown = Math.max(0, shootCooldown - dt);

            // ===========================================
            // STATE MACHINE
            // ===========================================

            switch (state) {
                // -----------------------------------------
                case ENEMY_STATES.IDLE:
                    // Just stand still, check for player
                    if (canSeePlayer({ x, y }, facingRight)) {
                        // BOSS: Trigger cutscene instead of going to ALERT
                        if (isBoss && !bossCutsceneTriggeredRef.current) {
                            bossCutsceneTriggeredRef.current = true;
                            triggerBossCutscene({ x, y, z });
                            state = ENEMY_STATES.ALERT;
                            alertTimer = 0;
                            return; // Stop processing this frame
                        }
                        state = ENEMY_STATES.ALERT;
                        alertTimer = 0;
                    } else {
                        // Random chance to start patrolling
                        if (Math.random() < 0.01) {
                            state = ENEMY_STATES.PATROL;
                        }
                    }
                    break;

                // -----------------------------------------
                case ENEMY_STATES.PATROL:
                    // Move back and forth between patrol bounds
                    velX = facingRight
                        ? ENEMY.PATROL_SPEED
                        : -ENEMY.PATROL_SPEED;
                    x += velX * dt;

                    // Turn around at bounds
                    if (x >= patrolBounds.right) {
                        x = patrolBounds.right;
                        facingRight = false;
                    } else if (x <= patrolBounds.left) {
                        x = patrolBounds.left;
                        facingRight = true;
                    }

                    // Check for player
                    if (canSeePlayer({ x, y }, facingRight)) {
                        // BOSS: Trigger cutscene instead of going to ALERT
                        if (isBoss && !bossCutsceneTriggeredRef.current) {
                            bossCutsceneTriggeredRef.current = true;
                            triggerBossCutscene({ x, y, z });
                            state = ENEMY_STATES.ALERT;
                            alertTimer = 0;
                            aimTimer = 0;

                            // Update and return
                            updateEnemy(enemy.id, {
                                position: { x, y, z },
                                velocity: { x: 0, y: 0 },
                                facingRight: playerPosition.x > x,
                                state,
                                alertTimer,
                                aimTimer,
                                shootCooldown,
                            });
                            return;
                        }

                        state = ENEMY_STATES.ALERT;
                        alertTimer = 0;
                        aimTimer = 0;
                    }
                    break;

                // -----------------------------------------
                case ENEMY_STATES.ALERT:
                    // Stop and face player
                    const playerDir = playerPosition.x > x;
                    facingRight = playerDir;

                    alertTimer += dt;

                    // If player still visible and in range, go to attack
                    if (canSeePlayer({ x, y }, facingRight)) {
                        if (canAttackPlayer({ x, y })) {
                            state = ENEMY_STATES.ATTACK;
                            aimTimer = 0;
                        }
                    } else {
                        // Lost sight of player, return to patrol after duration
                        if (alertTimer > ENEMY.ALERT_DURATION) {
                            state = ENEMY_STATES.PATROL;
                            alertTimer = 0;
                        }
                    }
                    break;

                // -----------------------------------------
                case ENEMY_STATES.ATTACK:
                    // Face player
                    facingRight = playerPosition.x > x;

                    // Aim then shoot
                    aimTimer += dt;

                    if (aimTimer >= ENEMY.AIM_TIME && shootCooldown <= 0) {
                        // SHOOT!
                        shootCooldown = ENEMY.SHOOT_COOLDOWN;
                        aimTimer = 0;

                        spawnProjectile({
                            position: {
                                x: x + (facingRight ? 0.8 : -0.8),
                                y: y + 0.9,
                                z: 0,
                            },
                            velocity: {
                                x: facingRight ? 1 : -1,
                                y: 0,
                            },
                            isPlayerProjectile: false,
                            lifetime: 0,
                        });
                    }

                    // If player out of range or hidden, go back to alert
                    if (
                        !canSeePlayer({ x, y }, facingRight) ||
                        !canAttackPlayer({ x, y })
                    ) {
                        state = ENEMY_STATES.ALERT;
                        alertTimer = 0;
                    }
                    break;

                // -----------------------------------------
                case ENEMY_STATES.DEAD:
                    // Do nothing, handled by rendering
                    break;

                default:
                    state = ENEMY_STATES.IDLE;
            }

            // Update enemy state
            updateEnemy(enemy.id, {
                position: { x, y, z },
                velocity: { x: velX, y: 0 },
                facingRight,
                state,
                alertTimer,
                aimTimer,
                shootCooldown,
            });
        });
    });
}

// ===========================================
// INDIVIDUAL ENEMY AI HOOK (for single enemy)
// ===========================================

export function useEnemyBehavior(enemyId) {
    const enemy = useGameStore((state) =>
        state.enemies.find((e) => e.id === enemyId),
    );

    return {
        isAiming:
            enemy?.state === ENEMY_STATES.ATTACK &&
            enemy?.aimTimer < ENEMY.AIM_TIME,
        isShooting:
            enemy?.state === ENEMY_STATES.ATTACK &&
            enemy?.aimTimer >= ENEMY.AIM_TIME,
        isAlert:
            enemy?.state === ENEMY_STATES.ALERT ||
            enemy?.state === ENEMY_STATES.ATTACK,
        isPatrolling: enemy?.state === ENEMY_STATES.PATROL,
        isBoss: enemy?.isBoss || false,
        accentColor: enemy?.accentColor || '#ff3366',
    };
}
