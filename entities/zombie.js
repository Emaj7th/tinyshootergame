import {
    ZOMBIE_SPEED,
    ZOMBIE_MIN_HEALTH,
    ZOMBIE_MAX_HEALTH,
    ELITE_ZOMBIE_MIN_HEALTH,
    ELITE_ZOMBIE_MAX_HEALTH,
    ELITE_ZOMBIE_CHANCE
} from '../utils/constants.js';

class Zombie {
    constructor(scene, player, audioSystem, position = null) {
        this.scene = scene;
        this.player = player;
        this.audioSystem = audioSystem;
        this.isDead = false;

        // Determine if this is an elite zombie
        this.isElite = Math.random() < ELITE_ZOMBIE_CHANCE;

        // Set health based on zombie type
        if (this.isElite) {
            // Elite zombie with higher health
            this.health = Math.floor(Math.random() * (ELITE_ZOMBIE_MAX_HEALTH - ELITE_ZOMBIE_MIN_HEALTH + 1)) + ELITE_ZOMBIE_MIN_HEALTH;
        } else {
            // Regular zombie with normal health
            this.health = Math.floor(Math.random() * (ZOMBIE_MAX_HEALTH - ZOMBIE_MIN_HEALTH + 1)) + ZOMBIE_MIN_HEALTH;
        }

        console.log(`Spawned ${this.isElite ? 'elite' : 'regular'} zombie with ${this.health} health`);

        // Create zombie mesh
        this.mesh = BABYLON.MeshBuilder.CreateBox("zombie", {height: 2, width: 1, depth: 1}, scene);
        this.mesh.material = new BABYLON.StandardMaterial("zombieMat", scene);

        if (this.isElite) {
            // Red color for elite zombies
            this.mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red for elite zombies
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.4, 0.05, 0.05); // Red glow

            // Make elite zombies slightly larger
            this.mesh.scaling = new BABYLON.Vector3(1.2, 1.2, 1.2);
        } else {
            // Regular zombie color
            this.mesh.material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2); // Green for regular zombies
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1); // Slight glow
        }

        // Set position
        if (position) {
            this.mesh.position = position.clone();
        } else {
            // Random position around the edges of the map
            const mapSize = 25; // Half the size of the ground
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

            // Make sure zombies spawn far from player
            const minDistanceFromPlayer = 15;

            let zombiePosition;
            let isValidPosition = false;

            // Try to find a valid position that's not too close to the player
            while (!isValidPosition) {
                switch(side) {
                    case 0: // Top
                        zombiePosition = new BABYLON.Vector3(
                            Math.random() * mapSize * 2 - mapSize,
                            1,
                            -mapSize
                        );
                        break;
                    case 1: // Right
                        zombiePosition = new BABYLON.Vector3(
                            mapSize,
                            1,
                            Math.random() * mapSize * 2 - mapSize
                        );
                        break;
                    case 2: // Bottom
                        zombiePosition = new BABYLON.Vector3(
                            Math.random() * mapSize * 2 - mapSize,
                            1,
                            mapSize
                        );
                        break;
                    case 3: // Left
                        zombiePosition = new BABYLON.Vector3(
                            -mapSize,
                            1,
                            Math.random() * mapSize * 2 - mapSize
                        );
                        break;
                }

                // Check distance from player
                const distanceFromPlayer = BABYLON.Vector3.Distance(
                    zombiePosition,
                    this.player.mesh.position
                );

                if (distanceFromPlayer >= minDistanceFromPlayer) {
                    isValidPosition = true;
                }
            }

            this.mesh.position = zombiePosition;
            console.log("Zombie spawned at:", this.mesh.position, "Player at:", this.player.mesh.position);
        }

        this.speed = ZOMBIE_SPEED;

        // Play zombie sound occasionally
        this.setupSoundTimer();
    }

    setupSoundTimer() {
        // Play zombie sound at random intervals
        this.soundTimer = setInterval(() => {
            if (!this.isDead && this.audioSystem && Math.random() < 0.2) {
                this.audioSystem.playZombieSound();
            }
        }, 5000); // Check every 5 seconds with a 20% chance to play
    }

    moveTowardsPlayer() {
        if (this.isDead) return;

        const direction = this.player.mesh.position.subtract(this.mesh.position).normalize();
        this.mesh.position.addInPlace(direction.scale(this.speed));
    }

    takeDamage(damage = 1) {
        if (this.isDead) return;

        // Reduce health
        this.health -= damage;
        console.log(`Zombie took damage. Health now: ${this.health}`);

        // Flash the zombie to indicate damage
        this.flashDamage();

        // Check if zombie is dead
        if (this.health <= 0) {
            this.die(true); // true indicates it was killed by player
        }
    }

    flashDamage() {
        // Flash the zombie mesh red to indicate damage
        const originalColor = this.mesh.material.diffuseColor.clone();
        this.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Bright red

        // Return to original color after a short time
        setTimeout(() => {
            if (this.mesh && this.mesh.material) {
                this.mesh.material.diffuseColor = originalColor;
            }
        }, 100);
    }

    die(killedByPlayer = false) {
        if (this.isDead) return;

        this.isDead = true;

        // Only increment kill count if killed by player
        if (killedByPlayer && this.scene && this.scene.zombiesKilled !== undefined) {
            this.scene.zombiesKilled++;
            console.log(`Zombie killed! Total: ${this.scene.zombiesKilled}`);
        }

        // Create explosion effect
        this.createDeathExplosion();

        // Play zombie death sound
        if (this.audioSystem) {
            this.audioSystem.playZombieSound();
        }

        // Remove the zombie mesh
        this.mesh.dispose();

        // Clear the sound timer
        if (this.soundTimer) {
            clearInterval(this.soundTimer);
        }
    }

    createDeathExplosion() {
        // Create particle system for explosion
        const explosion = new BABYLON.ParticleSystem("explosion", 100, this.scene);
        explosion.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

        // Set particle system properties
        explosion.emitter = this.mesh.position.clone();
        explosion.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        explosion.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        explosion.color1 = new BABYLON.Color4(0.2, 0.6, 0.2, 1.0);
        explosion.color2 = new BABYLON.Color4(0.4, 0.8, 0.4, 1.0);
        explosion.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        explosion.minSize = 0.1;
        explosion.maxSize = 0.5;
        explosion.minLifeTime = 0.3;
        explosion.maxLifeTime = 1.5;
        explosion.emitRate = 300;
        explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        explosion.gravity = new BABYLON.Vector3(0, 1, 0);
        explosion.direction1 = new BABYLON.Vector3(-1, 1, -1);
        explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
        explosion.minAngularSpeed = 0;
        explosion.maxAngularSpeed = Math.PI;
        explosion.minEmitPower = 1;
        explosion.maxEmitPower = 3;
        explosion.updateSpeed = 0.01;

        // Start the particle system
        explosion.start();

        // Create some "chunks" flying off
        this.createZombieChunks();

        // Stop and dispose after a short time
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => {
                explosion.dispose();
            }, 2000); // Wait for particles to die out
        }, 300); // Emit for 300ms
    }

    createZombieChunks() {
        // Create 5-8 small chunks that fly off
        const numChunks = 5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numChunks; i++) {
            // Create a small box for each chunk
            const chunk = BABYLON.MeshBuilder.CreateBox("zombieChunk", {size: 0.2 + Math.random() * 0.3}, this.scene);
            chunk.position = this.mesh.position.clone();

            // Give it the zombie material
            chunk.material = this.mesh.material.clone("chunkMat");

            // Apply a random impulse to make it fly off
            const impulse = new BABYLON.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );

            // Animate the chunk flying off
            const frameRate = 30;
            const animDuration = 1 + Math.random() * 2; // 1-3 seconds

            // Position animation
            const positionAnimation = new BABYLON.Animation(
                "chunkPosition",
                "position",
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            const targetPosition = chunk.position.add(impulse.scale(5));

            const positionKeys = [
                { frame: 0, value: chunk.position.clone() },
                { frame: frameRate * animDuration, value: targetPosition }
            ];

            positionAnimation.setKeys(positionKeys);

            // Rotation animation
            const rotationAnimation = new BABYLON.Animation(
                "chunkRotation",
                "rotation",
                frameRate,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            const targetRotation = new BABYLON.Vector3(
                Math.random() * Math.PI * 4,
                Math.random() * Math.PI * 4,
                Math.random() * Math.PI * 4
            );

            const rotationKeys = [
                { frame: 0, value: new BABYLON.Vector3(0, 0, 0) },
                { frame: frameRate * animDuration, value: targetRotation }
            ];

            rotationAnimation.setKeys(rotationKeys);

            // Add animations to the chunk
            chunk.animations = [positionAnimation, rotationAnimation];

            // Begin animation
            this.scene.beginAnimation(chunk, 0, frameRate * animDuration, false);

            // Dispose the chunk after animation completes
            setTimeout(() => {
                chunk.dispose();
            }, animDuration * 1000 + 100);
        }
    }

    dispose() {
        if (this.soundTimer) {
            clearInterval(this.soundTimer);
        }

        if (this.mesh && !this.mesh.isDisposed()) {
            this.mesh.dispose();
        }
    }
}

export { Zombie };