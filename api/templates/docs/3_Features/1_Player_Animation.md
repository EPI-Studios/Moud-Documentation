# Animation System

Moud provides a complete animation system that allows you to create custom animations in Blockbench, export them, and play them on players and models in your game. The system supports both individual body part manipulation and complex keyframe animations.


### 1. Creating Animations


You can create animations using either Blockbench or Blender since the PlayerAnimationLibrary can handle both.

Here are the examples files :
[https://github.com/KosmX/emotes/blob/dev/blender/README.md](https://github.com/KosmX/emotes/blob/dev/blender/README.md)

### 3. Exporting Animations

Export your animations for use in Moud:

1. **Go to File → Export → Animation**
2. **Choose "Bedrock Animation"** format
3. **Save the .animation.json file** to your project's `assets/animations/` directory

The exported file structure should look like:
```
my-project/
├── assets/
│   └── player_animations/
│       ├── player_wave.animation.json
│       ├── player_dance.animation.json
```

## Playing Animations

### Player Animations

Use the animation system to play custom animations on players:

```typescript
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const message = event.getMessage();

  if (message === '!wave') {
    player.getAnimation().playAnimation('moud:player_wave');
  }
  
  if (message === '!dance') {
    player.getAnimation().playAnimation('moud:player_dance');
  }
});
```


![video](https://youtu.be/YFbJkHxcCKk){width=800,height=450,muted}



### Model Animations

For PlayerModel objects created through the world API:

```typescript
const npc = api.getWorld().createPlayerModel({
  position: api.vector3(10, 70, 10),
  skinUrl: "https://example.com/skin.png"
});

npc.playAnimation('moud:npc_idle');

npc.onClick((player, clickData) => {
  npc.playAnimation('moud:npc_greet');
  player.sendMessage("Hello there!");
});
```

## Individual Body Part Control

For real-time body part manipulation without pre-made animations:

### Basic Part Configuration

```typescript
player.getAnimation().setPartConfig('right_arm', {
  rotation: api.vector3(-45, 0, 45),
  position: api.vector3(0, 0, 0),
  scale: api.vector3(1, 1, 1),
  visible: true,
  overrideAnimation: true,
  interpolation: {
    enabled: true,
    duration: 300,
    easing: 'ease_out'
  }
});
```

### Available Body Parts

- `head` - Player's head
- `body` - Torso/chest
- `right_arm` - Right arm
- `left_arm` - Left arm
- `right_leg` - Right leg
- `left_leg` - Left leg

### Pointing at Positions

The system includes a utility for making players point at world locations:

```typescript
const targetPosition = api.vector3(100, 70, 100);
player.getAnimation().pointToPosition(targetPosition, {
  interpolation: {
    enabled: true,
    duration: 500,
    easing: 'ease_in_out'
  }
});
```

## Animation States and Blending

### State-Based Animations

Soon

### Animation Events Integration

Trigger animations based on game events:

```typescript
api.on('player.movement_state', (player, movementData) => {
  if (movementData.sprinting) {
    player.getAnimation().playAnimation('moud:player_sprint');
  } else if (movementData.forward || movementData.backward || movementData.left || movementData.right) {
    player.getAnimation().playAnimation('moud:player_walk');
  } else {
    player.getAnimation().playAnimation('moud:player_idle');
  }
});

api.on('player.jump', (player) => {
  player.getAnimation().playAnimation('moud:player_jump');
});

api.on('player.sneak.start', (player) => {
  player.getAnimation().playAnimation('moud:player_sneak');
});
```

## First-Person View Control

Configure what's visible in first-person view:

```typescript
player.getAnimation().setFirstPersonConfig({
  showRightArm: true,
  showLeftArm: true,
  showRightItem: true,
  showLeftItem: false,
  showArmor: false
});
```

### Animation Validation

The system automatically validates animation files on server start. Check console logs for:

- Missing animation files
- Invalid keyframe data
- Malformed JSON structure

### Memory Management

```typescript
player.getAnimation().resetAllParts();

api.on('player.leave', (event) => {
  const playerId = event.getUuid();
});
```

## Troubleshooting

### Common Issues

1. **Animation not playing**: Check that the animation ID matches the exported file
2. **Jerky movement**: Increase interpolation duration or check keyframe easing
3. **Parts not visible**: Verify the `visible` property is set to `true`
4. **Animations conflicting**: Use `overrideAnimation: true` to prevent conflicts
