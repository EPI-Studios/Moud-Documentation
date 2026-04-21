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

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Collectible extends NodeScript {
    @Override public void onEnterTree() {
        core.connect(core.id(), "area_entered", core.id(), "_on_touched");
    }

    public void onTouched(Object playerUuid) {
        log("Touched by: " + playerUuid);
    }
}
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

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Manager extends NodeScript {
    @Override public void onReady() {
        core.connect(core.id(), "area_entered", core.id(), "_on_enter");
    }

    public void onEnter(Object playerUuid) {
        log("Entered: " + playerUuid);
        core.disconnect(core.id(), "area_entered", core.id(), "_on_enter");
    }
}
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

--- tab: Java
```java
core.emit_signal("door_opened");
core.emit_signal("damage_taken", 25);
core.emit_signal("item_used", "potion", 1);
core.emit_signal("hit", targetId, 50, "fire");
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

--- tab: Java
```java
// Java does not use @emits - emit_signal works without declaration
core.emit_signal("collected");
core.emit_signal("damage_taken", 10);
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

--- tab: Java
```java
// Orb.java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Orb extends NodeScript {
    @Override public void onEnterTree() {
        core.connect(core.id(), "area_entered", core.id(), "_on_enter");
    }

    public void onEnter(Object playerUuid) {
        core.emit_signal("collected", playerUuid);
        core.free(core.id());
    }
}

// ScoreManager.java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScoreManager extends NodeScript {
    int score = 0;

    @Override public void onReady() {
        long[] orbs = core.findNodesByType("Area3D");
        for (long orbId : orbs) {
            core.connect(orbId, "collected", core.id(), "_on_orb");
        }
    }

    public void onOrb(Object playerUuid) {
        score++;
        log("Score: " + score);
    }
}
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

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Demo extends NodeScript {
    @Override public void onReady() {
        core.after(2.0, () -> log("2 seconds passed!"));
    }
}
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

--- tab: Java
```java
core.tween(core.id(), "x", 10, 0.5);
core.tween(core.id(), "ry", 90, 1.0);
core.tween(panelId, "modulate_a", 0, 0.3);
```
````

Tweens run on the server and replicate to clients, so the animation looks smooth for all players.