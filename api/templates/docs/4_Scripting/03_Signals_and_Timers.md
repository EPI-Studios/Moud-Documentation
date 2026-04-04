# Signals and Timers API

Signals let nodes communicate without hard-coding dependencies. Timers let you delay actions. Tweens let you animate properties smoothly.

## Connecting Signals

### `api.connect(sourceId, signal, targetId, method)` → void

Connects a signal from one node to a method on another node. When the source emits the signal, the target's method is called.

````tabs
--- tab: JavaScript
```js
// When this node's area is entered, call _on_enter on this node
api.connect(api.id(), "area_entered", api.id(), "_on_enter");

// When the button is pressed, call _on_button on this node
api.connect(buttonId, "pressed", api.id(), "_on_button");

// Cross-node: when orb emits "collected", call _on_orb on the score node
api.connect(orbId, "collected", scoreId, "_on_orb");
```

--- tab: Luau
```lua
api.connect(api.id(), "area_entered", api.id(), "_on_enter")
api.connect(buttonId, "pressed", api.id(), "_on_button")
api.connect(orbId, "collected", scoreId, "_on_orb")
```
````

### `api.disconnect(sourceId, signal, targetId, method)` → void

Removes a signal connection.

```js
api.disconnect(buttonId, "pressed", api.id(), "_on_button");
```

## Emitting Signals

### `api.emit_signal(signal)` → void

Emits a signal from this node with no arguments.

```js
api.emit_signal("door_opened");
```

### `api.emit_signal(signal, arg1)` → void

Emits with one argument.

```js
api.emit_signal("damage_taken", 25);
```

### `api.emit_signal(signal, arg1, arg2)` → void

Emits with two arguments.

```js
api.emit_signal("item_used", "potion", 1);
```

### `api.emit_signal(signal, arg1, arg2, arg3)` → void

Emits with three arguments (maximum).

```js
api.emit_signal("hit", targetId, 50, "fire");
```

## Built-in Signals

These signals are emitted automatically by certain node types:

| Signal | Emitted By | Arguments | When |
|---|---|---|---|
| `area_entered` | `Area3D` | player UUID (string) | Player enters the area |
| `area_exited` | `Area3D` | player UUID (string) | Player leaves the area |
| `pressed` | `Button`, `TextureButton` | - | Button is clicked |
| `toggled` | `CheckBox` | state (bool) | Checkbox toggled |
| `value_changed` | `HSlider`, `VSlider` | new value (number) | Slider moved |

## Complete Signal Example

````tabs
--- tab: JavaScript
```js
// collectible.js - emits a signal when collected
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_touched");
  },

  _on_touched(playerUuid) {
    this.api.emit_signal("orb_collected");
    this.api.free(this.api.id());
  }
})

// score.js - listens for the signal
({
  score: 0,

  _ready(api) {
    this.api = api;
    // Connect to each orb's signal
    var orbs = api.findNodesByType("Area3D");
    for (var i = 0; i < orbs.length; i++) {
      api.connect(orbs[i], "orb_collected", api.id(), "_on_orb");
    }
  },

  _on_orb() {
    this.score++;
    this.api.log("Score: " + this.score);
  }
})
```

--- tab: Luau
```lua
-- collectible.luau
local script = {}
function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_touched")
end
function script:_on_touched(playerUuid)
    self.api:emit_signal("orb_collected")
    self.api:free(self.api:id())
end
return script

-- score.luau
local script = { score = 0 }
function script:_ready(api)
    self.api = api
    local orbs = api.findNodesByType("Area3D")
    for _, orbId in ipairs(orbs) do
        api.connect(orbId, "orb_collected", api.id(), "_on_orb")
    end
end
function script:_on_orb()
    self.score = self.score + 1
    self.api:log("Score: " .. self.score)
end
return script
```
````

## Timers

### `api.after(seconds, callback)` → void

Schedules a function to be called after a delay. The timer fires once.

````tabs
--- tab: JavaScript
```js
_ready(api) {
  // Do something after 2 seconds
  api.after(2.0, function() {
    api.log("2 seconds passed!");
  });

  // Chain timers for sequences
  api.after(1.0, function() {
    api.log("Step 1");
    api.after(1.0, function() {
      api.log("Step 2");
    });
  });
}
```

--- tab: Luau
```lua
function script:_ready(api)
    api.after(2.0, function()
        api.log("2 seconds passed!")
    end)
end
```
````

## Tweens

### `api.tween(nodeId, property, targetValue, duration)` → void

Smoothly animates a numeric property from its current value to the target value over the given duration in seconds.

````tabs
--- tab: JavaScript
```js
// Slide a node to x=10 over half a second
api.tween(api.id(), "x", 10, 0.5);

// Fade out a UI element
api.tween(panelId, "modulate_a", 0, 0.3);

// Open a door (rotate it)
api.tween(doorId, "ry", 90, 1.0);

// Move a platform up
api.tween(platformId, "y", 10, 2.0);
```

--- tab: Luau
```lua
api.tween(api.id(), "x", 10, 0.5)
api.tween(panelId, "modulate_a", 0, 0.3)
api.tween(doorId, "ry", 90, 1.0)
```
````

Tweens run on the server and replicate to clients, so they look smooth for all players.
