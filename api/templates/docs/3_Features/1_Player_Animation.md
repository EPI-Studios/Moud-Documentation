
# Player Animation System

## Core Concepts

There are two primary ways to control animations in Moud, each suited for different scenarios:

1.  **Keyframe Animations**: This is the traditional approach. You design a complete animation sequence (like an attack or a gesture) in an external tool like Blockbench, export it, and simply tell Moud to "play" it. This is ideal for complex, predefined sequences.

2.  **Procedural Control**: This is for real-time, dynamic manipulation. Instead of playing a pre-recorded animation, you issue direct commands every tick, such as "rotate the right arm by 45 degrees" or "make the head look at this point." This is perfect for reactive behaviors that respond to the game world.

Moud's API gives you full access to both methods, and they can even be used in combination.

## Keyframe Animations

This is the most straightforward way to play elaborate animations.

### 1. Authoring in Blockbench

Your workflow begins outside of code.
1.  Open **Blockbench** and create your animation on a standard Minecraft player model.
2.  When finished, navigate to `File > Export > Export Bedrock Animation`.
3.  Save the resulting `.json` file into your server project's `assets/moud/animations/` directory. For example: `assets/moud/animations/wave.json`.

```hint info Animation Naming
The filename is crucial. If you name your file `wave.json`, the ID for your animation within Moud becomes `moud:wave`. The `moud:` prefix is the default "namespace" for your project's assets.
```

### 2. Playing the Animation in-game

Once the animation file is in your assets folder, playing it is a one-line command using `player.animation.playAnimation()`.

```typescript
// Triggers a wave animation when a player types !wave
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  const message = event.getMessage();

  if (message === '!wave') {
    // Prevent the command from appearing in chat
    event.cancel();
    
    // Play the animation using its ID
    player.animation.playAnimation('moud:wave');
  }
});
```

## Body Part Control

For dynamic control, you can manipulate individual body parts in real-time using `player.animation.setPartConfig()`. This method gives you direct access to the position, rotation, and scale of a player's limbs.

### Example: Raising an Arm

```typescript
api.on('player.chat', (event) => {
    const player = event.getPlayer();

    if(event.getMessage() === '!raise') {
        event.cancel();

        player.animation.setPartConfig('right_arm', {
            // Rotates the arm -90 degrees on the X-axis (forward and up)
            rotation: api.math.vector3(-90, 0, 0),
            
            // Defines a smooth transition to the new rotation over 500ms
            interpolation: {
                enabled: true,
                duration: 500,
                easing: 'ease_out' // Other options: 'ease_in', 'ease_in_out', 'linear'
            }
        });
    }
});
```

### `setPartConfig` Parameters

| Property | Type | Description |
|---|---|---|
| `position` | `Vector3` | Offsets the body part from its default pivot point. |
| `rotation` | `Vector3` | Applies a rotation in degrees (pitch, yaw, roll) on the X, Y, and Z axes. |
| `scale` | `Vector3` | Stretches or shrinks the body part. `vector3(1, 1, 1)` is normal size. |
| `visible` | `boolean` | Set to `false` to make a body part invisible. |
| `overrideAnimation`| `boolean`| If `true`, this pose will take priority over any keyframe animation currently playing. |
| `interpolation`| `object` | An optional object to define a smooth transition to the target state. |

## First-Person View Configuration

You have full control over what is rendered from the player's own perspective. This is crucial for creating immersive experiences where custom animations don't clip through the camera.

Use `player.animation.setFirstPersonConfig()` to define the visibility of arms and items.

```typescript
// Example: Create a "left-handed" mode where only the left arm and item are visible
player.animation.setFirstPersonConfig({
  showRightArm: false,
  showRightItem: false,
  showLeftArm: true,
  showLeftItem: true,
  showArmor: true // Armor visibility can also be controlled
  // showTorso: Comming soon
});
```
