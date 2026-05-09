/**
 * Projectile Pool
 *
 * Object-pool for projectiles. State lives outside the Zustand store to
 * avoid array reallocation and component re-renders on every spawn / move /
 * remove. Systems mutate slots in place; the renderer reads them in useFrame.
 *
 * Why not Zustand?
 *  - Spawn/remove/update each frame would clone arrays and re-render every
 *    consumer; with 10+ projectiles in flight this is the largest source of
 *    GC pressure in the loop.
 *  - Positions are continuous data: re-rendering React on each tick is the
 *    wrong tool.
 *
 * The Zustand store still exposes a `projectilesVersion` counter so React
 * components can know when to re-mount projectile sub-trees on respawn /
 * reset. Position updates do NOT bump the version.
 */

import { PROJECTILE } from '../constants/gameplayConstants';

const POOL_SIZE = 64;

// Pre-allocate slots. `active=false` means the slot is free.
const slots = new Array(POOL_SIZE).fill(null).map((_, i) => ({
    id: i,
    active: false,
    isPlayerProjectile: false,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0 },
    lifetime: 0,
}));

let nextHint = 0;

// Subscribers notified on every successful spawn (for SFX, screen shake, etc.)
const spawnListeners = new Set();

export function onProjectileSpawn(listener) {
    spawnListeners.add(listener);
    return () => spawnListeners.delete(listener);
}

/** Acquire a free slot and initialize it. Returns the slot or null if full. */
export function spawnProjectile({ position, velocity, isPlayerProjectile }) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const idx = (nextHint + i) % POOL_SIZE;
        const s = slots[idx];
        if (!s.active) {
            s.active = true;
            s.isPlayerProjectile = !!isPlayerProjectile;
            s.position.x = position.x;
            s.position.y = position.y;
            s.position.z = position.z || 0;
            s.velocity.x = velocity.x;
            s.velocity.y = velocity.y;
            s.lifetime = 0;
            nextHint = (idx + 1) % POOL_SIZE;
            spawnListeners.forEach((fn) => fn(s));
            return s;
        }
    }
    // Pool exhausted: silently drop the request. Bullets are ephemeral.
    return null;
}

/** Release a slot. Safe to call on already-inactive slots. */
export function despawnProjectile(slot) {
    if (!slot) return;
    slot.active = false;
}

/** Iterate active slots. Callback receives (slot). */
export function forEachActive(cb) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const s = slots[i];
        if (s.active) cb(s);
    }
}

/** Returns the underlying slot array (read-only intent). */
export function getSlots() {
    return slots;
}

/** Step every active projectile and auto-despawn expired ones. */
export function tickProjectiles(dt, onExpire) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const s = slots[i];
        if (!s.active) continue;
        s.position.x += s.velocity.x * PROJECTILE.SPEED * dt;
        s.position.y += s.velocity.y * PROJECTILE.SPEED * dt;
        s.lifetime += dt;
        if (s.lifetime > PROJECTILE.LIFETIME) {
            s.active = false;
            if (onExpire) onExpire(s);
        }
    }
}

/** Reset the pool (used on game restart). */
export function clearProjectiles() {
    for (let i = 0; i < POOL_SIZE; i++) {
        slots[i].active = false;
    }
    nextHint = 0;
}

export const PROJECTILE_POOL_SIZE = POOL_SIZE;
