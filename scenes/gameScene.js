import { Player } from '../entities/player.js';
import { Zombie } from '../entities/zombie.js';
import { Food } from '../entities/food.js';
import { InputSystem } from '../systems/inputSystem.js';
import { CollisionSystem } from '../systems/collisionSystem.js';
import { UISystem } from '../systems/uiSystem.js';
import { AudioSystem } from '../systems/audioSystem.js';
import {
    FOOD_SPAWN_INTERVAL,
    SPECIAL_FOOD_TYPE,
    ZOMBIE_SPEED,
    ZOMBIE_SPEED_INCREASE_INTERVAL,
    ZOMBIE_SPEED_INCREASE_FACTOR
} from '../utils/constants.js';

async function createGameScene(scene, canvas) {
    // CRITICAL: Enable collision detection for the scene
    scene.collisionsEnabled = true;

    // Create the advanced texture for the UI
    scene.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Create the ground with tiled texture
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50, subdivisions: 2}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);

    // Load the ground texture
    const groundTexture = new BABYLON.Texture("assets/images/texture_ground.png", scene);
    groundTexture.uScale = 5; // Tile the texture 5 times in the U direction (2x larger)
    groundTexture.vScale = 5; // Tile the texture 5 times in the V direction (2x larger)

    // Apply the texture to the ground material
    groundMaterial.diffuseTexture = groundTexture;
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Reduce shininess

    // Apply the material to the ground
    ground.material = groundMaterial;

    console.log("Ground texture applied and tiled");

    // Add some obstacles
    createObstacles(scene);

    // Initialize audio system first so it can be used by other systems
    const audioSystem = new AudioSystem(scene);

    // Set up game state variables
    scene.zombiesKilled = 0; // Track zombie kills
    scene.isHordeModeActive = false; // Track horde mode state
    scene.baseZombieSpeed = ZOMBIE_SPEED; // Store the base zombie speed

    // Add methods to update zombie speed and horde mode
    scene.updateZombieSpeed = function(speedMultiplier) {
        // Update speed for all existing zombies
        for (const zombie of zombies) {
            zombie.speed = scene.baseZombieSpeed * speedMultiplier;
        }
        console.log(`Updated zombie speed with multiplier: ${speedMultiplier}`);
    };

    scene.setHordeModeActive = function(active) {
        // Only trigger if state is changing
        if (scene.isHordeModeActive !== active) {
            scene.isHordeModeActive = active;
            console.log(`Horde mode ${active ? 'activated' : 'deactivated'}!`);

            // If activating horde mode, spawn a large group of zombies
            if (active) {
                // Spawn 20-30 zombies at once
                const hordeSize = Math.floor(Math.random() * 11) + 20; // Random between 20-30
                console.log(`Spawning horde of ${hordeSize} zombies!`);

                for (let i = 0; i < hordeSize; i++) {
                    spawnZombie(scene, player, zombies, collisionSystem, audioSystem);
                }
            }
        }
    };

    // Initialize the player
    const player = new Player(scene, audioSystem);

    // Ensure player starts with full health
    player.health = player.maxHealth;
    console.log("Player health reset to maximum:", player.health);

    // Initialize zombies array
    const zombies = [];

    // Create initial zombies - increased count
    for (let i = 0; i < 10; i++) {
        const zombie = new Zombie(scene, player, audioSystem);
        zombies.push(zombie);
    }

    // Initialize food items array
    const foods = [];

    // Create initial food items - reduced to 0 since player starts with 1
    for (let i = 0; i < 0; i++) { // No initial food spawns
        const position = new BABYLON.Vector3(
            (Math.random() - 0.5) * 30,
            0.5, // Increased height for better visibility
            (Math.random() - 0.5) * 30
        );

        // Create a random food type
        const foodTypes = ['garlic', 'onion', 'cheese', 'coffee', 'sandwich'];
        const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];

        const food = new Food(scene, position, randomType);
        foods.push(food);
        console.log("Created initial food:", randomType, "at position:", position.toString());
    }

    // Initialize input system
    const inputSystem = new InputSystem(scene, player, canvas);

    // Initialize collision system
    const collisionSystem = new CollisionSystem(scene, player, zombies, foods);

    // Initialize UI system
    const uiSystem = new UISystem(scene, player);

    // Set up timers for spawning
    let lastFoodSpawnTime = Date.now();
    let lastZombieSpawnTime = Date.now();
    let lastZombieSpeedIncreaseTime = Date.now();
    let lastTime = Date.now();

    // Track zombie speed multiplier
    let zombieSpeedMultiplier = 1.0;
    console.log("Initial zombie speed multiplier:", zombieSpeedMultiplier);

    // Set up the game loop
    scene.onBeforeRenderObservable.add(() => {
        // Skip updates if input system is paused
        if (inputSystem.isPaused) {
            return;
        }

        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Update player
        player.update(deltaTime);

        // Update input system
        inputSystem.update();

        // Update zombies
        for (const zombie of zombies) {
            if (!zombie.isDead) {
                zombie.moveTowardsPlayer();
            }
        }

        // Update collision system
        collisionSystem.update();

        // Update UI system
        uiSystem.update();

        // Spawn new food items periodically
        if (currentTime - lastFoodSpawnTime > FOOD_SPAWN_INTERVAL * 1000) {
            spawnFood(scene, foods, collisionSystem);
            lastFoodSpawnTime = currentTime;
        }

        // Increase zombie speed every 15 seconds
        if (currentTime - lastZombieSpeedIncreaseTime > ZOMBIE_SPEED_INCREASE_INTERVAL) {
            zombieSpeedMultiplier *= ZOMBIE_SPEED_INCREASE_FACTOR;
            console.log(`Increasing zombie speed! New multiplier: ${zombieSpeedMultiplier.toFixed(2)}`);

            // Update speed for all existing zombies
            for (const zombie of zombies) {
                if (!zombie.isDead) {
                    zombie.speed = ZOMBIE_SPEED * zombieSpeedMultiplier;
                }
            }

            // Show a notification to the player
            if (uiSystem.showTemporaryMessage) {
                uiSystem.showTemporaryMessage(`Zombies are getting faster! (${Math.round((zombieSpeedMultiplier - 1) * 100)}% increase)`, 2000);
            }

            lastZombieSpeedIncreaseTime = currentTime;
        }

        // Spawn new zombies periodically
        if (currentTime - lastZombieSpawnTime > 2000) { // Every 2 seconds
            // In horde mode, spawn more zombies
            if (scene.isHordeModeActive) {
                // Spawn 3 zombies in horde mode
                for (let i = 0; i < 3; i++) {
                    const zombie = spawnZombie(scene, player, zombies, collisionSystem, audioSystem);
                    // Apply current speed multiplier to new zombie
                    if (zombie) {
                        zombie.speed = ZOMBIE_SPEED * zombieSpeedMultiplier;
                    }
                }
            } else {
                // Normal mode - spawn 2 zombies
                for (let i = 0; i < 2; i++) {
                    const zombie = spawnZombie(scene, player, zombies, collisionSystem, audioSystem);
                    // Apply current speed multiplier to new zombie
                    if (zombie) {
                        zombie.speed = ZOMBIE_SPEED * zombieSpeedMultiplier;
                    }
                }
            }
            lastZombieSpawnTime = currentTime;
        }
    });

    return {
        scene: scene,
        ground: ground,
        player: player,
        zombies: zombies,
        foods: foods,
        inputSystem: inputSystem,
        collisionSystem: collisionSystem,
        uiSystem: uiSystem,
        audioSystem: audioSystem
    };
}

function createObstacles(scene) {
    // Array to store all obstacles for collision detection
    scene.obstacles = [];

    // CRITICAL: Add a debug message to verify this function is being called
    console.log("OBSTACLE CREATION STARTED");

    try {
        // No test box needed anymore
        console.log("Starting car creation...");

        // Now try to create car sprites
        console.log("Creating car sprites...");

        // Create each car with a different image - one at a time to isolate issues
        console.log("Creating car 1...");
        const car1 = createCarImage(scene, new BABYLON.Vector3(10, 0, 8), "assets/images/car_down_1.png");
        console.log("Car 1 created:", car1);

        console.log("Creating car 2...");
        const car2 = createCarImage(scene, new BABYLON.Vector3(-12, 0, -5), "assets/images/car_down_2.png");
        console.log("Car 2 created:", car2);

        console.log("Creating car 3...");
        const car3 = createCarImage(scene, new BABYLON.Vector3(-8, 0, 15), "assets/images/car_down_3.png");
        console.log("Car 3 created:", car3);

        console.log("Creating car 4...");
        const car4 = createCarImage(scene, new BABYLON.Vector3(15, 0, -10), "assets/images/car_down_4.png");
        console.log("Car 4 created:", car4);

        console.log("Creating car 5...");
        const car5 = createCarImage(scene, new BABYLON.Vector3(0, 0, -18), "assets/images/car_down_5.png");
        console.log("Car 5 created:", car5);

        // Log to verify all cars were created
        console.log("All car sprites created successfully");
    } catch (error) {
        console.error("Error creating obstacles:", error);
    }

    // No additional obstacles needed
}

function createCarImage(scene, position, imagePath) {
    console.log(`Creating car at position ${position.toString()} with image ${imagePath}`);

    try {
        // Create a parent container for the car
        const car = new BABYLON.TransformNode("car", scene);
        car.position = position;
        // No rotation - all cars point down as designed

        // Create a plane for the car image - 1/3 bigger as requested
        const carPlane = BABYLON.MeshBuilder.CreatePlane("carPlane", {
            width: 5.33,   // Width of the car (4 * 1.33)
            height: 5.33    // Height of the car (4 * 1.33)
        }, scene);

        // CRITICAL: Rotate the plane to be vertical
        carPlane.rotation.x = Math.PI/2; // Rotate 90 degrees to be vertical

        // Position the plane at the right height
        carPlane.position.y = 2.5; // Raised to be visible (adjusted for larger size)

        // Make the plane a child of the car container
        carPlane.parent = car;

        // Create a material for the car
        const carMaterial = new BABYLON.StandardMaterial("carMaterial", scene);

        // Load the car texture
        console.log(`Loading texture from: ${imagePath}`);
        const carTexture = new BABYLON.Texture(imagePath, scene);
        carMaterial.diffuseTexture = carTexture;

        // Enable alpha for transparent parts of the image
        carMaterial.diffuseTexture.hasAlpha = true;
        carMaterial.useAlphaFromDiffuseTexture = true;

        // Set material properties
        carMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular highlights
        carMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // Full brightness
        carMaterial.backFaceCulling = false; // Visible from both sides

        // Apply the material to the plane
        carPlane.material = carMaterial;
        console.log(`Applied material with texture ${imagePath} to car plane`);

        // Create an invisible collision box for the car
        // Make it 50px narrower on both sides as requested
        const collisionBox = BABYLON.MeshBuilder.CreateBox("carCollision", {
            width: 3.33,   // Width of the car collision (narrower than the visual but 1/3 bigger than before)
            height: 2,      // Height of the car collision
            depth: 6.67     // Length of the car collision (1/3 bigger than before)
        }, scene);

        // Position the collision box at the center of the car
        collisionBox.position.y = 1; // Half the height

        // Make the collision box a child of the car container
        collisionBox.parent = car;

        // Make the collision box invisible
        collisionBox.isVisible = false;

        // CRITICAL: Enable collision detection for the collision box
        collisionBox.checkCollisions = true;

        // Add both the car and its collision box to the obstacles array for collision detection
        scene.obstacles.push(car);
        scene.obstacles.push(collisionBox); // Add the collision box separately to ensure it's checked

        console.log(`Created car at position ${position.toString()}`);

        return car;
    } catch (error) {
        console.error(`Error creating car image:`, error);

        // Create a fallback red box if there's an error - 1/3 bigger
        const fallbackBox = BABYLON.MeshBuilder.CreateBox("fallbackCar", {
            width: 4,      // 1/3 bigger than before
            height: 2.67,   // 1/3 bigger than before
            depth: 8        // 1/3 bigger than before
        }, scene);

        fallbackBox.position = position;
        fallbackBox.position.y = 1.33; // Half height
        // No rotation - all cars point down

        const fallbackMaterial = new BABYLON.StandardMaterial("fallbackMaterial", scene);
        fallbackMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Bright red
        fallbackBox.material = fallbackMaterial;

        // Enable collision detection for the fallback box
        fallbackBox.checkCollisions = true;

        scene.obstacles.push(fallbackBox);

        console.log(`Created fallback car at position ${position.toString()}`);

        return fallbackBox;
    }
}

function spawnFood(scene, foods, collisionSystem) {
    // Create a new food item at a random position
    // Use a smaller area to make food more visible and accessible
    const position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 30,
        0.5, // Increased height for better visibility
        (Math.random() - 0.5) * 30
    );

    // Determine if this should be a special food (20% chance)
    const isSpecialFood = Math.random() < 0.2;

    let foodType;
    if (isSpecialFood) {
        // This is a special food that resets breath range
        foodType = SPECIAL_FOOD_TYPE;
        console.log("Spawning SPECIAL food that resets breath range!");
    } else {
        // Create a random regular food type
        const foodTypes = ['garlic', 'onion', 'cheese', 'coffee', 'sandwich'];
        foodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
    }

    const food = new Food(scene, position, foodType);
    foods.push(food);
    collisionSystem.addFood(food);

    console.log("Spawned new food:", foodType, "at position:", position.toString());
}

function spawnZombie(scene, player, zombies, collisionSystem, audioSystem) {
    // Create a new zombie
    const zombie = new Zombie(scene, player, audioSystem);
    zombies.push(zombie);
    collisionSystem.addZombie(zombie);

    // Return the zombie so we can modify it if needed
    return zombie;
}

export { createGameScene };
