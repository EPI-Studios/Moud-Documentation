# Camera System

Moud gives you three ways to control the camera: **follow**, **scriptable**, and **scene**. The camera is controlled server-side through the script API, and the change is sent to the specific player whose view you want to affect.

---

## Camera Modes

### Follow Camera

The default camera follows the player from a fixed offset relative to the player's body. Good for third-person gameplay.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";
import { camera } from "moud/camera";

export default class FollowCameraScript extends Node3D {
  @process()
  onProcess(dt: number) {
    // Arguments: localX, localY, localZ, pitchDeg, rollDeg
    camera().follow(0.75, 2.4, -5.5, -12, 0);
  }
}
```

--- tab: JavaScript
```js
({
  _process(api, dt) {
    // Arguments: localX, localY, localZ, pitchDeg, rollDeg
    api.camera().follow(0.75, 2.4, -5.5, -12, 0);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_process(api, dt)
  -- Arguments: localX, localY, localZ, pitchDeg, rollDeg
  api:camera():follow(0.75, 2.4, -5.5, -12, 0)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class FollowCameraScript extends NodeScript {
    @Override public void onProcess(double dt) {
        // Arguments: localX, localY, localZ, pitchDeg, rollDeg
        core.setFollowCamera(0.75, 2.4, -5.5, -12, 0);
    }
}
```
````

| Parameter | Description |
|---|---|
| `localX` | Horizontal offset from the player (positive = right) |
| `localY` | Vertical offset (positive = up) |
| `localZ` | Depth offset (negative = behind the player) |
| `pitchDeg` | Camera pitch in degrees (negative = look down) |
| `rollDeg` | Camera roll in degrees (usually 0) |

Places the camera at an absolute world position with full control over orientation.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process } from "moud";
import { camera } from "moud/camera";

export default class ScriptableCameraScript extends Node3D {
  @process()
  onProcess(dt: number) {
    // Arguments: x, y, z, yawDeg, pitchDeg, rollDeg
    camera().scriptable(0, 70, -10, 0, -15, 0);
  }
}
```

--- tab: JavaScript
```js
({
  _process(api, dt) {
    // Arguments: x, y, z, yawDeg, pitchDeg, rollDeg
    api.camera().scriptable(0, 70, -10, 0, -15, 0);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_process(api, dt)
  -- Arguments: x, y, z, yawDeg, pitchDeg, rollDeg
  api:camera():scriptable(0, 70, -10, 0, -15, 0)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScriptableCameraScript extends NodeScript {
    @Override public void onProcess(double dt) {
        // Arguments: x, y, z, yawDeg, pitchDeg, rollDeg
        core.setScriptCamera(0, 70, -10, 0, -15, 0);
    }
}
```
````

| Parameter | Description |
|---|---|
| `x`, `y`, `z` | World-space camera position |
| `yawDeg` | Horizontal rotation (0 = looking toward +Z) |
| `pitchDeg` | Vertical angle (negative = looking down) |
| `rollDeg` | Roll (usually 0) |

### Scene Camera

Uses a `Camera3D` node already placed in your scene. Good for fixed-angle cameras, security-camera viewpoints, or pre-authored cinematic shots.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { camera } from "moud/camera";

export default class SceneCameraScript extends Node3D {
  @ready()
  onReady() {
    // Pass the nodeId of a Camera3D node
    const camId = this.find("CinematicCam");
    camera().scene(camId);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    const camId = api.find("CinematicCam");
    api.camera().scene(camId);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  local camId = api:find("CinematicCam")
  api:camera():scene(camId)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class SceneCameraScript extends NodeScript {
    @Override public void onReady() {
        // Pass the nodeId of a Camera3D node
        long camId = core.find("CinematicCam");
        core.setActiveCamera(camId);
    }
}
```
````

### Reset

Returns to the default player camera (first-person, attached to the player's eye position):

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { camera } from "moud/camera";

export default class ResetCameraScript extends Node3D {
  @ready()
  onReady() {
    camera().reset();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.camera().reset();
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  api:camera():reset()
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ResetCameraScript extends NodeScript {
    @Override public void onReady() {
        core.resetCamera();
    }
}
```
````

---

## Shorthand Methods

There are also top-level shorthand methods on `api`:

| Method | Equivalent |
|---|---|
| `api.setFollowCamera(x, y, z, pitch, roll)` | `api.camera().follow(...)` |
| `api.setScriptCamera(x, y, z, yaw, pitch, roll)` | `api.camera().scriptable(...)` |
| `api.setActiveCamera(nodeId)` | `api.camera().scene(nodeId)` |
| `api.resetCamera()` | `api.camera().reset()` |
| `api.setSceneCurrentCamera(nodeId)` | Sets `current: true` on a Camera3D node |
| `api.clearAllSceneCurrentCameras()` | Clears `current` on all Camera3D nodes |

---

## Camera3D Node Properties

Place a `Camera3D` node in your scene for use with `camera().scene()` or to set as the default active camera:

| Property | Type | Default | Description |
|---|---|---|---|
| `fov` | float | `70` | Field of view in degrees (1–179) |
| `near` | float | `0.05` | Near clipping plane distance |
| `far` | float | `1000` | Far clipping plane distance |
| `current` | bool | `false` | If `true`, this camera is used as the view for players in this scene |
| `x`, `y`, `z` | float | `0` | World position |
| `rx`, `ry`, `rz` | float | `0` | Rotation in degrees |

---

## Ownership Rule

Camera overrides apply to the **owning player** of the script node. In a single-player game this just works. In multiplayer, the camera change affects the player whose input tick is being processed by that script.

This means you can give different players different cameras by putting camera scripts on nodes owned by different players - or by using `api.getInput()` to identify which player is being ticked.

---

### First-Person Mouse Look (Client-Side)

For first-person games, use the client-side camera API inside a **client script** (`client_script` property, Luau). Client scripts run every render frame via `onFrame(dt)` - not `_process`.

```lua
-- local_scripts/fps_camera.luau
local script = {}
local sensitivity = 0.15

function script.onReady()
    camera.captureMouse(true)  -- lock and hide the cursor
end

function script.onFrame(dt)
    local dx, dy = camera.getMouseDelta()
    camera.setYaw(camera.getYaw() + dx * sensitivity)
    local newPitch = camera.getPitch() - dy * sensitivity
    camera.setPitch(math.max(-89, math.min(89, newPitch)))
end

function script.onDispose()
    camera.captureMouse(false)  -- release cursor when script unloads
end

return script
```

```hint info Client Scripts Only
The client camera API is only available inside **client scripts** (`client_script` property). It is not accessible from server scripts (`script` property). See [Client Scripts](/4_Scripting/10_Client_Scripts) for how to set up a client script.
```

---

## Client-Side Camera API

Available inside client scripts (`client_script` - Luau, runs on the Fabric client at ~60 Hz):

| Method | Description |
|---|---|
| `camera.setPos(x, y, z)` | Set camera world position |
| `camera.setYaw(degrees)` | Set horizontal rotation |
| `camera.setPitch(degrees)` | Set vertical angle |
| `camera.setRoll(degrees)` | Set roll |
| `camera.setFov(fov)` | Set field of view |
| `camera.getYaw()` | Get current yaw (float) |
| `camera.getPitch()` | Get current pitch (float) |
| `camera.getRoll()` | Get current roll (float) |
| `camera.getFov()` | Get current FOV (float) |
| `camera.captureMouse(enabled)` | `true` = lock and hide cursor, `false` = release cursor |
| `camera.getMouseDelta()` | Returns `dx, dy` - mouse movement since last frame (float[]) |
| `camera.setPlayerYaw(degrees)` | Rotate the visible player body to match camera yaw |

---

## Tips

```hint warning Camera Mode is Per-Player
In multiplayer, calling `api.camera().follow(...)` inside `_process` affects the player currently being ticked. If your game has multiple players, each will have their own camera configuration. Don't assume all players share the same camera.
```
