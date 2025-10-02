# The Camera System

It allows you to detach the player's viewpoint from their character, giving you complete, script-driven control over what they see. This capability is the foundation for creating everything from scripted cutscenes and spectator modes for  gameplay mechanics

## Core Concepts

Moud's camera philosophy is simple: you have a virtual camera that you can command from either the server or the client. The API is **identical** on both sides.

### The Detached Camera

When you activate custom camera control, you are not just tweaking the player's view; you are replacing it with a fully independent, scriptable camera. The system automatically handles everything:

1.  **Seamless Perspective Switching**: If the player is in first-person, the system automatically switches them to a third-person view so their own character model becomes visible. When control is released, their original perspective is restored.
2.  **Input Lock**: Standard player controls (movement and mouse look) are decoupled from the camera's view. This ensures your scripted movements are smooth and uninterrupted.
3.  **Absolute Authority**: Your script becomes the sole authority for the camera's state: its position (`x, y, z`), rotation (`pitch`, `yaw`, `roll`), and Field of View (`fov`).

This clean separation allows you to move the player character around in the world (e.g., following a path) while the player's viewpoint follows a completely different.

### `snapTo` vs. `transitionTo`

Instead of manually updating the camera every frame, you use a declarative approach. You tell the camera *where it should be*, and the system handles the rest. There are two primary methods for this:

-   **`snapTo(options)`**: This is an instantaneous cut. It teleports the camera to the specified state. It's perfect for setting an initial scene, for quick cuts, or for updating the camera's position continuously within a loop (like making it follow an entity).

-   **`transitionTo(options)`**: This is the heart of the cinematic system. It creates a smooth, interpolated animation from the camera's current state to a new target state. You define the destination and the `duration`, and the client-side renderer will generate all the in-between frames for a fluid motion.

## Controlling the Camera

The API is accessible via `player.camera` on the server and `Moud.camera` on the client.

### Enabling and Disabling

First, you must explicitly take control of the camera.

-   **`enableCustomCamera()`**: Activates the system. The camera detaches from the player and is now ready to receive `snapTo` or `transitionTo` commands.
-   **`disableCustomCamera()`**: Returns control to the player. The camera re-attaches to their head, and their original perspective is restored.

```typescript
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  if (event.getMessage() === '!cctv') {
    event.cancel();

    if (player.camera.isCustomCameraActive()) {
      player.camera.disableCustomCamera();
      player.sendMessage("CCTV view disabled.");
    } else {
      player.camera.enableCustomCamera();
      player.camera.snapTo({ 
        position: api.math.vector3(10, 80, 10),
        pitch: -45,
        yaw: 135
      });
      player.sendMessage("CCTV view enabled.");
    }
  }
});
```

### Creating a Cinematic Sequence

The `transitionTo` method makes camera movements incredibly simple. You can chain transitions together using `setTimeout` to build a full cutscene.

```typescript
async function startOpeningCinematic(player: Player) {
  player.camera.enableCustomCamera();

  // instantly set the starting position of the cinematic
  player.camera.snapTo({
    position: api.math.vector3(-50, 90, -50),
    pitch: -20,
    yaw: -135,
    fov: 60
  });
  
  // wait for a moment, then start a slow pan to the next shot
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  player.camera.transitionTo({
    position: api.math.vector3(50, 80, 50),
    yaw: 45,
    duration: 10000, // 10sec
    easing: (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2 // ease-in-out
  });
  
  // wait for the transition to finish, then release the camera
  await new Promise(resolve => setTimeout(resolve, 10000));
  player.camera.disableCustomCamera();
}
```

```hint info Easing Functions
The `transitionTo` method accepts an optional `easing` property, which can be a JavaScript function. This function takes a progress value `p` (from 0.0 to 1.0) and should return an adjusted progress value. This allows you to create custom acceleration and deceleration curves for your camera movements.
```
## API Reference

*This API is identical for `player.camera` (server-side) and `Moud.camera` (client-side).*

### Core Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| **`enableCustomCamera()`** | *None* | Detaches the camera from the player, enabling scripted control. |
| **`disableCustomCamera()`** | *None* | Re-attaches the camera to the player, restoring normal gameplay view. |
| **`transitionTo()`** | `options: CameraOptions` | Smoothly animates the camera to a new state over a specified `duration`. |
| **`snapTo()`** | `options: CameraOptions` | Instantly sets the camera's state to the values defined in `options`. |
| **`isCustomCameraActive()`**| *None* | Returns `true` if the camera is currently under scripted control. |

### Camera Options Object

Both `transitionTo()` and `snapTo()` accept an options object with any of the following properties. Unspecified properties will retain their current value.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `position` | `Vector3` | Current | The target world position `{x, y, z}`. |
| `yaw` | `number` | Current | The target horizontal rotation in degrees. |
| `pitch` | `number` | Current | The target vertical rotation in degrees (-90 to 90). |
| `roll` | `number` | Current | The target Z-axis tilt in degrees. |
| `fov` | `number` | Current | The target Field of View. |
| `duration` | `number` | `1000` | (*`transitionTo` only*) Duration of the animation in milliseconds. |
| `easing` | `Function`| *ease-out* | (*`transitionTo` only*) An optional function `(p) => p` for custom animation curves. |

### Utility Methods

| Method | Description |
| :--- | :--- |
| **`getPlayerX/Y/Z()`** | Returns the **player's** current world coordinates. |
| **`getPlayerYaw/Pitch()`** | Returns the **player's** current view rotation. |
| **`getFov()`** | Returns the player's current game FOV setting. |
| **`createVector3()`**| Creates a `Vector3` object for use in other camera methods. |
