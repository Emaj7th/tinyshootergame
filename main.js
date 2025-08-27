
import { createGameScene } from './scenes/gameScene.js';
import { MenuScene } from './scenes/menuScene.js';

document.addEventListener('DOMContentLoaded', function() {
    // Add global error handler to catch any unhandled errors
    window.addEventListener('error', function(event) {
        console.error('[GLOBAL_ERROR] Unhandled JavaScript error:', event.error);
        console.error('[GLOBAL_ERROR] Error message:', event.message);
        console.error('[GLOBAL_ERROR] File:', event.filename, 'Line:', event.lineno);
        // Don't restart automatically - just log the error
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('[GLOBAL_ERROR] Unhandled promise rejection:', event.reason);
        // Don't restart automatically - just log the error
    });

    // --- 1. SETUP ---
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    // Explicitly initialize the audio engine using the factory
    if (!engine.audioEngine) {
        BABYLON.AbstractEngine.audioEngine = BABYLON.AbstractEngine.AudioEngineFactory(engine.getRenderingCanvas(), engine.getAudioContext(), engine.getAudioDestination());
    }

    // Game state variables
    let gameScene = null;
    let gameEntities = null;
    let menuScene = null;
    let activeScene = null;
    let mouseHandlers = {};
    let attackInterval = null;

    // --- 2. FUNCTION DEFINITIONS ---

    function initMenu() {
        console.log("Initializing menu scene...");
        // Dispose previous menu scene if it exists to prevent resource leaks
        if (menuScene && menuScene.scene) {
            menuScene.dispose();
        }
        menuScene = new MenuScene(engine, canvas, startGame);
        activeScene = menuScene.scene;
        console.log("Active scene after initMenu:", activeScene.name);
    }

    async function startGame() {

        // Clean up any existing game state
        cleanupGame();

        // Create the main scene
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

        // Set up camera
        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 20, -5), scene);
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        const aspectRatio = canvas.width / canvas.height;
        const orthoSize = 15;
        camera.orthoTop = orthoSize;
        camera.orthoBottom = -orthoSize;
        camera.orthoLeft = -orthoSize * aspectRatio;
        camera.orthoRight = orthoSize * aspectRatio;
        scene.activeCamera = camera;
        camera.setTarget(BABYLON.Vector3.Zero());

        // Add lighting
        const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.6;
        const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0.5, -1, 0.5), scene);
        directionalLight.intensity = 0.3;

        // Load the game scene and entities
        console.log("Loading game scene with canvas...");
        try {
            gameEntities = await createGameScene(scene, canvas);
            gameScene = scene;
            activeScene = scene;
            console.log("Active scene after startGame:", activeScene.name);
        } catch (error) {
            console.error("Error loading game scene:", error);
            // Optionally, return to menu or display an error message
            initMenu();
            return; // Stop game initialization
        }

        // Play BGM
        if (gameEntities.audioSystem) {
            gameEntities.audioSystem.resumeAudioContext();
            gameEntities.audioSystem.playBGM();
        }

        // Make camera follow player
        scene.onBeforeRenderObservable.add(() => {
            if (gameEntities && gameEntities.player && gameEntities.player.mesh) {
                const playerPos = gameEntities.player.mesh.position;
                camera.position.x = playerPos.x;
                camera.position.z = playerPos.z - 5;
            }
        });

        // Set up game over handler and reset UI state
        if (gameEntities.uiSystem) {
            gameEntities.uiSystem.onGameOver = handleGameOver;
            gameEntities.uiSystem.reset(); // Reset UI state for new game
        }

        // Set up input handlers
        setupInputHandlers();
    }

    function handleGameOver() {
        console.log(`[RESTART] handleGameOver called.`);
        try {
            const finalScore = gameEntities?.scene?.zombiesKilled || 0;
            cleanupGame();
            initMenu();
            if (menuScene) {
                menuScene.showGameOver(finalScore);
            }
        } catch (error) {
            console.error(`[RESTART] Error in handleGameOver:`, error);
        }
    }

    function cleanupGame() {
        if (!gameScene && !gameEntities) {
            console.log("No game state to clean up");
            return; // Nothing to clean up
        }

        console.log("Starting game cleanup...");
        try {
            // Remove input handlers to prevent them from affecting the menu
            removeInputHandlers();

            // Remove game loop observer first to stop all game updates
            if (gameScene && gameEntities && gameEntities.gameLoopObserver) {
                console.log("Removing game loop observer...");
                gameScene.onBeforeRenderObservable.remove(gameEntities.gameLoopObserver);
                gameEntities.gameLoopObserver = null;
            }

            // Dispose all systems and entities created in createGameScene
            if (gameEntities) {
                console.log("Disposing game entities...");
                Object.entries(gameEntities).forEach(([key, entity]) => {
                    try {
                        if (entity && typeof entity.dispose === 'function') {
                            console.log(`Disposing ${key}...`);
                            entity.dispose();
                        }
                    } catch (error) {
                        console.error(`Error disposing ${key}:`, error);
                    }
                });
                gameEntities = null;
            }

            // Dispose the game scene itself
            if (gameScene) {
                console.log("Disposing game scene...");
                gameScene.dispose();
                gameScene = null;
            }

            // Reset active scene reference
            activeScene = null;

            console.log("Game cleanup completed successfully.");
        } catch (error) {
            console.error("Error during game cleanup:", error);
        }
    }

    function setupInputHandlers() {
        // Clear existing handlers to be safe
        removeInputHandlers();

        mouseHandlers.down = function(evt) {
            if (evt.button === 0) { // Left mouse button
                mouseHandlers.isMouseDown = true;
                if (gameEntities && gameEntities.player) {
                    gameEntities.player.attack();
                }
                evt.preventDefault();
            }
        };

        mouseHandlers.up = function(evt) {
            if (evt.button === 0) { // Left mouse button
                mouseHandlers.isMouseDown = false;
                evt.preventDefault();
            }
        };

        mouseHandlers.click = function() {
            if (gameEntities && gameEntities.player) {
                gameEntities.player.attack();
            }
        };

        // Add event listeners
        canvas.addEventListener('mousedown', mouseHandlers.down, false);
        canvas.addEventListener('mouseup', mouseHandlers.up, false);
        canvas.addEventListener('click', mouseHandlers.click, false);
        window.addEventListener('mousedown', mouseHandlers.down, false);
        window.addEventListener('mouseup', mouseHandlers.up, false);

        // Set up attack interval
        attackInterval = setInterval(function() {
            if (mouseHandlers.isMouseDown && gameEntities && gameEntities.player) {
                gameEntities.player.attack();
            }
        }, 200);

        // Keyboard handler for sound toggle
        mouseHandlers.keydown = function(evt) {
            if (evt.key === 'm' || evt.key === 'M') {
                if (gameEntities && gameEntities.audioSystem) {
                    const enabled = gameEntities.audioSystem.toggleSounds();
                    console.log(`Sounds ${enabled ? 'enabled' : 'disabled'}`);
                }
            }
        };
        window.addEventListener('keydown', mouseHandlers.keydown, false);
    }

    function removeInputHandlers() {
        if (mouseHandlers.down) {
            canvas.removeEventListener('mousedown', mouseHandlers.down, false);
            window.removeEventListener('mousedown', mouseHandlers.down, false);
        }
        if (mouseHandlers.up) {
            canvas.removeEventListener('mouseup', mouseHandlers.up, false);
            window.removeEventListener('mouseup', mouseHandlers.up, false);
        }
        if (mouseHandlers.click) {
            canvas.removeEventListener('click', mouseHandlers.click, false);
        }
        if (mouseHandlers.keydown) {
            window.removeEventListener('keydown', mouseHandlers.keydown, false);
        }
        if (attackInterval) {
            clearInterval(attackInterval);
            attackInterval = null;
        }
        mouseHandlers = {};
    }

    // --- 3. INITIALIZATION & MAIN LOOP ---

    // Handle window resize
    window.addEventListener('resize', function() {
        engine.resize();
        if (gameScene && gameScene.activeCamera && gameScene.activeCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
            const aspectRatio = canvas.width / canvas.height;
            const orthoSize = 15;
            gameScene.activeCamera.orthoLeft = -orthoSize * aspectRatio;
            gameScene.activeCamera.orthoRight = orthoSize * aspectRatio;
        }
    });

    // Start the render loop
    engine.runRenderLoop(function() {
        if (activeScene) {
            activeScene.render();
            // console.log("Rendering scene:", activeScene.name);
        }
    });

    // Start with the menu
    initMenu();
});
