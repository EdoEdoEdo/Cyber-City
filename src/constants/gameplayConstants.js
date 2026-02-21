/**
 * Gameplay Constants
 * Central configuration for all gameplay parameters
 */

// ===========================================
// PLAYER CONSTANTS
// ===========================================

export const PLAYER = {
    MOVE_SPEED: 8,
    ACCELERATION: 25,
    DECELERATION: 20,
    AIR_CONTROL: 0.7,

    JUMP_FORCE: 12,
    GRAVITY: 30,
    MAX_FALL_SPEED: 20,
    COYOTE_TIME: 0.1,
    JUMP_BUFFER: 0.1,

    SHOOT_COOLDOWN: 0.3,
    SHIELD_DURATION: 2,
    SHIELD_COOLDOWN: 3,

    WIDTH: 0.6,
    HEIGHT: 1.8,

    START_X: -12,
    START_Y: 0.5,
    START_Z: 0,
};

// ===========================================
// HEALTH CONSTANTS
// ===========================================

export const HEALTH = {
    PLAYER_MAX: 50,
    BOSS_MAX: 50,
    PLAYER_DAMAGE: 5,
    BOSS_DAMAGE: 10,
};

// ===========================================
// ENEMY CONSTANTS
// ===========================================

export const ENEMY = {
    PATROL_SPEED: 3,

    DETECTION_RANGE: 8,
    ATTACK_RANGE: 12,
    DETECTION_ANGLE: 60,

    AIM_TIME: 0.8,
    SHOOT_COOLDOWN: 1.5,
    ALERT_DURATION: 3,

    WIDTH: 0.6,
    HEIGHT: 1.8,
};

// ===========================================
// BOSS CONSTANTS
// ===========================================

export const BOSS = {
    // Movement
    MOVE_SPEED: 4,
    CHASE_SPEED: 5,
    PATROL_SPEED: 1,
    JUMP_FORCE: 10,
    GRAVITY: 30,

    // Combat ranges
    DETECTION_RANGE: 12,
    ATTACK_RANGE: 12,
    OPTIMAL_DISTANCE: 6,

    // Timings
    AIM_TIME: 0.5,
    SHOOT_COOLDOWN: 1.0,
    SHIELD_DURATION: 1.5,
    SHIELD_COOLDOWN: 4,
    JUMP_COOLDOWN: 2,

    // Dimensions
    WIDTH: 0.8,
    HEIGHT: 2.2,

    // Colors
    ACCENT_IDLE: '#ff6600',
    ACCENT_ALERT: '#ff0033',
    ACCENT_DEATH: '#ffffff',
    BODY_COLOR: '#0a0a0a',
    SHIELD_COLOR: '#ff3366',

    // Cutscene
    CUTSCENE_DURATION: 5.2,
    DEATH_CUTSCENE_DURATION: 5.0, // ← Allungato a 5 secondi
};

// ===========================================
// AI STATE MACHINE
// ===========================================

export const ENEMY_STATES = {
    IDLE: 'IDLE',
    PATROL: 'PATROL',
    ALERT: 'ALERT',
    ATTACK: 'ATTACK',
    DEAD: 'DEAD',
};

export const BOSS_STATES = {
    IDLE: 'IDLE', // ← Nuovo
    PATROL: 'PATROL',
    ALERT: 'ALERT',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    SHIELD: 'SHIELD',
    JUMP: 'JUMP',
    DEAD: 'DEAD',
};

// ===========================================
// PROJECTILE CONSTANTS
// ===========================================

export const PROJECTILE = {
    SPEED: 25,
    WIDTH: 0.3,
    HEIGHT: 0.1,
    LIFETIME: 3,

    PLAYER_COLOR: '#00ffff',
    ENEMY_COLOR: '#ff3366',
};

// ===========================================
// WORLD CONSTANTS
// ===========================================

export const WORLD = {
    LEVEL_START_X: -20,
    LEVEL_END_X: 50,
    GROUND_Y: 0,
    DEATH_Y: -7,

    PARALLAX: {
        FAR_BG: -30,
        MID_BG: -20,
        NEAR_BG: -10,
        GAMEPLAY: 0,
        FOREGROUND: 5,
    },

    PARALLAX_FACTORS: {
        FAR_BG: 0.1,
        MID_BG: 0.3,
        NEAR_BG: 0.6,
    },
};

// ===========================================
// CAMERA CONSTANTS
// ===========================================

export const CAMERA = {
    FOV: 60,
    NEAR: 0.1,
    FAR: 150,
    Z_POSITION: 15,

    FOLLOW_SMOOTHING: 5,
    LOOK_AHEAD: 2,
    VERTICAL_OFFSET: 2,

    MIN_X: -18,
    MAX_X: 45,

    CUTSCENE_ZOOM: 8,
    CUTSCENE_ZOOM_SPEED: 3,
};

// ===========================================
// VISUAL CONSTANTS
// ===========================================

export const COLORS = {
    NEON_CYAN: '#00ffff',
    NEON_PINK: '#ff0080',
    NEON_PURPLE: '#8000ff',
    NEON_BLUE: '#0040ff',

    DARK_BG: '#0a0a12',
    WALKWAY_METAL: '#1a1a24',
    WALKWAY_EDGE: '#2a2a3a',

    PLAYER_BODY: '#0a0a0a',
    PLAYER_ACCENT: '#00ffff',
    ENEMY_BODY: '#1a0a0a',
    ENEMY_ACCENT: '#ff3366',

    SHIELD_COLOR: '#00ffff',
    MUZZLE_FLASH: '#ffffff',
};

// ===========================================
// GAME STATES
// ===========================================

export const GAME_PHASES = {
    LOADING: 'LOADING',
    MENU: 'MENU',
    INTRO: 'INTRO',
    PLAYING: 'PLAYING',
    CUTSCENE: 'CUTSCENE',
    BOSS_FIGHT: 'BOSS_FIGHT',
    BOSS_DEATH: 'BOSS_DEATH',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
};

// ===========================================
// INPUT CONSTANTS
// ===========================================

export const INPUT = {
    KEYS: {
        LEFT: ['ArrowLeft', 'KeyA'],
        RIGHT: ['ArrowRight', 'KeyD'],
        JUMP: ['ArrowUp', 'KeyW', 'Space'],
        SHOOT: ['KeyX', 'KeyJ'],
        SHIELD: ['KeyZ', 'KeyK'],
        PAUSE: ['Escape', 'KeyP'],
    },

    TOUCH: {
        MOVE_ZONE_WIDTH: 0.3,
        ACTION_ZONE_WIDTH: 0.3,
    },
};

// ===========================================
// LEVEL DESIGN CONSTANTS
// ===========================================

export const LEVEL = {
    PLATFORM_HEIGHT: 0.3,
    WALKWAY_WIDTH: 60,

    // Patrol bounds ridotti per idle pre-fight, si espandono durante BOSS_FIGHT
    ENEMY_SPAWNS: [
        { x: 40, y: 0.3, patrolLeft: 34, patrolRight: 36, isBoss: true },
    ],

    PLATFORMS: [
        // Piattaforma base continua
        { x: 18, y: 0, width: 70, type: 'walkway' },

        // Piattaforme sopraelevate
        { x: -7, y: 2.5, width: 4, type: 'floating' },
        { x: 2, y: 3.7, width: 4, type: 'floating' },
        { x: 10, y: 2.6, width: 5, type: 'floating' },
        { x: 20, y: 3.5, width: 4, type: 'floating' },
        { x: 30, y: 2.5, width: 5, type: 'floating' },
        { x: 40, y: 3, width: 3, type: 'floating' },
    ],
};
