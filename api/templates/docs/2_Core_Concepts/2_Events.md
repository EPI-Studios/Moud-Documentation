# Events and Lifecycle

Scripts in Moud are event-driven. Your code does not run in a loop that you manage yourself. Instead, you define callback methods and the engine calls them at the right time.

## Script Shape

A Moud script is an object (JavaScript) or table (Luau) with named methods. The engine calls these methods automatically.

````tabs
--- tab: JavaScript
```js
({
  // Local state - lives on this script instance
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
````

## Lifecycle Callbacks

These are called automatically by the engine in this order:

| Callback | When It Fires | Common Use |
|---|---|---|
| `_enter_tree(api)` | Node is added to the scene tree | Store `api` reference, set up signal connections |
| `_ready(api)` | After `_enter_tree`, node is fully initialized | Initialize state, find other nodes, start timers |
| `_process(api, dt)` | Every server tick | Visual updates, UI logic, non-physics gameplay |
| `_physics_process(api, dt)` | Every physics step | Movement, forces, collision checks, physics-dependent logic |
| `_input(api, event)` | When a player sends input | Custom input handling |
| `_exit_tree(api)` | Node is being removed | Cleanup |

```hint important _enter_tree vs _ready
Use `_enter_tree` when you need to set up signal connections early. Use `_ready` for everything else - by that point the full scene tree is available so you can safely call `api.find(...)` to look up other nodes.
```

### The `dt` Parameter

Both `_process` and `_physics_process` receive a `dt` (delta time) value - the number of seconds since the last call. Always multiply movement and animation by `dt` to make them frame-rate independent:

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  // Move 5 units per second regardless of tick rate
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
````

## Signals

Signals are how nodes communicate without hard-coding dependencies. A node emits a signal, and any node that connected to it gets its handler called.

### Built-in Signals

| Signal | Emitted By | When |
|---|---|---|
| `area_entered` | `Area3D` | A player or body enters the area |
| `area_exited` | `Area3D` | A player or body leaves the area |
| `pressed` | `Button` | Button is clicked |
| `toggled` | `CheckBox` | Checkbox state changes |
| `value_changed` | `HSlider`, `VSlider` | Slider value changes |

### Connecting Signals

Use `api.connect(sourceId, signal, targetId, method)` to wire a signal to a handler:

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    // When this node's area_entered fires, call _on_player_enter on this node
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
````

### Custom Signals

You can emit your own signals and connect to them from other scripts:

````tabs
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
````

Signals can carry up to 3 arguments:

```js
api.emit_signal("damage_taken", 25, "fire");
// Handler receives: _on_damage_taken(amount, type)
```

### Disconnecting Signals

```js
api.disconnect(sourceId, "area_entered", targetId, "_on_player_enter");
```

## Timers

Use `api.after(seconds, callback)` for delayed one-shot actions:

````tabs
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
````

## Tweens

Use `api.tween(nodeId, property, targetValue, duration)` to smoothly animate a numeric property:

```js
// Slide the node to x=10 over 0.5 seconds
api.tween(api.id(), "x", 10, 0.5);
```

Tweens run on the server and replicate to clients, so they're ideal for gameplay animations like doors opening, platforms moving, or UI transitions.

## Storing State

Use `this` (JavaScript) or `self` (Luau) to keep local state on your script instance. This state is per-node and lives as long as the node exists:

````tabs
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
````

For data that needs to survive across scene loads or be visible to other scripts, write it to node **properties** with `api.set()` - properties are part of the scene tree and get replicated to clients.

## Storing the `api` Reference

The `api` object is passed to every lifecycle callback. If you need it inside signal handlers (which don't receive `api`), store it in `_enter_tree` or `_ready`:

```js
({
  _enter_tree(api) {
    this.api = api;  // Save for use in signal handlers
  },

  _on_pressed() {
    this.api.log("Button was pressed!");  // Works because we stored api
  }
})
```
