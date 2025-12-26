# Input & Camera 

- Client-side input (`Moud.input`)
- Client-side camera (`Moud.camera`)
- Server-side camera (`player.camera`) when you want the server to drive cinematics

## Input (`Moud.input`)

The input API is designed for two styles:

- **Polling** (read current state)
- **Hooks** (react to changes without writing your own state machine)

### Polling examples

```ts
// translation key form:
if (Moud.input.isKeyPressed('key.keyboard.space')) {
    console.log('Jump is held');
}

// mouse buttons: 0 = left, 1 = right, 2 = middle
if (Moud.input.isMouseButtonPressed(1)) {
    console.log('Right click held');
}

const mouseX = Moud.input.getMouseX();
const mouseY = Moud.input.getMouseY();
```

### Hook examples

```ts
Moud.input.onKey('key.keyboard.g', (pressed) => {
    if (!pressed) return;
    Moud.network.sendToServer('client:toggle-gizmo');
});

Moud.input.onKeyHold('key.keyboard.left.control', (heldMs) => {
    if (heldMs > 400) console.log('ctrl held for', heldMs, 'ms');
});

Moud.input.onMouseMove((dx, dy) => {
    // dx/dy are “this frame” deltas
});

Moud.input.lockMouse(true);
```

## Camera (`Moud.camera`)

`Moud.camera` is a **client-only** camera controller exposed to client scripts running inside the Fabric mod.

There are two camera modes:

- **Custom camera**: fully overrides the game camera (good for cinematics/cutscenes).
- **Scriptable camera**: applies offsets/effects *on top of* the vanilla camera (good for recoil, shake, shoulder cams, body-cam bob, etc.).

### Custom camera (full override)

When the custom camera is enabled, you’re controlling a *separate camera pose* (position + yaw/pitch/roll + FOV).

- `snapTo(...)` is a hard cut
- `transitionTo(...)` animates over `duration` (ms) and optionally uses a JS easing function

### Snap + transition

```ts
Moud.camera.enableCustomCamera();

Moud.camera.snapTo({
    position: MoudMath.Vector3.zero(),
    yaw: 180,
    pitch: -25,
    fov: 70
});

Moud.camera.transitionTo({
    position: MoudMath.Vector3.zero().add(new MoudMath.Vector3(0, 20, 20)),
    yaw: 180,
    pitch: -10,
    duration: 1200,
    easing: (t) => t * t
});
```

### Chaining transitions

`transitionTo` is non-blocking, so chain with `setTimeout`:

```ts
Moud.camera.transitionTo({ position: Moud.camera.createVector3(0, 90, 0), yaw: 180, pitch: -25, duration: 1200 });
setTimeout(() => {
    Moud.camera.transitionTo({ position: Moud.camera.createVector3(0, 75, 20), yaw: 180, pitch: -10, duration: 900 });
}, 1200);
```

### Perspective helpers

```ts
// show the player's body while the camera is detached
Moud.camera.setThirdPerson(true);
```

### Dolly zoom

```ts
Moud.camera.dollyZoom({
    targetFov: 30,
    duration: 3000,
    target: { x: 50, y: 75, z: -20 }
});
```

### Scriptable camera (offsets + effects)

Scriptable camera blends with vanilla camera. The player retains normal mouse look and movement; you only apply modifiers.

```ts
Moud.camera.enableScriptableCamera();

// Shoulder camera: right + slightly up + pulled back
Moud.camera.setPositionOffset({ x: 0.8, y: 0.3, z: -0.5, smoothTime: 0.25 });

// Small roll tilt
Moud.camera.setRotationOffset({ roll: 6, smoothTime: 0.2 });

// Zoom in (negative narrows FOV)
Moud.camera.setFovOffset({ offset: -15, smoothTime: 0.2 });
```

#### Shake

```ts
Moud.camera.shake({ intensity: 0.6, frequency: 18, duration: 400 });
// later
Moud.camera.stopShake();
```

#### Velocity tilt

```ts
Moud.camera.enableVelocityTilt({ amount: 4.0, smoothing: 0.12 });
// later
Moud.camera.disableVelocityTilt();
```

#### Soft look-at (blend with player input)

```ts
Moud.camera.setSoftLookAt({ x: 0, y: 64, z: 0, strength: 0.7, smoothTime: 0.25 });
// later
Moud.camera.clearSoftLookAt();
```

#### Rotation limits / axis locks

```ts
Moud.camera.setPitchLimits({ min: -45, max: 45 });
Moud.camera.setYawLimits({ range: 90 }); // +/- 90 degrees from current yaw

Moud.camera.lockAxis('yaw');
setTimeout(() => Moud.camera.unlockAxis('yaw'), 1000);

Moud.camera.clearPitchLimits();
Moud.camera.clearYawLimits();
```

#### Follow target (lag camera)

```ts
Moud.camera.setFollowTarget({ x: 0, y: 80, z: 0, lag: 0.2 });
Moud.camera.updateFollowTarget({ x: 10, y: 80, z: 10 });
Moud.camera.stopFollowTarget();
```

#### Cinematic bob + Perlin shake

```ts
Moud.camera.setCinematicBob({ enabled: true, intensity: 1.2, rollMultiplier: 3.5 });

Moud.camera.enablePerlinShake({ autoFromVelocity: true });
Moud.camera.addTrauma(0.25);
Moud.camera.disablePerlinShake();
```

#### Reset

```ts
Moud.camera.resetScriptableCamera();              // smooth reset
Moud.camera.resetScriptableCamera({ instant: true }); // instant reset
```

## Server-side camera (`player.camera`)

On the server, `player.camera` is an authoritative **camera lock** controller (it sends packets to the client).

```ts
api.on('player.chat', (event) => {
    const player = event.getPlayer();
    if (event.getMessage() !== '!cine') return;
    event.cancel();

    player.camera.lock(api.math.vector3(0, 80, 0), { yaw: 180, pitch: -25 });
    player.camera.smoothTransitionTo(
        api.math.vector3(0, 75, 20),
        { yaw: 180, pitch: -10 },
        2000
    );

    // release after the shot
    setTimeout(() => player.camera.release(), 2500);
});
```

The key difference: `player.camera` is *server-driven*, so use it for discrete camera beats (lock, transition, release) instead of per-frame effects.
