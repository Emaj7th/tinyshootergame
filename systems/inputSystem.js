class InputSystem {
    constructor(scene, player, canvas) {
        this.scene = scene;
        this.player = player;
        this.canvas = canvas;
        this.keys = {};
        this.mousePosition = new BABYLON.Vector2(0, 0);
        this.isMouseDown = false;
        // isPaused property removed as it was only related to mouse leaving the game

        // Set up keyboard input
        scene.onKeyboardObservable.add((kbInfo) => {
            this.keys[kbInfo.event.code] = kbInfo.event.type === BABYLON.KeyboardEventTypes.KEYDOWN;

            // Handle E key for eating food
            if (kbInfo.event.code === "KeyE" && kbInfo.event.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                const consumedFood = this.player.consumeFood();
                if (consumedFood) {
                    console.log(`Ate food: ${consumedFood}. New breath range: ${this.player.breathRange.toFixed(1)}`);
                } else {
                    console.log("No food to eat!");
                }
            }
        });

        // Set up direct keyboard event listeners as fallback
        window.addEventListener("keydown", (evt) => {
            this.keys[evt.code] = true;

            // Handle E key for eating food as fallback
            if (evt.code === "KeyE") {
                const consumedFood = this.player.consumeFood();
                if (consumedFood) {
                    console.log(`Ate food (window event): ${consumedFood}. New breath range: ${this.player.breathRange.toFixed(1)}`);
                }
            }
        });

        window.addEventListener("keyup", (evt) => {
            this.keys[evt.code] = false;
        });

        // Mouse handlers
        const handleMouseMove = (evt) => {
            if (!this.isPaused) {
                this.updateMousePosition(evt);
            }
        };

        const handleMouseDown = (evt) => {
            if (!this.isPaused && evt.button === 0) {
                this.isMouseDown = true;
            }
        };

        const handleMouseUp = (evt) => {
            if (evt.button === 0) {
                this.isMouseDown = false;
            }
        };

        // Mouse leave/enter handlers removed as they were only showing text and not actually pausing the game

        // Add event listeners to both canvas and window
        if (canvas) {
            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mousedown", handleMouseDown);
            canvas.addEventListener("mouseup", handleMouseUp);
            // Mouse leave/enter event listeners removed
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        // Store handlers for cleanup
        this._mouseHandlers = {
            move: handleMouseMove,
            down: handleMouseDown,
            up: handleMouseUp
            // Mouse leave/enter handlers removed
        };
    }

    // Pause overlay methods removed as they were only showing text and not actually pausing the game

    updateMousePosition(evt) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition.x = evt.clientX - rect.left;
        this.mousePosition.y = evt.clientY - rect.top;

        // Update player facing direction based on mouse position
        this.updateMouseDirection();
    }

    updateMouseDirection() {
        if (!this.player || !this.canvas) return;

        const camera = this.scene.activeCamera;
        if (!camera) return;

        // Get the player's current position in world space
        const playerPosition = this.player.mesh.position.clone();

        // Create a ray from the mouse position into the scene
        const ray = this.scene.createPickingRay(
            this.mousePosition.x,
            this.mousePosition.y,
            BABYLON.Matrix.Identity(),
            camera
        );

        // Define a plane at the player's height
        const plane = new BABYLON.Plane(0, 1, 0, -playerPosition.y);

        // Find where the ray intersects the plane
        let distance = 0;
        if (ray.intersectsPlane(plane, distance)) {
            const worldIntersectionPoint = ray.origin.add(ray.direction.scale(distance));
            const direction = worldIntersectionPoint.subtract(playerPosition);
            direction.y = 0; // Keep direction on the horizontal plane
            
            if (direction.length() > 0.01) {
                direction.normalize();
                this.player.setFacingDirection(direction);
            }
        }
    }

    update() {
        // isPaused check removed as it was only related to mouse leaving the game

        const moveDirection = new BABYLON.Vector3(0, 0, 0);

        // Handle WASD movement
        if (this.keys["KeyW"]) moveDirection.z += 1;
        if (this.keys["KeyS"]) moveDirection.z -= 1;
        if (this.keys["KeyA"]) moveDirection.x -= 1;
        if (this.keys["KeyD"]) moveDirection.x += 1;

        // Normalize the direction if moving diagonally
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.player.move(moveDirection);
        }

        // Handle jump (Space)
        if (this.keys["Space"]) {
            this.player.jump();
            this.keys["Space"] = false;
        }

        // Handle run (Shift)
        if (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) {
            this.player.run();
        }

        // Handle continuous breath attack while mouse is down
        if (this.isMouseDown) {
            this.player.attack();
        }
    }

    dispose() {
        if (this.canvas) {
            this.canvas.removeEventListener("mousemove", this._mouseHandlers.move);
            this.canvas.removeEventListener("mousedown", this._mouseHandlers.down);
            this.canvas.removeEventListener("mouseup", this._mouseHandlers.up);
            // Mouse leave/enter event listeners removed
        }

        window.removeEventListener("mousemove", this._mouseHandlers.move);
        window.removeEventListener("mousedown", this._mouseHandlers.down);
        window.removeEventListener("mouseup", this._mouseHandlers.up);

        // Pause overlay disposal removed
    }
}

export { InputSystem };
