class AudioSystem {
    constructor(scene) {
        this.scene = scene;
        this.soundsLoaded = false;
        this.soundsEnabled = true;

        // Sound collections for variety
        this.fartSounds = [];
        this.zombieSounds = [];

        // Try to load audio files
        this.loadSounds();
    }

    loadSounds() {
        try {
            // Load audio files
            this.breathSound = new BABYLON.Sound("breath", "assets/audio/breath.wav", this.scene, () => {
                console.log("Breath sound loaded");
            }, { volume: 0.5 });

            // Load multiple fart sounds
            for (let i = 1; i <= 4; i++) {
                const fartSound = new BABYLON.Sound(`fart${i}`, `assets/audio/fart${i}.wav`, this.scene, () => {
                    console.log(`Fart sound ${i} loaded`);
                }, { volume: 0.7 });
                this.fartSounds.push(fartSound);
            }

            // Load multiple zombie sounds
            for (let i = 1; i <= 4; i++) {
                const zombieSound = new BABYLON.Sound(`zombie${i}`, `assets/audio/zombie${i}.wav`, this.scene, () => {
                    console.log(`Zombie sound ${i} loaded`);
                }, { volume: 0.5 });
                this.zombieSounds.push(zombieSound);
            }

            this.pickupSound = new BABYLON.Sound("pickup", "assets/audio/eat.wav", this.scene, () => {
                console.log("Pickup sound loaded");
            }, { volume: 0.6 });

            // Add damage sound
            this.damageSound = new BABYLON.Sound("damage", "assets/audio/damage.wav", this.scene, () => {
                console.log("Damage sound loaded");
            }, { volume: 0.6 });

            this.jumpSound = new BABYLON.Sound("jump", "assets/audio/jump.wav", this.scene, () => {
                console.log("Jump sound loaded");
            }, { volume: 0.5 });

            this.bgm = new BABYLON.Sound("bgm", "assets/audio/bgm.mp3", this.scene, () => {
                console.log("BGM loaded");
                this.bgm.play();
            }, { loop: true, volume: 0.3 });

            this.soundsLoaded = true;
        } catch (error) {
            console.warn("Error loading sounds:", error);
            console.log("Continuing without audio");
            this.soundsLoaded = false;
            this.soundsEnabled = false;
        }
    }

    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;

        if (this.soundsEnabled) {
            if (this.bgm) this.bgm.play();
        } else {
            if (this.bgm) this.bgm.pause();
        }

        return this.soundsEnabled;
    }

    playBreathSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            if (this.breathSound && !this.breathSound.isPlaying) {
                this.breathSound.play();
            }
        } catch (error) {
            console.warn("Error playing breath sound:", error);
        }
    }

    playFartSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            // Play a random fart sound
            if (this.fartSounds.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.fartSounds.length);
                const sound = this.fartSounds[randomIndex];

                if (sound && !sound.isPlaying) {
                    sound.play();
                }
            }
        } catch (error) {
            console.warn("Error playing fart sound:", error);
        }
    }

    playZombieSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            // Play a random zombie sound
            if (this.zombieSounds.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.zombieSounds.length);
                const sound = this.zombieSounds[randomIndex];

                if (sound && !sound.isPlaying) {
                    sound.play();
                }
            }
        } catch (error) {
            console.warn("Error playing zombie sound:", error);
        }
    }

    playPickupSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            if (this.pickupSound && !this.pickupSound.isPlaying) {
                this.pickupSound.play();
            }
        } catch (error) {
            console.warn("Error playing pickup sound:", error);
        }
    }

    playDamageSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            if (this.damageSound && !this.damageSound.isPlaying) {
                this.damageSound.play();
            }
        } catch (error) {
            console.warn("Error playing damage sound:", error);
        }
    }

    playJumpSound() {
        if (!this.soundsLoaded || !this.soundsEnabled) return;

        try {
            if (this.jumpSound && !this.jumpSound.isPlaying) {
                this.jumpSound.play();
            }
        } catch (error) {
            console.warn("Error playing jump sound:", error);
        }
    }

    dispose() {
        // Dispose all sounds
        if (this.breathSound) this.breathSound.dispose();
        if (this.pickupSound) this.pickupSound.dispose();
        if (this.jumpSound) this.jumpSound.dispose();
        if (this.bgm) this.bgm.dispose();

        // Dispose sound collections
        this.fartSounds.forEach(sound => {
            if (sound) sound.dispose();
        });

        this.zombieSounds.forEach(sound => {
            if (sound) sound.dispose();
        });
    }
}

export { AudioSystem };