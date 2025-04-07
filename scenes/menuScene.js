import { ScoreManager } from '../utils/scoreManager.js';

class MenuScene {
    constructor(engine, canvas, onPlayCallback) {
        this.engine = engine;
        this.canvas = canvas;
        this.onPlayCallback = onPlayCallback;
        this.scoreManager = new ScoreManager();
        this.lastScore = 0;

        // Create the scene
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1); // Dark background

        // Create a camera for the scene (required for rendering)
        this.camera = new BABYLON.FreeCamera("menuCamera", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.scene.activeCamera = this.camera;

        // Create the UI
        this.createUI();
    }

    createUI() {
        // Create fullscreen UI
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

        // Create main container
        const mainContainer = new BABYLON.GUI.StackPanel();
        mainContainer.width = "100%";
        mainContainer.height = "100%";
        this.advancedTexture.addControl(mainContainer);

        // Game title
        const titleText = new BABYLON.GUI.TextBlock();
        titleText.text = "Bad Breath Blitz";
        titleText.color = "white";
        titleText.fontSize = 60;
        titleText.fontWeight = "bold";
        titleText.height = "120px";
        titleText.fontFamily = "Impact, fantasy";
        titleText.top = "50px";
        mainContainer.addControl(titleText);

        // Developer credit
        const creditText = new BABYLON.GUI.TextBlock();
        creditText.text = "Vibe Coded Games ~ BY: Gideon Marken";
        creditText.color = "white";
        creditText.fontSize = 24;
        creditText.height = "50px";
        mainContainer.addControl(creditText);

        // Last score display (hidden initially)
        this.lastScoreText = new BABYLON.GUI.TextBlock();
        this.lastScoreText.text = "";
        this.lastScoreText.color = "yellow";
        this.lastScoreText.fontSize = 36;
        this.lastScoreText.height = "60px";
        this.lastScoreText.isVisible = false;
        mainContainer.addControl(this.lastScoreText);

        // Play button
        const playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "PLAY");
        playButton.width = "200px";
        playButton.height = "60px";
        playButton.color = "white";
        playButton.background = "green";
        playButton.fontSize = 24;
        playButton.cornerRadius = 10;
        playButton.thickness = 2;
        playButton.top = "30px";
        playButton.onPointerUpObservable.add(() => {
            if (this.onPlayCallback) {
                this.onPlayCallback();
            }
        });
        mainContainer.addControl(playButton);

        // High score input container (hidden initially)
        this.highScoreInputContainer = new BABYLON.GUI.StackPanel();
        this.highScoreInputContainer.width = "300px";
        this.highScoreInputContainer.height = "200px";
        this.highScoreInputContainer.background = "#333333"; // Dark gray background
        this.highScoreInputContainer.paddingTop = "10px";
        this.highScoreInputContainer.paddingBottom = "10px";
        this.highScoreInputContainer.isVisible = false;
        this.highScoreInputContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.highScoreInputContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Add a border to the container
        this.highScoreInputContainer.thickness = 2;
        this.highScoreInputContainer.color = "#555555";

        this.advancedTexture.addControl(this.highScoreInputContainer);

        // High score title
        const highScoreTitle = new BABYLON.GUI.TextBlock();
        highScoreTitle.text = "NEW HIGH SCORE!";
        highScoreTitle.color = "yellow";
        highScoreTitle.fontSize = 24;
        highScoreTitle.height = "40px";
        this.highScoreInputContainer.addControl(highScoreTitle);

        // Score display
        this.newHighScoreText = new BABYLON.GUI.TextBlock();
        this.newHighScoreText.text = "Score: 0000";
        this.newHighScoreText.color = "white";
        this.newHighScoreText.fontSize = 20;
        this.newHighScoreText.height = "30px";
        this.highScoreInputContainer.addControl(this.newHighScoreText);

        // Initials input
        const initialsInputRow = new BABYLON.GUI.StackPanel();
        initialsInputRow.height = "40px";
        initialsInputRow.isVertical = false;
        this.highScoreInputContainer.addControl(initialsInputRow);

        const initialsLabel = new BABYLON.GUI.TextBlock();
        initialsLabel.text = "Enter Initials:";
        initialsLabel.color = "white";
        initialsLabel.fontSize = 18;
        initialsLabel.width = "120px";
        initialsInputRow.addControl(initialsLabel);

        this.initialsInput = new BABYLON.GUI.InputText();
        this.initialsInput.width = "100px";
        this.initialsInput.height = "30px";
        this.initialsInput.color = "black";
        this.initialsInput.background = "#e0e0e0"; // Light gray background
        this.initialsInput.maxWidth = "100px";
        this.initialsInput.fontSize = 18;
        this.initialsInput.text = "AAA";

        // Ensure the background stays light gray even when focused
        this.initialsInput.onFocusObservable.add(() => {
            this.initialsInput.background = "#e0e0e0"; // Keep light gray when focused
        });

        // Also ensure it stays light gray when text changes
        this.initialsInput.onTextChangedObservable.add(() => {
            this.initialsInput.background = "#e0e0e0"; // Keep light gray when text changes
        });
        initialsInputRow.addControl(this.initialsInput);

        // Save button
        const saveButton = BABYLON.GUI.Button.CreateSimpleButton("saveButton", "SAVE");
        saveButton.width = "100px";
        saveButton.height = "40px";
        saveButton.color = "white";
        saveButton.background = "green";
        saveButton.cornerRadius = 5;
        saveButton.thickness = 2;
        saveButton.top = "10px";
        saveButton.onPointerUpObservable.add(() => {
            this.saveHighScore();
        });
        this.highScoreInputContainer.addControl(saveButton);

        // Create scoreboard
        this.createScoreboard(mainContainer);
    }

    createScoreboard(parentContainer) {
        // Scoreboard container
        const scoreboardContainer = new BABYLON.GUI.StackPanel();
        scoreboardContainer.width = "300px";
        scoreboardContainer.height = "250px";
        scoreboardContainer.top = "50px";
        scoreboardContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        parentContainer.addControl(scoreboardContainer);

        // Scoreboard title
        const scoreboardTitle = new BABYLON.GUI.TextBlock();
        scoreboardTitle.text = "SCOREBOARD";
        scoreboardTitle.color = "white";
        scoreboardTitle.fontSize = 24;
        scoreboardTitle.height = "40px";
        scoreboardContainer.addControl(scoreboardTitle);

        // Create a simple text display for high scores
        this.scoreboardText = new BABYLON.GUI.TextBlock();
        this.scoreboardText.text = this.formatHighScores();
        this.scoreboardText.color = "white";
        this.scoreboardText.fontSize = 18;
        this.scoreboardText.height = "200px";
        this.scoreboardText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.scoreboardText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoreboardContainer.addControl(this.scoreboardText);
    }

    formatHighScores() {
        const highScores = this.scoreManager.getHighScores();
        let text = "";

        for (let i = 0; i < highScores.length; i++) {
            const score = highScores[i];
            const formattedScore = String(score.score).padStart(4, '0');
            text += `${i+1}. ${score.initials}  ${formattedScore}\n`;
        }

        return text;
    }

    updateScoreboard() {
        if (this.scoreboardText) {
            this.scoreboardText.text = this.formatHighScores();
        }
    }

    showGameOver(score) {
        // Store the score
        this.lastScore = score;

        // Show the last score
        this.lastScoreText.text = `LAST SCORE: ${String(score).padStart(4, '0')}`;
        this.lastScoreText.isVisible = true;

        // Check if it's a high score
        if (this.scoreManager.isHighScore(score)) {
            this.showHighScoreInput(score);
        }

        // Update the scoreboard
        this.updateScoreboard();
    }

    showHighScoreInput(score) {
        // Show the high score input container
        this.highScoreInputContainer.isVisible = true;

        // Set the score text
        this.newHighScoreText.text = `Score: ${String(score).padStart(4, '0')}`;

        // Focus the input
        this.initialsInput.focus();
    }

    saveHighScore() {
        try {
            // Get the initials
            const initials = this.initialsInput ? this.initialsInput.text : 'AAA';

            console.log("Saving high score:", this.lastScore, initials);

            // Add the high score
            this.scoreManager.addHighScore(this.lastScore, initials);

            // Hide the input container
            if (this.highScoreInputContainer) {
                this.highScoreInputContainer.isVisible = false;
            }

            // Update the scoreboard
            this.updateScoreboard();
        } catch (error) {
            console.error("Error saving high score:", error);
        }
    }

    dispose() {
        // Clean up resources
        if (this.scene) {
            // Dispose the scene
            this.scene.dispose();
            this.scene = null;
        }
    }
}

export { MenuScene };
