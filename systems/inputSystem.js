class InputSystem {
    constructor(scene, player, canvas) {
        this.scene = scene;
        this.player = player;
        this.canvas = canvas;
        this.keys = {};
        this.mousePosition = new BABYLON.Vector2(0, 0);
        this.isMouseDown = false;

        console.log("Input system initialized with canvas:", canvas ? "Yes" : "No");

        // Set up keyboard input
        scene.onKeyboardObservable.add((kbInfo) => {
            this.keys[kbInfo.event.code] = kbInfo.event.type === BABYLON.KeyboardEventTypes.KEYDOWN;
            console.log("Key event:", kbInfo.event.code, kbInfo.event.type === BABYLON.KeyboardEventTypes.KEYDOWN);

            // Handle E key for eating food
            if (kbInfo.event.code === "KeyE" && kbInfo.event.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                this.player.consumeFood();
            }
        });

        // Set up direct keyboard event listeners as a fallback
        window.addEventListener("keydown", (evt) => {
            this.keys[evt.code] = true;
            console.log("Window keydown:", evt.code);
        });

        window.addEventListener("keyup", (evt) => {
            this.keys[evt.code] = false;
            console.log("Window keyup:", evt.code);
        });

        // Set up mouse input - use both canvas and window events for better reliability
        // Mouse move for aiming
        const handleMouseMove = (evt) => {
            this.updateMousePosition(evt);
        };

        // Mouse down for breath attack
        const handleMouseDown = (evt) => {
            if (evt.button === 0) { // Left mouse button
                this.isMouseDown = true;
                this.player.attack();
                console.log("Mouse down - attack");

                // Prevent default to avoid issues with text selection
                evt.preventDefault();
            }
        };

        // Mouse up to stop attack
        const handleMouseUp = (evt) => {
            if (evt.button === 0) { // Left mouse button
                this.isMouseDown = false;
            }
        };

        // Mouse leave to stop attack
        const handleMouseLeave = () => {
            this.isMouseDown = false;
        };

        // Add event listeners to both canvas and window
        if (canvas) {
            canvas.addEventListener("mousemove", handleMouseMove);
            canvas.addEventListener("mousedown", handleMouseDown);
            canvas.addEventListener("mouseup", handleMouseUp);
            canvas.addEventListener("mouseleave", handleMouseLeave);
        }

        // Also add to window as a fallback
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        // Store the handlers for cleanup
        this._mouseHandlers = {
            move: handleMouseMove,
            down: handleMouseDown,
            up: handleMouseUp,
            leave: handleMouseLeave
        };
    }

    updateMousePosition(evt) {
        if (!this.canvas) {
            console.warn("Cannot update mouse position: canvas is not available");
            return;
        }

        try {
            // Get mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;

            // Convert to normalized coordinates (-1 to 1)
            const normalizedX = (x / rect.width) * 2 - 1;
            const normalizedY = -((y / rect.height) * 2 - 1);

            this.mousePosition.x = normalizedX;
            this.mousePosition.y = normalizedY;

            console.log("Mouse position updated:", this.mousePosition);

            // Update player facing direction based on mouse position
            this.updatePlayerFacingDirection();
        } catch (error) {
            console.error("Error updating mouse position:", error);
        }
    }

    updatePlayerFacingDirection() {
        try {
            // Convert 2D mouse position to 3D direction vector
            // Since we're in a top-down view, we'll use x and z coordinates
            const direction = new BABYLON.Vector3(
                this.mousePosition.x,
                0,
                this.mousePosition.y
            );

            // Only update if the direction has a meaningful length
            if (direction.length() > 0.1) {
                this.player.setFacingDirection(direction);
                console.log("Updated player facing from mouse:", direction.toString());
            }
        } catch (error) {
            console.error("Error updating player facing direction:", error);
        }
    }

    update() {
        // Handle movement input
        const moveDirection = new BABYLON.Vector3(0, 0, 0);

        // Check for WASD keys - reversed Z axis to match screen directions
        if (this.keys["KeyW"] || this.keys["ArrowUp"]) {
            moveDirection.z += 1; // Move up on screen (positive Z)
        }
        if (this.keys["KeyS"] || this.keys["ArrowDown"]) {
            moveDirection.z -= 1; // Move down on screen (negative Z)
        }
        if (this.keys["KeyA"] || this.keys["ArrowLeft"]) {
            moveDirection.x -= 1; // Move left (negative X)
        }
        if (this.keys["KeyD"] || this.keys["ArrowRight"]) {
            moveDirection.x += 1; // Move right (positive X)
        }

        // Normalize the direction if moving diagonally
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.player.move(moveDirection);
            console.log("Moving player in direction:", moveDirection);
        }

        // Handle jump (Space)
        if (this.keys["Space"]) {
            this.player.jump();
            console.log("Player jump");
            // Reset the key to prevent continuous jumping
            this.keys["Space"] = false;
        }

        // Handle run (Shift)
        if (this.keys["ShiftLeft"] || this.keys["ShiftRight"]) {
            this.player.run();
            console.log("Player run");
        }

        // Handle continuous breath attack while mouse is down
        if (this.isMouseDown) {
            this.player.attack();
            console.log("Player attack (continuous from mouse)");
        }

        // Also allow firing with F key or Ctrl key as an alternative
        if (this.keys["KeyF"] || this.keys["ControlLeft"] || this.keys["ControlRight"]) {
            this.player.attack();
            console.log("Player attack (from keyboard)");
        }

        // Debug key states
        if (Object.keys(this.keys).filter(k => this.keys[k]).length > 0) {
            console.log("Active keys:", Object.keys(this.keys).filter(k => this.keys[k]));
        }
    }

    dispose() {
        // Clean up event listeners
        if (this._mouseHandlers) {
            if (this.canvas) {
                this.canvas.removeEventListener("mousemove", this._mouseHandlers.move);
                this.canvas.removeEventListener("mousedown", this._mouseHandlers.down);
                this.canvas.removeEventListener("mouseup", this._mouseHandlers.up);
                this.canvas.removeEventListener("mouseleave", this._mouseHandlers.leave);
            }

            window.removeEventListener("mousemove", this._mouseHandlers.move);
            window.removeEventListener("mousedown", this._mouseHandlers.down);
            window.removeEventListener("mouseup", this._mouseHandlers.up);
        }

        // Clean up keyboard event listeners
        window.removeEventListener("keydown", this._handleKeyDown);
        window.removeEventListener("keyup", this._handleKeyUp);
    }
}

export { InputSystem };