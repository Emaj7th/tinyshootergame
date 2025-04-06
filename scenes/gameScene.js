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
    // Create the advanced texture for the UI
    scene.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Create the ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50, subdivisions: 2}, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.1); // Dark green for grass

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

    // Create car-like obstacles at different positions and rotations
    createCar(scene, new BABYLON.Vector3(10, 0, 8), 0, new BABYLON.Color3(0.8, 0.1, 0.1)); // Red car
    createCar(scene, new BABYLON.Vector3(-12, 0, -5), Math.PI / 4, new BABYLON.Color3(0.1, 0.1, 0.8)); // Blue car
    createCar(scene, new BABYLON.Vector3(-8, 0, 15), Math.PI / 2, new BABYLON.Color3(0.1, 0.7, 0.1)); // Green car
    createCar(scene, new BABYLON.Vector3(15, 0, -10), Math.PI / 6, new BABYLON.Color3(0.8, 0.8, 0.1)); // Yellow car
    createCar(scene, new BABYLON.Vector3(0, 0, -18), Math.PI, new BABYLON.Color3(0.8, 0.4, 0.1)); // Orange car

    // Add a few more obstacles
    // Dumpster
    const dumpster = BABYLON.MeshBuilder.CreateBox("dumpster", {width: 3, height: 2, depth: 5}, scene);
    dumpster.position = new BABYLON.Vector3(-18, 1, 5);
    dumpster.material = new BABYLON.StandardMaterial("dumpsterMat", scene);
    dumpster.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Dark gray
    scene.obstacles.push(dumpster);
}

function createCar(scene, position, rotation, color) {
    // Create a parent container for the car parts
    const car = new BABYLON.TransformNode("car", scene);
    car.position = position;
    car.rotation.y = rotation;

    // Main body of the car
    const carBody = BABYLON.MeshBuilder.CreateBox("carBody", {
        width: 3,      // Width of the car
        height: 1.5,    // Height of the car body
        depth: 6        // Length of the car
    }, scene);
    carBody.position.y = 0.75; // Half the height
    carBody.parent = car;

    // Create a material for the car body
    const bodyMaterial = new BABYLON.StandardMaterial("carBodyMat", scene);
    bodyMaterial.diffuseColor = color;
    carBody.material = bodyMaterial;

    // Create wheels (4 smaller blocks)
    // Front left wheel
    const wheelFL = BABYLON.MeshBuilder.CreateBox("wheelFL", {
        width: 0.8,
        height: 0.8,
        depth: 1
    }, scene);
    wheelFL.position = new BABYLON.Vector3(-1.5, -0.35, 2); // Left front
    wheelFL.parent = car;

    // Front right wheel
    const wheelFR = BABYLON.MeshBuilder.CreateBox("wheelFR", {
        width: 0.8,
        height: 0.8,
        depth: 1
    }, scene);
    wheelFR.position = new BABYLON.Vector3(1.5, -0.35, 2); // Right front
    wheelFR.parent = car;

    // Rear left wheel
    const wheelRL = BABYLON.MeshBuilder.CreateBox("wheelRL", {
        width: 0.8,
        height: 0.8,
        depth: 1
    }, scene);
    wheelRL.position = new BABYLON.Vector3(-1.5, -0.35, -2); // Left rear
    wheelRL.parent = car;

    // Rear right wheel
    const wheelRR = BABYLON.MeshBuilder.CreateBox("wheelRR", {
        width: 0.8,
        height: 0.8,
        depth: 1
    }, scene);
    wheelRR.position = new BABYLON.Vector3(1.5, -0.35, -2); // Right rear
    wheelRR.parent = car;

    // Create a material for the wheels
    const wheelMaterial = new BABYLON.StandardMaterial("wheelMat", scene);
    wheelMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Dark gray/black

    // Apply the wheel material to all wheels
    wheelFL.material = wheelMaterial;
    wheelFR.material = wheelMaterial;
    wheelRL.material = wheelMaterial;
    wheelRR.material = wheelMaterial;

    // Add a windshield
    const windshield = BABYLON.MeshBuilder.CreateBox("windshield", {
        width: 2.5,
        height: 0.8,
        depth: 0.1
    }, scene);
    windshield.position = new BABYLON.Vector3(0, 1.2, 1.5); // Front top
    windshield.parent = car;

    // Create a material for the windshield
    const glassMaterial = new BABYLON.StandardMaterial("glassMat", scene);
    glassMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.8, 1.0); // Light blue
    glassMaterial.alpha = 0.7; // Semi-transparent
    windshield.material = glassMaterial;

    // Add the car to the obstacles array for collision detection
    scene.obstacles.push(car);

    return car;
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
