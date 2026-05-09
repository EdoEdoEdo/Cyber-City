/**
 * Device capability detection.
 * Returns a coarse tier ('low' | 'mid' | 'high') used to scale visual effects.
 */

let cachedTier = null;

function detectTier() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return 'high';
    }

    const ua = navigator.userAgent || '';
    const isMobile =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

    const cores =
        typeof navigator.hardwareConcurrency === 'number'
            ? navigator.hardwareConcurrency
            : 4;
    const memory =
        typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
    const dpr = window.devicePixelRatio || 1;

    // Low: phone with few cores or low memory
    if (isMobile && (cores <= 4 || memory <= 2)) return 'low';

    // Mid: any mobile, or weak desktop
    if (isMobile || cores <= 4 || memory <= 4) return 'mid';

    // High: desktop with plenty of resources
    if (cores >= 8 && memory >= 8 && dpr <= 2) return 'high';

    return 'mid';
}

export function getDeviceTier() {
    if (cachedTier === null) cachedTier = detectTier();
    return cachedTier;
}

export function getRainCount() {
    const tier = getDeviceTier();
    if (tier === 'low') return 150;
    if (tier === 'mid') return 350;
    return 600;
}

export function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return (
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
    );
}
