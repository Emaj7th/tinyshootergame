// No longer using the Projectile class directly
import {
    MIN_BREATH_RANGE,
    MAX_BREATH_RANGE,
    BREATH_INCREASE_PER_FOOD,
    JUMP_COOLDOWN,
    RUN_DURATION,
    RUN_COOLDOWN,
    PLAYER_SPEED,
    PLAYER_RUN_SPEED,
    PLAYER_MAX_HEALTH,
    FART_THRESHOLD,
    FART_DURATION,
    FART_RANGE,
    SPECIAL_FOOD_TYPE
} from '../utils/constants.js';

class Player {
    constructor(scene, audioSystem) {
        this.scene = scene;
        this.audioSystem = audioSystem;

        // Create a plane for the player collision/hitbox
        this.mesh = BABYLON.MeshBuilder.CreatePlane("playerPlane", {
            width: 1.5,  // Adjust size to match sprite visual size
            height: 1.5
        }, scene);

        // Rotate plane to lay flat on the ground
        this.mesh.rotation.x = Math.PI / 2;

        // Position the plane slightly above ground to prevent z-fighting
        this.mesh.position.y = 0.01;

        // Create invisible material for the collision plane
        const playerPlaneMaterial = new BABYLON.StandardMaterial("playerPlaneMat", scene);
        playerPlaneMaterial.alpha = 0;
        playerPlaneMaterial.backFaceCulling = false;
        this.mesh.material = playerPlaneMaterial;

        // CRITICAL: Ensure the mesh never affects visibility
        this.mesh.isVisible = false;
        this.mesh.visibility = 0;
        this.mesh.checkCollisions = true;
        this.mesh.isPickable = true;
        this.mesh.renderingGroupId = 0; // Lowest rendering group

        // Create sprite manager for up movement
        this.spriteManagerUp = new BABYLON.SpriteManager(
            "playerManagerUp",
            "assets/images/character_up_spritemap.png",
            1, // Only one sprite in this manager
            {width: 300, height: 400}, // Size of each sprite cell
            scene
        );

        // Create the up-facing sprite
        this.spriteUp = new BABYLON.Sprite("playerUp", this.spriteManagerUp);
        this.spriteUp.width = 2;
        this.spriteUp.height = 2;
        this.spriteUp.position.y = 1;
        this.spriteUp.renderingGroupId = 2; // Highest rendering group to ensure visibility
        this.spriteUp.depth = 0.1; // Set depth to ensure it renders on top

        // Initialize other properties
        this.speed = PLAYER_SPEED;
        this.baseSpeed = PLAYER_SPEED;
        this.runSpeed = PLAYER_RUN_SPEED;
        this.isRunning = false;
        this.runTimeLeft = RUN_DURATION;
        this.runCooldown = 0;

        // Create sprite manager for down movement
        this.spriteManagerDown = new BABYLON.SpriteManager(
            "playerManagerDown",
            "assets/images/character_down_spritemap.png",
            1,
            {width: 300, height: 400},
            scene
        );

        // Create the down-facing sprite
        this.spriteDown = new BABYLON.Sprite("playerDown", this.spriteManagerDown);
        this.spriteDown.width = 2;
        this.spriteDown.height = 2;
        this.spriteDown.position.y = 1;
        this.spriteDown.renderingGroupId = 2; // Highest rendering group to ensure visibility
        this.spriteDown.depth = 0.1; // Set depth to ensure it renders on top

        // Set up sprite animations
        this.setupSpriteAnimations();

        // Track current direction and movement state
        this.currentDirection = "down"; // Start with down sprite
        this.isMoving = false;
        this.lastMoveTime = 0;

        // Jump properties
        this.canJump = true;
        this.jumpCooldown = 0;

        // Health properties
        this.health = PLAYER_MAX_HEALTH;
        this.maxHealth = PLAYER_MAX_HEALTH;
        console.log("Player initialized with health:", this.health);

        // Breath attack properties
        this.breathRange = MIN_BREATH_RANGE;
        this.facingDirection = new BABYLON.Vector3(0, 0, -1);
        this.lastMoveDirection = new BABYLON.Vector3(0, 0, -1);
        this.activeBreathAttacks = [];
        this._usingMouseAim = false;
        this._lastAttackTime = 0;

        // Food and fart properties
        this.collectedFoods = ['sandwich'];
        this.consumedFoods = 0;
        this.inFartMode = false;
        this.fartTimeLeft = 0;
        this.fartCloud = null;

        console.log("Player initialized with 1 food item in inventory:", this.collectedFoods[0]);

        // Create a particle system for the fart cloud
        this.createFartParticleSystem();
    }

    createFartParticleSystem() {
        // Create a particle system for the fart cloud - increased particles for denser cloud
        this.fartParticleSystem = new BABYLON.ParticleSystem("fartParticles", 5000, this.scene);
        this.fartParticleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

        // Set rendering group to ensure it doesn't hide the player sprite
        this.fartParticleSystem.renderingGroupId = 0; // Lower rendering group than player (2) and food (1)

        // Set particle system properties for a larger, more visible cloud
        // Emit from behind the player (opposite to facing direction)
        this.fartParticleSystem.minEmitBox = new BABYLON.Vector3(-1.5, 0, -1.5);
        this.fartParticleSystem.maxEmitBox = new BABYLON.Vector3(1.5, 0, 1.5);

        // Green colors for fart cloud
        this.fartParticleSystem.color1 = new BABYLON.Color4(0.2, 0.5, 0.1, 0.8); // More transparent
        this.fartParticleSystem.color2 = new BABYLON.Color4(0.4, 0.6, 0.2, 0.8); // More transparent
        this.fartParticleSystem.colorDead = new BABYLON.Color4(0.1, 0.3, 0.1, 0.0); // Fade to transparent

        // Larger particles for more visible cloud
        this.fartParticleSystem.minSize = 0.5;
        this.fartParticleSystem.maxSize = 2.0;

        // Longer lifetime for more persistent cloud
        this.fartParticleSystem.minLifeTime = 0.5;
        this.fartParticleSystem.maxLifeTime = 2.0;

        // Higher emit rate for denser cloud
        this.fartParticleSystem.emitRate = 1000;

        // Blend mode for better visual
        this.fartParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

        // Slight upward gravity for rising effect
        this.fartParticleSystem.gravity = new BABYLON.Vector3(0, 0.2, 0);

        // Spread in all directions for cloud effect
        this.fartParticleSystem.direction1 = new BABYLON.Vector3(-2, 0.5, -2);
        this.fartParticleSystem.direction2 = new BABYLON.Vector3(2, 1.5, 2);

        // Add rotation for swirling effect
        this.fartParticleSystem.minAngularSpeed = 0.5;
        this.fartParticleSystem.maxAngularSpeed = Math.PI * 2;

        // Emission power for spread
        this.fartParticleSystem.minEmitPower = 1.0;
        this.fartParticleSystem.maxEmitPower = 3.0;

        // Faster update for smoother animation
        this.fartParticleSystem.updateSpeed = 0.01;

        // Attach the particle system to the player mesh
        this.fartParticleSystem.emitter = this.mesh;

        // Stop the particle system initially
        this.fartParticleSystem.stop();
    }

    move(direction) {
        // Update facing direction if moving
        if (direction.length() > 0) {
            // Store the last movement direction for jump functionality
            this.lastMoveDirection = direction.normalize().clone();

            // Also update facing direction if we're not using mouse to aim
            if (!this._usingMouseAim) {
                this.facingDirection = this.lastMoveDirection.clone();
            }

            // Mark as moving and update last move time
            this.isMoving = true;
            this.lastMoveTime = Date.now();

            // Start animation if not already animating
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.lastFrameTime = Date.now();
                console.log("Starting animation");
            }

            // Determine which sprite to show based on movement direction
            // If moving down (positive z), use down sprite, otherwise use up sprite
            // This matches the keyboard keys: W = up, S = down
            const isMovingDown = direction.z > 0;

            // Switch sprites if direction changed
            if (isMovingDown && this.currentDirection !== "down") {
                // Switch to down sprite
                this.currentDirection = "down";
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;

                // Keep the same animation frame when switching sprites
                this.spriteDown.cellIndex = this.animationFrame;

                console.log("Switched to DOWN sprite");
            } else if (!isMovingDown && this.currentDirection !== "up") {
                // Switch to up sprite
                this.currentDirection = "up";
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;

                // Keep the same animation frame when switching sprites
                this.spriteUp.cellIndex = this.animationFrame;

                console.log("Switched to UP sprite");
            }

            // Apply current speed to movement
            const scaledDirection = direction.scale(this.speed);
            const newPosition = this.mesh.position.clone();
            newPosition.addInPlace(scaledDirection);

            // Check if the new position is within the ground boundaries
            const groundSize = 25; // Half the size of the ground (50/2)

            // Restrict movement to stay within the ground boundaries
            if (newPosition.x < -groundSize) newPosition.x = -groundSize;
            if (newPosition.x > groundSize) newPosition.x = groundSize;
            if (newPosition.z < -groundSize) newPosition.z = -groundSize;
            if (newPosition.z > groundSize) newPosition.z = groundSize;

            // Check for collisions with obstacles
            if (!this.checkObstacleCollision(newPosition)) {
                // No collision, update the position
                this.mesh.position = newPosition;

                // Update sprite positions immediately for smoother movement
                // CRITICAL: Set the correct y-position for sprites
                if (this.spriteUp) {
                    const upPos = this.mesh.position.clone();
                    upPos.y = 1; // Set the correct height
                    this.spriteUp.position = upPos;
                }
                if (this.spriteDown) {
                    const downPos = this.mesh.position.clone();
                    downPos.y = 1; // Set the correct height
                    this.spriteDown.position = downPos;
                }

                console.log("Player moved. Position:", this.mesh.position.toString());
            } else {
                console.log("Movement blocked by obstacle");
            }
        }
    }

    checkObstacleCollision(newPosition) {
        // If there are no obstacles in the scene, return false (no collision)
        if (!this.scene.obstacles || this.scene.obstacles.length === 0) {
            return false;
        }

        // Player collision parameters
        const playerRadius = 0.7; // Slightly smaller than the player width/depth

        // Check each obstacle
        for (const obstacle of this.scene.obstacles) {
            // For TransformNode (car parent), we need to check its children
            if (obstacle instanceof BABYLON.TransformNode) {
                // Get the car body which is the main collision object
                const carBody = obstacle.getChildren().find(child => child.name === "carBody");
                if (!carBody) continue;

                // Get car's world position
                const carPosition = obstacle.getAbsolutePosition();

                // Calculate car dimensions in world space
                const carWidth = 3;
                const carDepth = 6;

                // Calculate car bounds with rotation
                const angle = obstacle.rotation.y;
                const cosAngle = Math.cos(angle);
                const sinAngle = Math.sin(angle);

                // Calculate the distance from player to car center
                const dx = newPosition.x - carPosition.x;
                const dz = newPosition.z - carPosition.z;

                // Rotate the point to align with car's local coordinates
                const localX = dx * cosAngle + dz * sinAngle;
                const localZ = -dx * sinAngle + dz * cosAngle;

                // Check if the point is inside the car's bounding box (plus player radius)
                if (Math.abs(localX) < (carWidth / 2 + playerRadius) &&
                    Math.abs(localZ) < (carDepth / 2 + playerRadius)) {
                    return true; // Collision detected
                }
            }
            // For regular meshes like the dumpster
            else if (obstacle instanceof BABYLON.Mesh) {
                // Get bounding box in world space
                const boundingInfo = obstacle.getBoundingInfo();
                const boundingBox = boundingInfo.boundingBox;

                // Expand the bounding box by the player radius
                const min = boundingBox.minimum;
                const max = boundingBox.maximum;

                // Check if the player's position is inside the expanded bounding box
                if (newPosition.x >= min.x - playerRadius && newPosition.x <= max.x + playerRadius &&
                    newPosition.z >= min.z - playerRadius && newPosition.z <= max.z + playerRadius) {
                    return true; // Collision detected
                }
            }
        }

        return false; // No collision
    }

    setFacingDirection(direction) {
        this.facingDirection = direction;
    }

    jump() {
        if (this.canJump) {
            // Get the current movement direction or use facing direction if not moving
            let jumpDirection;

            // Use the last movement direction if available, otherwise use facing direction
            if (this.lastMoveDirection && this.lastMoveDirection.length() > 0) {
                jumpDirection = this.lastMoveDirection.clone();
                console.log("Jumping in movement direction:", jumpDirection.toString());
            } else {
                jumpDirection = this.facingDirection.clone();
                console.log("Jumping in facing direction:", jumpDirection.toString());
            }

            // Set jump distance
            const jumpDistance = 5; // Increased jump distance

            // Scale the direction by the jump distance
            jumpDirection = jumpDirection.normalize().scale(jumpDistance);

            // Calculate new position
            const newPosition = this.mesh.position.clone();
            newPosition.addInPlace(jumpDirection);

            // Check if the new position is within the ground boundaries
            const groundSize = 25; // Half the size of the ground (50/2)

            // Restrict movement to stay within the ground boundaries
            if (newPosition.x < -groundSize) newPosition.x = -groundSize;
            if (newPosition.x > groundSize) newPosition.x = groundSize;
            if (newPosition.z < -groundSize) newPosition.z = -groundSize;
            if (newPosition.z > groundSize) newPosition.z = groundSize;

            // Check for collisions with obstacles
            if (!this.checkObstacleCollision(newPosition)) {
                // No collision, update the position
                this.mesh.position = newPosition;
                console.log("Jumped to position:", this.mesh.position.toString());
            } else {
                console.log("Jump blocked by obstacle");
            }

            // Play jump sound
            if (this.audioSystem) {
                this.audioSystem.playJumpSound();
            }

            // Set cooldown
            this.canJump = false;
            this.jumpCooldown = JUMP_COOLDOWN;
        } else {
            console.log("Cannot jump - on cooldown:", this.jumpCooldown);
        }
    }

    run() {
        if (!this.isRunning && this.runCooldown <= 0) {
            // Start running
            this.isRunning = true;
            this.speed = this.runSpeed;
            this.runTimeLeft = RUN_DURATION;
        }
    }

    attack() {
        // Rate limit attacks to prevent too many projectiles
        const now = Date.now();
        const attackCooldown = 300; // 300ms between attacks

        if (now - this._lastAttackTime < attackCooldown) {
            return; // Skip if attacking too frequently
        }

        this._lastAttackTime = now;

        // Create a breath attack projectile
        if (!this.inFartMode) {
            // Create a breath projectile in the facing direction
            const origin = this.mesh.position.clone();
            origin.y += 0.5; // Adjust to come from the "mouth" level

            // Make sure we have a valid facing direction
            if (!this.facingDirection || this.facingDirection.length() === 0) {
                this.facingDirection = new BABYLON.Vector3(0, 0, -1); // Default direction
            }

            console.log("Creating breath attack in direction:", this.facingDirection.toString());

            try {
                // Create an invisible sphere as the base for our particle system
                const projectileMesh = BABYLON.MeshBuilder.CreateSphere("breathProjectile", {
                    diameter: 1.0
                }, this.scene);

                // Make the mesh invisible - we'll only see the particles
                projectileMesh.isVisible = false;

                // Position it at the player's position
                projectileMesh.position = origin.clone();

                // Create a chunky, cloudy particle system for the breath attack
                const particleSystem = new BABYLON.ParticleSystem("breathParticles", 500, this.scene);

                // Create a cloudy texture for particles
                particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

                // Set up the emitter to be the projectile mesh
                particleSystem.emitter = projectileMesh;

                // Make particles emit in a cone shape in the direction the player is facing
                const emitCone = 0.5; // Width of the emission cone
                particleSystem.minEmitBox = new BABYLON.Vector3(-emitCone, -emitCone, -0.1);
                particleSystem.maxEmitBox = new BABYLON.Vector3(emitCone, emitCone, 0.1);

                // Set particle colors - light blue/white for breath
                particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 0.8); // Light blue
                particleSystem.color2 = new BABYLON.Color4(0.9, 0.9, 1.0, 0.8); // Almost white
                particleSystem.colorDead = new BABYLON.Color4(0.5, 0.5, 0.8, 0.0); // Fade to transparent

                // Make particles chunky and varied in size
                particleSystem.minSize = 0.3;
                particleSystem.maxSize = 1.2;

                // Make particles last longer for a more persistent cloud
                particleSystem.minLifeTime = 0.3;
                particleSystem.maxLifeTime = 0.8;

                // Emit lots of particles for a dense cloud
                particleSystem.emitRate = 300;

                // Set particle behavior
                particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; // Additive blending for glow effect

                // Make particles move in the direction the player is facing
                const directionVector = this.facingDirection.clone();

                // Add some spread to the particles
                particleSystem.direction1 = new BABYLON.Vector3(
                    directionVector.x - 0.5,
                    directionVector.y - 0.5,
                    directionVector.z - 0.5
                );
                particleSystem.direction2 = new BABYLON.Vector3(
                    directionVector.x + 0.5,
                    directionVector.y + 0.5,
                    directionVector.z + 0.5
                );

                // Set emission power (speed)
                particleSystem.minEmitPower = 1.5;
                particleSystem.maxEmitPower = 3.5;

                // Add some gravity to make particles rise slightly
                particleSystem.gravity = new BABYLON.Vector3(0, 0.1, 0);

                // Add some angular velocity for swirling effect
                particleSystem.minAngularSpeed = -2.0;
                particleSystem.maxAngularSpeed = 2.0;

                // Update faster for smoother animation
                particleSystem.updateSpeed = 0.01;

                // Start the particle system
                particleSystem.start();

                // Create a simple projectile object
                const projectile = {
                    mesh: projectileMesh,
                    particleSystem: particleSystem,
                    direction: this.facingDirection.clone(),
                    speed: 0.8, // Even faster speed for better visibility
                    distance: 0,
                    range: this.breathRange,
                    isDisposed: false,
                    move: function() {
                        if (this.isDisposed) return;

                        // Move the projectile in the direction it's facing
                        this.mesh.position.addInPlace(this.direction.scale(this.speed));
                        this.distance += this.speed;

                        // Scale the particle system as it travels to create a spreading cloud effect
                        const travelProgress = this.distance / this.range;

                        // Calculate spread factor for the cloud as it travels
                        const spread = 0.5 + travelProgress * 1.5; // Starts at 0.5, grows to 2.0

                        if (this.particleSystem) {
                            // Update emission box to create spreading effect
                            this.particleSystem.minEmitBox = new BABYLON.Vector3(-spread, -spread, -spread/2);
                            this.particleSystem.maxEmitBox = new BABYLON.Vector3(spread, spread, spread/2);

                            // Increase particle size as it travels
                            this.particleSystem.minSize = 0.3 + travelProgress * 0.7; // 0.3 to 1.0
                            this.particleSystem.maxSize = 1.2 + travelProgress * 1.3; // 1.2 to 2.5

                            // Slow down particles as they travel
                            this.particleSystem.minEmitPower = Math.max(0.5, 1.5 - travelProgress);
                            this.particleSystem.maxEmitPower = Math.max(1.0, 3.5 - travelProgress * 2);

                            // Increase emission rate as it travels for denser cloud
                            this.particleSystem.emitRate = 300 + travelProgress * 200; // 300 to 500
                        }

                        if (this.distance > this.range) {
                            this.dispose();
                        }
                    },
                    dispose: function() {
                        if (this.isDisposed) return;

                        if (this.particleSystem) {
                            this.particleSystem.stop();
                            this.particleSystem.dispose();
                        }

                        if (this.mesh) {
                            this.mesh.dispose();
                        }

                        this.isDisposed = true;
                    }
                };

                this.activeBreathAttacks.push(projectile);
                console.log("Breath attack created. Total active:", this.activeBreathAttacks.length);

                // Play breath sound
                if (this.audioSystem) {
                    this.audioSystem.playBreathSound();
                }
            } catch (error) {
                console.error("Error creating breath attack:", error);
            }
        } else {
            // In fart mode, we don't need to create projectiles as the fart cloud is always active
            // But we can play the fart sound
            if (this.audioSystem) {
                this.audioSystem.playFartSound();
            }
        }
    }

    collectFood(foodType) {
        // CRITICAL: Store current sprite states before doing anything else
        const currentDirection = this.currentDirection;
        // Store current position for sprite positioning
        const currentPosition = this.mesh.position.clone();
        currentPosition.y = 1; // Ensure correct height

        console.log(`[FOOD] Collecting ${foodType}, current direction: ${currentDirection}`);

        if (foodType === SPECIAL_FOOD_TYPE) {
            console.log("[FOOD] Special food collected! Resetting breath range");
            this.breathRange = MIN_BREATH_RANGE;
            this.updateZombieSpeed();

            // Create a special effect
            this.createBreathResetEffect();

            if (this.audioSystem) {
                this.audioSystem.playPickupSound();
            }
        } else {
            console.log(`[FOOD] Regular food collected: ${foodType}`);
            this.collectedFoods.push(foodType);

            // Flash the player to indicate food pickup
            this.flashFoodPickup();

            if (this.audioSystem) {
                this.audioSystem.playPickupSound();
            }
        }

        // CRITICAL: Force sprite visibility and position after collection
        // This prevents the sprite from disappearing

        // First, force visibility immediately
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
            this.spriteUp.position = this.mesh.position.clone();
            this.spriteUp.position.y = 1;
            this.spriteUp.renderingGroupId = 2;
            this.spriteUp.depth = 0.1;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
            this.spriteDown.position = this.mesh.position.clone();
            this.spriteDown.position.y = 1;
            this.spriteDown.renderingGroupId = 2;
            this.spriteDown.depth = 0.1;
        }
        console.log(`[FOOD] Forced sprite visibility immediately after food collection`);

        // Then, force visibility again after a short delay to ensure it sticks
        setTimeout(() => {
            // Force correct sprite visibility based on current direction
            if (this.currentDirection === "up") {
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;
                this.spriteUp.position = this.mesh.position.clone();
                this.spriteUp.position.y = 1;
                this.spriteUp.renderingGroupId = 2;
                this.spriteUp.depth = 0.1;
            } else {
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;
                this.spriteDown.position = this.mesh.position.clone();
                this.spriteDown.position.y = 1;
                this.spriteDown.renderingGroupId = 2;
                this.spriteDown.depth = 0.1;
            }
            console.log(`[FOOD] Forced sprite visibility again after food collection`);
        }, 50); // Small delay to ensure this happens after any other changes

        return foodType;
    }

    createBreathResetEffect() {
        // Create a particle system for the breath reset effect
        const particleSystem = new BABYLON.ParticleSystem("breathResetEffect", 500, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

        // Set particle system properties
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 2, 1);

        // Bright, sparkly colors
        particleSystem.color1 = new BABYLON.Color4(0.7, 1.0, 1.0, 1.0); // Light blue
        particleSystem.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0); // White
        particleSystem.colorDead = new BABYLON.Color4(0.5, 0.7, 1.0, 0.0); // Fade out to blue

        // Larger particles for more visible effect
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.5;

        // Longer lifetime for more persistent effect
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 2.0;

        // High emit rate for dense effect
        particleSystem.emitRate = 300;

        // Blending for glow effect
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

        // Upward gravity for rising effect
        particleSystem.gravity = new BABYLON.Vector3(0, 1, 0);

        // Direction for particles to emit outward
        particleSystem.direction1 = new BABYLON.Vector3(-2, 0.5, -2);
        particleSystem.direction2 = new BABYLON.Vector3(2, 2, 2);

        // Angular speed for twinkling
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI * 2;

        // Emission power for spread
        particleSystem.minEmitPower = 1.0;
        particleSystem.maxEmitPower = 3.0;

        // Update speed
        particleSystem.updateSpeed = 0.01;

        // Start the particle system
        particleSystem.start();

        // Stop and dispose after a short time
        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => {
                particleSystem.dispose();
            }, 2000); // Wait for particles to die out
        }, 1000); // Emit for 1 second

        // Flash the player mesh
        this.flashBreathReset();
    }

    flashBreathReset() {
        // Store current sprite visibility state
        const wasUpVisible = this.spriteUp.isVisible;
        const wasDownVisible = this.spriteDown.isVisible;
        const currentDirection = this.currentDirection;

        console.log(`[FLASH_RESET] Current direction: ${currentDirection}`);
        console.log(`[FLASH_RESET] Sprite UP visible before flash: ${wasUpVisible}`);
        console.log(`[FLASH_RESET] Sprite DOWN visible before flash: ${wasDownVisible}`);

        // Flash the player sprites blue to indicate breath reset
        const flashColor = new BABYLON.Color3(0.3, 0.7, 1.0); // Blue tint

        // Store original colors
        const originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
        const originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

        // Apply blue tint
        this.spriteUp.color = flashColor;
        this.spriteDown.color = flashColor;

        // CRITICAL: Force the correct sprite to be visible
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
        }

        console.log(`[FLASH_RESET] Forced sprite visibility during flash`);

        // Return to original color after a short time
        setTimeout(() => {
            // Restore original colors
            if (this.spriteUp) this.spriteUp.color = originalUpColor;
            if (this.spriteDown) this.spriteDown.color = originalDownColor;

            // CRITICAL: Ensure correct sprite visibility
            if (this.currentDirection === "up") {
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;
            } else {
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;
            }

            console.log(`[FLASH_RESET] Restored sprite visibility after flash`);
        }, 500);
    }

    flashFoodPickup() {
        console.log(`[FLASH_FOOD] Starting food pickup flash effect`);

        // Flash the player sprites green to indicate food pickup
        const flashColor = new BABYLON.Color3(0.3, 1.0, 0.3); // Green tint

        // Store original colors
        const originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
        const originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

        try {
            // Apply green tint
            this.spriteUp.color = flashColor;
            this.spriteDown.color = flashColor;

            // CRITICAL: Force the correct sprite to be visible using the dedicated method
            this.enforceCorrectSpriteVisibility();

            console.log(`[FLASH_FOOD] Applied flash effect, UP visible=${this.spriteUp.isVisible}, DOWN visible=${this.spriteDown.isVisible}`);

            // Return to original color after a short time
            setTimeout(() => {
                try {
                    // Restore original colors
                    if (this.spriteUp) this.spriteUp.color = originalUpColor;
                    if (this.spriteDown) this.spriteDown.color = originalDownColor;

                    // CRITICAL: Force the correct sprite to be visible using the dedicated method
                    this.enforceCorrectSpriteVisibility();

                    console.log(`[FLASH_FOOD] Restored colors after flash, UP visible=${this.spriteUp.isVisible}, DOWN visible=${this.spriteDown.isVisible}`);
                } catch (error) {
                    console.error(`[FLASH_FOOD] Error restoring colors:`, error);
                }
            }, 200);
        } catch (error) {
            console.error(`[FLASH_FOOD] Error applying flash effect:`, error);
        }
    }

    consumeFood() {
        if (this.collectedFoods.length > 0) {
            // Consume the first food in the collection
            const food = this.collectedFoods.shift();
            this.consumedFoods++;

            console.log("Food consumed:", food, "Total consumed:", this.consumedFoods);

            // Increase breath range
            const oldRange = this.breathRange;
            this.breathRange = Math.min(this.breathRange + BREATH_INCREASE_PER_FOOD, MAX_BREATH_RANGE);
            console.log("Breath range increased from", oldRange, "to", this.breathRange);

            // Increase zombie speed based on breath range
            this.updateZombieSpeed();

            // Check if we should enter fart mode
            if (this.consumedFoods >= FART_THRESHOLD && !this.inFartMode) {
                this.activateFartMode();
            }

            // Flash the player mesh to indicate food consumption
            this.flashFoodConsumption();

            // Play pickup sound
            if (this.audioSystem) {
                this.audioSystem.playPickupSound();
            }

            return food;
        } else {
            console.log("No food to consume");
        }
        return null;
    }

    updateZombieSpeed() {
        // Calculate a speed multiplier based on breath range
        // As breath range increases from MIN to MAX, zombie speed increases by up to 100%
        const speedIncreaseFactor = (this.breathRange - MIN_BREATH_RANGE) / (MAX_BREATH_RANGE - MIN_BREATH_RANGE);
        const speedMultiplier = 1 + speedIncreaseFactor; // 1.0 to 2.0

        // Update the zombie speed in the scene
        if (this.scene && this.scene.updateZombieSpeed) {
            this.scene.updateZombieSpeed(speedMultiplier);
        }

        // Check if we've reached max breath range for horde mode
        if (this.breathRange >= MAX_BREATH_RANGE && this.scene && this.scene.setHordeModeActive) {
            this.scene.setHordeModeActive(true);
        } else if (this.breathRange < MAX_BREATH_RANGE && this.scene && this.scene.setHordeModeActive) {
            this.scene.setHordeModeActive(false);
        }
    }

    flashFoodConsumption() {
        // Store current sprite visibility state
        const wasUpVisible = this.spriteUp.isVisible;
        const wasDownVisible = this.spriteDown.isVisible;
        const currentDirection = this.currentDirection;

        console.log(`[FLASH_CONSUME] Current direction: ${currentDirection}`);
        console.log(`[FLASH_CONSUME] Sprite UP visible before flash: ${wasUpVisible}`);
        console.log(`[FLASH_CONSUME] Sprite DOWN visible before flash: ${wasDownVisible}`);

        // Flash the player sprites yellow to indicate food consumption
        const flashColor = new BABYLON.Color3(1, 1, 0.3); // Yellow tint

        // Store original colors
        const originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
        const originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

        // Apply yellow tint
        this.spriteUp.color = flashColor;
        this.spriteDown.color = flashColor;

        // CRITICAL: Force the correct sprite to be visible
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
        }

        console.log(`[FLASH_CONSUME] Forced sprite visibility during flash`);

        // Return to original color after a short time
        setTimeout(() => {
            // Restore original colors
            if (this.spriteUp) this.spriteUp.color = originalUpColor;
            if (this.spriteDown) this.spriteDown.color = originalDownColor;

            // CRITICAL: Ensure correct sprite visibility
            if (this.currentDirection === "up") {
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;
            } else {
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;
            }

            console.log(`[FLASH_CONSUME] Restored sprite visibility after flash`);
        }, 300);
    }

    activateFartMode() {
        console.log("[FART_START] Entering fart mode");
        console.log("[FART_START] Current health:", this.health);
        console.log("[FART_START] Current position:", this.mesh.position.toString());

        // Store current sprite visibility state
        const wasUpVisible = this.spriteUp.isVisible;
        const wasDownVisible = this.spriteDown.isVisible;
        const currentDirection = this.currentDirection;
        console.log(`[FART_START] Current direction: ${currentDirection}`);
        console.log(`[FART_START] Sprite UP visible: ${wasUpVisible}`);
        console.log(`[FART_START] Sprite DOWN visible: ${wasDownVisible}`);

        this.inFartMode = true;
        this.fartTimeLeft = FART_DURATION;

        // Start the particle system
        if (this.fartParticleSystem) {
            this.fartParticleSystem.start();
        }

        // Store original colors
        this._originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
        this._originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

        // Apply green tint
        const fartColor = new BABYLON.Color3(0.3, 0.7, 0.3);
        this.spriteUp.color = fartColor;
        this.spriteDown.color = fartColor;

        // CRITICAL: Force the correct sprite to be visible immediately
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
        }
        console.log(`[FART_START] Forced sprite visibility immediately after fart mode activation`);
        console.log(`[FART_START] Sprite UP visible: ${this.spriteUp.isVisible}`);
        console.log(`[FART_START] Sprite DOWN visible: ${this.spriteDown.isVisible}`);

        // Play fart sound
        if (this.audioSystem) {
            this.audioSystem.playFartSound();
        }

        // Create a visual indicator for the fart range
        this.createFartRangeIndicator();
    }

    createFartRangeIndicator() {
        // Create a transparent disc to show the fart range
        this.fartRangeIndicator = BABYLON.MeshBuilder.CreateDisc("fartRangeIndicator", {
            radius: FART_RANGE,
            tessellation: 64
        }, this.scene);

        // Position it at ground level
        this.fartRangeIndicator.position = new BABYLON.Vector3(
            this.mesh.position.x,
            0.05, // Slightly above ground to avoid z-fighting
            this.mesh.position.z
        );

        // Rotate it to be flat on the ground
        this.fartRangeIndicator.rotation.x = Math.PI / 2;

        // Create a semi-transparent material
        const fartRangeMaterial = new BABYLON.StandardMaterial("fartRangeMaterial", this.scene);
        fartRangeMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.3); // Green
        fartRangeMaterial.alpha = 0.3; // Very transparent
        fartRangeMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1); // Slight glow
        this.fartRangeIndicator.material = fartRangeMaterial;

        // Make it follow the player
        this.fartRangeUpdateObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.fartRangeIndicator && this.mesh) {
                this.fartRangeIndicator.position.x = this.mesh.position.x;
                this.fartRangeIndicator.position.z = this.mesh.position.z;
            }
        });
    }

    deactivateFartMode() {
        // Store current sprite visibility state before deactivating
        const wasUpVisible = this.spriteUp.isVisible;
        const wasDownVisible = this.spriteDown.isVisible;
        const currentDirection = this.currentDirection;

        console.log("[FART_END] Deactivating fart mode");
        console.log(`[FART_END] Current direction: ${currentDirection}`);
        console.log(`[FART_END] Sprite UP visible: ${wasUpVisible}`);
        console.log(`[FART_END] Sprite DOWN visible: ${wasDownVisible}`);

        this.inFartMode = false;
        this.consumedFoods = 0;

        // Stop the particle system
        if (this.fartParticleSystem) {
            this.fartParticleSystem.stop();
        }

        // Restore original sprite colors
        if (this.spriteUp && this._originalUpColor) {
            this.spriteUp.color = this._originalUpColor;
        }

        if (this.spriteDown && this._originalDownColor) {
            this.spriteDown.color = this._originalDownColor;
        }

        // CRITICAL: Force the correct sprite to be visible immediately
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
        }
        console.log(`[FART_END] Forced sprite visibility immediately after fart mode deactivation`);
        console.log(`[FART_END] Sprite UP visible: ${this.spriteUp.isVisible}`);
        console.log(`[FART_END] Sprite DOWN visible: ${this.spriteDown.isVisible}`);

        // Remove the fart range indicator
        if (this.fartRangeIndicator) {
            this.fartRangeIndicator.dispose();
            this.fartRangeIndicator = null;
        }

        // Remove the update observer
        if (this.fartRangeUpdateObserver) {
            this.scene.onBeforeRenderObservable.remove(this.fartRangeUpdateObserver);
            this.fartRangeUpdateObserver = null;
        }
    }

    takeDamage() {
        // Add a small cooldown to prevent multiple hits at once
        if (this._lastDamageTime && Date.now() - this._lastDamageTime < 1000) {
            console.log("Damage cooldown active, ignoring hit");
            return; // Skip if hit too recently (1 second cooldown)
        }

        this._lastDamageTime = Date.now();
        this.health--;
        console.log(`[HEALTH] Player health reduced to: ${this.health}`);

        // Flash the player to indicate damage
        this.flashDamage();

        // Play damage sound if available
        if (this.audioSystem) {
            this.audioSystem.playDamageSound();
        }
    }

    flashDamage() {
        // Store current sprite visibility state
        const wasUpVisible = this.spriteUp.isVisible;
        const wasDownVisible = this.spriteDown.isVisible;
        const currentDirection = this.currentDirection;

        console.log(`[FLASH_DAMAGE] Current direction: ${currentDirection}`);
        console.log(`[FLASH_DAMAGE] Sprite UP visible before flash: ${wasUpVisible}`);
        console.log(`[FLASH_DAMAGE] Sprite DOWN visible before flash: ${wasDownVisible}`);

        // Flash the player sprites red to indicate damage
        const flashColor = new BABYLON.Color3(1, 0.3, 0.3); // Red tint

        // Store original colors
        const originalUpColor = this.spriteUp.color ? this.spriteUp.color.clone() : new BABYLON.Color3(1, 1, 1);
        const originalDownColor = this.spriteDown.color ? this.spriteDown.color.clone() : new BABYLON.Color3(1, 1, 1);

        // Apply red tint
        this.spriteUp.color = flashColor;
        this.spriteDown.color = flashColor;

        // CRITICAL: Force the correct sprite to be visible
        if (this.currentDirection === "up") {
            this.spriteUp.isVisible = true;
            this.spriteDown.isVisible = false;
        } else {
            this.spriteDown.isVisible = true;
            this.spriteUp.isVisible = false;
        }

        console.log(`[FLASH_DAMAGE] Forced sprite visibility during flash`);

        // Return to original color after a short time
        setTimeout(() => {
            // Restore original colors
            if (this.spriteUp) this.spriteUp.color = originalUpColor;
            if (this.spriteDown) this.spriteDown.color = originalDownColor;

            // CRITICAL: Ensure correct sprite visibility
            if (this.currentDirection === "up") {
                this.spriteUp.isVisible = true;
                this.spriteDown.isVisible = false;
            } else {
                this.spriteDown.isVisible = true;
                this.spriteUp.isVisible = false;
            }

            console.log(`[FLASH_DAMAGE] Restored sprite visibility after flash`);
        }, 200);
    }

    update(deltaTime) {
        try {
            // CRITICAL: Force sprite visibility at the beginning of every update
            this.enforceCorrectSpriteVisibility();

            // Update jump cooldown
            if (!this.canJump) {
                this.jumpCooldown -= deltaTime;
                if (this.jumpCooldown <= 0) {
                    this.canJump = true;
                    this.jumpCooldown = 0;
                }
            }

            // Update run duration and cooldown
            if (this.isRunning) {
                this.runTimeLeft -= deltaTime;
                if (this.runTimeLeft <= 0) {
                    this.isRunning = false;
                    this.speed = this.baseSpeed;
                    this.runCooldown = RUN_COOLDOWN;
                }
            } else if (this.runCooldown > 0) {
                this.runCooldown -= deltaTime;
            }

            // Update fart mode
            if (this.inFartMode) {
                this.fartTimeLeft -= deltaTime;
                if (this.fartTimeLeft <= 0) {
                    this.deactivateFartMode();
                }
            }

            // Update active breath attacks
            for (let i = this.activeBreathAttacks.length - 1; i >= 0; i--) {
                const attack = this.activeBreathAttacks[i];
                attack.move();

                // Remove disposed attacks
                if (attack.isDisposed) {
                    this.activeBreathAttacks.splice(i, 1);
                }
            }

            // CRITICAL: Force sprite visibility at the end of every update as well
            this.enforceCorrectSpriteVisibility();
        } catch (error) {
            console.error(`[UPDATE] Error in player update:`, error);
        }
    }

    // CRITICAL: New method to enforce correct sprite visibility
    enforceCorrectSpriteVisibility() {
        try {
            // Force the mesh to be invisible
            if (this.mesh) {
                this.mesh.isVisible = false;
                this.mesh.visibility = 0;
            }

            // Force the correct sprite to be visible
            if (this.currentDirection === "up") {
                if (this.spriteUp) {
                    this.spriteUp.isVisible = true;
                    this.spriteUp.renderingGroupId = 2;
                    this.spriteUp.depth = 0.1;

                    // Set the correct position with proper height
                    if (this.mesh) {
                        const spritePos = this.mesh.position.clone();
                        spritePos.y = 1; // Set the correct height
                        this.spriteUp.position = spritePos;
                    }
                }

                if (this.spriteDown) {
                    this.spriteDown.isVisible = false;
                }
            } else {
                if (this.spriteDown) {
                    this.spriteDown.isVisible = true;
                    this.spriteDown.renderingGroupId = 2;
                    this.spriteDown.depth = 0.1;

                    // Set the correct position with proper height
                    if (this.mesh) {
                        const spritePos = this.mesh.position.clone();
                        spritePos.y = 1; // Set the correct height
                        this.spriteDown.position = spritePos;
                    }
                }

                if (this.spriteUp) {
                    this.spriteUp.isVisible = false;
                }
            }
        } catch (error) {
            console.error(`[ENFORCE_VISIBILITY] Error enforcing sprite visibility:`, error);
        }
    }

    setupSpriteAnimations() {
        // Set up sprite animations for both up and down sprites

        // Each sprite has 4 frames (0-3)
        // We'll use a custom animation approach for more control
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 250; // 250ms per frame = 4 frames per second
        this.isAnimating = false;

        // Set initial frame
        this.spriteUp.cellIndex = 0;
        this.spriteDown.cellIndex = 0;

        // Disable automatic animation
        this.spriteUp.stopAnimation();
        this.spriteDown.stopAnimation();

        // Add an observer to update sprite positions, handle animation, and ensure visibility
        this.spriteUpdateObserver = this.scene.onBeforeRenderObservable.add(() => {
            // Make sure sprites exist
            if (!this.spriteUp || !this.spriteDown || !this.mesh) return;

            try {
                // CRITICAL: Use the dedicated method to enforce correct sprite visibility
                this.enforceCorrectSpriteVisibility();

                // STEP 3: Handle custom animation timing
                const currentTime = Date.now();

                // Check if we should stop animating
                if (this.isMoving && currentTime - this.lastMoveTime > 100) {
                    this.isMoving = false;
                    this.isAnimating = false;
                    console.log("Stopping animation, player not moving");
                }

                // Update animation frame if we're animating
                if (this.isAnimating && currentTime - this.lastFrameTime > this.frameDuration) {
                    // Time to advance to next frame
                    this.animationFrame = (this.animationFrame + 1) % 4; // Loop through 0-3
                    this.lastFrameTime = currentTime;

                    // Update the current sprite's cell index
                    if (this.currentDirection === "up") {
                        this.spriteUp.cellIndex = this.animationFrame;
                    } else {
                        this.spriteDown.cellIndex = this.animationFrame;
                    }

                    console.log(`Animation frame updated to ${this.animationFrame}`);
                }
            } catch (error) {
                console.error("Error in sprite update observer:", error);
            }
        });
    }

    dispose() {
        // Clean up resources
        if (this.fartParticleSystem) {
            this.fartParticleSystem.dispose();
        }

        // Dispose all active breath attacks
        for (const attack of this.activeBreathAttacks) {
            attack.dispose();
        }

        // Dispose the sprite managers and sprites
        if (this.spriteManagerUp) {
            this.spriteManagerUp.dispose();
        }

        if (this.spriteManagerDown) {
            this.spriteManagerDown.dispose();
        }

        // Dispose the fart range indicator
        if (this.fartRangeIndicator) {
            this.fartRangeIndicator.dispose();
        }

        // Remove any observers
        if (this.fartRangeUpdateObserver) {
            this.scene.onBeforeRenderObservable.remove(this.fartRangeUpdateObserver);
        }

        // Remove sprite update observer
        if (this.spriteUpdateObserver) {
            this.scene.onBeforeRenderObservable.remove(this.spriteUpdateObserver);
        }

        // Dispose the mesh
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}

export { Player };
