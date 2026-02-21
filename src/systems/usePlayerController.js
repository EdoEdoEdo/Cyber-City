/**
 * Player Controller System
 * Handles all player movement, physics, and input processing
 */

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectPlayer,
    selectInput,
    selectIsPaused,
    selectGamePhase,
} from '../store/gameStore';
import {
    PLAYER,
    WORLD,
    LEVEL,
    GAME_PHASES,
} from '../constants/gameplayConstants';

export function usePlayerController() {
    const player = useGameStore(selectPlayer);
    const input = useGameStore(selectInput);
    const isPaused = useGameStore(selectIsPaused);
    const gamePhase = useGameStore(selectGamePhase);
    const updatePlayer = useGameStore((state) => state.updatePlayer);
    const setInput = useGameStore((state) => state.setInput);
    const killPlayer = useGameStore((state) => state.killPlayer);
    const spawnProjectile = useGameStore((state) => state.spawnProjectile);

    // Refs for state that shouldn't trigger re-renders
    const coyoteTimeRef = useRef(0);
    const jumpBufferRef = useRef(0);
    const shootCooldownRef = useRef(0);
    const shieldCooldownRef = useRef(0);
    const shieldActiveTimeRef = useRef(0);
    const wasGroundedRef = useRef(false);

    // Get platform under position
    const getPlatformAtPosition = useCallback((x, y) => {
        for (const platform of LEVEL.PLATFORMS) {
            const halfWidth = platform.width / 2;
            const platformLeft = platform.x - halfWidth;
            const platformRight = platform.x + halfWidth;
            const platformTop = platform.y + LEVEL.PLATFORM_HEIGHT;

            if (x >= platformLeft && x <= platformRight) {
                if (y >= platform.y && y <= platformTop + 0.5) {
                    return platform;
                }
            }
        }
        return null;
    }, []);

    // Check if player is on ground
    const checkGrounded = useCallback(
        (x, y, velY) => {
            if (velY > 0.1) return { grounded: false, groundY: null };

            const platform = getPlatformAtPosition(x, y);
            if (platform) {
                const platformTop = platform.y + LEVEL.PLATFORM_HEIGHT;
                if (y <= platformTop + 0.3 && y >= platform.y - 0.5) {
                    return { grounded: true, groundY: platformTop };
                }
            }

            return { grounded: false, groundY: null };
        },
        [getPlatformAtPosition],
    );

    // Main update loop
    useFrame((_, delta) => {
        if (
            isPaused ||
            player.isDead ||
            gamePhase === GAME_PHASES.VICTORY ||
            gamePhase === GAME_PHASES.GAME_OVER ||
            gamePhase === GAME_PHASES.INTRO
        )
            return;

        // ========================================
        // BLOCK CONTROLS DURING CUTSCENE OR BOSS_DEATH
        // ========================================
        if (
            gamePhase === GAME_PHASES.CUTSCENE ||
            gamePhase === GAME_PHASES.BOSS_DEATH
        ) {
            // Player stands still during cutscene
            updatePlayer({
                velocity: { x: 0, y: 0 },
            });
            return;
        }

        const dt = Math.min(delta, 0.1);

        let { x, y, z } = player.position;
        let { x: velX, y: velY } = player.velocity;
        let { isGrounded, facingRight, isShielding } = player;

        // -----------------------------------------
        // CONSUME SINGLE-PRESS INPUTS
        // -----------------------------------------
        const jumpPressed = input.jumpPressed;
        const shootPressed = input.shootPressed;
        const shieldPressed = input.shieldPressed;

        if (jumpPressed) setInput({ jumpPressed: false });
        if (shootPressed) setInput({ shootPressed: false });
        if (shieldPressed) setInput({ shieldPressed: false });

        // -----------------------------------------
        // HORIZONTAL MOVEMENT
        // -----------------------------------------

        let targetVelX = 0;

        if (input.left) {
            targetVelX = -PLAYER.MOVE_SPEED;
            facingRight = false;
        }
        if (input.right) {
            targetVelX = PLAYER.MOVE_SPEED;
            facingRight = true;
        }

        const accelRate = isGrounded
            ? PLAYER.ACCELERATION
            : PLAYER.ACCELERATION * PLAYER.AIR_CONTROL;
        const decelRate = isGrounded
            ? PLAYER.DECELERATION
            : PLAYER.DECELERATION * PLAYER.AIR_CONTROL;

        if (targetVelX !== 0) {
            velX = moveTowards(velX, targetVelX, accelRate * dt);
        } else {
            velX = moveTowards(velX, 0, decelRate * dt);
        }

        // -----------------------------------------
        // COYOTE TIME & JUMP BUFFER
        // -----------------------------------------

        if (isGrounded) {
            coyoteTimeRef.current = PLAYER.COYOTE_TIME;
        } else {
            coyoteTimeRef.current = Math.max(0, coyoteTimeRef.current - dt);
        }

        if (jumpPressed) {
            jumpBufferRef.current = PLAYER.JUMP_BUFFER;
        } else {
            jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dt);
        }

        // -----------------------------------------
        // JUMPING
        // -----------------------------------------

        const canJump = coyoteTimeRef.current > 0 || isGrounded;
        const wantsJump = jumpPressed || jumpBufferRef.current > 0;

        if (wantsJump && canJump) {
            velY = PLAYER.JUMP_FORCE;
            coyoteTimeRef.current = 0;
            jumpBufferRef.current = 0;
        }

        // -----------------------------------------
        // GRAVITY
        // -----------------------------------------

        if (!isGrounded) {
            velY -= PLAYER.GRAVITY * dt;
            velY = Math.max(velY, -PLAYER.MAX_FALL_SPEED);
        }

        // -----------------------------------------
        // APPLY MOVEMENT
        // -----------------------------------------

        x += velX * dt;
        y += velY * dt;

        // -----------------------------------------
        // GROUND COLLISION
        // -----------------------------------------

        const groundCheck = checkGrounded(x, y, velY);

        if (groundCheck.grounded) {
            y = groundCheck.groundY;
            velY = 0;
            isGrounded = true;
        } else {
            isGrounded = false;
        }

        wasGroundedRef.current = isGrounded;

        // -----------------------------------------
        // WORLD BOUNDS
        // -----------------------------------------

        x = Math.max(WORLD.LEVEL_START_X, Math.min(x, WORLD.LEVEL_END_X));

        if (y < WORLD.DEATH_Y) {
            killPlayer();
            return;
        }

        // -----------------------------------------
        // SHOOTING
        // -----------------------------------------

        shootCooldownRef.current = Math.max(0, shootCooldownRef.current - dt);

        if (shootPressed && shootCooldownRef.current <= 0 && !isShielding) {
            shootCooldownRef.current = PLAYER.SHOOT_COOLDOWN;

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
                isPlayerProjectile: true,
                lifetime: 0,
            });

            updatePlayer({ isShooting: true });
            setTimeout(() => updatePlayer({ isShooting: false }), 100);
        }

        // -----------------------------------------
        // SHIELD
        // -----------------------------------------

        shieldCooldownRef.current = Math.max(0, shieldCooldownRef.current - dt);

        if (shieldPressed && shieldCooldownRef.current <= 0 && !isShielding) {
            isShielding = true;
            shieldActiveTimeRef.current = 0;
            shieldCooldownRef.current = PLAYER.SHIELD_COOLDOWN;
        }

        if (isShielding) {
            shieldActiveTimeRef.current += dt;

            if (shieldActiveTimeRef.current >= PLAYER.SHIELD_DURATION) {
                isShielding = false;
                shieldActiveTimeRef.current = 0;
            }
        }

        // -----------------------------------------
        // UPDATE STATE
        // -----------------------------------------

        updatePlayer({
            position: { x, y, z },
            velocity: { x: velX, y: velY },
            isGrounded,
            facingRight,
            isShielding,
            shieldCooldown: shieldCooldownRef.current,
        });
    });
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function moveTowards(current, target, maxDelta) {
    if (Math.abs(target - current) <= maxDelta) {
        return target;
    }
    return current + Math.sign(target - current) * maxDelta;
}
