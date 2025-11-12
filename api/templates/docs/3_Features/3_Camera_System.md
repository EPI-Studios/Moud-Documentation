# Camera System

Moud lets you take over a player’s camera by either the server or client and drive it with declarative commands. 

The API is symmetrical:

- `player.camera` – server-side `CameraLockProxy`; works even if the player isn’t running any client script.
- `Moud.camera` – client-side service for scripts running inside the Fabric mod (perfect for UI-driven flows).

## Detaching and Restoring

```ts
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  if (event.getMessage() !== '!cine') return;

  event.cancel();
  const cam = player.camera;

  if (cam.isCustomCameraActive()) {
    cam.disableCustomCamera();
    player.sendMessage('Camera released.');
  } else {
    cam.enableCustomCamera();
    cam.snapTo({
      position: api.math.vector3(0, 90, 0),
      yaw: 180,
      pitch: -35,
      fov: 60
    });
    player.sendMessage('Cinematic camera engaged.');
  }
});
```

`enableCustomCamera()` locks the camera position/rotation/FOV to script-defined values, switches the player to third-person (so their body is visible), and tells `CursorService` to interpret mouse movement as camera yaw/pitch updates. `disableCustomCamera()` hands everything back to vanilla behaviour.

## Commands: snap vs transition

| Method | Use case |
| --- | --- |
| `snapTo(options)` | Hard cut. Useful when setting the initial shot or keeping the camera attached to a moving object every tick. |
| `transitionTo(options)` | Smoothly animate to a new state. Provide `duration` (ms) and optional `easing(progress: number) => number`. |

```ts
await cam.transitionTo({
  position: api.math.vector3(-30, 70, -30),
  yaw: 45,
  pitch: -10,
  fov: 50,
  duration: 6000,
  easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
});
```

All unspecified properties keep their previous values, so you can animate just the yaw or just the fov.

## Building a Cutscene

```ts
async function runIntro(player: Player) {
  const cam = player.camera;
  cam.enableCustomCamera();

  cam.snapTo({ position: api.math.vector3(10, 80, 10), yaw: 120, pitch: -25, fov: 70 });
  await wait(1000);

  await cam.transitionTo({ position: api.math.vector3(-15, 72, 0), yaw: -30, duration: 7000 });
  await cam.transitionTo({ position: api.math.vector3(-5, 66, 6), yaw: 10, pitch: -5, duration: 5000 });

  cam.disableCustomCamera();
}
```

Combine this with `player.cursor.setVisible(false)` to hide the cursor, or `player.animation.setFirstPersonConfig` to prevent limbs from showing in the shot.

## Client-side Usage

Inside a Fabric script you get the same API via `Moud.camera`.

```ts
Moud.camera.enableCustomCamera();
Moud.camera.snapTo({ position: Moud.math.vector3(0, 90, 0), yaw: 0, pitch: -60 });

uiSkipButton.onClick(() => {
  Moud.camera.disableCustomCamera();
});
```

Use this to drive UI-originated experiences (e.g., a spectator who can orbit an arena locally without asking the server).

## API Reference

| Method | Description |
| --- | --- |
| `enableCustomCamera()` / `disableCustomCamera()` | Take/release control. |
| `isCustomCameraActive()` | Check lock state. |
| `snapTo(options)` | Immediately set position/yaw/pitch/roll/fov. |
| `transitionTo(options)` | Animate across `duration` (ms) using optional `easing`. |
| `getPlayerYaw/Pitch()` | Convenience getters for blending relative offsets. |

`options` can include:

- `position: Vector3`
- `yaw`, `pitch`, `roll` (degrees)
- `fov`
- `duration` (ms, transition only)
- `easing(progress) -> progress`

