# Scene Management API

Load scenes, instantiate subscenes, query the scene tree, and control the scene lifecycle from scripts.

All scene management functions are imported from `moud/scene`.

## Loading Scenes

### `loadScene(id)` - from `moud/scene`

Replaces the current scene with the scene identified by `id`. The `id` matches the `sceneId` field in the target scene file.

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
````

The `sceneId` comes from the target scene file:

```json
{
  "format": 1,
  "sceneId": "level_1",
  "displayName": "Level 1 - The Forest"
}
```

## Instantiating Subscenes

### `instantiate<T>(path, parent)` - from `moud/scene`

Instantiates a `.moud.scene` file as a subtree under the given parent node. Returns a typed reference to the root node of the instantiated tree.

Use this to spawn prefabs, enemies, pickups, or any reusable scene authored in the editor.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, RigidBody3D, ready } from "moud";
import { instantiate, getRoot } from "moud/scene";

export default class Spawner extends Node3D {
  @ready()
  init() {
    const root = getRoot();

    // Spawn an enemy prefab under the scene root
    const enemy = instantiate<RigidBody3D>("scenes/enemy.moud.scene", root);
    enemy.position = { x: 5, y: 0, z: 0 };

    // Spawn a decoration under this node
    instantiate("scenes/tree.moud.scene", this);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;

    // Spawn under root
    var enemy = api.instantiate("scenes/enemy.moud.scene", api.getRootId());
    api.set(enemy, "x", "5");

    // Spawn under this node
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
````

## Getting the Scene Root

### `getRoot()` - from `moud/scene`

Returns a reference to the root node of the current scene. Useful when you need to instantiate a scene at the top level rather than as a child of the current node.

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
````

## Finding Nodes by Type

### `findNodesByType<T>(type)` - from `moud/scene`

Returns an array of all nodes in the current scene tree that match the given type. Import `NodeType` from `"moud"` for the type enum.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, Area3D, NodeType, ready } from "moud";
import { findNodesByType } from "moud/scene";

export default class Manager extends Node3D {
  @ready()
  init() {
    // Find all Area3D nodes in the scene
    const zones = findNodesByType<Area3D>(NodeType.Area3D);
    console.log(`Found ${zones.length} trigger zones`);

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
    api.log("Found " + zones.length + " trigger zones");

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
    api.log("Found " .. #zones .. " trigger zones")

    for _, zoneId in ipairs(zones) do
        api.connect(zoneId, "area_entered", api.id(), "_on_zone_entered")
    end
end

function script:_on_zone_entered(playerUuid)
    self.api:log("Player " .. playerUuid .. " entered a zone")
end

return script
```
````

## Flushing Pending Operations

### `this.flush()` → `void`

Forces all pending scene operations to be applied immediately within the current tick.

Normally, scene mutations (property writes, node creation, reparenting) are batched and applied together at the end of the tick. Call `flush()` when you need a change to be visible to a subsequent API call in the same tick.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { instantiate } from "moud/scene";

export default class SetupScript extends Node3D {
  @ready()
  init() {
    const child = this.createChild("Marker", "Node3D");
    // Without flush, position read-back in the same tick may return stale data
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
    // Now api.getNumber(node, "x", 0) reliably returns 10
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
````

In most cases you do not need `flush()`. Default batching is fine and more efficient.

## Complete Example: Scene Switcher with Loading Screen

A button-driven scene switcher that briefly shows a loading label before transitioning. Demonstrates `loadScene`, `instantiate`, `findNodesByType`, and a timer chain.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, Label, signal, ready } from "moud";
import { loadScene, findNodesByType } from "moud/scene";
import { NodeType } from "moud";
import { after } from "moud/timers";

export default class SceneSwitcher extends Node3D {
  private nextScene = "level_2";
  private transitioning = false;

  @ready()
  init() {
    // Connect every button in the scene to the switch handler
    const buttons = findNodesByType(NodeType.Button);
    for (const btn of buttons) {
      btn.connect({ signal: "pressed", target: this, handler: this.onSwitch });
    }
  }

  @signal("pressed")
  onSwitch() {
    if (this.transitioning) return;
    this.transitioning = true;

    // Show a loading label
    const label = this.find<Label>("UI/LoadingLabel");
    if (label) {
      label.text = "Loading...";
      label.visible = true;
    }

    // Fade in the label, wait, then load
    if (label) {
      label.tween({ property: "modulate_a", to: 1, duration: 0.3 });
    }

    after(0.5, () => {
      loadScene(this.nextScene);
    });
  }
}
```

--- tab: JavaScript
```js
({
  nextScene: "level_2",
  transitioning: false,

  _ready(api) {
    this.api = api;
    var buttons = api.findNodesByType("Button");
    for (var i = 0; i < buttons.length; i++) {
      api.connect(buttons[i], "pressed", api.id(), "_on_switch");
    }
  },

  _on_switch() {
    if (this.transitioning) return;
    this.transitioning = true;

    var self = this;
    var label = this.api.find("UI/LoadingLabel");
    if (label) {
      this.api.set(label, "text", "Loading...");
      this.api.set(label, "visible", "true");
      this.api.tween(label, "modulate_a", 1, 0.3);
    }

    this.api.after(0.5, function() {
      self.api.loadScene(self.nextScene);
    });
  }
})
```

--- tab: Luau
```lua
local script = { nextScene = "level_2", transitioning = false }

function script:_ready(api)
    self.api = api
    local buttons = api.findNodesByType("Button")
    for _, btnId in ipairs(buttons) do
        api.connect(btnId, "pressed", api.id(), "_on_switch")
    end
end

function script:_on_switch()
    if self.transitioning then return end
    self.transitioning = true

    local label = self.api:find("UI/LoadingLabel")
    if label then
        self.api:set(label, "text", "Loading...")
        self.api:set(label, "visible", "true")
        self.api.tween(label, "modulate_a", 1, 0.3)
    end

    local self_ref = self
    self.api.after(0.5, function()
        self_ref.api:loadScene(self_ref.nextScene)
    end)
end

return script
```
````
