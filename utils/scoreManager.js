class ScoreManager {
    constructor() {
        this.highScores = [];
        this.loadHighScores();
    }
    
    loadHighScores() {
        try {
            // Try to load high scores from localStorage
            const savedScores = localStorage.getItem('badBreathBlitzHighScores');
            
            if (savedScores) {
                this.highScores = JSON.parse(savedScores);
                console.log("Loaded high scores:", this.highScores);
            } else {
                // Initialize with default scores if none exist
                this.initializeDefaultScores();
            }
        } catch (error) {
            console.error("Error loading high scores:", error);
            // Initialize with default scores if there was an error
            this.initializeDefaultScores();
        }
    }
    
    initializeDefaultScores() {
        // Create default high scores
        this.highScores = [
            { initials: "AAA", score: 0 },
            { initials: "AAA", score: 0 },
            { initials: "AAA", score: 0 },
            { initials: "AAA", score: 0 },
            { initials: "AAA", score: 0 }
        ];
        
        // Save the default scores
        this.saveHighScores();
        console.log("Initialized default high scores");
    }
    
    saveHighScores() {
        try {
            // Save high scores to localStorage
            localStorage.setItem('badBreathBlitzHighScores', JSON.stringify(this.highScores));
            console.log("Saved high scores:", this.highScores);
        } catch (error) {
            console.error("Error saving high scores:", error);
        }
    }
    
    getHighScores() {
        return this.highScores;
    }
    
    isHighScore(score) {
        // Check if the score is higher than any existing high score
        return this.highScores.some(highScore => score > highScore.score);
    }
    
    addHighScore(score, initials) {
        // Validate initials (3 capital letters max)
        const validInitials = this.validateInitials(initials);
        
        // Add the new score
        this.highScores.push({ initials: validInitials, score: score });
        
        // Sort high scores (highest first)
        this.highScores.sort((a, b) => b.score - a.score);
        
        // Keep only the top 5
        this.highScores = this.highScores.slice(0, 5);
        
        // Save the updated high scores
        this.saveHighScores();
        
        return this.highScores;
    }
    
    validateInitials(initials) {
        // Convert to string
        let validInitials = String(initials || "").toUpperCase();
        
        // Keep only letters
        validInitials = validInitials.replace(/[^A-Z]/g, "");
        
        // Truncate to 3 characters
        validInitials = validInitials.substring(0, 3);
        
        // Pad with 'A's if less than 3 characters
        while (validInitials.length < 3) {
            validInitials += "A";
        }
        
        return validInitials;
    }
}

export { ScoreManager };
