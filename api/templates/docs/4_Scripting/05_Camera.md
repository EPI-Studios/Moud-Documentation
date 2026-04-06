# Camera

Control the player's camera from scripts. Cameras in Moud are `Camera3D` nodes - extend the `Camera3D` base class to attach scripted camera behavior to a node in the scene tree.

## Camera3D Node

To write a scripted camera, export a class that extends `Camera3D`. The camera methods (`follow`, `scriptable`, `scene`, `reset`) are available directly on `this`.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class MyCamera extends Camera3D {
  @ready()
  init() {
    // Set the camera mode here
    this.follow({ offset: { x: 0, y: 5, z: -10 }, pitch: -15, roll: 0 });
  }
}
```

--- tab: JavaScript
```js
// JavaScript accesses camera via api.camera()
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
````

## Camera Modes

### `this.follow({ offset, pitch, roll })` - Follow Camera

Attaches the camera to the player at a fixed local offset. The camera rotates with the player's yaw, keeping the offset relative to their facing direction.

| Parameter | Type | Description |
|---|---|---|
| `offset.x` | `number` | Horizontal offset (positive = right) |
| `offset.y` | `number` | Vertical offset (positive = up) |
| `offset.z` | `number` | Depth offset (negative = behind the player) |
| `pitch` | `number` | Camera pitch in degrees (negative = look down) |
| `roll` | `number` | Camera roll in degrees |

````tabs
--- tab: TypeScript
```typescript
// Third-person over-the-shoulder
this.follow({ offset: { x: 0.75, y: 2.4, z: -5.5 }, pitch: -12, roll: 0 });

// Top-down view
this.follow({ offset: { x: 0, y: 15, z: 0 }, pitch: -90, roll: 0 });

// Side-scroller style
this.follow({ offset: { x: 0, y: 2, z: -8 }, pitch: 0, roll: 0 });
```

--- tab: JavaScript
```js
// Third-person over-the-shoulder
api.camera().follow(0.75, 2.4, -5.5, -12, 0);

// Top-down
api.camera().follow(0, 15, 0, -90, 0);

// Side-scroller
api.camera().follow(0, 2, -8, 0, 0);
```

--- tab: Luau
```lua
api.camera().follow(0.75, 2.4, -5.5, -12, 0)
api.camera().follow(0, 15, 0, -90, 0)
api.camera().follow(0, 2, -8, 0, 0)
```
````

### `this.scriptable({ position, yaw, pitch, roll })` - Scripted Position

Places the camera at an absolute world position with an explicit orientation. Use this for cinematic shots, fixed angles, or cameras you move each frame via `@process`.

| Parameter | Type | Description |
|---|---|---|
| `position.x/y/z` | `number` | World-space position |
| `yaw` | `number` | Horizontal look direction in degrees |
| `pitch` | `number` | Vertical look direction in degrees |
| `roll` | `number` | Camera roll in degrees |

````tabs
--- tab: TypeScript
```typescript
// Fixed overhead shot
this.scriptable({
  position: { x: 0, y: 20, z: 0 },
  yaw: 0,
  pitch: -90,
  roll: 0,
});

// Cinematic orbit (update every frame)
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
````

### `this.scene()` - Use This Node as the Active Camera

Activates this `Camera3D` node as the scene camera for the player. Useful when you want the camera to be positioned and animated via the scene tree rather than code.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class CutsceneCamera extends Camera3D {
  @ready()
  init() {
    // This node is now the active camera
    this.scene();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var cam = api.find("CutsceneCamera");
    api.camera().scene(cam);
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local cam = api.find("CutsceneCamera")
    api.camera().scene(cam)
end
```
````

### `this.reset()` - Revert to Default Player Camera

Returns the camera to the engine's default first-person player perspective.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";
import { after } from "moud/timers";

export default class CutsceneCamera extends Camera3D {
  @ready()
  init() {
    this.scene();
    // Return to player camera after 5 seconds
    after(5.0, () => this.reset());
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.camera().scene(api.find("CutsceneCamera"));
    api.after(5.0, function() {
      api.camera().reset();
    });
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    api.camera().scene(api.find("CutsceneCamera"))
    api.after(5.0, function()
        api.camera().reset()
    end)
end
```
````

## Animating Camera Properties with `this.tween`

Camera properties (position, rotation) can be animated using `this.tween` the same way as any node. This is useful for smooth transitions between camera states.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready } from "moud";

export default class SweepCamera extends Camera3D {
  @ready()
  init() {
    this.scene();
    // Sweep the camera from y=5 to y=20 over 2 seconds
    this.tween({ property: "y", to: 20, duration: 2.0 });
    // Then tilt it down
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
````

## Complete Example: Camera Controller

A camera controller that switches between a follow camera during gameplay and a scripted cinematic position, triggered by a signal.

````tabs
--- tab: TypeScript
```typescript
import { Camera3D, ready, signal } from "moud";
import { after } from "moud/timers";

export default class GameCamera extends Camera3D {
  @ready()
  init() {
    // Start in third-person follow mode
    this.follow({ offset: { x: 0, y: 3, z: -7 }, pitch: -10, roll: 0 });
  }

  // Listen for a "cutscene_start" signal from a trigger area
  @signal("cutscene_start")
  startCutscene() {
    // Move to a fixed cinematic position
    this.scriptable({
      position: { x: 10, y: 15, z: -5 },
      yaw: 200,
      pitch: -25,
      roll: 0,
    });

    // Animate the camera downward for dramatic effect
    this.tween({ property: "y", to: 8, duration: 3.0 });

    // Return to follow camera after the cutscene
    after(5.0, () => {
      this.follow({ offset: { x: 0, y: 3, z: -7 }, pitch: -10, roll: 0 });
    });
  }

  // A trigger node can call reset() to bail out early
  @signal("cutscene_skip")
  skip() {
    this.reset();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.camera().follow(0, 3, -7, -10, 0);
    api.connect(triggerId, "cutscene_start", api.id(), "_on_cutscene");
  },

  _on_cutscene() {
    var a = this.api;
    a.camera().scriptable(10, 15, -5, 200, -25, 0);
    a.tween(a.id(), "y", 8, 3.0);
    a.after(5.0, function() {
      a.camera().follow(0, 3, -7, -10, 0);
    });
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    self.api = api
    api.camera().follow(0, 3, -7, -10, 0)
    api.connect(triggerId, "cutscene_start", api.id(), "_on_cutscene")
end

function script:_on_cutscene()
    local a = self.api
    a.camera().scriptable(10, 15, -5, 200, -25, 0)
    a.tween(a.id(), "y", 8, 3.0)
    a.after(5.0, function()
        a.camera().follow(0, 3, -7, -10, 0)
    end)
end

return script
```
````
