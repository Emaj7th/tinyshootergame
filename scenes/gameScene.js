import { Player } from '../entities/player.js';
import { Zombie } from '../entities/zombie.js';
import { Food } from '../entities/food.js';
import { InputSystem } from '../systems/inputSystem.js';
import { CollisionSystem } from '../systems/collisionSystem.js';
import { UISystem } from '../systems/uiSystem.js';
import { AudioSystem } from '../systems/audioSystem.js';
import { FOOD_SPAWN_INTERVAL } from '../utils/constants.js';

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

    // Initialize the player
    const player = new Player(scene, audioSystem);

    // Initialize zombies array
    const zombies = [];

    // Create initial zombies
    for (let i = 0; i < 5; i++) {
        const zombie = new Zombie(scene, player, audioSystem);
        zombies.push(zombie);
    }

    // Initialize food items array
    const foods = [];

    // Create initial food items - 3x more food (15 items)
    for (let i = 0; i < 15; i++) {
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
    let lastTime = Date.now();

    // Set up the game loop
    scene.onBeforeRenderObservable.add(() => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
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

        // Spawn new zombies periodically
        if (currentTime - lastZombieSpawnTime > 5000) { // Every 5 seconds
            spawnZombie(scene, player, zombies, collisionSystem, audioSystem);
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
    // Create some obstacles like cars, dumpsters, etc.

    // Car 1
    const car1 = BABYLON.MeshBuilder.CreateBox("car1", {width: 3, height: 1.5, depth: 6}, scene);
    car1.position = new BABYLON.Vector3(10, 0.75, 8);
    car1.material = new BABYLON.StandardMaterial("carMat1", scene);
    car1.material.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red car

    // Car 2
    const car2 = BABYLON.MeshBuilder.CreateBox("car2", {width: 3, height: 1.5, depth: 6}, scene);
    car2.position = new BABYLON.Vector3(-12, 0.75, -5);
    car2.rotation.y = Math.PI / 4; // Rotated 45 degrees
    car2.material = new BABYLON.StandardMaterial("carMat2", scene);
    car2.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.8); // Blue car

    // Dumpster
    const dumpster = BABYLON.MeshBuilder.CreateBox("dumpster", {width: 3, height: 2, depth: 5}, scene);
    dumpster.position = new BABYLON.Vector3(-8, 1, 15);
    dumpster.material = new BABYLON.StandardMaterial("dumpsterMat", scene);
    dumpster.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Dark gray

    // Bus
    const bus = BABYLON.MeshBuilder.CreateBox("bus", {width: 3, height: 3, depth: 12}, scene);
    bus.position = new BABYLON.Vector3(15, 1.5, -10);
    bus.rotation.y = Math.PI / 6; // Slight rotation
    bus.material = new BABYLON.StandardMaterial("busMat", scene);
    bus.material.diffuseColor = new BABYLON.Color3(1, 0.8, 0); // Yellow bus

    // Garbage cans
    for (let i = 0; i < 5; i++) {
        const garbageCan = BABYLON.MeshBuilder.CreateCylinder(
            `garbageCan${i}`,
            {height: 1.5, diameter: 1},
            scene
        );
        garbageCan.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * 40,
            0.75,
            (Math.random() - 0.5) * 40
        );
        garbageCan.material = new BABYLON.StandardMaterial(`garbageCanMat${i}`, scene);
        garbageCan.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Gray
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

    // Create a random food type
    const foodTypes = ['garlic', 'onion', 'cheese', 'coffee', 'sandwich'];
    const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];

    const food = new Food(scene, position, randomType);
    foods.push(food);
    collisionSystem.addFood(food);

    console.log("Spawned new food:", randomType, "at position:", position.toString());
}

function spawnZombie(scene, player, zombies, collisionSystem, audioSystem) {
    // Create a new zombie
    const zombie = new Zombie(scene, player, audioSystem);
    zombies.push(zombie);
    collisionSystem.addZombie(zombie);
}

export { createGameScene };
