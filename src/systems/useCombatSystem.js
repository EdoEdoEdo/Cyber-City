/**
 * Combat System
 * Handles projectile updates, collision detection, and damage
 */

import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectProjectiles,
    selectPlayer,
    selectAliveEnemies,
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

export function useCombatSystem() {
    const projectiles = useGameStore(selectProjectiles);
    const player = useGameStore(selectPlayer);
    const enemies = useGameStore(selectAliveEnemies);
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);

    const updateProjectile = useGameStore((state) => state.updateProjectile);
    const removeProjectile = useGameStore((state) => state.removeProjectile);
    const damagePlayer = useGameStore((state) => state.damagePlayer);
    const damageEnemy = useGameStore((state) => state.damageEnemy);

    useFrame((_, delta) => {
        if (isPaused) return;
        if (gamePhase === GAME_PHASES.CUTSCENE) return;

        const dt = Math.min(delta, 0.1);

        projectiles.forEach((projectile) => {
            let { x, y, z } = projectile.position;
            const { x: dirX, y: dirY } = projectile.velocity;

            // Update position
            x += dirX * PROJECTILE.SPEED * dt;
            y += dirY * PROJECTILE.SPEED * dt;

            // Update lifetime
            const lifetime = projectile.lifetime + dt;

            // Remove if too old
            if (lifetime > PROJECTILE.LIFETIME) {
                removeProjectile(projectile.id);
                return;
            }

            // -----------------------------------------
            // COLLISION DETECTION
            // -----------------------------------------

            if (projectile.isPlayerProjectile) {
                // Player projectile - check collision with enemies
                for (const enemy of enemies) {
                    // Check if enemy is shielding
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
                            // Projectile blocked by enemy shield
                            removeProjectile(projectile.id);
                            return;
                        }
                    }

                    // Check collision with enemy body
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
                        // Damage enemy (shield check is in damageEnemy)
                        damageEnemy(enemy.id, HEALTH.PLAYER_DAMAGE);
                        removeProjectile(projectile.id);
                        return;
                    }
                }
            } else {
                // Enemy projectile - check collision with player
                if (!player.isDead) {
                    // Check if player shield blocks
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
                            // Projectile blocked by player shield
                            removeProjectile(projectile.id);
                            return;
                        }
                    }

                    // Check collision with player body
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
                        // Damage player (not instant kill anymore)
                        if (!player.isShielding) {
                            damagePlayer(HEALTH.BOSS_DAMAGE);
                        }
                        removeProjectile(projectile.id);
                        return;
                    }
                }
            }

            // Update projectile position
            updateProjectile(projectile.id, {
                position: { x, y, z },
                lifetime,
            });
        });
    });
}

// ===========================================
// COLLISION UTILITIES
// ===========================================

function checkCollision(pos1, size1, pos2, size2) {
    // AABB collision detection
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

// ===========================================
// HIT DETECTION UTILITY (for external use)
// ===========================================

export function checkPlayerEnemyCollision(playerPos, enemyPos) {
    return checkCollision(
        playerPos,
        { width: PLAYER.WIDTH, height: PLAYER.HEIGHT },
        enemyPos,
        { width: ENEMY.WIDTH, height: ENEMY.HEIGHT },
    );
}
