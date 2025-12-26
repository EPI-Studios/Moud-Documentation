# Camera System

Moud exposes two camera control surfaces:

- **Server-driven cinematics** via `player.camera` (works for vanilla + modded clients).
- **Client-only camera effects** via `Moud.camera` (requires the Moud Fabric mod).

## Server-driven camera (`player.camera`)

`player.camera` is a *camera lock* controller. When locked, the server dictates the camera position and rotation.

### Lock, move, release

```ts
api.on('player.chat', (event) => {
  const player = event.getPlayer();
  if (event.getMessage() !== '!cine') return;
  event.cancel();

  if (player.camera.isLocked()) {
    player.camera.release();
    player.sendMessage('Camera released.');
    return;
  }

  player.camera.lock(api.math.vector3(0, 90, 0), { yaw: 180, pitch: -35 });
  player.camera.smoothTransitionTo(
    api.math.vector3(-15, 72, 0),
    { yaw: -30, pitch: -10 },
    2500
  );

  // optional: shake for impact
  player.camera.shake(0.35, 400);
});
```

Use `dollyZoom(...)` for a “Vertigo” zoom effect, and `stopAnimation()` to cancel an in-progress transition.

## Client-side camera (`Moud.camera`)

Client scripts get two modes:

### 1) Custom camera (full override)

Use this when you want to fully detach the camera.

```ts
Moud.camera.enableCustomCamera();
Moud.camera.snapTo({ position: Moud.camera.createVector3(0, 90, 0), yaw: 180, pitch: -35, fov: 60 });
Moud.camera.transitionTo({ position: Moud.camera.createVector3(-15, 72, 0), yaw: -30, duration: 2500 });
```

### 2) Scriptable camera (offsets + effects)

Use this when you want effects while the player keeps normal control (mouse look + movement).

```ts
Moud.camera.enableScriptableCamera();
Moud.camera.setPositionOffset({ x: 0.8, y: 0.3, z: -0.5, smoothTime: 0.25 }); // shoulder cam
Moud.camera.setRotationOffset({ roll: 6, smoothTime: 0.2 });
Moud.camera.shake({ intensity: 0.5, frequency: 14, duration: 500 });
```

Use `resetScriptableCamera()` to clear offsets, `enableVelocityTilt(...)` for “lean into strafing”, and `setPitchLimits` / `setYawLimits` to restrict where the player can look.

## Quick method map

| Surface | Common methods |
| --- | --- |
| `player.camera` | `lock`, `smoothTransitionTo`, `setPosition`, `setRotation`, `shake`, `dollyZoom`, `release` |
| `Moud.camera` (custom) | `enableCustomCamera`, `snapTo`, `transitionTo`, `dollyZoom`, `disableCustomCamera` |
| `Moud.camera` (scriptable) | `enableScriptableCamera`, `setPositionOffset`, `setRotationOffset`, `setFovOffset`, `shake`, `enablePerlinShake`, `setCinematicBob`, `resetScriptableCamera` |
