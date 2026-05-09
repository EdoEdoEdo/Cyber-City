/**
 * Pickup Pool
 *
 * Floating pickup orbs (shield refill) dropped by destroyed projectiles.
 * Stays in the same singleton/mutable-pool style as projectiles & sparks
 * to keep the React tree quiet during heavy combat.
 */

const POOL_SIZE = 12;
const LIFETIME = 6; // disappear after 6s if not collected
const GRAVITY = 5;
const PICKUP_RADIUS = 0.45;

const slots = new Array(POOL_SIZE).fill(null).map((_, i) => ({
    id: i,
    active: false,
    grounded: false,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0 },
    age: 0,
    type: 'shield', // future: health, ammo, ...
}));

let nextHint = 0;

export function spawnPickup({ position, velocity, type = 'shield' }) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const idx = (nextHint + i) % POOL_SIZE;
        const s = slots[idx];
        if (!s.active) {
            s.active = true;
            s.grounded = false;
            s.position.x = position.x;
            s.position.y = position.y;
            s.position.z = position.z || 0;
            s.velocity.x = velocity?.x ?? (Math.random() - 0.5) * 2;
            s.velocity.y = velocity?.y ?? 4 + Math.random() * 2;
            s.age = 0;
            s.type = type;
            nextHint = (idx + 1) % POOL_SIZE;
            return s;
        }
    }
    return null;
}

export function tickPickups(dt, groundY = 0.4) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const s = slots[i];
        if (!s.active) continue;
        s.age += dt;
        if (s.age >= LIFETIME) {
            s.active = false;
            continue;
        }
        if (!s.grounded) {
            s.position.x += s.velocity.x * dt;
            s.position.y += s.velocity.y * dt;
            s.velocity.y -= GRAVITY * dt;
            if (s.position.y <= groundY) {
                s.position.y = groundY;
                s.grounded = true;
                s.velocity.x = 0;
                s.velocity.y = 0;
            }
        }
    }
}

export function forEachPickup(cb) {
    for (let i = 0; i < POOL_SIZE; i++) {
        if (slots[i].active) cb(slots[i]);
    }
}

export function despawnPickup(slot) {
    if (slot) slot.active = false;
}

export function getPickupSlots() {
    return slots;
}

export function clearPickups() {
    for (let i = 0; i < POOL_SIZE; i++) slots[i].active = false;
    nextHint = 0;
}

export const PICKUP_POOL_SIZE = POOL_SIZE;
export const PICKUP_RADIUS_VALUE = PICKUP_RADIUS;
