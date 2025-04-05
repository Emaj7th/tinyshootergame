import { FART_RANGE } from '../utils/constants.js';

class CollisionSystem {
    constructor(scene, player, zombies = [], foods = []) {
        this.scene = scene;
        this.player = player;
        this.zombies = zombies;
        this.foods = foods;
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

                if (distance < collisionThreshold) {
                    console.log("Zombie collision detected with player! Distance:", distance);
                    this.player.takeDamage();

                    // Move the zombie away slightly to prevent multiple hits
                    const pushDirection = zombie.mesh.position.subtract(this.player.mesh.position).normalize();
                    zombie.mesh.position.addInPlace(pushDirection.scale(5)); // Increased push distance
                }

                // Also try the built-in intersection check as a backup
                if (zombie.mesh.intersectsMesh(this.player.mesh, false)) {
                    console.log("Zombie intersection detected with player!");
                    this.player.takeDamage();

                    // Move the zombie away
                    const pushDirection = zombie.mesh.position.subtract(this.player.mesh.position).normalize();
                    zombie.mesh.position.addInPlace(pushDirection.scale(5));
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
                        zombie.die();
                        this.zombiesToRemove.push(zombie);
                        continue; // Skip to next zombie
                    }

                    // Also try the built-in intersection check as a backup
                    if (attack.mesh.intersectsMesh(zombie.mesh, false)) {
                        console.log("Breath attack intersection with zombie!");
                        zombie.die();
                        this.zombiesToRemove.push(zombie);
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

                // If zombie is within fart range, kill it
                if (distance <= FART_RANGE) {
                    zombie.die();
                    this.zombiesToRemove.push(zombie);
                }
            }
        }
    }

    checkPlayerFoodCollisions() {
        for (const food of this.foods) {
            if (!food.mesh || !this.player.mesh) continue;

            try {
                // Calculate distance between food and player
                const distance = BABYLON.Vector3.Distance(
                    food.mesh.position,
                    this.player.mesh.position
                );

                // Check for collision using distance (more reliable)
                const collisionThreshold = 2.0; // Adjust based on mesh sizes

                if (distance < collisionThreshold) {
                    console.log("Player collected food:", food.type, "Distance:", distance);
                    // Player collects the food
                    this.player.collectFood(food.type);

                    // Mark food for removal
                    this.foodsToRemove.push(food);
                    continue;
                }

                // Also try the built-in intersection check as a backup
                if (food.mesh.intersectsMesh(this.player.mesh, false)) {
                    console.log("Player intersected with food:", food.type);
                    // Player collects the food
                    this.player.collectFood(food.type);

                    // Mark food for removal
                    this.foodsToRemove.push(food);
                }
            } catch (error) {
                console.error("Error in player-food collision detection:", error);
            }
        }
    }

    cleanupEntities() {
        // Remove zombies marked for removal
        for (const zombie of this.zombiesToRemove) {
            this.removeZombie(zombie);
        }

        // Remove foods marked for removal and dispose their resources
        for (const food of this.foodsToRemove) {
            food.dispose();
            this.removeFood(food);
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