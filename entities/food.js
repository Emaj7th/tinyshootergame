import { FOOD_TYPES, SPECIAL_FOOD_TYPE, MIN_BREATH_RANGE } from '../utils/constants.js';

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
        // Create a different shape based on food type for better visual distinction
        if (this.type === SPECIAL_FOOD_TYPE || this.type === 'sandwich') {
            // Create a simple rectangle for both sandwich and special food
            this.mesh = BABYLON.MeshBuilder.CreateBox(`food-${this.type}`, {width: 0.8, height: 0.2, depth: 0.6}, this.scene);
        } else {
            switch(this.type) {
                case 'garlic':
                    // Create a sphere for garlic
                    this.mesh = BABYLON.MeshBuilder.CreateSphere(`food-${this.type}`, {diameter: 0.8}, this.scene);
                    break;
                case 'onion':
                    // Create a torus for onion
                    this.mesh = BABYLON.MeshBuilder.CreateTorus(`food-${this.type}`, {diameter: 0.8, thickness: 0.3}, this.scene);
                    break;
                case 'cheese':
                    // Create a box for cheese
                    this.mesh = BABYLON.MeshBuilder.CreateBox(`food-${this.type}`, {size: 0.8}, this.scene);
                    break;
                case 'coffee':
                    // Create a cylinder for coffee
                    this.mesh = BABYLON.MeshBuilder.CreateCylinder(`food-${this.type}`, {height: 0.8, diameter: 0.6}, this.scene);
                    break;
                // Sandwich case is handled above
                // case 'sandwich':
                //    this.mesh = BABYLON.MeshBuilder.CreateBox(`food-${this.type}`, {width: 0.8, height: 0.2, depth: 0.6}, this.scene);
                //    break;
                default:
                    // Default to a box
                    this.mesh = BABYLON.MeshBuilder.CreateBox(`food-${this.type}`, {size: 0.8}, this.scene);
            }
        }

        this.mesh.position = this.position.clone();

        // Create a material for the food based on its type
        const material = new BABYLON.StandardMaterial(`food-${this.type}-material`, this.scene);

        // Set color based on food type
        if (this.type === SPECIAL_FOOD_TYPE) {
            // Special food looks exactly like a sandwich
            material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4); // Same as sandwich
            material.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1); // Same as sandwich
        } else {
            switch(this.type) {
                case 'garlic':
                    material.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.8); // Off-white
                    material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1); // Slight glow
                    break;
                case 'onion':
                    material.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.8); // Light purple
                    material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.2); // Slight glow
                    break;
                case 'cheese':
                    material.diffuseColor = new BABYLON.Color3(1.0, 0.8, 0.0); // Yellow
                    material.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.0); // Slight glow
                    break;
                case 'coffee':
                    material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1); // Brown
                    material.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.0); // Slight glow
                    break;
                case 'sandwich':
                    material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4); // Tan
                    material.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0.1); // Slight glow
                    break;
                default:
                    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gray
            }
        }

        this.mesh.material = material;

        // Add a small animation to make the food float up and down
        this.startFloatingAnimation();

        // Add a rotation animation for more visibility
        this.startRotationAnimation();
    }

    startRotationAnimation() {
        // Create an animation to make the food rotate
        const rotationSpeed = this.type === SPECIAL_FOOD_TYPE ? 0.03 : 0.01; // Faster rotation for special food

        // Add an observer to the scene's onBeforeRenderObservable
        this.rotationObserver = this.scene.onBeforeRenderObservable.add(() => {
            // Rotate the mesh
            this.mesh.rotation.y += rotationSpeed;
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
