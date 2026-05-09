/**
 * Combat System
 * Handles projectile updates, collision detection, and damage.
 *
 * Projectiles live in a mutable pool (systems/projectilePool.js); this
 * system advances them, runs collisions and despawns expired ones without
 * touching the Zustand store on every frame.
 */

import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIsPaused,
    selectGamePhase,
} from '../store/gameStore';
import {
    PROJECTILE,
    PLAYER,
    ENEMY,
    HEALTH,
    GAME_PHASES,
} from '../constants/gameplayConstants';
import { tickProjectiles, forEachActive } from './projectilePool';
import { spawnSparks } from './particlePool';
import {
    spawnPickup,
    tickPickups,
    forEachPickup,
    despawnPickup,
    PICKUP_RADIUS_VALUE,
} from './pickupPool';
import { getTimeScale } from './timeScale';

export function useCombatSystem() {
    // Subscribe ONLY to gating state. player/enemies are read via
    // getState() inside the frame loop — they change every frame so
    // subscribing would cause GameSystems to re-render at 60 fps.
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);

    const damagePlayer = useGameStore((state) => state.damagePlayer);
    const damageEnemy = useGameStore((state) => state.damageEnemy);
    const refillShield = useGameStore((state) => state.refillShield);

    useFrame((_, delta) => {
        if (isPaused) return;
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH ||
            gamePhase === GAME_PHASES.GAME_OVER ||
            gamePhase === GAME_PHASES.VICTORY ||
            gamePhase === GAME_PHASES.OUTRO
        )
            return;

        const state = useGameStore.getState();
        const player = state.player;
        // Filter alive enemies inline (avoids selectAliveEnemies allocating
        // a fresh array every Zustand notification — here we only allocate
        // one array per frame, scoped to this useFrame).
        const enemies = state.enemies.filter((e) => !e.isDead);

        const dt = Math.min(delta, 0.1) * getTimeScale();

        // 1) Move every active projectile + auto-despawn by lifetime.
        const expiredEnemyShots = [];
        tickProjectiles(dt, (slot) => {
            // Lifetime-expired enemy projectile -> chance to drop a pickup
            if (!slot.isPlayerProjectile) {
                expiredEnemyShots.push({
                    x: slot.position.x,
                    y: slot.position.y,
                });
            }
        });
        for (const p of expiredEnemyShots) {
            if (Math.random() < 0.25) {
                spawnPickup({
                    position: { x: p.x, y: p.y, z: 0 },
                    type: 'shield',
                });
            }
        }

        // 1b) Pickups physics + collection
        tickPickups(dt);
        forEachPickup((p) => {
            const dx = p.position.x - player.position.x;
            const dy = p.position.y - (player.position.y + 0.9);
            if (
                dx * dx + dy * dy <=
                PICKUP_RADIUS_VALUE * PICKUP_RADIUS_VALUE * 4
            ) {
                refillShield();
                spawnSparks(p.position, 8, 1, 3);
                despawnPickup(p);
            }
        });

        // 2) Collision pass.
        forEachActive((slot) => {
            const { x, y } = slot.position;

            if (slot.isPlayerProjectile) {
                for (const enemy of enemies) {
                    if (enemy.isShielding) {
                        const projectileFromRight = x > enemy.position.x;
                        const shieldBlocks =
                            enemy.facingRight === projectileFromRight;

                        if (
                            shieldBlocks &&
                            checkCollision(
                                { x, y },
                                {
                                    width: PROJECTILE.WIDTH,
                                    height: PROJECTILE.HEIGHT,
                                },
                                {
                                    x:
                                        enemy.position.x +
                                        (enemy.facingRight ? 0.8 : -0.8),
                                    y: enemy.position.y + 1,
                                },
                                { width: 1.2, height: 1.8 },
                            )
                        ) {
                            spawnSparks({ x, y }, 6, 0, 5);
                            slot.active = false;
                            return;
                        }
                    }

                    if (
                        checkCollision(
                            { x, y },
                            {
                                width: PROJECTILE.WIDTH,
                                height: PROJECTILE.HEIGHT,
                            },
                            enemy.position,
                            { width: ENEMY.WIDTH, height: ENEMY.HEIGHT },
                        )
                    ) {
                        damageEnemy(enemy.id, HEALTH.PLAYER_DAMAGE);
                        spawnSparks({ x, y }, 12, 0, 6);
                        slot.active = false;
                        return;
                    }
                }
            } else {
                if (player.isDead) return;

                if (player.isShielding) {
                    const projectileFromRight = x > player.position.x;
                    const shieldBlocks =
                        player.facingRight === projectileFromRight;

                    if (
                        shieldBlocks &&
                        checkCollision(
                            { x, y },
                            {
                                width: PROJECTILE.WIDTH,
                                height: PROJECTILE.HEIGHT,
                            },
                            {
                                x:
                                    player.position.x +
                                    (player.facingRight ? 0.8 : -0.8),
                                y: player.position.y + 0.9,
                            },
                            { width: 1.2, height: 1.8 },
                        )
                    ) {
                        spawnSparks({ x, y }, 8, 1, 5);
                        // Shielded enemy shots have a higher pickup drop chance
                        if (Math.random() < 0.45) {
                            spawnPickup({
                                position: { x, y, z: 0 },
                                velocity: {
                                    x: (Math.random() - 0.5) * 2,
                                    y: 4,
                                },
                                type: 'shield',
                            });
                        }
                        slot.active = false;
                        return;
                    }
                }

                if (
                    checkCollision(
                        { x, y },
                        {
                            width: PROJECTILE.WIDTH,
                            height: PROJECTILE.HEIGHT,
                        },
                        player.position,
                        { width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
                    )
                ) {
                    if (!player.isShielding && !player.isInvulnerable) {
                        damagePlayer(HEALTH.BOSS_DAMAGE);
                        spawnSparks({ x, y }, 10, 1, 5);
                    } else {
                        // Dodged via i-frames
                        spawnSparks({ x, y }, 6, 2, 4);
                    }
                    slot.active = false;
                }
            }
        });
    });
}

function checkCollision(pos1, size1, pos2, size2) {
    const halfWidth1 = size1.width / 2;
    const halfWidth2 = size2.width / 2;

    const left1 = pos1.x - halfWidth1;
    const right1 = pos1.x + halfWidth1;
    const bottom1 = pos1.y;
    const top1 = pos1.y + size1.height;

    const left2 = pos2.x - halfWidth2;
    const right2 = pos2.x + halfWidth2;
    const bottom2 = pos2.y;
    const top2 = pos2.y + size2.height;

    return left1 < right2 && right1 > left2 && bottom1 < top2 && top1 > bottom2;
}

export function checkPlayerEnemyCollision(playerPos, enemyPos) {
    return checkCollision(
        playerPos,
        { width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
        enemyPos,
        { width: ENEMY.WIDTH, height: ENEMY.HEIGHT },
    );
}
