class AudioSystem {
    constructor(scene) {
        this.scene = scene;
        this.audioEngine = scene.getEngine().audioEngine; // Store the audio engine from the scene's engine
        this.soundsLoaded = false;
        this.soundsEnabled = true; // Sounds are enabled by default

        // Sound collections for variety
        this.playerFartSounds = [];
        this.zombieGroanSounds = [];
        this.eliteZombieGroanSounds = [];

        // Individual sounds
        this.bgm = null;
        this.buttonClickSound = null;
        this.gameHordeAlertSound = null;
        this.gameStartSound = null;
        this.playerBreathSound = null;
        this.playerDamageSound = null;
        this.playerDeathSound = null;
        this.playerEatSound = null;
        this.playerFartStartSound = null;
        this.playerJumpSound = null;
        this.playerPickupSound = null;
        this.playerRunSound = null;
        this.zombieDeathSound = null;

        // Load all audio files
        this.loadSounds();
    }

    loadSounds() {
        try {
            // Background Music
            this.bgm = new BABYLON.Sound("bgm", "assets/audio/bgm.mp3", this.scene, () => {
                console.log("BGM loaded.");
                if (this.soundsEnabled) {
                    this.bgm.play();
                }
            }, { loop: true, volume: 0.6, audioEngine: this.audioEngine });

            // Player Sounds
            this.playerBreathSound = new BABYLON.Sound("player_breath", "assets/audio/player_breath.mp3", this.scene, () => { console.log("player_breath loaded."); }, { volume: 0.6, audioEngine: this.audioEngine });
            this.playerDamageSound = new BABYLON.Sound("player_damage", "assets/audio/player_damage.mp3", this.scene, () => { console.log("player_damage loaded."); }, { volume: 0.8, audioEngine: this.audioEngine });
            this.playerDeathSound = new BABYLON.Sound("player_death", "assets/audio/player_death.mp3", this.scene, () => { console.log("player_death loaded."); }, { volume: 0.9, audioEngine: this.audioEngine });
            this.playerEatSound = new BABYLON.Sound("player_eat", "assets/audio/player_eat.mp3", this.scene, () => { console.log("player_eat loaded."); }, { volume: 0.6, audioEngine: this.audioEngine });
            this.playerFartStartSound = new BABYLON.Sound("player_fart_start", "assets/audio/player_fart_start.mp3", this.scene, () => { console.log("player_fart_start loaded."); }, { volume: 0.8, audioEngine: this.audioEngine });
            this.playerJumpSound = new BABYLON.Sound("player_jump", "assets/audio/player_jump.mp3", this.scene, () => { console.log("player_jump loaded."); }, { volume: 0.6, audioEngine: this.audioEngine });
            this.playerPickupSound = new BABYLON.Sound("player_pickup", "assets/audio/player_pickup.mp3", this.scene, () => { console.log("player_pickup loaded."); }, { volume: 0.6, audioEngine: this.audioEngine });
            this.playerRunSound = new BABYLON.Sound("player_run", "assets/audio/player_run.mp3", this.scene, () => { console.log("player_run loaded."); }, { volume: 0.4, loop: true, audioEngine: this.audioEngine }); // Loop run sound

            // Player Fart Variations
            this.playerFartSounds.push(new BABYLON.Sound("player_fart_1", "assets/audio/player_fart_1.mp3", this.scene, () => { console.log("player_fart_1 loaded."); }, { volume: 0.7, audioEngine: this.audioEngine }));
            this.playerFartSounds.push(new BABYLON.Sound("player_fart_2", "assets/audio/player_fart_2.mp3", this.scene, () => { console.log("player_fart_2 loaded."); }, { volume: 0.7, audioEngine: this.audioEngine }));

            // Zombie Sounds
            this.zombieDeathSound = new BABYLON.Sound("zombie_death", "assets/audio/zombie_death.mp3", this.scene, () => { console.log("zombie_death loaded."); }, { volume: 0.6, audioEngine: this.audioEngine });

            // Zombie Groan Variations
            this.zombieGroanSounds.push(new BABYLON.Sound("zombie_groan_1", "assets/audio/zombie_groan_1.mp3", this.scene, () => { console.log("zombie_groan_1 loaded."); }, { volume: 0.1, audioEngine: this.audioEngine }));
            this.zombieGroanSounds.push(new BABYLON.Sound("zombie_groan_2", "assets/audio/zombie_groan_2.mp3", this.scene, () => { console.log("zombie_groan_2 loaded."); }, { volume: 0.1, audioEngine: this.audioEngine }));

            // Elite Zombie Groan Variations
            this.eliteZombieGroanSounds.push(new BABYLON.Sound("elite_zombie_groan_1", "assets/audio/elite_zombie_groan_1.mp3", this.scene, () => { console.log("elite_zombie_groan_1 loaded."); }, { volume: 0.2, audioEngine: this.audioEngine }));
            this.eliteZombieGroanSounds.push(new BABYLON.Sound("elite_zombie_groan_2", "assets/audio/elite_zombie_groan_2.mp3", this.scene, () => { console.log("elite_zombie_groan_2 loaded."); }, { volume: 0.2, audioEngine: this.audioEngine }));

            // Game Sounds
            this.buttonClickSound = new BABYLON.Sound("button_click", "assets/audio/button_click.mp3", this.scene, () => { console.log("button_click loaded."); }, { volume: 0.8, audioEngine: this.audioEngine });
            this.gameHordeAlertSound = new BABYLON.Sound("game_horde_alert", "assets/audio/game_horde_alert.mp3", this.scene, () => { console.log("game_horde_alert loaded."); }, { volume: 0.8, audioEngine: this.audioEngine });
            this.gameStartSound = new BABYLON.Sound("game_start", "assets/audio/game_start.mp3", this.scene, () => { console.log("game_start loaded."); }, { volume: 0.9, audioEngine: this.audioEngine });

            this.soundsLoaded = true;
            console.log("All sounds loaded successfully.");
        } catch (error) {
            console.warn("Error loading sounds:", error);
            console.log("Continuing without audio.");
            this.soundsLoaded = false;
            this.soundsEnabled = false;
        }
    }

    _playSound(sound, loop = false) {
        if (!this.soundsLoaded || !this.soundsEnabled || !sound) {
            console.log(`[AudioSystem] Playback skipped for ${sound ? sound.name : 'unknown sound'}: soundsLoaded=${this.soundsLoaded}, soundsEnabled=${this.soundsEnabled}, sound exists=${!!sound}`);
            return;
        }
        try {
            console.log(`[AudioSystem] Attempting to play ${sound.name}. isPlaying before: ${sound.isPlaying}`);
            // Stop if already playing and not meant to loop
            if (sound.isPlaying && !loop) {
                sound.stop();
                console.log(`[AudioSystem] Stopped ${sound.name} before re-playing.`);
            }
            sound.play();
            console.log(`[AudioSystem] Played ${sound.name}. isPlaying after: ${sound.isPlaying}`);
        } catch (error) {
            console.warn(`[AudioSystem] Error playing sound ${sound.name}:`, error);
        }
    }

    _playRandomSound(soundArray) {
        if (!this.soundsLoaded || !this.soundsEnabled || soundArray.length === 0) {
            console.log(`[AudioSystem] Random playback skipped: soundsLoaded=${this.soundsLoaded}, soundsEnabled=${this.soundsEnabled}, array empty=${soundArray.length === 0}`);
            return;
        }
        try {
            const randomIndex = Math.floor(Math.random() * soundArray.length);
            const sound = soundArray[randomIndex];
            console.log(`[AudioSystem] Attempting to play random sound: ${sound.name}`);
            this._playSound(sound);
        } catch (error) {
            console.warn("[AudioSystem] Error playing random sound:", error);
        }
    }

    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        if (this.bgm) {
            if (this.soundsEnabled) {
                this.bgm.play();
            } else {
                this.bgm.pause();
            }
        }
        // Pause/play other looping sounds like player run
        if (this.playerRunSound) {
            if (this.soundsEnabled) {
                this.playerRunSound.play();
            } else {
                this.playerRunSound.pause();
            }
        }
        return this.soundsEnabled;
    }

    playBGM() {
        this._playSound(this.bgm, true);
    }

    playButtonClick() {
        this._playSound(this.buttonClickSound);
    }

    playGameStart() {
        this._playSound(this.gameStartSound);
    }

    playGameHordeAlert() {
        this._playSound(this.gameHordeAlertSound);
    }

    playPlayerBreath() {
        this._playSound(this.playerBreathSound);
    }

    playPlayerDamage() {
        this._playSound(this.playerDamageSound);
    }

    playPlayerDeath() {
        this._playSound(this.playerDeathSound);
    }

    playPlayerEat() {
        this._playSound(this.playerEatSound);
    }

    playPlayerFart() {
        this._playRandomSound(this.playerFartSounds);
    }

    playPlayerFartStart() {
        this._playSound(this.playerFartStartSound);
    }

    playPlayerJump() {
        this._playSound(this.playerJumpSound);
    }

    playPlayerPickup() {
        this._playSound(this.playerPickupSound);
    }

    playPlayerRun() {
        this._playSound(this.playerRunSound, true);
    }

    playZombieGroan() {
        this._playRandomSound(this.zombieGroanSounds);
    }

    playEliteZombieGroan() {
        this._playRandomSound(this.eliteZombieGroanSounds);
    }

    playZombieDeath() {
        this._playSound(this.zombieDeathSound);
    }

    resumeAudioContext() {
        if (this.audioEngine && this.audioEngine.audioContext) {
            if (this.audioEngine.audioContext.state === 'suspended') {
                console.log("[AudioSystem] Resuming audio context...");
                this.audioEngine.audioContext.resume().then(() => {
                    console.log("[AudioSystem] Audio context resumed.");
                }).catch(error => {
                    console.error("[AudioSystem] Error resuming audio context:", error);
                });
            } else {
                console.log("[AudioSystem] Audio context is already in state: " + this.audioEngine.audioContext.state);
            }
        }
    }

    dispose() {
        // Dispose all individual sounds
        if (this.bgm) this.bgm.dispose();
        if (this.buttonClickSound) this.buttonClickSound.dispose();
        if (this.gameHordeAlertSound) this.gameHordeAlertSound.dispose();
        if (this.gameStartSound) this.gameStartSound.dispose();
        if (this.playerBreathSound) this.playerBreathSound.dispose();
        if (this.playerDamageSound) this.playerDamageSound.dispose();
        if (this.playerDeathSound) this.playerDeathSound.dispose();
        if (this.playerEatSound) this.playerEatSound.dispose();
        if (this.playerFartStartSound) this.playerFartStartSound.dispose();
        if (this.playerJumpSound) this.playerJumpSound.dispose();
        if (this.playerPickupSound) this.playerPickupSound.dispose();
        if (this.playerRunSound) this.playerRunSound.dispose();
        if (this.zombieDeathSound) this.zombieDeathSound.dispose();

        // Dispose sound collections
        this.playerFartSounds.forEach(sound => {
            if (sound) sound.dispose();
        });
        this.zombieGroanSounds.forEach(sound => {
            if (sound) sound.dispose();
        });
        this.eliteZombieGroanSounds.forEach(sound => {
            if (sound) sound.dispose();
        });
        console.log("AudioSystem disposed.");
    }
}

export { AudioSystem };
