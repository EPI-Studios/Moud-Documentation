# Events and Lifecycle

Scripts in Moud are event-driven. Your code does not run in a loop that you manage yourself. Instead, you define decorated methods and the engine calls them at the right time.

## Script Shape

A Moud script is a TypeScript class that extends a node type. Decorators mark which methods the engine calls automatically.

````tabs
--- tab: TypeScript
```ts
import { process, ready, enterTree, exitTree, physicsProcess, input } from "moud";

export default class MyNode extends Node3D {
  // Local state - lives on this script instance
  health = 100;
  speed = 5;

  @enterTree()
  onEnterTree() {
    // Called when the node is added to the scene tree
  }

  @ready()
  onReady() {
    // Called after @enterTree, when the node is fully initialized
  }

  @process()
  onProcess(dt: number) {
    // Called every frame/tick. dt = seconds since last call.
  }

  @physicsProcess()
  onPhysicsProcess(dt: number) {
    // Called at fixed physics timestep
  }

  @input()
  onInput(event: string) {
    // Called when player input is received
  }

  @exitTree()
  onExitTree() {
    // Called when the node is removed from the scene tree
  }
}
```

--- tab: JavaScript
```js
({
  health: 100,
  speed: 5,

  _enter_tree(api) {
    // Called when the node is added to the scene tree
  },

  _ready(api) {
    // Called after _enter_tree, when the node is fully initialized
  },

  _process(api, dt) {
    // Called every frame/tick. dt = seconds since last call.
  },

  _physics_process(api, dt) {
    // Called at fixed physics timestep
  },

  _input(api, event) {
    // Called when player input is received
  },

  _exit_tree(api) {
    // Called when the node is removed from the scene tree
  }
})
```

--- tab: Luau
```lua
local script = {
    health = 100,
    speed = 5,
}

function script:_enter_tree(api)
    -- Called when the node is added to the scene tree
end

function script:_ready(api)
    -- Called after _enter_tree, when the node is fully initialized
end

function script:_process(api, dt)
    -- Called every frame/tick. dt = seconds since last call.
end

function script:_physics_process(api, dt)
    -- Called at fixed physics timestep
end

function script:_input(api, event)
    -- Called when player input is received
end

function script:_exit_tree(api)
    -- Called when the node is removed from the scene tree
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;
import com.moud.server.minestom.scripting.player.InputEvent;

public final class MyNode extends NodeScript {
    // Local state - lives on this script instance
    private int health = 100;
    private int speed = 5;

    @Override public void onEnterTree() {
        // Called when the node is added to the scene tree
    }

    @Override public void onReady() {
        // Called after onEnterTree, when the node is fully initialized
    }

    @Override public void onProcess(double dt) {
        // Called every frame/tick. dt = seconds since last call.
    }

    @Override public void onPhysicsProcess(double dt) {
        // Called at fixed physics timestep
    }

    @Override public void onInput(InputEvent event) {
        // Called when player input is received
    }

    @Override public void onExitTree() {
        // Called when the node is removed from the scene tree
    }
}
```
````

## Lifecycle Callbacks

These are called automatically by the engine in this order:

| Decorator (TypeScript) | Method (JS/Luau) | When It Fires | Common Use |
|---|---|---|---|
| `@enterTree()` | `_enter_tree(api)` | Node is added to the scene tree | Set up signal connections |
| `@ready()` | `_ready(api)` | After enter_tree, node is fully initialized | Initialize state, find other nodes, start timers |
| `@process()` | `_process(api, dt)` | Every server tick | Visual updates, UI logic, non-physics gameplay |
| `@physicsProcess()` | `_physics_process(api, dt)` | Every physics step | Movement, forces, collision checks |
| `@input()` | `_input(api, event)` | When a player sends input | Custom input handling |
| `@exitTree()` | `_exit_tree(api)` | Node is being removed | Cleanup |

```hint important @enterTree vs @ready
Use `@enterTree` when you need to set up signal connections early. Use `@ready` for everything else - by that point the full scene tree is available so you can safely call `this.find(...)` to look up other nodes.
```

### The `dt` Parameter

Both `@process` and `@physicsProcess` receive a `dt` (delta time) value - the number of seconds since the last call. Always multiply movement and animation by `dt` to make them frame-rate independent:

````tabs
--- tab: TypeScript
```ts
@physicsProcess()
onPhysicsProcess(dt: number) {
  // Move 5 units per second regardless of tick rate
  this.position.x += 5 * dt;
}
```

--- tab: JavaScript
```js
_physics_process(api, dt) {
  var x = api.getNumber("x", 0);
  api.setNumber("x", x + 5 * dt);
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local x = api.getNumber("x", 0)
    api.setNumber("x", x + 5 * dt)
end
```

--- tab: Java
```java
@Override public void onPhysicsProcess(double dt) {
    double x = core.getNumber(core.id(), "x", 0);
    core.setNumber(core.id(), "x", x + 5 * dt);
}
```
````

## Signals

Signals are how nodes communicate without hard-coding dependencies. A node emits a signal, and any node that has connected to it gets its handler called.

### Built-in Signals

| Signal | Emitted By | When |
|---|---|---|
| `area_entered` | `Area3D` | A player or body enters the area |
| `area_exited` | `Area3D` | A player or body leaves the area |
| `pressed` | `Button` | Button is clicked |
| `toggled` | `CheckBox` | Checkbox state changes |
| `value_changed` | `HSlider`, `VSlider` | Slider value changes |

### Connecting Signals

In TypeScript, use the `@signal` decorator to declare a handler. The engine wires it automatically when the node enters the scene tree:

````tabs
--- tab: TypeScript
```ts
import { signal } from "moud";

export default class TrapZone extends Area3D {
  @signal("area_entered")
  onPlayerEnter(playerUuid: string) {
    this.log("Player entered: " + playerUuid);
    this.teleportPlayer(playerUuid, 0, 10, 0);
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_player_enter");
  },

  _on_player_enter(playerUuid) {
    this.api.log("Player entered: " + playerUuid);
    this.api.teleportPlayer(playerUuid, 0, 10, 0);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_player_enter")
end

function script:_on_player_enter(playerUuid)
    self.api:log("Player entered: " .. playerUuid)
    self.api:teleportPlayer(playerUuid, 0, 10, 0)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class TrapZone extends NodeScript {
    @Override public void onEnterTree() {
        core.connect(core.id(), "area_entered", core.id(), "_on_player_enter");
    }

    public void onPlayerEnter(Object playerUuid) {
        core.log("Player entered: " + playerUuid);
        // teleport via property set or dedicated API
    }
}
```
````

### Custom Signals

Declare custom signals with `@signal` on your class, then emit them with `this.emit()`. Use `@emits` to document which signals a method fires:

````tabs
--- tab: TypeScript
```ts
import { signal, emits } from "moud";

// collectible.ts
export default class Collectible extends Area3D {
  @signal("orb_collected")
  onDeclareSignal() {}  // declaration only - never called directly

  @emits("orb_collected")
  collect() {
    this.emit("orb_collected");
    this.free();
  }
}

// score.ts
export default class ScoreTracker extends Node {
  private orbNode!: Node;

  @ready()
  onReady() {
    this.orbNode = this.find("Orb");
    this.connect(this.orbNode.id, "orb_collected", this.id, "_on_orb");
  }

  _on_orb() {
    this.score++;
  }
}
```

--- tab: JavaScript
```js
// In collectible.js:
this.api.emit_signal("orb_collected");

// In score.js:
api.connect(orbNodeId, "orb_collected", api.id(), "_on_orb");
```

--- tab: Luau
```lua
-- In collectible.luau:
self.api:emit_signal("orb_collected")

-- In score.luau:
api.connect(orbNodeId, "orb_collected", api.id(), "_on_orb")
```

--- tab: Java
```java
// In Collectible.java:
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Collectible extends NodeScript {
    public void collect() {
        core.emit_signal("orb_collected");
        core.free(core.id());
    }
}

// In ScoreTracker.java:
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScoreTracker extends NodeScript {
    private long orbNodeId;

    @Override public void onReady() {
        orbNodeId = core.find("Orb");
        core.connect(orbNodeId, "orb_collected", core.id(), "_on_orb");
    }

    public void onOrb(Object arg) {
        // score++
    }
}
```
````

Signals can carry up to 3 arguments:

````tabs
--- tab: TypeScript
```ts
this.emit("damage_taken", 25, "fire");
// Handler receives: onDamageTaken(amount: number, type: string)
```

--- tab: JavaScript
```js
api.emit_signal("damage_taken", 25, "fire");
// Handler receives: _on_damage_taken(amount, type)
```

--- tab: Java
```java
core.emit_signal("damage_taken", 25, "fire");
// Handler receives: public void onDamageTaken(Object amount, Object type) { ... }
```
````

### Disconnecting Signals

````tabs
--- tab: TypeScript
```ts
this.disconnect(sourceId, "area_entered", targetId, "_on_player_enter");
```

--- tab: JavaScript
```js
api.disconnect(sourceId, "area_entered", targetId, "_on_player_enter");
```

--- tab: Java
```java
core.disconnect(sourceId, "area_entered", targetId, "_on_player_enter");
```
````

## Timers

Use `after()` from `moud/timers` for delayed one-shot actions:

````tabs
--- tab: TypeScript
```ts
import { after } from "moud/timers";

export default class Spawner extends Node {
  @ready()
  onReady() {
    after(2.0, () => {
      this.log("Two seconds have passed!");
    });
  }
}
```

--- tab: JavaScript
```js
_ready(api) {
  api.after(2.0, function() {
    api.log("Two seconds have passed!");
  });
}
```

--- tab: Luau
```lua
function script:_ready(api)
    api.after(2.0, function()
        api.log("Two seconds have passed!")
    end)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Spawner extends NodeScript {
    @Override public void onReady() {
        core.after(2.0, () -> {
            core.log("Two seconds have passed!");
        });
    }
}
```
````

## Tweens

Use `this.tween()` to smoothly animate a numeric property:

````tabs
--- tab: TypeScript
```ts
// Slide the node to x=10 over 0.5 seconds
this.tween({ property: "x", to: 10, duration: 0.5 });
```

--- tab: JavaScript
```js
// Slide the node to x=10 over 0.5 seconds
api.tween(api.id(), "x", 10, 0.5);
```

--- tab: Java
```java
// Slide the node to x=10 over 0.5 seconds via timed set
double start = core.getNumber(core.id(), "x", 0);
core.after(0.5, () -> core.setNumber(core.id(), "x", 10));
```
````

Tweens run on the server and replicate to clients, making them ideal for doors, moving platforms, or UI transitions.

## Storing State

Use class fields (TypeScript) or `this`/`self` (JS/Luau) to keep local state on your script instance. This state is per-node and lives as long as the node exists:

````tabs
--- tab: TypeScript
```ts
import { property } from "moud";

export default class ScoreTracker extends Node {
  @property score = 0;  // synced to scene tree, visible to other scripts

  private localCache = "";  // private - not synced

  _on_orb() {
    this.score++;
  }
}
```

--- tab: JavaScript
```js
({
  score: 0,

  _on_orb() {
    this.score++;
    this.api.set("score", "" + this.score);
  }
})
```

--- tab: Luau
```lua
local script = { score = 0 }

function script:_on_orb()
    self.score = self.score + 1
    self.api:set("score", tostring(self.score))
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScoreTracker extends NodeScript {
    private int score = 0;

    public void onOrb(Object arg) {
        score++;
        core.set(core.id(), "score", Integer.toString(score));
    }
}
```
````

Fields marked with `@property` are backed by node properties in the scene tree - they get replicated to clients and are visible to other scripts. Plain class fields are local only.
