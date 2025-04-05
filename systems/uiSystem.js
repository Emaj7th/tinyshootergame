import { MAX_BREATH_RANGE, MIN_BREATH_RANGE } from '../utils/constants.js';

class UISystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Flag to track if game over has been shown
        this.gameOverShown = false;

        // Create UI container
        this.createUIElements();

        console.log("UI System initialized. Player health:", this.player.health);
    }

    createUIElements() {
        // Health display
        this.createHealthDisplay();

        // Food inventory display
        this.createFoodInventoryDisplay();

        // Cooldown indicators
        this.createCooldownIndicators();

        // Breath range indicator
        this.createBreathRangeIndicator();

        // Game over screen (hidden initially)
        this.createGameOverScreen();
    }

    createHealthDisplay() {
        // Create a container for health hearts
        this.healthContainer = new BABYLON.GUI.StackPanel();
        this.healthContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.healthContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.healthContainer.top = "20px";
        this.healthContainer.left = "20px";
        this.healthContainer.isVertical = false;
        this.scene.advancedTexture.addControl(this.healthContainer);

        // Create heart icons for health
        this.heartIcons = [];
        for (let i = 0; i < this.player.maxHealth; i++) {
            const heart = new BABYLON.GUI.TextBlock();
            heart.text = "❤";
            heart.color = "red";
            heart.fontSize = 30;
            heart.width = "40px";
            heart.height = "40px";
            this.healthContainer.addControl(heart);
            this.heartIcons.push(heart);
        }
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
        this.foodList.height = "100px";
        this.foodContainer.addControl(this.foodList);

        // Consumed foods counter
        this.consumedFoodsText = new BABYLON.GUI.TextBlock();
        this.consumedFoodsText.text = "Foods eaten: 0";
        this.consumedFoodsText.color = "white";
        this.consumedFoodsText.fontSize = 16;
        this.consumedFoodsText.height = "30px";
        this.foodContainer.addControl(this.consumedFoodsText);
    }

    createCooldownIndicators() {
        // Create a container for cooldown indicators
        this.cooldownContainer = new BABYLON.GUI.StackPanel();
        this.cooldownContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.cooldownContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.cooldownContainer.bottom = "20px";
        this.cooldownContainer.left = "20px";
        this.scene.advancedTexture.addControl(this.cooldownContainer);

        // Jump cooldown
        this.jumpCooldownText = new BABYLON.GUI.TextBlock();
        this.jumpCooldownText.text = "Jump: Ready";
        this.jumpCooldownText.color = "white";
        this.jumpCooldownText.fontSize = 16;
        this.jumpCooldownText.height = "30px";
        this.cooldownContainer.addControl(this.jumpCooldownText);

        // Run cooldown
        this.runCooldownText = new BABYLON.GUI.TextBlock();
        this.runCooldownText.text = "Run: Ready";
        this.runCooldownText.color = "white";
        this.runCooldownText.fontSize = 16;
        this.runCooldownText.height = "30px";
        this.cooldownContainer.addControl(this.runCooldownText);

        // Fart mode indicator
        this.fartModeText = new BABYLON.GUI.TextBlock();
        this.fartModeText.text = "Fart Mode: Inactive";
        this.fartModeText.color = "white";
        this.fartModeText.fontSize = 16;
        this.fartModeText.height = "30px";
        this.cooldownContainer.addControl(this.fartModeText);
    }

    createBreathRangeIndicator() {
        // Create a container for the breath range indicator
        this.breathRangeContainer = new BABYLON.GUI.StackPanel();
        this.breathRangeContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.breathRangeContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.breathRangeContainer.bottom = "20px";
        this.scene.advancedTexture.addControl(this.breathRangeContainer);

        // Create a breath range indicator text
        this.breathRangeText = new BABYLON.GUI.TextBlock();
        this.breathRangeText.text = `Breath Range: ${this.player.breathRange.toFixed(1)}`;
        this.breathRangeText.color = "white";
        this.breathRangeText.fontSize = 18;
        this.breathRangeText.height = "25px";
        this.breathRangeContainer.addControl(this.breathRangeText);

        // Create a visual indicator bar
        this.breathRangeBar = new BABYLON.GUI.Rectangle();
        this.breathRangeBar.width = "200px";
        this.breathRangeBar.height = "10px";
        this.breathRangeBar.background = "blue";
        this.breathRangeBar.color = "white";
        this.breathRangeBar.cornerRadius = 5;
        this.breathRangeContainer.addControl(this.breathRangeBar);

        // Create max range indicator
        this.maxRangeBar = new BABYLON.GUI.Rectangle();
        this.maxRangeBar.width = "200px";
        this.maxRangeBar.height = "10px";
        this.maxRangeBar.background = "transparent";
        this.maxRangeBar.color = "white";
        this.maxRangeBar.thickness = 1;
        this.maxRangeBar.cornerRadius = 5;
        this.breathRangeContainer.addControl(this.maxRangeBar);
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
        this.restartButton = BABYLON.GUI.Button.CreateSimpleButton("restartButton", "Restart");
        this.restartButton.width = "200px";
        this.restartButton.height = "60px";
        this.restartButton.color = "white";
        this.restartButton.background = "green";
        this.restartButton.fontSize = 24;
        this.restartButton.top = "100px";
        this.restartButton.onPointerUpObservable.add(() => {
            // Reload the page to restart the game
            console.log("Restarting game...");
            window.location.reload();
        });
        this.gameOverContainer.addControl(this.restartButton);
    }

    update() {
        // Update health display
        this.updateHealthDisplay();

        // Update food inventory
        this.updateFoodInventory();

        // Update cooldown indicators
        this.updateCooldownIndicators();

        // Update breath range indicator
        this.updateBreathRangeIndicator();

        // Check for game over - only if health is actually 0 or less and game over hasn't been shown yet
        if (this.player.health <= 0 && !this.gameOverShown) {
            console.log("Game over triggered. Player health:", this.player.health);
            this.showGameOver();
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
        if (!this.gameOverShown) {
            console.log("Showing game over screen");
            this.gameOverContainer.isVisible = true;
            this.gameOverShown = true;
        }
    }

    dispose() {
        // Clean up resources if needed
    }
}

export { UISystem };