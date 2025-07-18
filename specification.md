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
/d/DevRoot/tinyshootergame/
├───.gitattributes
├───index.html
├───LICENSE
├───main.js
├───README.md
├───specification.md
├───test_audio.html
├───test_audio2.html
├───test-image.html
├───tinyshootergame.code-workspace
├───.git/...
├───assets/
│   ├───audio/
│   │   ├───bgm.mp3
│   │   ├───bgm.wav
│   │   ├───button_click.mp3
│   │   ├───elite_zombie_groan_1.mp3
│   │   ├───elite_zombie_groan_2.mp3
│   │   ├───game_horde_alert.mp3
│   │   ├───game_start.mp3
│   │   ├───player_breath.mp3
│   │   ├───player_damage.mp3
│   │   ├───player_death.mp3
│   │   ├───player_eat.mp3
│   │   ├───player_fart_1.mp3
│   │   ├───player_fart_2.mp3
│   │   ├───player_fart_start.mp3
│   │   ├───player_jump.mp3
│   │   ├───player_pickup.mp3
│   │   ├───player_run.mp3
│   │   ├───testfile.wav
│   │   ├───zombie_death.mp3
│   │   ├───zombie_groan_1.mp3
│   │   ├───zombie_groan_2.mp3
│   │   └───ogg/
│   │       ├───bgm.ogg
│   │       ├───button_click.ogg
│   │       ├───elite_zombie_groan_1.ogg
│   │       ├───elite_zombie_groan_2.ogg
│   │       ├───game_horde_alert.ogg
│   │       ├───game_start.ogg
│   │       ├───player_breath.ogg
│   │       ├───player_damage.ogg
│   │       ├───player_death.ogg
│   │       ├───player_eat.ogg
│   │       ├───player_fart_1.ogg
│   │       ├───player_fart_2.ogg
│   │       ├───player_fart_start.ogg
│   │       ├───player_jump.ogg
│   │       ├───player_pickup.ogg
│   │       ├───player_run.ogg
│   │       ├───zombie_death.ogg
│   │       ├───zombie_groan_1.ogg
│   │       └───zombie_groan_2.ogg
│   └───images/
│       ├───car_down_1.png
│       ├───car_down_2.png
│       ├───car_down_3.png
│       ├───car_down_4.png
│       ├───car_down_5.png
│       ├───character_down_spritemap-old.png
│       ├───character_down_spritemap.png
│       ├───character_up_spritemap-old.png
│       ├───character_up_spritemap.png
│       ├───food_cheese.png
│       ├───food_coffee.png
│       ├───food_garlic.png
│       ├───food_onion.png
│       ├───food_sandwich.png
│       ├───texture_ground.png
│       ├───zombie_down_spritemap.png
│       ├───zombie_up_spritemap.png
│       ├───zombieboss_down_spritemap.png
│       └───zombieboss_up_spritemap.png
├───entities/
│   ├───food.js
│   ├───player.js
│   ├───projectile.js
│   └───zombie.js
├───levels/
│   └───level1.json
├───lib/
│   ├───babylon.js
│   └───babylon.max.js
├───scenes/
│   ├───gameScene.js
│   └───menuScene.js
├───systems/
│   ├───audioSystem.js
│   ├───collisionSystem.js
│   ├───inputSystem.js
│   └───uiSystem.js
└───utils/
    ├───constants.js
    ├───helpers.js
    └───scoreManager.js
```

## Naming Conventions
- **CamelCase** for all class names: `PlayerCharacter`, `ZombieEnemy`
- **camelCase** for variables and functions: `handleInput`, `updateBreathStrength`
- **UPPER_SNAKE_CASE** for constants: `MAX_BREATH_RANGE`, `JUMP_COOLDOWN`
- Prefix custom Babylon objects clearly: `playerMesh`, `zombieMesh`

## Sounds
1. **Player Actions:**
- Breath attack (continuous while firing) - player_breath.ogg
- Picking up food items - player_pickup.ogg
- Eating food items - player_eat.ogg
- Entering fart mode - player_fart_start.ogg
- Fart cloud effect (2 random variations) - player_fart_1.ogg, player_fart_2.ogg
- Jump/dodge movement - player_jump.ogg
- Running (optional footstep sounds)  - player_run.ogg
- Taking damage/getting hit by zombie - player_damage.ogg
- Death/game over - player_death.ogg
1. **Zombie Actions:**
- Zombie groans (2 random variations) - zombie_groan_1.ogg, zombie_groan_2.ogg.
- Elite Zombie groans (2 random variations)- elite_zombie_groan_1.ogg, elite_zombie_groan_2.ogg
- Zombie death/explosion - zombie_death.ogg
1. **Game State:**
- Game start - game_start.ogg
- Horde mode activation - game_horde_alert.ogg
- Background music (continuous loop) - bgm.ogg
1. **UI/Menu:**
- Button clicks (optional) - button_click.ogg

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