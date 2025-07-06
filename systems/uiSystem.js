import { MAX_BREATH_RANGE, MIN_BREATH_RANGE } from '../utils/constants.js';

class UISystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Flag to track if game over has been shown
        this.gameOverShown = false;

        // Flag to track if game over callback has been triggered
        this.gameOverCallbackTriggered = false;

        // Callback for game over
        this.onGameOver = null;

        // Create UI container
        this.createUIElements();

        console.log("UI System initialized. Player health:", this.player.health);
    }

    createUIElements() {
        // Create a container for top-left elements
        this.topLeftContainer = new BABYLON.GUI.Grid();
        this.topLeftContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.topLeftContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.topLeftContainer.width = "500px";
        this.topLeftContainer.top = "20px";
        this.topLeftContainer.addColumnDefinition(0.5); // Left column for health
        this.topLeftContainer.addColumnDefinition(0.5); // Right column for score
        this.scene.advancedTexture.addControl(this.topLeftContainer);

        // Health display
        this.createHealthDisplay();

        // Food inventory display
        this.createFoodInventoryDisplay();

        // Create zombie kill counter
        this.createZombieKillCounter();

        // Create bottom info bar with all indicators
        this.createBottomInfoBar();

        // Game over screen (hidden initially)
        this.createGameOverScreen();

        // Create HORDE MODE notification (hidden initially)
        this.createHordeModeNotification();
    }

    createZombieKillCounter() {
        // Create a container for zombie kill counter
        this.killCounterContainer = new BABYLON.GUI.StackPanel();
        this.killCounterContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.killCounterContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        
        // Score counter (zombie kills)
        this.killCounterText = new BABYLON.GUI.TextBlock();
        this.killCounterText.text = "SCORE: 0";
        this.killCounterText.color = "white";
        this.killCounterText.fontSize = 24; // Slightly larger
        this.killCounterText.height = "30px";
        this.killCounterContainer.addControl(this.killCounterText);

        this.topLeftContainer.addControl(this.killCounterContainer, 0, 1); // Add to grid, row 0, col 1
    }

    createHordeModeNotification() {
        // Create a notification for HORDE MODE
        this.hordeModeNotification = new BABYLON.GUI.TextBlock();
        this.hordeModeNotification.text = "HORDE MODE!";
        this.hordeModeNotification.color = "red";
        this.hordeModeNotification.fontSize = 60;
        this.hordeModeNotification.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.hordeModeNotification.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.hordeModeNotification.isVisible = false;
        this.scene.advancedTexture.addControl(this.hordeModeNotification);

        // Create a temporary message text block for notifications
        this.temporaryMessage = new BABYLON.GUI.TextBlock();
        this.temporaryMessage.text = "";
        this.temporaryMessage.color = "black";
        this.temporaryMessage.fontSize = 30;
        this.temporaryMessage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.temporaryMessage.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.temporaryMessage.top = "300px"; // Below the horde mode notification
        this.temporaryMessage.isVisible = false;
        this.scene.advancedTexture.addControl(this.temporaryMessage);
    }

    showTemporaryMessage(message, duration = 2000) {
        // Show a temporary message on screen
        this.temporaryMessage.text = message;
        this.temporaryMessage.isVisible = true;

        // Hide after duration
        if (this._tempMessageTimeout) {
            clearTimeout(this._tempMessageTimeout);
        }

        this._tempMessageTimeout = setTimeout(() => {
            this.temporaryMessage.isVisible = false;
        }, duration);
    }

    createHealthDisplay() {
        // Create a container for health hearts
        const healthCell = new BABYLON.GUI.Rectangle();
        healthCell.width = "100%";
        healthCell.height = "100%";
        healthCell.thickness = 0;
        healthCell.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

        this.healthContainer = new BABYLON.GUI.StackPanel();
        this.healthContainer.isVertical = false;
        this.healthContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.healthContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.healthContainer.top = "-455px";

        // Create heart icons for health
        this.heartIcons = [];
        for (let i = 1; i < this.player.maxHealth; i++) {
            const heart = new BABYLON.GUI.TextBlock();
            heart.text = "❤";
            heart.color = "red";
            heart.fontSize = 30;
            heart.width = "40px";
            heart.height = "40px";
            this.healthContainer.addControl(heart);
            this.heartIcons.push(heart);
        }

        healthCell.addControl(this.healthContainer);
        this.topLeftContainer.addControl(healthCell, 0, 0); // Add to grid, row 0, col 0
    }

    createFoodInventoryDisplay() {
        // Create a container for food items
        this.foodContainer = new BABYLON.GUI.StackPanel();
        this.foodContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.foodContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.foodContainer.top = "20px";
        this.foodContainer.right = "20px";
        this.foodContainer.width = "200px";
        this.scene.advancedTexture.addControl(this.foodContainer);

        // Food inventory title
        this.foodTitle = new BABYLON.GUI.TextBlock();
        this.foodTitle.text = "Food Inventory";
        this.foodTitle.color = "white";
        this.foodTitle.fontSize = 18;
        this.foodTitle.height = "30px";
        this.foodContainer.addControl(this.foodTitle);

        // Food items list
        this.foodList = new BABYLON.GUI.TextBlock();
        this.foodList.text = "No items";
        this.foodList.color = "white";
        this.foodList.fontSize = 16;
        this.foodList.height = "120px";
        this.foodContainer.addControl(this.foodList);

        // Consumed foods counter
        this.consumedFoodsText = new BABYLON.GUI.TextBlock();
        this.consumedFoodsText.text = "Bites Eaten: 0";
        this.consumedFoodsText.color = "white";
        this.consumedFoodsText.fontSize = 16;
        this.consumedFoodsText.height = "30px";
        this.foodContainer.addControl(this.consumedFoodsText);
    }

    createBottomInfoBar() {
        // Create a grid container for the bottom info bar
        this.bottomInfoBar = new BABYLON.GUI.Grid();
        this.bottomInfoBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.bottomInfoBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.bottomInfoBar.bottom = "20px";
        this.bottomInfoBar.width = "90%";
        this.bottomInfoBar.height = "80px";
        this.bottomInfoBar.addColumnDefinition(0.25); // Jump
        this.bottomInfoBar.addColumnDefinition(0.25); // Run
        this.bottomInfoBar.addColumnDefinition(0.25); // Breath Range
        this.bottomInfoBar.addColumnDefinition(0.25); // Fart Mode
        this.scene.advancedTexture.addControl(this.bottomInfoBar);

        // Create individual containers for each element
        this.createJumpIndicator();
        this.createRunIndicator();
        this.createBreathRangeIndicator();
        this.createFartModeIndicator();
    }

    createJumpIndicator() {
        // Create a container for jump cooldown
        const jumpContainer = new BABYLON.GUI.StackPanel();
        jumpContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        jumpContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Jump cooldown text
        this.jumpCooldownText = new BABYLON.GUI.TextBlock();
        this.jumpCooldownText.text = "Jump: Ready";
        this.jumpCooldownText.color = "white";
        this.jumpCooldownText.fontSize = 16;
        this.jumpCooldownText.height = "30px";
        jumpContainer.addControl(this.jumpCooldownText);

        // Add to grid
        this.bottomInfoBar.addControl(jumpContainer, 0, 0);
    }

    createRunIndicator() {
        // Create a container for run cooldown
        const runContainer = new BABYLON.GUI.StackPanel();
        runContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        runContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Run cooldown text
        this.runCooldownText = new BABYLON.GUI.TextBlock();
        this.runCooldownText.text = "Run: Ready";
        this.runCooldownText.color = "white";
        this.runCooldownText.fontSize = 16;
        this.runCooldownText.height = "30px";
        runContainer.addControl(this.runCooldownText);

        // Add to grid
        this.bottomInfoBar.addControl(runContainer, 0, 1);
    }

    createBreathRangeIndicator() {
        // Create a container for breath range
        const breathContainer = new BABYLON.GUI.StackPanel();
        breathContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        breathContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Breath range text
        this.breathRangeText = new BABYLON.GUI.TextBlock();
        this.breathRangeText.text = `Breath Range: ${this.player.breathRange.toFixed(1)}`;
        this.breathRangeText.color = "white";
        this.breathRangeText.fontSize = 16;
        this.breathRangeText.height = "25px";
        breathContainer.addControl(this.breathRangeText);

        // Create a visual indicator bar
        this.breathRangeBar = new BABYLON.GUI.Rectangle();
        this.breathRangeBar.width = "150px";
        this.breathRangeBar.height = "10px";
        this.breathRangeBar.background = "blue";
        this.breathRangeBar.color = "white";
        this.breathRangeBar.cornerRadius = 5;
        breathContainer.addControl(this.breathRangeBar);

        // Create max range indicator
        this.maxRangeBar = new BABYLON.GUI.Rectangle();
        this.maxRangeBar.width = "150px";
        this.maxRangeBar.height = "10px";
        this.maxRangeBar.background = "transparent";
        this.maxRangeBar.color = "white";
        this.maxRangeBar.thickness = 1;
        this.maxRangeBar.cornerRadius = 5;
        breathContainer.addControl(this.maxRangeBar);

        // Add to grid
        this.bottomInfoBar.addControl(breathContainer, 0, 2);
    }

    createFartModeIndicator() {
        // Create a container for fart mode
        const fartContainer = new BABYLON.GUI.StackPanel();
        fartContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        fartContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Fart mode text
        this.fartModeText = new BABYLON.GUI.TextBlock();
        this.fartModeText.text = "Fart Mode: Inactive";
        this.fartModeText.color = "white";
        this.fartModeText.fontSize = 16;
        this.fartModeText.height = "30px";
        fartContainer.addControl(this.fartModeText);

        // Add to grid
        this.bottomInfoBar.addControl(fartContainer, 0, 3);
    }

    createGameOverScreen() {
        // Create a full-screen container for game over
        this.gameOverContainer = new BABYLON.GUI.Rectangle();
        this.gameOverContainer.width = "100%";
        this.gameOverContainer.height = "100%";
        this.gameOverContainer.background = "black";
        this.gameOverContainer.alpha = 0.7;
        this.gameOverContainer.isVisible = false; // Explicitly hide it

        // Force it to be hidden at start
        setTimeout(() => {
            this.gameOverContainer.isVisible = false;
            console.log("Forced game over screen to be hidden");
        }, 100);

        this.scene.advancedTexture.addControl(this.gameOverContainer);

        // Game over text
        this.gameOverText = new BABYLON.GUI.TextBlock();
        this.gameOverText.text = "GAME OVER";
        this.gameOverText.color = "red";
        this.gameOverText.fontSize = 60;
        this.gameOverContainer.addControl(this.gameOverText);

        // Restart button
        this.restartButton = BABYLON.GUI.Button.CreateSimpleButton("restartButton", "Continue");
        this.restartButton.width = "200px";
        this.restartButton.height = "60px";
        this.restartButton.color = "white";
        this.restartButton.background = "green";
        this.restartButton.fontSize = 24;
        this.restartButton.top = "100px";
        this.restartButton.onPointerUpObservable.add(() => {
            // Call the game over callback to return to menu
            console.log("Continue to menu...");
            if (typeof this.onGameOver === 'function') {
                this.onGameOver();
            }
        });
        this.gameOverContainer.addControl(this.restartButton);
    }

    update() {
        // Update health display
        this.updateHealthDisplay();
        this.updateZombieKillCounter();
        this.updateFoodInventory();  // Changed from updateCollectedFoodsDisplay
        this.updateCooldownIndicators(); // This updates fart mode display as well
        this.updateBreathRangeIndicator(); // Update breath range display
        this.updateHordeModeNotification(); // Update horde mode notification

        // Add detailed logging for game over conditions
        if (this.player.health <= 0) {
            console.log("[HEALTH_CHECK] Player health is 0 or less, health value:", this.player.health);
        }

        // Check for game over - only if health is actually 0 or less and game over hasn't been shown yet
        if (this.player.health <= 0 && !this.gameOverShown) {
            console.log("[GAMEOVER_TRIGGER] Game over condition met:");
            console.log("[GAMEOVER_TRIGGER] Player health:", this.player.health);
            console.log("[GAMEOVER_TRIGGER] GameOverShown flag:", this.gameOverShown);
            console.log("[GAMEOVER_TRIGGER] GameOverCallbackTriggered flag:", this.gameOverCallbackTriggered);

            // Double-check that we haven't already shown game over
            if (!this.gameOverShown) {
                console.log("[GAMEOVER_TRIGGER] Calling showGameOver method...");
                this.showGameOver();
            }
        }
    }

    updateZombieKillCounter() {
        if (this.killCounterText && this.scene.zombiesKilled !== undefined) {
            // Format score with leading zeros
            const formattedScore = String(this.scene.zombiesKilled).padStart(4, '0');
            this.killCounterText.text = `SCORE: ${formattedScore}`;
        }
    }

    updateHordeModeNotification() {
        // Show HORDE MODE notification when breath range reaches maximum
        if (this.player.breathRange >= MAX_BREATH_RANGE && !this.hordeModeActive) {
            this.showHordeModeNotification();
            this.hordeModeActive = true;
        } else if (this.player.breathRange < MAX_BREATH_RANGE && this.hordeModeActive) {
            this.hideHordeModeNotification();
            this.hordeModeActive = false;
        }
    }

    showHordeModeNotification() {
        if (this.hordeModeNotification) {
            this.hordeModeNotification.isVisible = true;

            // Hide after 3 seconds
            setTimeout(() => {
                this.hideHordeModeNotification();
            }, 3000);
        }
    }

    hideHordeModeNotification() {
        if (this.hordeModeNotification) {
            this.hordeModeNotification.isVisible = false;
        }
    }

    updateHealthDisplay() {
        // Update heart icons based on current health
        for (let i = 0; i < this.heartIcons.length; i++) {
            if (i < this.player.health) {
                this.heartIcons[i].color = "red";
            } else {
                this.heartIcons[i].color = "gray";
            }
        }
    }

    updateFoodInventory() {
        // Update food list
        if (this.player.collectedFoods.length > 0) {
            // Count occurrences of each food type
            const foodCounts = {};
            for (const food of this.player.collectedFoods) {
                foodCounts[food] = (foodCounts[food] || 0) + 1;
            }

            // Create a formatted list
            let foodListText = "";
            for (const [food, count] of Object.entries(foodCounts)) {
                foodListText += `${food}: ${count}\n`;
            }

            this.foodList.text = foodListText;
        } else {
            this.foodList.text = "No items";
        }

        // Update consumed foods counter
        this.consumedFoodsText.text = `Foods eaten: ${this.player.consumedFoods}`;

        // Highlight if close to fart mode
        if (this.player.consumedFoods >= 4 && !this.player.inFartMode) {
            this.consumedFoodsText.color = "yellow";
        } else {
            this.consumedFoodsText.color = "white";
        }
    }

    updateCooldownIndicators() {
        // Update jump cooldown
        if (this.player.canJump) {
            this.jumpCooldownText.text = "Jump: Ready";
            this.jumpCooldownText.color = "white";
        } else {
            this.jumpCooldownText.text = `Jump: ${this.player.jumpCooldown.toFixed(1)}s`;
            this.jumpCooldownText.color = "yellow";
        }

        // Update run cooldown
        if (this.player.isRunning) {
            this.runCooldownText.text = `Run: ${this.player.runTimeLeft.toFixed(1)}s`;
            this.runCooldownText.color = "green";
        } else if (this.player.runCooldown > 0) {
            this.runCooldownText.text = `Run: ${this.player.runCooldown.toFixed(1)}s`;
            this.runCooldownText.color = "yellow";
        } else {
            this.runCooldownText.text = "Run: Ready";
            this.runCooldownText.color = "white";
        }

        // Update fart mode indicator
        if (this.player.inFartMode) {
            this.fartModeText.text = `Fart Mode: ${this.player.fartTimeLeft.toFixed(1)}s`;
            this.fartModeText.color = "green";
        } else {
            this.fartModeText.text = "Fart Mode: Inactive";
            this.fartModeText.color = "white";
        }
    }

    updateBreathRangeIndicator() {
        // Update text
        this.breathRangeText.text = `Breath Range: ${this.player.breathRange.toFixed(1)}`;

        // Calculate percentage of max range
        const maxRange = MAX_BREATH_RANGE;
        const minRange = MIN_BREATH_RANGE;
        const currentRange = this.player.breathRange;
        const percentage = (currentRange - minRange) / (maxRange - minRange);

        // Update bar width based on percentage
        this.breathRangeBar.width = `${percentage * 200}px`;

        // Update color based on range
        if (percentage < 0.3) {
            this.breathRangeBar.background = "blue";
        } else if (percentage < 0.6) {
            this.breathRangeBar.background = "green";
        } else if (percentage < 0.9) {
            this.breathRangeBar.background = "orange";
        } else {
            this.breathRangeBar.background = "red";
        }
    }

    showGameOver() {
        console.log(`[GAMEOVER] Triggered at ${Date.now()}`);

        // CRITICAL: Add extra protection against multiple game over calls
        if (this.gameOverCallbackTriggered) {
            console.log(`[GAMEOVER] Callback already triggered, ignoring duplicate call`);
            return;
        }

        if (!this.gameOverShown) {
            console.log(`[GAMEOVER] First time showing game over screen`);

            try {
                // Make sure the container exists
                if (!this.gameOverContainer) {
                    console.error(`[GAMEOVER] Game over container is null or undefined!`);
                    return;
                }

                // Show the game over screen
                this.gameOverContainer.isVisible = true;
                this.gameOverShown = true;

                // Mark callback as triggered IMMEDIATELY to prevent multiple calls
                this.gameOverCallbackTriggered = true;

                if (typeof this.onGameOver === 'function') {
                    console.log(`[GAMEOVER] Setting up callback timer`);

                    // Use a longer delay to ensure UI is fully visible before transitioning
                    setTimeout(() => {
                        try {
                            console.log(`[GAMEOVER] Executing callback`);
                            this.onGameOver();
                        } catch (error) {
                            console.error(`[GAMEOVER] Error in callback:`, error);
                        }
                    }, 3000); // Increased from 2000 to 3000ms
                } else {
                    console.warn(`[GAMEOVER] No game over callback function defined`);
                }
            } catch (error) {
                console.error(`[GAMEOVER] Error in showGameOver:`, error);
            }
        } else {
            console.log(`[GAMEOVER] Game over already shown, ignoring call`);
        }
    }

    dispose() {
        // Clean up resources if needed
    }
}

export { UISystem };
