/**
 * Particle (Sparks) Pool
 *
 * Mutable pool of short-lived 2D sparks. Spawned on projectile impacts /
 * shield blocks / kills. Rendered as a single InstancedMesh by Sparks.jsx.
 *
 * Sparks have only position, velocity, age, color tint and an "alive" flag.
 * Gravity is light so they feel like neon embers rather than physics debris.
 */

const POOL_SIZE = 192;
const LIFETIME = 0.45;
const GRAVITY = 6;

const slots = new Array(POOL_SIZE).fill(null).map((_, i) => ({
    id: i,
    active: false,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0 },
    age: 0,
    lifetime: LIFETIME,
    noGravity: false,
    // 0 = cyan (player hit something), 1 = pink (player got hit), 2 = white
    tint: 0,
    size: 1,
}));

let nextHint = 0;

function acquire() {
    for (let i = 0; i < POOL_SIZE; i++) {
        const idx = (nextHint + i) % POOL_SIZE;
        if (!slots[idx].active) {
            nextHint = (idx + 1) % POOL_SIZE;
            return slots[idx];
        }
    }
    return null;
}

/**
 * Spawn a burst of `count` sparks at `position` with random outward velocities.
 *  - tint: 0 (cyan), 1 (pink), 2 (white)
 *  - speed: base spread velocity in units/sec
 */
export function spawnSparks(position, count = 10, tint = 0, speed = 4) {
    for (let i = 0; i < count; i++) {
        const s = acquire();
        if (!s) return;
        s.active = true;
        s.position.x = position.x;
        s.position.y = position.y;
        s.position.z = position.z || 0;
        const angle = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.8);
        s.velocity.x = Math.cos(angle) * v;
        s.velocity.y = Math.sin(angle) * v + 1.5;
        s.age = 0;
        s.lifetime = LIFETIME;
        s.noGravity = false;
        s.tint = tint;
        s.size = 0.6 + Math.random() * 0.8;
    }
}

/**
 * Spawn one spark on a circle of `radius` around `target`, with velocity
 * pointing inward so it visually converges to the target. Used by the intro
 * for the agent materialization. Gravity is disabled so the path stays clean.
 */
export function spawnConvergingSpark(
    target,
    radius = 3,
    lifetime = 0.55,
    tint = 0,
) {
    const s = acquire();
    if (!s) return;
    const angle = Math.random() * Math.PI * 2;
    const r = radius * (0.6 + Math.random() * 0.6);
    s.active = true;
    s.position.x = target.x + Math.cos(angle) * r;
    s.position.y = target.y + Math.sin(angle) * r;
    s.position.z = target.z || 0;
    // Reach the target a bit before lifetime ends so the spark dies on impact
    const travelTime = lifetime * 0.85;
    s.velocity.x = -Math.cos(angle) * (r / travelTime);
    s.velocity.y = -Math.sin(angle) * (r / travelTime);
    s.age = 0;
    s.lifetime = lifetime;
    s.noGravity = true;
    s.tint = tint;
    s.size = 0.5 + Math.random() * 0.5;
}

/**
 * Spawn one spark AT `origin` with velocity pointing OUTWARD (radially away).
 * Used by the outro for the agent dematerialization — sparks appear on the
 * body and disperse outward, mirror of spawnConvergingSpark.
 */
export function spawnDispersingSpark(
    origin,
    radius = 0.4,
    lifetime = 0.7,
    tint = 0,
) {
    const s = acquire();
    if (!s) return;
    const angle = Math.random() * Math.PI * 2;
    const r = radius * (0.3 + Math.random() * 0.7);
    s.active = true;
    s.position.x = origin.x + Math.cos(angle) * r * 0.3;
    s.position.y = origin.y + Math.sin(angle) * r * 0.3;
    s.position.z = origin.z || 0;
    // Travel outward, dying at lifetime.
    const travelDist = 1.2 + Math.random() * 0.8;
    s.velocity.x = Math.cos(angle) * (travelDist / lifetime);
    s.velocity.y = Math.sin(angle) * (travelDist / lifetime);
    s.age = 0;
    s.lifetime = lifetime;
    s.noGravity = true;
    s.tint = tint;
    s.size = 0.4 + Math.random() * 0.4;
}

export function tickSparks(dt) {
    for (let i = 0; i < POOL_SIZE; i++) {
        const s = slots[i];
        if (!s.active) continue;
        s.age += dt;
        if (s.age >= s.lifetime) {
            s.active = false;
            continue;
        }
        s.position.x += s.velocity.x * dt;
        s.position.y += s.velocity.y * dt;
        if (!s.noGravity) {
            s.velocity.y -= GRAVITY * dt;
            s.velocity.x *= 0.96;
        }
    }
}

export function getSparkSlots() {
    return slots;
}

export function clearSparks() {
    for (let i = 0; i < POOL_SIZE; i++) slots[i].active = false;
    nextHint = 0;
}

export const SPARK_POOL_SIZE = POOL_SIZE;
export const SPARK_LIFETIME = LIFETIME;
