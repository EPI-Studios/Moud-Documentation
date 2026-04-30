# Scene Management API

The `moud/scene` module provides methods for runtime scene evaluation and lifecycle management. Scripts utilize these functions to transition between environments, instantiate hierarchical subgraphs, traverse the active node structure, and force synchronous state updates.

---

## Loading scenes

`loadScene(id: string)`

Replaces the executing scene with the target scene environment. The `id` parameter evaluates against the `sceneId` property defined within the root of the target `.moud.scene` JSON file.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, signal } from "moud";
import { loadScene } from "moud/scene";

export default class MainMenu extends Node3D {
  @signal("pressed")
  onPlayPressed() {
    loadScene("level_1");
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "pressed", api.id(), "_on_play");
  },

  _on_play() {
    this.api.loadScene("level_1");
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "pressed", api.id(), "_on_play")
end

function script:_on_play()
    self.api:loadScene("level_1")
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MainMenu extends NodeScript {
    @Override public void onEnterTree() {
        core.connect(core.id(), "pressed", core.id(), "_on_play");
    }

    public void onPlay() {
        core.loadScene("level_1");
    }
}
```
````

---

## Instantiating subscenes

`instantiate<T>(path: string, parent: Node | long)`

Instantiates an external `.moud.scene` file as a child hierarchy beneath the designated `parent` node. Returns a typed reference (or numerical node ID) to the root node of the allocated subgraph.

The `path` is resolved through the project root by `ProjectService.resolveProjectPath`. It must be a full path including the `.moud.scene` extension, either as a relative project path (`"scenes/enemy.moud.scene"`) or as a `res://` URI (`"res://scenes/enemy.moud.scene"`). A bare scene id like `"enemy"` will fail because the resolver does not append an extension.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, RigidBody3D, ready } from "moud";
import { instantiate, getRoot } from "moud/scene";

export default class Spawner extends Node3D {
  @ready()
  init() {
    const root = getRoot();

    const enemy = instantiate<RigidBody3D>("scenes/enemy.moud.scene", root);
    enemy.position = { x: 5, y: 0, z: 0 };

    instantiate("scenes/tree.moud.scene", this);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;

    var enemy = api.instantiate("scenes/enemy.moud.scene", api.getRootId());
    api.set(enemy, "x", "5");

    api.instantiate("scenes/tree.moud.scene", api.id());
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    self.api = api

    local enemy = api.instantiate("scenes/enemy.moud.scene", api.getRootId())
    api.set(enemy, "x", "5")

    api.instantiate("scenes/tree.moud.scene", api.id())
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Spawner extends NodeScript {
    @Override public void onReady() {
        long enemy = core.instantiate("scenes/enemy.moud.scene", core.getRootId());
        core.set(enemy, "x", "5");

        core.instantiate("scenes/tree.moud.scene", core.id());
    }
}
```
````

---

## Scene root evaluation

`getRoot()`

Returns a reference (or numerical node ID) to the absolute root node of the executing scene graph.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { getRoot } from "moud/scene";

export default class LevelManager extends Node3D {
  @ready()
  init() {
    const root = getRoot();
    console.log(`Scene root: ${root.name}`);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var rootId = api.getRootId();
    api.log("Scene root id: " + rootId);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local rootId = api.getRootId()
    api.log("Scene root id: " .. rootId)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class LevelManager extends NodeScript {
    @Override public void onReady() {
        long rootId = core.getRootId();
        log("Scene root id: " + rootId);
    }
}
```
````

---

## Type-based traversal

`findNodesByType<T>(type: string | NodeType)`

Iterates the active scene graph and returns an array of instantiated nodes matching the specified class type. In TypeScript, the target class is evaluated using the `NodeType` enum.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, Area3D, NodeType, ready } from "moud";
import { findNodesByType } from "moud/scene";

export default class Manager extends Node3D {
  @ready()
  init() {
    const zones = findNodesByType<Area3D>(NodeType.Area3D);

    for (const zone of zones) {
      zone.connect({
        signal: "area_entered",
        target: this,
        handler: this.onZoneEntered,
      });
    }
  }

  onZoneEntered(playerUuid: string) {
    console.log(`Player ${playerUuid} entered a zone`);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    var zones = api.findNodesByType("Area3D");

    for (var i = 0; i < zones.length; i++) {
      api.connect(zones[i], "area_entered", api.id(), "_on_zone_entered");
    }
  },

  _on_zone_entered(playerUuid) {
    this.api.log("Player " + playerUuid + " entered a zone");
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    self.api = api
    local zones = api.findNodesByType("Area3D")

    for _, zoneId in ipairs(zones) do
        api.connect(zoneId, "area_entered", api.id(), "_on_zone_entered")
    end
end

function script:_on_zone_entered(playerUuid)
    self.api:log("Player " .. playerUuid .. " entered a zone")
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Manager extends NodeScript {
    @Override public void onReady() {
        long[] zones = core.findNodesByType("Area3D");

        for (long zoneId : zones) {
            core.connect(zoneId, "area_entered", core.id(), "_on_zone_entered");
        }
    }

    public void onZoneEntered(Object playerUuid) {
        log("Player " + playerUuid + " entered a zone");
    }
}
```
````

---

## Synchronous state execution

`flush()`

Forces immediate execution of all pending scene mutations (e.g., property modifications, node instantiation) within the active server tick.

By default, the engine batches scene operations for end-of-tick execution. Evaluating `flush()` overrides this batching, ensuring subsequent synchronous API calls evaluate against the mutated scene state.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class SetupScript extends Node3D {
  @ready()
  init() {
    const child = this.createChild("Marker", "Node3D");
    this.flush();
    console.log(`Marker at: ${child.position.x}`);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var node = api.createRuntime(0, "Marker", "Node3D");
    api.set(node, "x", "10");
    api.flush();
    api.log("x is: " + api.getNumber(node, "x", 0));
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local node = api.createRuntime(0, "Marker", "Node3D")
    api.set(node, "x", "10")
    api.flush()
    api.log("x is: " .. api.getNumber(node, "x", 0))
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class SetupScript extends NodeScript {
    @Override public void onReady() {
        long node = core.createRuntime(0, "Marker", "Node3D");
        core.set(node, "x", "10");
        core.flush();
        log("x is: " + core.getNumber(node, "x", 0));
    }
}
```
````