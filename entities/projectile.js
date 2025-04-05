class Projectile {
    constructor(scene, origin, direction, range, type = 'breath') {
        this.scene = scene;
        this.origin = origin;
        this.direction = direction;
        this.range = range;
        this.type = type;
        this.isDisposed = false;

        // Create different visuals based on type
        if (type === 'breath') {
            // Create a breath projectile (cone-like shape)
            this.createBreathProjectile();
        } else if (type === 'fart') {
            // Create a fart cloud (particle system)
            this.createFartCloud();
        }

        this.speed = 0.1;
        this.distance = 0;
    }

    createBreathProjectile() {
        // Create a cone for the breath attack
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("breathProjectile", {
            height: 1,
            diameterTop: 0.5,
            diameterBottom: 1.5,
            tessellation: 8
        }, this.scene);

        // Rotate the cone to point in the direction of travel
        const targetDirection = new BABYLON.Vector3(0, 0, 1);
        const angle = Math.atan2(this.direction.x, this.direction.z);
        this.mesh.rotation.y = angle;

        // Position the cone
        this.mesh.position = this.origin.clone();

        // Create a semi-transparent material for the breath
        const material = new BABYLON.StandardMaterial("breathMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.9, 0.9, 1.0);
        material.alpha = 0.5;
        material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.8);
        this.mesh.material = material;

        // Create a particle system for the breath effect
        this.particleSystem = new BABYLON.ParticleSystem("breathParticles", 100, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

        // Set particle system properties
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        this.particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        this.particleSystem.minSize = 0.1;
        this.particleSystem.maxSize = 0.3;
        this.particleSystem.minLifeTime = 0.2;
        this.particleSystem.maxLifeTime = 0.5;
        this.particleSystem.emitRate = 50;
        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        this.particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        this.particleSystem.direction1 = this.direction.scale(-1);
        this.particleSystem.direction2 = this.direction.scale(-1);
        this.particleSystem.minEmitPower = 0.5;
        this.particleSystem.maxEmitPower = 1;
        this.particleSystem.updateSpeed = 0.01;

        // Attach the particle system to the mesh
        this.particleSystem.emitter = this.mesh;
        this.particleSystem.start();
    }

    createFartCloud() {
        // For fart cloud, we'll use a particle system without a mesh
        this.particleSystem = new BABYLON.ParticleSystem("fartParticles", 500, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", this.scene);

        // Set particle system properties
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        this.particleSystem.color1 = new BABYLON.Color4(0.2, 0.5, 0.1, 1.0);
        this.particleSystem.color2 = new BABYLON.Color4(0.4, 0.6, 0.2, 1.0);
        this.particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        this.particleSystem.minSize = 0.3;
        this.particleSystem.maxSize = 0.8;
        this.particleSystem.minLifeTime = 0.5;
        this.particleSystem.maxLifeTime = 2.0;
        this.particleSystem.emitRate = 200;
        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        this.particleSystem.gravity = new BABYLON.Vector3(0, 0.1, 0);
        this.particleSystem.direction1 = new BABYLON.Vector3(-1, 0.5, -1);
        this.particleSystem.direction2 = new BABYLON.Vector3(1, 0.5, 1);
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = Math.PI;
        this.particleSystem.minEmitPower = 0.5;
        this.particleSystem.maxEmitPower = 1.5;
        this.particleSystem.updateSpeed = 0.01;

        // Create an invisible mesh to attach the particle system to
        this.mesh = BABYLON.MeshBuilder.CreateBox("fartEmitter", {size: 0.1}, this.scene);
        this.mesh.isVisible = false;
        this.mesh.position = this.origin.clone();

        // Attach the particle system to the mesh
        this.particleSystem.emitter = this.mesh;
        this.particleSystem.start();
    }

    move() {
        if (this.isDisposed) return;

        this.mesh.position.addInPlace(this.direction.scale(this.speed));
        this.distance += this.speed;

        if (this.distance > this.range) {
            this.dispose();
        }
    }

    dispose() {
        if (this.isDisposed) return;

        if (this.particleSystem) {
            this.particleSystem.stop();
            this.particleSystem.dispose();
        }

        if (this.mesh) {
            this.mesh.dispose();
        }

        this.isDisposed = true;
    }
}

export { Projectile };