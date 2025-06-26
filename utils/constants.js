// Player constants
const MAX_BREATH_RANGE = 20; // Doubled max range
const MIN_BREATH_RANGE = 5; // Increased starting range
const BREATH_INCREASE_PER_FOOD = 2; // Doubled increase per food
const JUMP_COOLDOWN = 2; // seconds
const RUN_DURATION = 3; // seconds
const RUN_COOLDOWN = 10; // seconds
const PLAYER_SPEED = 0.1;
const PLAYER_RUN_SPEED = 0.2;
const PLAYER_MAX_HEALTH = 5;

// Food constants
const FOOD_TYPES = ['garlic', 'onion', 'cheese', 'coffee', 'sandwich'];
const FART_THRESHOLD = 5; // Number of foods to trigger fart mode
const FART_DURATION = 6; // seconds
const FART_RANGE = 5; // Area of effect - increased to approximately 1 inch square in game space

// Zombie constants
const ZOMBIE_SPEED = 0.01;
const ZOMBIE_DAMAGE = 1;
const ZOMBIE_MIN_HEALTH = 1;
const ZOMBIE_MAX_HEALTH = 3;
const ELITE_ZOMBIE_MIN_HEALTH = 4;
const ELITE_ZOMBIE_MAX_HEALTH = 6;
const ELITE_ZOMBIE_CHANCE = 0.2; // 20% chance to spawn an elite zombie
const ZOMBIE_SPEED_INCREASE_INTERVAL = 15000; // 15 seconds
const ZOMBIE_SPEED_INCREASE_FACTOR = 1.1; // 10% speed increase every interval

// Game constants
const FOOD_SPAWN_INTERVAL = 5; // seconds - spawn food more frequently
const SPECIAL_FOOD_TYPE = 'special'; // Special food that resets breath range

export {
    MAX_BREATH_RANGE,
    MIN_BREATH_RANGE,
    BREATH_INCREASE_PER_FOOD,
    JUMP_COOLDOWN,
    RUN_DURATION,
    RUN_COOLDOWN,
    PLAYER_SPEED,
    PLAYER_RUN_SPEED,
    PLAYER_MAX_HEALTH,
    FOOD_TYPES,
    FART_THRESHOLD,
    FART_DURATION,
    FART_RANGE,
    ZOMBIE_SPEED,
    ZOMBIE_DAMAGE,
    ZOMBIE_MIN_HEALTH,
    ZOMBIE_MAX_HEALTH,
    ELITE_ZOMBIE_MIN_HEALTH,
    ELITE_ZOMBIE_MAX_HEALTH,
    ELITE_ZOMBIE_CHANCE,
    ZOMBIE_SPEED_INCREASE_INTERVAL,
    ZOMBIE_SPEED_INCREASE_FACTOR,
    FOOD_SPAWN_INTERVAL,
    SPECIAL_FOOD_TYPE
};