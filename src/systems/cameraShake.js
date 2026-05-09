/**
 * Camera Shake
 *
 * Mutable singleton driving short-lived camera offsets. Sits outside Zustand
 * to avoid per-frame state updates: useCameraFollow reads the offset every
 * frame, gameplay code triggers shakes imperatively.
 *
 * Active shakes are summed (with falloff) so multiple events overlap nicely.
 */

const shakes = [];

/** Trigger a new shake. */
export function triggerShake(intensity = 0.2, duration = 0.25) {
    shakes.push({
        intensity,
        duration,
        elapsed: 0,
    });
    // Cap to avoid pathological accumulation
    if (shakes.length > 8) shakes.shift();
}

/**
 * Advance shakes and return the current 2D offset to apply to the camera.
 * Caller is expected to invoke this once per frame from useFrame.
 */
const offset = { x: 0, y: 0 };
export function tickShake(dt) {
    offset.x = 0;
    offset.y = 0;
    if (shakes.length === 0) return offset;

    for (let i = shakes.length - 1; i >= 0; i--) {
        const s = shakes[i];
        s.elapsed += dt;
        if (s.elapsed >= s.duration) {
            shakes.splice(i, 1);
            continue;
        }
        // Quadratic falloff: punchy at start, fades smoothly.
        const t = 1 - s.elapsed / s.duration;
        const falloff = t * t;
        const amp = s.intensity * falloff;
        offset.x += (Math.random() * 2 - 1) * amp;
        offset.y += (Math.random() * 2 - 1) * amp;
    }
    return offset;
}

export function clearShakes() {
    shakes.length = 0;
}
