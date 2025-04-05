# Game Design Document: "Bad Breath Blitz"

## Game Overview
**Title**: Bad Breath Blitz  
**Genre**: Top-down action shooter  
**Platform**: Web browser (Babylon.js - https://cdn.babylonjs.com/babylon.max.js)  
**Perspective**: 2D top-down  
**Visual Style**: Retro / Minimalist  
**Sound**: Light retro background music and comedic sound effects

## Game Concept
The player controls a character who uses their breath as a weapon against zombies. The breath starts weak and requires proximity to zombies to be effective. The player can collect foods like garlic, onions, cheese, coffee, and old sandwhiches to increase the range and damage of their breath attack. After consuming more than 5 foods, the character enters a farting state, killing nearby zombies instantly with a toxic cloud for 6 seconds.

## Core Gameplay Mechanics
### Controls
- **WASD**: Move
- **Mouse Movement**: Aim/Direction
- **Left Mouse Button**: Fires Breath
- **Space**: Jump (short dodge movement)
- **Shift**: Run (3 seconds max, 10 seconds cooldown)
- **E**: Eat collected food item

### Player Abilities
- **Breath Attack**
  - Starts with short range
  - Range and strength increase by collecting and consuming items like garlic, onions, cheese, coffee, and old sandwhiches
  - Visual: Wispy, discolored air emitted in direction faced
- **Fart Mode**
  - Triggered after consuming >5 food items
  - Duration: 6 seconds
  - Kills zombies on contact
  - Visual: Greenish gas cloud around the character
- **Jump (Space)**: Quick dodge in direction of movement
- **Run (Shift)**: Temporary speed boost with cooldown

### Player Health
- **3 Lives**: Each time a zombie touches the player, they get slower
- **Game Over**: On 3rd hit
- **UI**: Display 3 hearts or breath icons

### Enemies
- **Zombies**: Slow-moving but persistent
- **Behavior**: Navigate around obstacles to chase player
- **Death**: When a Zombie dies, it should explode with some effect, with small chunks flying off randomly.

### World
- **Location**: A small town street with enterable stores
- **Obstacles**: Cars, buses, garbage cans, dumpsters
- **Collectibles**: garlic, onions, cheese, coffee, and old sandwhiches, etc. to enhance breath

## Visual Elements
- **Retro pixelated assets** for characters, zombies, and scenery
- **Particle System** for breath and fart visuals
- **Tilemap** for level design (basic grid layout)

## Audio Elements
Audio files to be provided.
- **Breath Sound**
- **Fart Sound** - plan for 4 that we randomize
- **Zombie Groans** - plan for 4 that we randomize
- **Pickup Sound**
- **Jump Sound**
- **BG Music**: Looped retro track

## Project Directory Structure
```
project-root/
│
├── index.html                  # Main HTML file
├── main.js                     # Entry point
├── /lib                        # External libraries
│   └── babylon.max.js          # BabylonJS core
│
├── /assets                     # Game assets (SFX, BGM, optional retro sprites)
│   ├── audio/
│   │   ├── breath.wav
│   │   ├── fart.wav
│   │   ├── zombie.wav
│   │   ├── eat.wav
│   │   └── bgm.mp3
│   └── images/                 # Retro pixel icons or textures (optional)
│
├── /scenes                    # BabylonJS scene setup
│   └── gameScene.js           # Main gameplay scene logic
│
├── /entities
│   ├── player.js              # Player class and behaviors
│   ├── zombie.js              # Zombie enemy class and AI
│   └── projectile.js          # Breath and fart emissions
│
├── /systems
│   ├── inputSystem.js         # Input handlers (WASD, mouse, etc.)
│   ├── collisionSystem.js     # Handle all collisions
│   ├── uiSystem.js            # Lives, items collected, status bars
│   └── audioSystem.js         # All SFX/BGM handling
│
├── /utils
│   ├── helpers.js             # General helper functions
│   └── constants.js           # Game constants and config
│
└── /levels
    └── level1.json            # Town level layout (JSON map or procedurally generated)
```

## Naming Conventions
- **CamelCase** for all class names: `PlayerCharacter`, `ZombieEnemy`
- **camelCase** for variables and functions: `handleInput`, `updateBreathStrength`
- **UPPER_SNAKE_CASE** for constants: `MAX_BREATH_RANGE`, `JUMP_COOLDOWN`
- Prefix custom Babylon objects clearly: `playerMesh`, `zombieMesh`

## Gameplay Flow
1. Load `index.html` which initializes `main.js`
2. `main.js` sets up engine and loads `gameScene.js`
3. Scene setup:
   - Load tilemap/terrain
   - Initialize player, zombies, obstacles
   - Setup input, audio, and UI systems
4. Game Loop:
   - Handle player movement and input
   - Emit breath or fart attacks
   - Process zombie AI
   - Check collisions (breath/zombie, zombie/player)
   - Update UI and cooldowns
5. On death (3rd hit), display Game Over and option to restart

## Development Notes
- **Optimize for no external graphical assets** by using `BABYLON.StandardMaterial` with solid colors and built-in shapes (boxes, spheres, planes)
- **Breath Effect**: Use a cone of particles or simple animated plane mesh
- **Fart Cloud**: Particle system surrounding the player
- **Zombies**: Can be simple colored shapes with slight green glow material for retro look
- **Store Interiors**: Transition by loading new part of map or layering tiles

## Final Notes
This game prioritizes simplicity, fun, and humor. It is built entirely with Babylon.js, standard JavaScript, and retro-style rendering without reliance on heavy assets or frameworks. The modular file structure ensures scalability and clean development practices. The goal is to not require any additional assets other than the sound files.

Let your breath do the talking!