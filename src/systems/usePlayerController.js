/**
 * Player Controller System
 * Handles all player movement, physics, and input processing
 */

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
    useGameStore,
    selectIsPaused,
    selectGamePhase,
} from '../store/gameStore';
import {
    PLAYER,
    WORLD,
    LEVEL,
    GAME_PHASES,
} from '../constants/gameplayConstants';
import { getTimeScale } from './timeScale';

export function usePlayerController() {
    // Subscribe ONLY to gating state. player/input are read via getState()
    // inside the frame loop — they change every frame so subscribing would
    // re-render GameSystems at 60 fps.
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
    const shootingTimerRef = useRef(0);
    const dashTimerRef = useRef(0);
    const dashCooldownRef = useRef(0);
    const dashIFrameRef = useRef(0);
    const dashDirRef = useRef(1);

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
            gamePhase === GAME_PHASES.VICTORY ||
            gamePhase === GAME_PHASES.GAME_OVER ||
            gamePhase === GAME_PHASES.INTRO ||
            gamePhase === GAME_PHASES.OUTRO
        )
            return;

        const storeState = useGameStore.getState();
        const player = storeState.player;
        const input = storeState.input;
        if (player.isDead) return;

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

        // Apply the global time scale (slow-mo / freeze frame) to gameplay.
        // The timer itself is advanced by useCameraFollow so it keeps ticking
        // even after we early-return on VICTORY / BOSS_DEATH.
        const ts = getTimeScale();
        const sdt = dt * ts; // scaled dt for gameplay physics

        let { x, y, z } = player.position;
        let { x: velX, y: velY } = player.velocity;
        let { isGrounded, facingRight, isShielding } = player;

        // -----------------------------------------
        // CONSUME SINGLE-PRESS INPUTS
        // -----------------------------------------
        const jumpPressed = input.jumpPressed;
        const shootPressed = input.shootPressed;
        const shieldPressed = input.shieldPressed;
        const dashPressed = input.dashPressed;

        if (jumpPressed) setInput({ jumpPressed: false });
        if (shootPressed) setInput({ shootPressed: false });
        if (shieldPressed) setInput({ shieldPressed: false });
        if (dashPressed) setInput({ dashPressed: false });

        // -----------------------------------------
        // DASH
        // -----------------------------------------
        // Dash overrides horizontal movement, suppresses gravity briefly and
        // grants i-frames. Cooldown gates spam.
        dashCooldownRef.current = Math.max(0, dashCooldownRef.current - dt);
        if (dashIFrameRef.current > 0) {
            dashIFrameRef.current = Math.max(0, dashIFrameRef.current - dt);
        }
        if (
            dashPressed &&
            dashCooldownRef.current <= 0 &&
            dashTimerRef.current <= 0 &&
            !isShielding
        ) {
            dashTimerRef.current = PLAYER.DASH_DURATION;
            dashCooldownRef.current = PLAYER.DASH_COOLDOWN;
            dashIFrameRef.current = PLAYER.DASH_IFRAMES;
            // Direction: input wins, otherwise facing
            if (input.left) dashDirRef.current = -1;
            else if (input.right) dashDirRef.current = 1;
            else dashDirRef.current = facingRight ? 1 : -1;
            facingRight = dashDirRef.current > 0;
        }

        const isDashing = dashTimerRef.current > 0;
        if (isDashing) {
            dashTimerRef.current = Math.max(0, dashTimerRef.current - dt);
            velX = dashDirRef.current * PLAYER.DASH_SPEED;
            velY = 0; // float through the dash
        }

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

        // Dash overrides every other horizontal input
        if (isDashing) {
            velX = dashDirRef.current * PLAYER.DASH_SPEED;
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

        if (!isGrounded && !isDashing) {
            velY -= PLAYER.GRAVITY * dt;
            velY = Math.max(velY, -PLAYER.MAX_FALL_SPEED);
        }

        // -----------------------------------------
        // APPLY MOVEMENT
        // -----------------------------------------

        x += velX * sdt;
        y += velY * sdt;

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

        // Decrement muzzle-flash timer; clear isShooting when expired.
        // (Replaces the previous setTimeout inside useFrame, which leaked
        // timers on unmount/pause and bypassed the dt-driven loop.)
        let nextIsShooting = player.isShooting;
        if (shootingTimerRef.current > 0) {
            shootingTimerRef.current = Math.max(
                0,
                shootingTimerRef.current - dt,
            );
            if (shootingTimerRef.current === 0 && nextIsShooting) {
                nextIsShooting = false;
                updatePlayer({ isShooting: false });
            }
        }

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

            shootingTimerRef.current = 0.1; // 100ms muzzle flash
            if (!nextIsShooting) {
                updatePlayer({ isShooting: true });
            }
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
            isDashing,
            isInvulnerable: dashIFrameRef.current > 0,
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
