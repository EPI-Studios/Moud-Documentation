# Camera API

Control the player's camera from scripts. There are three camera modes and several shorthand methods.

## Camera Object

### `api.camera()` → CameraApi

Returns the camera controller. All camera methods are called on this object.

## Camera Modes

### `api.camera().follow(localX, localY, localZ, pitchDeg, rollDeg)`

Sets the camera to follow the player from a fixed offset.

| Parameter | Description |
|---|---|
| `localX` | Horizontal offset (positive = right) |
| `localY` | Vertical offset (positive = up) |
| `localZ` | Depth offset (negative = behind player) |
| `pitchDeg` | Camera pitch (negative = look down) |
| `rollDeg` | Camera roll |

```js
// Third-person over-the-shoulder
api.camera().follow(0.75, 2.4, -5.5, -12, 0);

// Top-down view
api.camera().follow(0, 15, 0, -90, 0);

// Side-scroller style
api.camera().follow(0, 2, -8, 0, 0);
```

### `api.camera().scriptable(x, y, z, yawDeg, pitchDeg, rollDeg)`

Places the camera at an absolute world position with explicit orientation.

```js
// Cinematic orbit shot
var angle = time * 0.5;
var x = Math.cos(angle) * 10;
var z = Math.sin(angle) * 10;
var yaw = angle * 180 / Math.PI + 90;
api.camera().scriptable(x, 70, z, yaw, -15, 0);
```

### `api.camera().scene(cameraNodeId)`

Activates a `Camera3D` node from the scene.

```js
var cam = api.find("CutsceneCamera");
api.camera().scene(cam);
```

### `api.camera().reset()`

Returns to the default first-person player camera.

```js
api.camera().reset();
```

## Shorthand Methods

These are top-level methods on `api` that call through to the camera controller:

| Method | Equivalent |
|---|---|
| `api.setFollowCamera(lx, ly, lz, pitch, roll)` | `api.camera().follow(...)` |
| `api.setScriptCamera(x, y, z, yaw, pitch, roll)` | `api.camera().scriptable(...)` |
| `api.setActiveCamera(nodeId)` | `api.camera().scene(nodeId)` |
| `api.resetCamera()` | `api.camera().reset()` |

## Scene Camera Helpers

### `api.setSceneCurrentCamera(cameraNodeId)`

Sets the `current` property to `"true"` on the given `Camera3D` node and clears it on all other Camera3D nodes in the scene.

### `api.clearAllSceneCurrentCameras()`

Sets `current` to `"false"` on every `Camera3D` in the scene.
