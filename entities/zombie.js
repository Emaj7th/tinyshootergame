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

        // Create an invisible mesh for collision detection
        // Make the collision box 2x bigger to match the larger sprites
        this.mesh = BABYLON.MeshBuilder.CreateBox("zombie", {height: 3.0, width: 2.0, depth: 1.0}, scene);
        const zombieMaterial = new BABYLON.StandardMaterial("zombieMat", scene);
        zombieMaterial.alpha = 0; // Make it invisible
        this.mesh.material = zombieMaterial;
        this.mesh.isVisible = false;

        // Create sprite managers for zombie sprites
        if (this.isElite) {
            // Elite zombie (boss) sprites
            this.spriteManagerUp = new BABYLON.SpriteManager(
                "zombieBossUpManager",
                "assets/images/zombieboss_up_spritemap.png",
                1, // Only one sprite in this manager
                {width: 350, height: 450}, // Size of each sprite cell
                scene
            );

            this.spriteManagerDown = new BABYLON.SpriteManager(
                "zombieBossDownManager",
                "assets/images/zombieboss_down_spritemap.png",
                1, // Only one sprite in this manager
                {width: 350, height: 450}, // Size of each sprite cell
                scene
            );

            // Make elite zombies larger
            this.spriteScale = 3.0; // 2x bigger than before (1.5 * 2)
        } else {
            // Regular zombie sprites
            this.spriteManagerUp = new BABYLON.SpriteManager(
                "zombieUpManager",
                "assets/images/zombie_up_spritemap.png",
                1, // Only one sprite in this manager
                {width: 350, height: 450}, // Size of each sprite cell
                scene
            );

            this.spriteManagerDown = new BABYLON.SpriteManager(
                "zombieDownManager",
                "assets/images/zombie_down_spritemap.png",
                1, // Only one sprite in this manager
                {width: 350, height: 450}, // Size of each sprite cell
                scene
            );

            this.spriteScale = 2.4; // 2x bigger than before (1.2 * 2)
        }

        // Create the up-facing sprite
        this.spriteUp = new BABYLON.Sprite("zombieUp", this.spriteManagerUp);
        this.spriteUp.width = this.spriteScale;
        this.spriteUp.height = this.spriteScale;
        this.spriteUp.isVisible = false;
        this.spriteUp.renderingGroupId = 1; // Middle rendering group

        // Create the down-facing sprite
        this.spriteDown = new BABYLON.Sprite("zombieDown", this.spriteManagerDown);
        this.spriteDown.width = this.spriteScale;
        this.spriteDown.height = this.spriteScale;
        this.spriteDown.isVisible = true; // Start with down sprite visible
        this.spriteDown.renderingGroupId = 1; // Middle rendering group

        // Track current direction
        this.currentDirection = "down"; // Start with down direction

        // Set up sprite animations
        this.setupSpriteAnimations();

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

    setupSpriteAnimations() {
        // Set up sprite animations for both up and down sprites
        // Each sprite has 4 frames (0-3)

        // We'll use a custom animation approach to match the player's animation speed
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 250; // 250ms per frame = 4 frames per second (same as player)

        // Set initial frame
        this.spriteUp.cellIndex = 0;
        this.spriteDown.cellIndex = 0;

        // Disable automatic animation
        this.spriteUp.stopAnimation();
        this.spriteDown.stopAnimation();

        // Add an observer to handle custom animation
        this.animationObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.isDead) return;

            try {
                // Handle custom animation timing
                const currentTime = Date.now();

                // Update animation frame at the specified frame duration
                if (currentTime - this.lastFrameTime > this.frameDuration) {
                    // Time to advance to next frame
                    this.animationFrame = (this.animationFrame + 1) % 4; // Loop through 0-3
                    this.lastFrameTime = currentTime;

                    // Update both sprites' cell index
                    this.spriteUp.cellIndex = this.animationFrame;
                    this.spriteDown.cellIndex = this.animationFrame;
                }
            } catch (error) {
                console.error("Error in zombie animation:", error);
            }
        });
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

        try {
            // Get direction to player
            const direction = this.player.mesh.position.subtract(this.mesh.position);
            direction.y = 0; // Keep zombies on the ground
            direction.normalize();

            // Move zombie
            this.mesh.position.addInPlace(direction.scale(this.speed));

            // Update sprite positions to match the mesh
            const spritePosition = this.mesh.position.clone();
            spritePosition.y = 1; // Set the correct height for sprites
            this.spriteUp.position = spritePosition.clone();
            this.spriteDown.position = spritePosition.clone();

            // Determine which sprite to show based on movement direction
            // If moving up (negative z), use up sprite, otherwise use down sprite
            const isMovingUp = direction.z < 0;

            // Switch sprites if direction changed
            if (isMovingUp && this.currentDirection !== "up") {
                // Switch to up sprite
                this.currentDirection = "up";
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;
            } else if (!isMovingUp && this.currentDirection !== "down") {
                // Switch to down sprite
                this.currentDirection = "down";
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;
            }
        } catch (error) {
            console.error("Error in zombie moveTowardsPlayer:", error);
        }
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
        try {
            // Flash the zombie sprites red to indicate damage
            const flashColor = new BABYLON.Color3(1, 0, 0); // Bright red

            // Store original colors (sprites use color property, not material)
            const originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
            const originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

            // Apply red tint to both sprites
            this.spriteUp.color = flashColor;
            this.spriteDown.color = flashColor;

            // Return to original colors after a short time
            setTimeout(() => {
                if (this.spriteUp) this.spriteUp.color = originalUpColor;
                if (this.spriteDown) this.spriteDown.color = originalDownColor;
            }, 100);
        } catch (error) {
            console.error("Error in zombie flashDamage:", error);
        }
    }

    die(killedByPlayer = false) {
        if (this.isDead) return;

        try {
            this.isDead = true;
            console.log(`Zombie died. Elite: ${this.isElite}`);

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

            // Dispose of sprites and sprite managers
            if (this.spriteUp) {
                this.spriteUp.dispose();
            }

            if (this.spriteDown) {
                this.spriteDown.dispose();
            }

            if (this.spriteManagerUp) {
                this.spriteManagerUp.dispose();
            }

            if (this.spriteManagerDown) {
                this.spriteManagerDown.dispose();
            }

            // Remove the zombie mesh
            if (this.mesh) {
                this.mesh.dispose();
            }

            // Clear the sound timer
            if (this.soundTimer) {
                clearInterval(this.soundTimer);
            }

            // Remove animation observer
            if (this.animationObserver) {
                this.scene.onBeforeRenderObservable.remove(this.animationObserver);
                this.animationObserver = null;
            }
        } catch (error) {
            console.error("Error in zombie die:", error);
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
        try {
            // Clear timers and observers
            if (this.soundTimer) {
                clearInterval(this.soundTimer);
            }

            // Remove animation observer
            if (this.animationObserver) {
                this.scene.onBeforeRenderObservable.remove(this.animationObserver);
            }

            // Dispose sprites
            if (this.spriteUp && !this.spriteUp.isDisposed) {
                this.spriteUp.dispose();
            }

            if (this.spriteDown && !this.spriteDown.isDisposed) {
                this.spriteDown.dispose();
            }

            // Dispose sprite managers
            if (this.spriteManagerUp && !this.spriteManagerUp.isDisposed) {
                this.spriteManagerUp.dispose();
            }

            if (this.spriteManagerDown && !this.spriteManagerDown.isDisposed) {
                this.spriteManagerDown.dispose();
            }

            // Dispose mesh
            if (this.mesh && !this.mesh.isDisposed()) {
                this.mesh.dispose();
            }

            console.log("Zombie fully disposed");
        } catch (error) {
            console.error("Error in zombie dispose:", error);
        }
    }
}

export { Zombie };