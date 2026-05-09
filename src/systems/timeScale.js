/**
 * Time Scale
 *
 * Mutable singleton applying a global time multiplier read by every gameplay
 * useFrame. Used for:
 *  - Freeze frames (scale = 0 for ~50ms on big hits)
 *  - Slow-motion (scale = 0.3 for ~500ms on the boss kill)
 *
 * Each consumer multiplies its delta by `getTimeScale()` at the top of its
 * useFrame callback. Camera shake & UI keep ticking at real time so the
 * effect feels framed rather than juddery.
 */

let current = 1;
let target = 1;
let remaining = 0;

/**
 * Set the time scale for `duration` seconds, then snap back to 1.
 * Stacks: a stronger override (lower scale) takes precedence over a weaker one.
 */
export function setTimeScale(scale, duration) {
    // Always override on freeze frames; for slow-mo, only override if
    // we're not currently in a stronger freeze.
    if (scale < current || remaining <= 0) {
        current = scale;
        target = scale;
        remaining = duration;
    } else if (duration > remaining) {
        remaining = duration;
    }
}

export function tickTimeScale(realDt) {
    if (remaining <= 0) {
        current = 1;
        return;
    }
    remaining -= realDt;
    if (remaining <= 0) {
        current = 1;
        target = 1;
        remaining = 0;
    }
}

export function getTimeScale() {
    return current;
}

export function resetTimeScale() {
    current = 1;
    target = 1;
    remaining = 0;
}

/**
 * Sequence used on a kill: brief freeze frame then deep slow-mo, snap back.
 */
export function triggerKillCam() {
    setTimeScale(0, 0.09); // 90ms freeze
    setTimeout(() => setTimeScale(0.2, 0.7), 90); // then 0.2x for 700ms
}
