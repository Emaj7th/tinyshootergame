import { createGameScene } from './scenes/gameScene.js';

document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element and create the engine
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    // Game state variables
    let gameScene;
    let gameEntities;

    async function initGame() {
        console.log("Initializing game...");
        console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

        // Create the main scene
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1); // Dark background

        // Set up camera
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -5), scene);
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        // Set orthographic camera size based on canvas size
        const aspectRatio = canvas.width / canvas.height;
        const orthoSize = 15; // Base size for view height

        camera.orthoTop = orthoSize;
        camera.orthoBottom = -orthoSize;
        camera.orthoLeft = -orthoSize * aspectRatio;
        camera.orthoRight = orthoSize * aspectRatio;

        // Look down at the scene
        camera.rotation.x = Math.PI / 2;

        // Add lighting
        const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0.5, -1, 0.5), scene);
        directionalLight.intensity = 0.5;

        // Make sure canvas is properly set up for input
        canvas.focus();

        // Load the game scene and entities
        console.log("Loading game scene with canvas...");
        gameEntities = await createGameScene(scene, canvas);
        gameScene = scene;

        // Make camera follow player
        scene.onBeforeRenderObservable.add(() => {
            if (gameEntities && gameEntities.player) {
                const playerPos = gameEntities.player.mesh.position;
                camera.position.x = playerPos.x;
                camera.position.z = playerPos.z - 5; // Offset slightly
            }
        });

        return scene;
    }

    // Initialize the game and start the render loop
    initGame().then(scene => {
        // Start the render loop
        engine.runRenderLoop(function() {
            if (scene) {
                scene.render();
            }
        });

        // Add global mouse event handlers
        let isMouseDown = false;

        document.addEventListener('mousedown', function(evt) {
            if (evt.button === 0) { // Left mouse button
                isMouseDown = true;
                if (gameEntities && gameEntities.player) {
                    gameEntities.player.attack();
                    console.log("Global mouse down - attack");
                }
            }
        });

        document.addEventListener('mouseup', function(evt) {
            if (evt.button === 0) { // Left mouse button
                isMouseDown = false;
            }
        });

        // Add a regular interval to check if mouse is down and trigger attacks
        setInterval(function() {
            if (isMouseDown && gameEntities && gameEntities.player) {
                gameEntities.player.attack();
                console.log("Continuous attack from interval");
            }
        }, 200); // Check every 200ms
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        engine.resize();

        // Update camera aspect ratio on resize
        if (gameScene && gameScene.activeCamera) {
            const aspectRatio = canvas.width / canvas.height;
            const orthoSize = 15;

            gameScene.activeCamera.orthoLeft = -orthoSize * aspectRatio;
            gameScene.activeCamera.orthoRight = orthoSize * aspectRatio;
        }
    });

    // Add keyboard shortcut for sound toggle
    window.addEventListener('keydown', function(evt) {
        // 'M' key to mute/unmute
        if (evt.key === 'm' || evt.key === 'M') {
            if (gameEntities && gameEntities.audioSystem) {
                const soundsEnabled = gameEntities.audioSystem.toggleSounds();
                console.log(`Sounds ${soundsEnabled ? 'enabled' : 'disabled'}`);
            }
        }
    });
});