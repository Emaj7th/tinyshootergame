import { createGameScene } from './scenes/gameScene.js';
import { MenuScene } from './scenes/menuScene.js';

document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element and create the engine
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    // Game state variables
    let gameScene = null;
    let gameEntities = null;
    let menuScene = null;
    let activeScene = null;
    let mouseHandlers = {};
    let attackInterval = null;

    // Initialize the menu scene
    function initMenu() {
        console.log("Initializing menu scene...");

        // Create the menu scene
        menuScene = new MenuScene(engine, canvas, startGame);

        // Set as active scene
        activeScene = menuScene.scene;
    }

    // Start a new game
    async function startGame() {
        console.log("Starting new game...");

        // Clean up any existing game
        cleanupGame();

        // Create the main scene
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1); // Dark background

        // Set up camera
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -5), scene);
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

        // Set orthographic camera size based on canvas size
        const aspectRatio = canvas.width / canvas.height;
        const orthoSize = 15;
        camera.orthoTop = orthoSize;
        camera.orthoBottom = -orthoSize;
        camera.orthoLeft = -orthoSize * aspectRatio;
        camera.orthoRight = orthoSize * aspectRatio;

        // Make sure the camera is set as the active camera
        scene.activeCamera = camera;

        // Look down at the scene
        camera.rotation.x = Math.PI / 2;

        // Add lighting - reduced brightness to prevent glare
        const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.6; // Reduced from 0.8

        const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0.5, -1, 0.5), scene);
        directionalLight.intensity = 0.3; // Reduced from 0.5

        // Load the game scene and entities
        console.log("Loading game scene with canvas...");
        gameEntities = await createGameScene(scene, canvas);
        gameScene = scene;
        activeScene = scene; // Set as the active scene for rendering

        // Make camera follow player
        scene.onBeforeRenderObservable.add(() => {
            if (gameEntities && gameEntities.player) {
                const playerPos = gameEntities.player.mesh.position;
                camera.position.x = playerPos.x;
                camera.position.z = playerPos.z - 5; // Offset slightly
            }
        });

        // Set up game over handler
        if (gameEntities.uiSystem) {
            gameEntities.uiSystem.onGameOver = handleGameOver;
        }

        // Set up input handlers
        setupInputHandlers();
    }

    // Handle game over
    function handleGameOver() {
        console.log(`[RESTART] handleGameOver called at ${Date.now()}`);

        try {
            const finalScore = gameEntities?.scene?.zombiesKilled || 0;
            console.log(`[RESTART] Final score: ${finalScore}`);

            cleanupGame();
            console.log(`[RESTART] Game cleanup completed`);

            initMenu();
            console.log(`[RESTART] Menu initialized`);

            if (menuScene) {
                console.log(`[RESTART] Showing game over screen in menu`);
                menuScene.showGameOver(finalScore);
            }
        } catch (error) {
            console.error(`[RESTART] Error in handleGameOver:`, error);
        }
    }

    // Clean up the current game
    function cleanupGame() {
        // Only log detailed cleanup if we actually have a game to clean up
        const hasGameToCleanup = gameScene !== null || gameEntities !== null;

        if (hasGameToCleanup) {
            console.log("Starting game cleanup...");
        }

        try {
            // Remove input handlers
            if (hasGameToCleanup) {
                console.log("Removing input handlers...");
            }
            removeInputHandlers();

            // Clear attack interval
            if (attackInterval) {
                console.log("Clearing attack interval...");
                clearInterval(attackInterval);
                attackInterval = null;
            }

            // Dispose the game scene
            if (gameScene) {
                console.log("Disposing game scene...");
                gameScene.dispose();
                gameScene = null;
            } else if (hasGameToCleanup) {
                console.warn("Game scene already null during cleanup");
            }

            // Clear game entities
            if (gameEntities) {
                console.log("Clearing game entities reference...");
                gameEntities = null;
            }

            if (hasGameToCleanup) {
                console.log("Game cleanup completed successfully");
            }
        } catch (error) {
            console.error("Error during game cleanup:", error);
        }
    }

    // Set up input handlers for the game
    function setupInputHandlers() {
        // Mouse down handler
        mouseHandlers.down = function(evt) {
            if (evt.button === 0) { // Left mouse button
                mouseHandlers.isMouseDown = true;
                if (gameEntities && gameEntities.player) {
                    gameEntities.player.attack();
                }
                evt.preventDefault();
                return false;
            }
        };

        // Mouse up handler
        mouseHandlers.up = function(evt) {
            if (evt.button === 0) { // Left mouse button
                mouseHandlers.isMouseDown = false;
                evt.preventDefault();
                return false;
            }
        };

        // Click handler
        mouseHandlers.click = function() {
            if (gameEntities && gameEntities.player) {
                gameEntities.player.attack();
            }
        };

        // Add event listeners
        document.addEventListener('mousedown', mouseHandlers.down, false);
        document.addEventListener('mouseup', mouseHandlers.up, false);
        canvas.addEventListener('mousedown', mouseHandlers.down, false);
        canvas.addEventListener('mouseup', mouseHandlers.up, false);
        window.addEventListener('mousedown', mouseHandlers.down, false);
        window.addEventListener('mouseup', mouseHandlers.up, false);
        canvas.addEventListener('click', mouseHandlers.click, false);

        // Set up attack interval
        attackInterval = setInterval(function() {
            if (mouseHandlers.isMouseDown && gameEntities && gameEntities.player) {
                gameEntities.player.attack();
            }
        }, 200);

        // Keyboard handler for sound toggle
        mouseHandlers.keydown = function(evt) {
            // 'M' key to mute/unmute
            if (evt.key === 'm' || evt.key === 'M') {
                if (gameEntities && gameEntities.audioSystem) {
                    const soundsEnabled = gameEntities.audioSystem.toggleSounds();
                    console.log(`Sounds ${soundsEnabled ? 'enabled' : 'disabled'}`);
                }
            }
        };

        // Add keyboard event listener
        window.addEventListener('keydown', mouseHandlers.keydown, false);
    }

    // Remove input handlers
    function removeInputHandlers() {
        if (mouseHandlers.down) {
            document.removeEventListener('mousedown', mouseHandlers.down, false);
            canvas.removeEventListener('mousedown', mouseHandlers.down, false);
            window.removeEventListener('mousedown', mouseHandlers.down, false);
        }

        if (mouseHandlers.up) {
            document.removeEventListener('mouseup', mouseHandlers.up, false);
            canvas.removeEventListener('mouseup', mouseHandlers.up, false);
            window.removeEventListener('mouseup', mouseHandlers.up, false);
        }

        if (mouseHandlers.click) {
            canvas.removeEventListener('click', mouseHandlers.click, false);
        }

        if (mouseHandlers.keydown) {
            window.removeEventListener('keydown', mouseHandlers.keydown, false);
        }

        // Reset mouse handlers
        mouseHandlers = {};
    }

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

    // Start with the menu
    initMenu();

    // Set up a single render loop for the entire application
    engine.runRenderLoop(function() {
        if (activeScene) {
            activeScene.render();
        }
    });
});
