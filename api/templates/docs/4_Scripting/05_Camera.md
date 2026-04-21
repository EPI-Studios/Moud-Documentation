# Camera

The `Camera3D` node determines how the client views the 3D world. By extending the `Camera3D` base class within a script, developers can evaluate and modify the camera's behavioral mode, position, and orientation dynamically. 

---

## Initialization

Scripts extending `Camera3D` gain direct access to camera behavioral methods (`follow`, `scriptable`, `scene`, `reset`) through the `this` context (or via the `api.camera()` object in JavaScript and Luau).

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class MyCamera extends Camera3D {
  @ready()
  init() {
    this.follow({ offset: { x: 0, y: 5, z: -10 }, pitch: -15, roll: 0 });
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.camera().follow(0, 5, -10, -15, 0);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
    api.camera().follow(0, 5, -10, -15, 0)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MyCamera extends NodeScript {
    @Override public void onReady() {
        camera.follow(0, 5, -10, -15, 0);
    }
}
```
````

---

## Behavioral modes

### Follow mode

`this.follow({ offset, pitch, roll })`

Attaches the camera to the client's player entity at a fixed local offset. The camera inherits the player's yaw rotation, maintaining the offset relative to the character's facing direction.

| Parameter | Type | Description |
|---|---|---|
| `offset.x` | `number` | Horizontal transform offset (`+` = right). |
| `offset.y` | `number` | Vertical transform offset (`+` = up). |
| `offset.z` | `number` | Depth transform offset (`-` = behind). |
| `pitch` | `number` | Camera pitch evaluation in degrees (`-` = downward angle). |
| `roll` | `number` | Camera roll evaluation in degrees. |

````tabs
--- tab: TypeScript
```typescript
// Third-person offset
this.follow({ offset: { x: 0.75, y: 2.4, z: -5.5 }, pitch: -12, roll: 0 });

// Top-down offset
this.follow({ offset: { x: 0, y: 15, z: 0 }, pitch: -90, roll: 0 });

// Orthogonal side-scrolling offset
this.follow({ offset: { x: 0, y: 2, z: -8 }, pitch: 0, roll: 0 });
```

--- tab: JavaScript
```js
// Third-person offset
api.camera().follow(0.75, 2.4, -5.5, -12, 0);

// Top-down offset
api.camera().follow(0, 15, 0, -90, 0);

// Orthogonal side-scrolling offset
api.camera().follow(0, 2, -8, 0, 0);
```

--- tab: Luau
```lua
api.camera().follow(0.75, 2.4, -5.5, -12, 0)
api.camera().follow(0, 15, 0, -90, 0)
api.camera().follow(0, 2, -8, 0, 0)
```

--- tab: Java
```java
camera.follow(0.75, 2.4, -5.5, -12, 0);
camera.follow(0, 15, 0, -90, 0);
camera.follow(0, 2, -8, 0, 0);
```
````

### Scriptable mode

`this.scriptable({ position, yaw, pitch, roll })`

Assigns the camera to an absolute world coordinate and explicit orientation. This mode is utilized for fixed viewing angles or procedural camera transformations evaluated per frame via the `@process` execution step.

| Parameter | Type | Description |
|---|---|---|
| `position.x/y/z` | `number` | Absolute world-space coordinate. |
| `yaw` | `number` | Horizontal look direction in degrees. |
| `pitch` | `number` | Vertical look direction in degrees. |
| `roll` | `number` | Camera roll in degrees. |

````tabs
--- tab: TypeScript
```typescript
// Fixed perspective initialization
this.scriptable({
  position: { x: 0, y: 20, z: 0 },
  yaw: 0,
  pitch: -90,
  roll: 0,
});

// Procedural orbital transformation
import { Camera3D, process } from "moud";

export default class OrbitCamera extends Camera3D {
  private time = 0;

  @process()
  tick(dt: number) {
    this.time += dt;
    const angle = this.time * 0.5;
    const radius = 10;
    
    this.scriptable({
      position: {
        x: Math.cos(angle) * radius,
        y: 7,
        z: Math.sin(angle) * radius,
      },
      yaw: (angle * 180) / Math.PI + 90,
      pitch: -15,
      roll: 0,
    });
  }
}
```

--- tab: JavaScript
```js
({
  time: 0,

  _ready(api) {
    this.api = api;
  },

  _process(api, dt) {
    this.time += dt;
    var angle = this.time * 0.5;
    var x = Math.cos(angle) * 10;
    var z = Math.sin(angle) * 10;
    var yaw = angle * 180 / Math.PI + 90;
    api.camera().scriptable(x, 7, z, yaw, -15, 0);
  }
})
```

--- tab: Luau
```lua
local script = { time = 0 }
function script:_process(api, dt)
    self.time = self.time + dt
    local angle = self.time * 0.5
    local x = math.cos(angle) * 10
    local z = math.sin(angle) * 10
    local yaw = angle * 180 / math.pi + 90
    api.camera().scriptable(x, 7, z, yaw, -15, 0)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class OrbitCamera extends NodeScript {
    double time = 0;

    @Override public void onProcess(double dt) {
        time += dt;
        double angle = time * 0.5;
        double x = Math.cos(angle) * 10;
        double z = Math.sin(angle) * 10;
        double yaw = angle * 180 / Math.PI + 90;
        camera.scriptable(x, 7, z, yaw, -15, 0);
    }
}
```
````

### Scene mode

`this.scene()`

Designates the executing `Camera3D` node as the active client viewport. The renderer inherits the node's current transform matrix directly from the scene graph.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class SceneCamera extends Camera3D {
  @ready()
  init() {
    this.scene();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var cam = api.find("SceneCamera");
    api.camera().scene(cam);
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local cam = api.find("SceneCamera")
    api.camera().scene(cam)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class SceneCamera extends NodeScript {
    @Override public void onReady() {
        long cam = core.find("SceneCamera");
        camera.scene(cam);
    }
}
```
````

### Reset

`this.reset()`

Reverts the client viewport to the engine's default first-person perspective, detaching it from any prior scripted camera state.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";
import { after } from "moud/timers";

export default class TempCamera extends Camera3D {
  @ready()
  init() {
    this.scene();
    after(5.0, () => this.reset());
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.camera().scene(api.find("TempCamera"));
    api.after(5.0, function() {
      api.camera().reset();
    });
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    api.camera().scene(api.find("TempCamera"))
    api.after(5.0, function()
        api.camera().reset()
    end)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class TempCamera extends NodeScript {
    @Override public void onReady() {
        camera.scene(core.find("TempCamera"));
        core.after(5.0, () -> camera.reset());
    }
}
```
````

---

## Property interpolation

Camera transform properties (position, rotation) support linear interpolation via the `tween` method, enabling continuous transitions between states over a defined duration.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class SweepCamera extends Camera3D {
  @ready()
  init() {
    this.scene();
    this.tween({ property: "y", to: 20, duration: 2.0 });
    
    this.tween({
      property: "pitch",
      to: -60,
      duration: 2.0,
      onComplete: () => this.reset(),
    });
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var cam = api.find("SweepCamera");
    api.camera().scene(cam);
    api.tween(cam, "y", 20, 2.0);
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local cam = api.find("SweepCamera")
    api.camera().scene(cam)
    api.tween(cam, "y", 20, 2.0)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class SweepCamera extends NodeScript {
    @Override public void onReady() {
        long cam = core.find("SweepCamera");
        camera.scene(cam);
        core.tween(cam, "y", 20, 2.0);
    }
}
```
````

---

## Look targets

The camera system supports target acquisition methods that override or blend with standard client input. These methods constrain the viewport's look vectors toward a designated world coordinate.

```hint info Client-side evaluation
Target acquisition algorithms process entirely on the local client, bypassing server round-trip latency to ensure immediate visual response.
```

### Soft target

`camera.setLookTarget(x, y, z, strength, maxAngleDeg)`

Applies a rotational pull toward the designated coordinate. Client hardware input is compounded with this pull, permitting the user to deviate from the target axis. When hardware input ceases, the camera interpolates back to the center of the target constraint.

| Parameter | Description |
|---|---|
| `x, y, z` | The absolute world coordinate to track. |
| `strength` | Speed multiplier for target re-centering (`0` = none, `1.0` ≈ 0.5s interpolation). |
| `maxAngleDeg` | *(Optional)* The maximum allowable yaw/pitch deviation clamp in degrees. A value of `0` disables clamping. |

```lua
-- Standard coordinate tracking without clamp
camera:setLookTarget(targetX, targetY, targetZ, 3.0, 0)

-- Strict pull with a 40-degree maximum deviation cone
camera:setLookTarget(targetX, targetY, targetZ, 8.0, 40)
```

### Hard target

`camera.setLookTargetHard(x, y, z)`

Forces the viewport to directly face the target coordinate, entirely discarding client rotational input. This is utilized for strict sequence overrides where client deviation must be prevented.

```lua
camera:setLookTargetHard(targetX, targetY, targetZ)
```

### Clear target

`camera.clearLookTarget()`

Nullifies any active soft or hard target parameters, returning total rotational control to the client hardware evaluation.

```lua
camera:clearLookTarget()
```

