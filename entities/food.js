import { FOOD_TYPES } from '../utils/constants.js';

class Food {
    constructor(scene, position, type = null) {
        this.scene = scene;
        this.position = position;

        // If no type is provided, randomly select one
        this.type = type || FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];

        // Create the food mesh
        this.createMesh();
    }

    createMesh() {
        // Create a different shape based on food type for better visual distinction
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
            case 'sandwich':
                // Create a disc for sandwich
                this.mesh = BABYLON.MeshBuilder.CreateDisc(`food-${this.type}`, {radius: 0.6}, this.scene);
                break;
            default:
                // Default to a box
                this.mesh = BABYLON.MeshBuilder.CreateBox(`food-${this.type}`, {size: 0.8}, this.scene);
        }

        this.mesh.position = this.position.clone();

        // Create a material for the food based on its type
        const material = new BABYLON.StandardMaterial(`food-${this.type}-material`, this.scene);

        // Set color based on food type
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

        this.mesh.material = material;

        // Add a small animation to make the food float up and down
        this.startFloatingAnimation();

        // Add a rotation animation for more visibility
        this.startRotationAnimation();
    }

    startRotationAnimation() {
        // Create an animation to make the food rotate
        const rotationSpeed = 0.01;

        // Add an observer to the scene's onBeforeRenderObservable
        this.rotationObserver = this.scene.onBeforeRenderObservable.add(() => {
            // Rotate the mesh
            this.mesh.rotation.y += rotationSpeed;
        });
    }

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

        // Dispose the mesh
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}

export { Food };
