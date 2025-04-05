/**
 * Utility functions for the game
 */

/**
 * Gets a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number between min and max
 */
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Calculates a random position within the game world
 * @param {number} minDistance - Minimum distance from center
 * @param {number} maxDistance - Maximum distance from center
 * @param {number} y - Y position (height)
 * @returns {BABYLON.Vector3} - Random position vector
 */
function getRandomPosition(minDistance = 0, maxDistance = 20, y = 0.5) {
    // Get random angle
    const angle = Math.random() * Math.PI * 2;

    // Get random distance within range
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    // Calculate position using polar coordinates
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    return new BABYLON.Vector3(x, y, z);
}

/**
 * Checks if a position is too close to any obstacles
 * @param {BABYLON.Vector3} position - Position to check
 * @param {Array} obstacles - Array of obstacle meshes
 * @param {number} minDistance - Minimum allowed distance
 * @returns {boolean} - True if position is valid (not too close to obstacles)
 */
function isValidPosition(position, obstacles, minDistance = 2) {
    for (const obstacle of obstacles) {
        const distance = BABYLON.Vector3.Distance(position, obstacle.position);
        if (distance < minDistance) {
            return false;
        }
    }
    return true;
}

/**
 * Limits a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Formats a time in seconds to a string (MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export {
    getRandomNumber,
    getRandomPosition,
    isValidPosition,
    clamp,
    formatTime
};