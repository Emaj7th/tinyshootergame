import { FOOD_TYPES, SPECIAL_FOOD_TYPE } from '../utils/constants.js';

class Food {
    constructor(scene, position, type = null) {
        this.scene = scene;
        this.position = position;

        // If no type is provided, randomly select one
        this.type = type || FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];

        // Create the food mesh
        this.createMesh();

        // Set up food to disappear after 15 seconds
        this.setupDisappearTimer();
    }

    setupDisappearTimer() {
        // Food disappears after 15 seconds
        this.disappearTimeout = setTimeout(() => {
            this.startFadeOut();
        }, 15000); // 15 seconds
    }

    startFadeOut() {
        // Create a fade-out animation for the food
        console.log(`Food ${this.type} starting to fade out`);

        // Start with full opacity
        let opacity = 1.0;

        // Create an interval to gradually reduce opacity
        this.fadeInterval = setInterval(() => {
            opacity -= 0.05; // Reduce opacity by 5% each step

            if (this.mesh && this.mesh.material) {
                // Set the material's alpha directly
                this.mesh.material.alpha = opacity;
            }

            // When fully transparent, dispose the food
            if (opacity <= 0) {
                clearInterval(this.fadeInterval);
                this.dispose();
                console.log(`Food ${this.type} faded out and disposed`);
            }
        }, 50); // Update every 50ms for smooth fade
    }

    createMesh() {
        // Create a plane for the food sprite
        // Size 0.8 is a good starting point - can be adjusted based on player size
        const size = 1;
        this.mesh = BABYLON.MeshBuilder.CreatePlane(`food-${this.type}`, {
            width: size,
            height: size
        }, this.scene);

        // Position the food
        this.mesh.position = this.position.clone();

        // Make the plane always face the camera (billboarding)
        this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        // Create a material for the food texture
        const material = new BABYLON.StandardMaterial(`food-${this.type}-material`, this.scene);

        // Determine which image to use based on food type
        let imagePath;
        if (this.type === SPECIAL_FOOD_TYPE) {
            // Special food looks exactly like a sandwich
            imagePath = 'assets/images/food_sandwich.png';
        } else {
            switch(this.type) {
                case 'garlic':
                    imagePath = 'assets/images/food_garlic.png';
                    break;
                case 'onion':
                    imagePath = 'assets/images/food_onion.png';
                    break;
                case 'cheese':
                    imagePath = 'assets/images/food_cheese.png';
                    break;
                case 'coffee':
                    imagePath = 'assets/images/food_coffee.png';
                    break;
                case 'sandwich':
                    imagePath = 'assets/images/food_sandwich.png';
                    break;
                default:
                    // Default to sandwich if type is unknown
                    imagePath = 'assets/images/food_sandwich.png';
            }
        }

        // Set the texture
        material.diffuseTexture = new BABYLON.Texture(imagePath, this.scene);

        // Enable transparency for the PNG
        material.diffuseTexture.hasAlpha = true;
        material.useAlphaFromDiffuseTexture = true;
        material.backFaceCulling = false;

        // Disable lighting effects on the sprite
        material.emissiveColor = new BABYLON.Color3(1, 1, 1); // Full brightness
        material.disableLighting = true;

        // Apply the material to the mesh
        this.mesh.material = material;

        // Add a small animation to make the food float up and down
        this.startFloatingAnimation();

        // Add a rotation animation for more visibility
        this.startRotationAnimation();

        console.log(`Created food sprite for ${this.type} using image: ${imagePath}`);
    }

    startRotationAnimation() {
        // For billboarded planes, we'll rotate the texture instead of the mesh
        // This creates a spinning effect while still facing the camera
        const rotationSpeed = this.type === SPECIAL_FOOD_TYPE ? 0.03 : 0.01; // Faster rotation for special food

        // Add an observer to the scene's onBeforeRenderObservable
        this.rotationObserver = this.scene.onBeforeRenderObservable.add(() => {
            // If we have a texture, rotate it
            if (this.mesh.material && this.mesh.material.diffuseTexture) {
                // Rotate the UV coordinates of the texture
                this.mesh.material.diffuseTexture.uRotationCenter = 0.5;
                this.mesh.material.diffuseTexture.vRotationCenter = 0.5;
                this.mesh.material.diffuseTexture.uRotationSpeed = rotationSpeed;
            }
        });
    }

    // Special food no longer has particles
    // createSpecialFoodParticles() {
    //    // Removed - special food should look like a normal sandwich
    // }

    startFloatingAnimation() {
        // Create an animation to make the food float up and down
        const amplitude = 0.1; // How high it floats
        const speed = 0.005; // How fast it floats

        // Store the original y position
        const originalY = this.mesh.position.y;

        // Add an observer to the scene's onBeforeRenderObservable
        this.animationObserver = this.scene.onBeforeRenderObservable.add(() => {
            // Calculate the new y position using a sine wave
            const newY = originalY + Math.sin(this.scene.getEngine().getFps() * speed) * amplitude;
            this.mesh.position.y = newY;
        });
    }

    dispose() {
        // Remove the animation observers
        if (this.animationObserver) {
            this.scene.onBeforeRenderObservable.remove(this.animationObserver);
        }

        if (this.rotationObserver) {
            this.scene.onBeforeRenderObservable.remove(this.rotationObserver);
        }

        // Clear the disappear timer
        if (this.disappearTimeout) {
            clearTimeout(this.disappearTimeout);
        }

        // Clear the fade interval
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        // Dispose the particle system
        if (this.particleSystem) {
            this.particleSystem.stop();
            this.particleSystem.dispose();
        }

        // Dispose the mesh
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}

export { Food };
