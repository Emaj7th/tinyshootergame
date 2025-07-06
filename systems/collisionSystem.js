import { FART_RANGE } from '../utils/constants.js';

class CollisionSystem {
    constructor(scene, player, zombies = [], foods = [], audioSystem) {
        this.scene = scene; // Store scene reference for zombie kill tracking
        this.player = player;
        this.zombies = zombies;
        this.foods = foods;
        this.audioSystem = audioSystem; // Store the audio system
        this.zombiesToRemove = [];
        this.foodsToRemove = [];
    }

    addZombie(zombie) {
        this.zombies.push(zombie);
    }

    removeZombie(zombie) {
        const index = this.zombies.indexOf(zombie);
        if (index !== -1) {
            this.zombies.splice(index, 1);
        }
    }

    addFood(food) {
        this.foods.push(food);
    }

    removeFood(food) {
        const index = this.foods.indexOf(food);
        if (index !== -1) {
            this.foods.splice(index, 1);
        }
    }

    update() {
        // Reset removal arrays
        this.zombiesToRemove = [];
        this.foodsToRemove = [];

        // Check player-zombie collisions
        this.checkPlayerZombieCollisions();

        // Check breath attack-zombie collisions
        this.checkBreathZombieCollisions();

        // Check fart-zombie collisions
        this.checkFartZombieCollisions();

        // Check player-food collisions
        this.checkPlayerFoodCollisions();

        // Remove zombies and foods that were marked for removal
        this.cleanupEntities();
    }

    checkPlayerZombieCollisions() {
        for (const zombie of this.zombies) {
            if (zombie.isDead || !zombie.mesh || !this.player.mesh) continue;

            try {
                // Calculate distance between zombie and player
                const distance = BABYLON.Vector3.Distance(
                    zombie.mesh.position,
                    this.player.mesh.position
                );

                // Check for collision using distance (more reliable than intersectsMesh)
                const collisionThreshold = 1.5; // Adjust based on mesh sizes

                if (distance < collisionThreshold || zombie.mesh.intersectsMesh(this.player.mesh, false)) {
                    console.log("Zombie collision detected with player! Distance:", distance);

                    // Call takeDamage only once per collision
                    this.player.takeDamage();

                    // Move the zombie away to prevent multiple hits
                    const pushDirection = zombie.mesh.position.subtract(this.player.mesh.position).normalize();
                    zombie.mesh.position.addInPlace(pushDirection.scale(5)); // Increased push distance
                }
            } catch (error) {
                console.error("Error in collision detection:", error);
            }
        }
    }

    checkBreathZombieCollisions() {
        // Check each active breath attack against zombies
        for (const attack of this.player.activeBreathAttacks) {
            if (attack.isDisposed || !attack.mesh) continue;

            for (const zombie of this.zombies) {
                if (zombie.isDead || !zombie.mesh) continue;

                try {
                    // Calculate distance between breath attack and zombie
                    const distance = BABYLON.Vector3.Distance(
                        attack.mesh.position,
                        zombie.mesh.position
                    );

                    // Check for collision using distance - scale based on breath range
                    const collisionThreshold = attack.range ? attack.range / 4 : 3.0; // Adjust based on breath size

                    if (distance < collisionThreshold) {
                        console.log("Breath attack hit zombie! Distance:", distance);
                        zombie.takeDamage(1);

                        if (zombie.health <= 0) {
                            this.zombiesToRemove.push(zombie);
                        }

                        continue; // Skip to next zombie
                    }

                    // Also try the built-in intersection check as a backup
                    if (attack.mesh.intersectsMesh(zombie.mesh, false)) {
                        console.log("Breath attack intersection with zombie!");
                        zombie.takeDamage(1);

                        if (zombie.health <= 0) {
                            this.zombiesToRemove.push(zombie);
                        }
                    }
                } catch (error) {
                    console.error("Error in breath-zombie collision detection:", error);
                }
            }
        }
    }

    checkFartZombieCollisions() {
        // If player is in fart mode, check for zombies in range
        if (this.player.inFartMode) {
            for (const zombie of this.zombies) {
                if (zombie.isDead) continue;

                // Calculate distance between player and zombie
                const distance = BABYLON.Vector3.Distance(
                    this.player.mesh.position,
                    zombie.mesh.position
                );

                // If zombie is within fart range, deal massive damage (instant kill)
                if (distance <= FART_RANGE) {
                    // Fart is powerful enough to kill any zombie instantly
                    zombie.takeDamage(100); // Large damage value to ensure death
                    this.zombiesToRemove.push(zombie);
                }
            }
        }
    }

    checkPlayerFoodCollisions() {
        // CRITICAL: Use the player's mesh position for collision detection, not the sprite position
        // This ensures consistent collision detection even if sprites are temporarily invisible

        for (const food of this.foods) {
            if (!food.mesh || !this.player.mesh || food.isCollected) continue;

            try {
                // Calculate distance between food and player mesh (not sprite)
                const distance = BABYLON.Vector3.Distance(
                    food.mesh.position,
                    this.player.mesh.position
                );

                // Check for collision using distance only
                const collisionThreshold = 2.0;

                if (distance < collisionThreshold) {
                    food.isCollected = true; // Set the flag immediately
                    console.log("Player collected food:", food.type, "Distance:", distance);

                    // Log current sprite state before collection
                    console.log(`[COLLISION] Before food collection:`);
                    console.log(`[COLLISION] Current direction: ${this.player.currentDirection}`);
                    console.log(`[COLLISION] Sprite UP visible: ${this.player.spriteUp.isVisible}`);
                    console.log(`[COLLISION] Sprite DOWN visible: ${this.player.spriteDown.isVisible}`);

                    // CRITICAL: Make the food invisible immediately to avoid any rendering issues
                    if (food.mesh) {
                        food.mesh.isVisible = false;
                        food.mesh.visibility = 0;
                    }

                    // Log the current state of the player sprites
                    console.log(`[COLLISION] Before food collection: UP visible=${this.player.spriteUp.isVisible}, DOWN visible=${this.player.spriteDown.isVisible}`);

                    // CRITICAL: Force the player sprites to be visible
                    if (this.player.currentDirection === "up") {
                        this.player.spriteUp.isVisible = true;
                        this.player.spriteDown.isVisible = false;
                    } else {
                        this.player.spriteDown.isVisible = true;
                        this.player.spriteUp.isVisible = false;
                    }

                    // Process the food collection with a delay to avoid any rendering issues
                    setTimeout(() => {
                        try {
                            // Player collects the food - but we'll handle the food collection differently
                            // Instead of calling the player's method directly, we'll just add the food to the inventory
                            if (food.type === 'special') {
                                // Handle special food
                                this.player.breathRange = 5; // Reset breath range to minimum
                                this.player.updateZombieSpeed();
                                console.log("[COLLISION] Special food collected, breath range reset");
                            } else {
                                // Add regular food to inventory
                                this.player.collectedFoods.push(food.type);
                                console.log(`[COLLISION] Regular food collected: ${food.type}`);
                            }

                            // Play pickup sound
                            if (this.audioSystem) {
                                this.audioSystem.playPlayerPickup();
                            }

                            // CRITICAL: Force the player sprites to be visible again
                            if (this.player.currentDirection === "up") {
                                this.player.spriteUp.isVisible = true;
                                this.player.spriteDown.isVisible = false;
                            } else {
                                this.player.spriteDown.isVisible = true;
                                this.player.spriteUp.isVisible = false;
                            }

                            console.log(`[COLLISION] After food collection: UP visible=${this.player.spriteUp.isVisible}, DOWN visible=${this.player.spriteDown.isVisible}`);
                        } catch (error) {
                            console.error(`[COLLISION] Error processing food collection:`, error);
                        }
                    }, 50);

                    // Mark food for removal, but don't process it immediately
                    this.foodsToRemove.push(food);
                }
            } catch (error) {
                console.error("Error in player-food collision detection:", error);
            }
        }
    }

    cleanupEntities() {
        try {
            // Remove zombies marked for removal
            for (const zombie of this.zombiesToRemove) {
                this.removeZombie(zombie);
            }

            // CRITICAL: Handle food removal carefully to avoid affecting player sprites
            if (this.foodsToRemove.length > 0) {
                console.log(`[CLEANUP] Processing ${this.foodsToRemove.length} foods for removal`);

                // First, make all foods invisible immediately
                for (const food of this.foodsToRemove) {
                    if (food.mesh) {
                        food.mesh.isVisible = false;
                        food.mesh.visibility = 0;
                    }
                }

                // Then, process them with a slight delay between each
                const processFood = (index) => {
                    if (index >= this.foodsToRemove.length) {
                        // All foods processed, clear the array
                        this.foodsToRemove = [];
                        return;
                    }

                    const food = this.foodsToRemove[index];
                    try {
                        // First remove from the foods array
                        this.removeFood(food);

                        // Then dispose the food object
                        food.dispose();

                        console.log(`[CLEANUP] Processed food ${index + 1}/${this.foodsToRemove.length}`);

                        // Process next food with a delay
                        setTimeout(() => processFood(index + 1), 50);
                    } catch (error) {
                        console.error(`[CLEANUP] Error processing food ${index}:`, error);
                        // Continue with next food despite error
                        setTimeout(() => processFood(index + 1), 50);
                    }
                };

                // Start processing foods with a delay
                setTimeout(() => processFood(0), 100);
            }
        } catch (error) {
            console.error(`[CLEANUP] Error in cleanupEntities:`, error);
        }
    }

    dispose() {
        // Clean up any resources if needed
        this.zombies = [];
        this.foods = [];
        this.zombiesToRemove = [];
        this.foodsToRemove = [];
    }
}

export { CollisionSystem };