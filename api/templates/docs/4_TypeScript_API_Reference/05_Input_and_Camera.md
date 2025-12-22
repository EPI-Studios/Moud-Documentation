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

### Model

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

### Follow modes

Use `followTo` when you update a target pose frequently (for example: every tick from input).

```ts
Moud.camera.followTo({
    position: MoudMath.Vector3.zero(),
    yaw: 0,
    pitch: 0,
    smoothing: 0.9
});
```

Use `smoothFollow` when you want *physics-like* smoothing:

```ts
Moud.camera.smoothFollow({
    position: MoudMath.Vector3.zero(),
    yaw: 0,
    smoothTime: 0.15,
    maxSpeed: 9999
});
```

### Look-at

```ts
Moud.camera.lookAt({ x: 0, y: 64, z: 0 });
// later
Moud.camera.clearLookAt();
```

### Paths + keyframes

```ts
Moud.camera.followPath(
    [
        { x: 0, y: 80, z: 0, yaw: 90 },
        { x: 10, y: 75, z: 10, yaw: 135 },
        { x: 0, y: 70, z: 20, yaw: 180 }
    ],
    4000,
    false
);

Moud.camera.createCinematic([
    { x: 0, y: 85, z: 0, yaw: 90, pitch: -20, fov: 80, duration: 1500 },
    { x: 12, y: 80, z: 12, yaw: 135, pitch: -15, fov: 70, duration: 1500 },
    { x: 0, y: 75, z: 22, yaw: 180, pitch: -10, fov: 60, duration: 2000 }
]);
```

### Dolly zoom

```ts
Moud.camera.dollyZoom({
    targetFov: 30,
    duration: 3000,
    target: { x: 50, y: 75, z: -20 }
});
```

## Server-side camera (`player.camera`)

On the server you can drive the same custom camera controller through `player.camera`:

```ts
api.on('player.chat', (event) => {
    const player = event.getPlayer();
    if (event.getMessage() !== '!cine') return;
    event.cancel();

    player.camera.enableCustomCamera();
    player.camera.snapTo({ position: api.math.vector3(0, 80, 0), yaw: 180, pitch: -25, fov: 70 });
    player.camera.followPath([{ x: 0, y: 80, z: 0, yaw: 90 }], 2000, false);
});
```

The big difference: `player.camera` is *server-driven* (it sends packets to the client), so don’t spam it every frame unless you really mean to.


### Code Example
```ts
let camActive = false;

Moud.input.onKey('key.keyboard.c', (pressed) => {
    if (!pressed) return;
    camActive = !camActive;

    if (camActive) {
        Moud.camera.enableCustomCamera();
        Moud.camera.snapTo({ 
            position: api.math.vector3(0, 80, 0), 
            lookAt: player.getPos() 
        });
    } else {
        Moud.camera.disableCustomCamera();
    }
});
```
