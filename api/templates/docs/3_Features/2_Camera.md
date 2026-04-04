# Camera System

Moud gives you three ways to control the camera: **follow**, **scriptable**, and **scene**. 

## Camera Modes

### Follow Camera

The default camera follows the player from a fixed offset. Good for third-person gameplay.

````tabs
--- tab: JavaScript
```js
// Arguments: localX, localY, localZ, pitchDeg, rollDeg
api.camera().follow(0.75, 2.4, -5.5, -12, 0);
```

--- tab: Luau
```lua
api.camera().follow(0.75, 2.4, -5.5, -12, 0)
```
````

| Parameter | Description |
|---|---|
| `localX` | Horizontal offset from the player (positive = right) |
| `localY` | Vertical offset (positive = up) |
| `localZ` | Depth offset (negative = behind the player) |
| `pitchDeg` | Camera pitch in degrees (negative = look down) |
| `rollDeg` | Camera roll in degrees |

### Scriptable Camera

Places the camera at an absolute world position with full control over orientation. Good for cutscenes, orbit shots, and cinematics.

````tabs
--- tab: JavaScript
```js
// Arguments: x, y, z, yawDeg, pitchDeg, rollDeg
api.camera().scriptable(0, 70, -10, 0, -15, 0);
```

--- tab: Luau
```lua
api.camera().scriptable(0, 70, -10, 0, -15, 0)
```
````

### Scene Camera

Uses a `Camera3D` node already placed in your scene. Good for fixed-angle cameras or pre-authored viewpoints.

````tabs
--- tab: JavaScript
```js
api.camera().scene(cameraNodeId);
```

--- tab: Luau
```lua
api.camera().scene(cameraNodeId)
```
````

### Reset

Returns to the default player camera:

```js
api.camera().reset();
```

## Alternative Methods

There are also top-level shorthand methods on `api`:

| Method | Equivalent |
|---|---|
| `api.setFollowCamera(localX, localY, localZ, pitchDeg, rollDeg)` | `api.camera().follow(...)` |
| `api.setScriptCamera(x, y, z, yawDeg, pitchDeg, rollDeg)` | `api.camera().scriptable(...)` |
| `api.setActiveCamera(nodeId)` | `api.camera().scene(nodeId)` |
| `api.resetCamera()` | `api.camera().reset()` |
| `api.setSceneCurrentCamera(nodeId)` | Sets `current` property on a Camera3D node |
| `api.clearAllSceneCurrentCameras()` | Clears `current` on all Camera3D nodes |

## Camera3D Node Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `fov` | float | 70 | Field of view in degrees (1–179) |
| `near` | float | 0.05 | Near clipping plane |
| `far` | float | 1000 | Far clipping plane |
| `current` | bool | false | Whether this is the active camera |

## Ownership Rule

Camera overrides apply to the **owning player** of the script node. In single-player this just works. In multiplayer, the camera change affects the player whose input is being processed by that script.
