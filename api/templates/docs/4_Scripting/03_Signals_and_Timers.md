# Signals, Timers, and Tweens

Signals let nodes communicate without hard-coding dependencies. Timers let you delay actions. Tweens let you animate properties smoothly.

## Connecting Signals

### `@signal` Decorator (Primary)

The `@signal` decorator is the recommended way to connect signals. Place it on a method and it will be auto-connected when the node enters the tree.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, enterTree, signal } from "moud";

export default class Collectible extends Node3D {
  @signal("area_entered")
  onTouched(playerUuid: string) {
    console.log(`Player ${playerUuid} touched the collectible`);
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_touched");
  },

  _on_touched(playerUuid) {
    this.api.log("Touched by: " + playerUuid);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_touched")
end
function script:_on_touched(playerUuid)
    self.api:log("Touched by: " .. playerUuid)
end
return script
```
````

### `this.connect` / `this.disconnect` - Programmatic

Use `this.connect` and `this.disconnect` when you need to connect signals dynamically at runtime rather than at tree entry.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class Manager extends Node3D {
  @ready()
  init() {
    // Connect a signal programmatically
    this.connect({
      signal: "area_entered",
      target: this,
      handler: this.onEnter,
    });
  }

  onEnter(playerUuid: string) {
    console.log("Entered:", playerUuid);
    // Disconnect after first use
    this.disconnect({
      signal: "area_entered",
      target: this,
      handler: this.onEnter,
    });
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    this.api.log("Entered: " + playerUuid);
    this.api.disconnect(this.api.id(), "area_entered", this.api.id(), "_on_enter");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end
function script:_on_enter(playerUuid)
    self.api:log("Entered: " .. playerUuid)
    api.disconnect(api.id(), "area_entered", api.id(), "_on_enter")
end
return script
```
````

## Emitting Signals

### `this.emit(signal, ...args)`

Emit a custom signal from this node. Up to three arguments are supported.

````tabs
--- tab: TypeScript
```typescript
this.emit("door_opened");
this.emit("damage_taken", 25);
this.emit("item_used", "potion", 1);
this.emit("hit", targetId, 50, "fire");
```

--- tab: JavaScript
```js
api.emit_signal("door_opened");
api.emit_signal("damage_taken", 25);
api.emit_signal("item_used", "potion", 1);
api.emit_signal("hit", targetId, 50, "fire");
```

--- tab: Luau
```lua
api:emit_signal("door_opened")
api:emit_signal("damage_taken", 25)
api:emit_signal("item_used", "potion", 1)
```
````

### `@emits` - Typed Custom Signals

Use the `@emits` class decorator to declare the signals your node emits. This gives you full TypeScript type safety when calling `this.emit`.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal } from "moud";
import { emits } from "moud/signals";

@emits<{
  collected: [];
  damage_taken: [amount: number];
  item_dropped: [itemId: string, count: number];
}>()
export default class Enemy extends Area3D {
  @signal("area_entered")
  onHit(playerUuid: string) {
    this.emit("damage_taken", 10); // type-checked: number required
    this.emit("collected");        // type-checked: no args
  }
}
```

--- tab: JavaScript
```js
// JavaScript does not use @emits - emit_signal works without declaration
api.emit_signal("collected");
api.emit_signal("damage_taken", 10);
```

--- tab: Luau
```lua
-- Luau does not use @emits - emit_signal works without declaration
api:emit_signal("collected")
api:emit_signal("damage_taken", 10)
```
````

## Built-in Signals

These signals are emitted automatically by certain node types:

| Signal | Node Types | Arguments |
|---|---|---|
| `area_entered` | `Area3D` | `playerUuid: string` |
| `area_exited` | `Area3D` | `playerUuid: string` |
| `pressed` | `Button`, `TextureButton` | (none) |
| `toggled` | `CheckBox` | `state: boolean` |
| `value_changed` | `HSlider`, `VSlider` | `value: number` |

## Complete Example: Collectible Orb

A collectible orb that emits a custom `collected` signal and removes itself when a player enters its area.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal } from "moud";
import { emits } from "moud/signals";

@emits<{ collected: [playerUuid: string] }>()
export default class Orb extends Area3D {
  @signal("area_entered")
  onPlayerEnter(playerUuid: string) {
    // Notify any listeners (e.g. a score manager)
    this.emit("collected", playerUuid);
    // Remove this node from the scene
    this.free();
  }
}
```

```typescript
// score_manager.ts - listens for the orb's signal
import { Node3D, ready } from "moud";

export default class ScoreManager extends Node3D {
  private score = 0;

  @ready()
  init() {
    // Connect to every orb in the scene
    const orbs = this.findNodesByType("Area3D");
    for (const orb of orbs) {
      orb.connect({
        signal: "collected",
        target: this,
        handler: this.onOrbCollected,
      });
    }
  }

  onOrbCollected(playerUuid: string) {
    this.score++;
    console.log(`Score: ${this.score} (collected by ${playerUuid})`);
  }
}
```

--- tab: JavaScript
```js
// orb.js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    this.api.emit_signal("collected", playerUuid);
    this.api.free(this.api.id());
  }
})

// score_manager.js
({
  score: 0,

  _ready(api) {
    this.api = api;
    var orbs = api.findNodesByType("Area3D");
    for (var i = 0; i < orbs.length; i++) {
      api.connect(orbs[i], "collected", api.id(), "_on_orb");
    }
  },

  _on_orb(playerUuid) {
    this.score++;
    this.api.log("Score: " + this.score);
  }
})
```

--- tab: Luau
```lua
-- orb.luau
local script = {}
function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end
function script:_on_enter(playerUuid)
    self.api:emit_signal("collected", playerUuid)
    self.api:free(self.api:id())
end
return script

-- score_manager.luau
local script = { score = 0 }
function script:_ready(api)
    self.api = api
    local orbs = api.findNodesByType("Area3D")
    for _, orbId in ipairs(orbs) do
        api.connect(orbId, "collected", api.id(), "_on_orb")
    end
end
function script:_on_orb(playerUuid)
    self.score = self.score + 1
    self.api:log("Score: " .. self.score)
end
return script
```
````

## Timers

### `after(seconds, callback)` - from `moud/timers`

Schedules a function to run after a delay. Returns a cancel function you can call to abort the timer before it fires.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { after } from "moud/timers";

export default class Demo extends Node3D {
  @ready()
  init() {
    // Fire once after 2 seconds
    after(2.0, () => {
      console.log("2 seconds passed!");
    });

    // Cancel a timer early
    const cancel = after(5.0, () => {
      console.log("This will never run");
    });
    cancel();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.after(2.0, function() {
      api.log("2 seconds passed!");
    });
  }
})
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

### `this.tween({ property, to, duration, onComplete? })`

Smoothly animates a numeric property from its current value to a target value over the given duration in seconds. The optional `onComplete` callback fires when the tween finishes.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class Platform extends Node3D {
  @ready()
  init() {
    // Slide right
    this.tween({ property: "x", to: 10, duration: 0.5 });

    // Rotate door open
    this.tween({ property: "ry", to: 90, duration: 1.0 });

    // Move up then free the node
    this.tween({
      property: "y",
      to: 5,
      duration: 1.0,
      onComplete: () => this.free(),
    });
  }
}
```

--- tab: JavaScript
```js
api.tween(api.id(), "x", 10, 0.5);
api.tween(api.id(), "ry", 90, 1.0);
api.tween(panelId, "modulate_a", 0, 0.3);
```

--- tab: Luau
```lua
api.tween(api.id(), "x", 10, 0.5)
api.tween(api.id(), "ry", 90, 1.0)
api.tween(panelId, "modulate_a", 0, 0.3)
```
````

Tweens run on the server and replicate to clients, so the animation looks smooth for all players.

## Complete Example: Door with Timer Chain

A door that opens on signal, waits, then closes automatically.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal } from "moud";
import { after } from "moud/timers";

export default class Door extends Area3D {
  private isOpen = false;

  @signal("area_entered")
  onPlayerEnter(playerUuid: string) {
    if (this.isOpen) return;
    this.open();
  }

  private open() {
    this.isOpen = true;
    // Swing door open
    this.tween({ property: "ry", to: 90, duration: 0.6 });

    // Auto-close after 3 seconds
    after(3.0, () => this.close());
  }

  private close() {
    this.tween({
      property: "ry",
      to: 0,
      duration: 0.6,
      onComplete: () => {
        this.isOpen = false;
      },
    });
  }
}
```

--- tab: JavaScript
```js
({
  isOpen: false,

  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
  },

  _on_enter(playerUuid) {
    if (this.isOpen) return;
    this.isOpen = true;
    var self = this;
    this.api.tween(this.api.id(), "ry", 90, 0.6);
    this.api.after(3.0, function() {
      self.api.tween(self.api.id(), "ry", 0, 0.6);
      self.isOpen = false;
    });
  }
})
```

--- tab: Luau
```lua
local script = { isOpen = false }

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
end

function script:_on_enter(playerUuid)
    if self.isOpen then return end
    self.isOpen = true
    self.api.tween(self.api:id(), "ry", 90, 0.6)
    self.api.after(3.0, function()
        self.api.tween(self.api:id(), "ry", 0, 0.6)
        self.isOpen = false
    end)
end

return script
```
````
