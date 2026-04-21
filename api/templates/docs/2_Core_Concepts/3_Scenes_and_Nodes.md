# Scenes and Nodes


## What Is a Scene?

A scene is a JSON file (`.moud.scene`) that describes a tree of nodes. It represents a level, a room, a HUD, a menu - whatever you need. A project can have many scenes; the server loads and manages them independently.

```json
{
  "format": 1,
  "sceneId": "main",
  "displayName": "Main Level",
  "nodes": [
    {
      "id": 1,
      "parent": 0,
      "name": "Environment",
      "type": "WorldEnvironment",
      "properties": {
        "sky_color_r": "0.4",
        "sky_color_g": "0.6",
        "sky_color_b": "1.0"
      }
    },
    {
      "id": 2,
      "parent": 0,
      "name": "Spawn",
      "type": "PlayerStart",
      "properties": { "x": "0", "y": "5", "z": "0" }
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `format` | Yes | Always `1` |
| `sceneId` | Yes | Unique ID used by `api.loadScene()` to switch scenes |
| `displayName` | Yes | Human-readable name shown in the editor |
| `nodes` | Yes | Array of node objects |

```hint info Scene ID Format
Scene ID rules: lowercase letters, digits, underscores, and hyphens only (`[a-z0-9_-]`), maximum 64 characters. Example valid IDs: `main`, `dungeon_level_1`, `pvp-arena`.
```

---

## What Is a Node?

A node is the basic the building block of every Moud scene. Everything in your game, such as the floor, lights, cameras, UI buttons, physics objects, or scripts, is simply a node.

Each node has exactly these fields:

| Field | Type | Description |
|---|---|---|
| `id` | long integer | Unique numeric ID within the scene, assigned by the server |
| `parent` | long integer | ID of the parent node, or `0` for root-level |
| `name` | string | Human-readable label (does not need to be unique) |
| `type` | string | The node type - determines what properties it has and how it behaves |
| `properties` | object | String key-value pairs for all configuration |

```hint warning All Property Values Are Strings
**All property values are strings.** Even numbers and booleans:
- Position: `"x": "10.5"` not `"x": 10.5`
- Boolean: `"visible": "true"` not `"visible": true`
- Integer: `"collision_layer": "1"` not `"collision_layer": 1`

The scripting API provides `api.getNumber()` as a convenience, but the underlying storage is always a string.
```

---

## The Node Tree

Nodes form a tree through parent-child relationships. A node with `parent: 0` is at the root. A node with `parent: 5` is a child of the node with `id: 5`.

**Transform inheritance:** Child nodes inherit their parent's transform. If you move a parent `Node3D`, all its children move with it. This is how you group objects into hierarchies.

**Script inheritance:** A script on a parent node can find and control child nodes using `api.find()`. There is no automatic script event propagation - you wire things up explicitly via signals and `api.find()`.

---

## Navigating the Tree from Scripts

### Finding Nodes

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class TreeNavigator extends Node3D {
  @ready()
  onReady() {
    // Find a child by relative path from this node
    const camera = this.api.find("Camera");          // immediate child named "Camera"
    const child  = this.api.find("Level/Floor");     // path: Level → Floor

    // Find all nodes of a given type in the scene
    const lights = this.api.findNodesByType("OmniLight3D");

    // Get the direct children of a node
    const children = this.api.getChildren(this.api.id());

    // Check if a node still exists
    if (this.api.exists(camera)) {
      this.api.set(camera, "visible", "true");
    }

    // Get the scene root node ID
    const rootId = this.api.getRootId();
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    // Find a child by relative path
    const camera = api.find("Camera");
    const child  = api.find("Level/Floor");

    // Find all nodes of a given type
    const lights = api.findNodesByType("OmniLight3D");

    // Get direct children
    const children = api.getChildren(api.id());

    // Check existence
    if (api.exists(camera)) {
      api.set(camera, "visible", "true");
    }

    // Get the scene root node ID
    const rootId = api.getRootId();
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  -- Find a child by relative path
  local camera = api.find("Camera")
  local child  = api.find("Level/Floor")

  -- Find all nodes of a given type
  local lights = api.findNodesByType("OmniLight3D")

  -- Get direct children
  local children = api.getChildren(api.id())

  -- Check existence
  if api.exists(camera) then
    api.set(camera, "visible", "true")
  end

  -- Get the scene root node ID
  local rootId = api.getRootId()
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class TreeNavigator extends NodeScript {
    @Override public void onReady() {
        // Find a child by relative path from this node
        long camera = core.find("Camera");            // immediate child named "Camera"
        long child  = core.find("Level/Floor");       // path: Level -> Floor

        // Get the direct children of a node
        long[] children = core.getChildren(core.id());

        // Check if a node still exists
        if (core.exists(camera)) {
            core.set(camera, "visible", "true");
        }

        // Get the scene root node ID
        long rootId = core.rootId();
    }
}
```
````

### Reading and Writing Properties

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class PropertyExample extends Node3D {
  @ready()
  onReady() {
    // Write a property (always a string)
    this.api.set("x", "10.5");
    this.api.set("visible", "true");
    this.api.set("texture", "res://textures/hero.png");

    // Write on a different node
    const otherNodeId = this.api.find("OtherNode");
    this.api.set(otherNodeId, "color_tint_r", "1.0");

    // Read a property
    const name = this.api.get("name");       // returns string | null
    const x = this.api.getNumber("x", 0);   // returns number, with default

    // Read on a different node
    const barId = this.api.find("HUD/HealthBar");
    const h = this.api.getNumber(barId, "value", 100);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    // Write
    api.set("x", "10.5");
    api.set("visible", "true");

    // Write on another node
    const otherNodeId = api.find("OtherNode");
    api.set(otherNodeId, "color_tint_r", "1.0");

    // Read
    const name = api.get("name");
    const x = api.getNumber("x", 0);

    // Read on a different node
    const barId = api.find("HUD/HealthBar");
    const h = api.getNumber(barId, "value", 100);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  -- Write
  api.set("x", "10.5")
  api.set("visible", "true")

  -- Write on another node
  local otherNodeId = api.find("OtherNode")
  api.set(otherNodeId, "color_tint_r", "1.0")

  -- Read
  local name = api.get("name")
  local x = api.getNumber("x", 0)

  -- Read on a different node
  local barId = api.find("HUD/HealthBar")
  local h = api.getNumber(barId, "value", 100)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class PropertyExample extends NodeScript {
    @Override public void onReady() {
        // Write a property (always a string)
        core.set(core.id(), "x", "10.5");
        core.set(core.id(), "visible", "true");
        core.set(core.id(), "texture", "res://textures/hero.png");

        // Write on a different node
        long otherNodeId = core.find("OtherNode");
        core.set(otherNodeId, "color_tint_r", "1.0");

        // Read a property
        String name = core.getString(core.id(), "name", null);
        double x = core.getNumber(core.id(), "x", 0);

        // Read on a different node
        long barId = core.find("HUD/HealthBar");
        double h = core.getNumber(barId, "value", 100);
    }
}
```
````

---

## Creating Nodes at Runtime

Scripts can create new nodes dynamically with `api.createRuntime()`:

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class CubeSpawner extends Node3D {
  @ready()
  onReady() {
    // Signature: createRuntime(parentId, name, type) → nodeId
    const cube = this.api.createRuntime(0, "FallingCube", "RigidBody3D");
    this.api.set(cube, "x", "10");
    this.api.set(cube, "y", "20");
    this.api.set(cube, "shape", "box");
    this.api.set(cube, "mass", "2.0");
    this.api.set(cube, "sx", "1");
    this.api.set(cube, "sy", "1");
    this.api.set(cube, "sz", "1");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    // Signature: createRuntime(parentId, name, type) → nodeId
    const cube = api.createRuntime(0, "FallingCube", "RigidBody3D");
    api.set(cube, "x", "10");
    api.set(cube, "y", "20");
    api.set(cube, "shape", "box");
    api.set(cube, "mass", "2.0");
    api.set(cube, "sx", "1");
    api.set(cube, "sy", "1");
    api.set(cube, "sz", "1");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  -- Signature: createRuntime(parentId, name, type) → nodeId
  local cube = api.createRuntime(0, "FallingCube", "RigidBody3D")
  api.set(cube, "x", "10")
  api.set(cube, "y", "20")
  api.set(cube, "shape", "box")
  api.set(cube, "mass", "2.0")
  api.set(cube, "sx", "1")
  api.set(cube, "sy", "1")
  api.set(cube, "sz", "1")
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class CubeSpawner extends NodeScript {
    @Override public void onReady() {
        // Signature: createRuntime(parentId, name, typeId) -> nodeId
        long cube = core.createRuntime(0, "FallingCube", "RigidBody3D");
        core.set(cube, "x", "10");
        core.set(cube, "y", "20");
        core.set(cube, "shape", "box");
        core.set(cube, "mass", "2.0");
        core.set(cube, "sx", "1");
        core.set(cube, "sy", "1");
        core.set(cube, "sz", "1");
    }
}
```
````

Remove a node (and all its children) with `api.free()`:

````tabs
--- tab: TypeScript
```typescript
this.api.free(cube);
```

--- tab: JavaScript
```js
api.free(cube);
```

--- tab: Luau
```lua
api.free(cube)
```

--- tab: Java
```java
core.free(cube);
```
````

```hint warning api.free() is deferred
`api.free()` queues the node for removal at the end of the current tick. Do not access the node's properties after calling `api.free()` - the node may no longer exist.
```

---

## Instantiating Scene Files at Runtime

Embed an entire scene file as a subtree under a parent node:

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { instantiate } from "moud/scene";

export default class RoomLoader extends Node3D {
  @ready()
  onReady() {
    // Instantiate the "treasure_room" scene as a child of the root
    const roomId = instantiate("treasure_room", 0);
    this.api.set(roomId, "x", "50");
    this.api.set(roomId, "z", "-20");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    // Instantiate the "treasure_room" scene as a child of the root
    const roomId = api.instantiate("treasure_room", 0);
    api.set(roomId, "x", "50");
    api.set(roomId, "z", "-20");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  -- Instantiate the "treasure_room" scene as a child of the root
  local roomId = api.instantiate("treasure_room", 0)
  api.set(roomId, "x", "50")
  api.set(roomId, "z", "-20")
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class RoomLoader extends NodeScript {
    @Override public void onReady() {
        // Instantiate the "treasure_room" scene as a child of the root
        long roomId = core.instantiate("treasure_room", 0);
        core.set(roomId, "x", "50");
        core.set(roomId, "z", "-20");
    }
}
```
````

---

## Script Lifecycle

Every node can have a `script` property (runs on the **server** at 20 Hz) and/or a `client_script` property (runs on the **client** at ~60 Hz in Luau). The script engine calls lifecycle hooks as the node exists in the scene:

| Hook | When called |
|---|---|
| `_enter_tree(api)` | Once when the node first enters the scene tree |
| `_ready(api)` | Once after the full scene tree is built |
| `_process(api, dt)` | Every server tick (50 ms) while in play mode |
| `_exit_tree(api)` | Once when the node is about to be removed |

**Client script hooks** (`client_script` property - Luau only, ~60 Hz):

| Hook | When called |
|---|---|
| `onReady()` | Once when the script loads on the client |
| `onFrame(dt)` | Every render frame |
| `onDispose()` | When the node is removed or the session ends |

See [Client Scripts](/4_Scripting/10_Client_Scripts) for the full client-side API (`body`, `input`, `timer`, `anim`, `render`).

````tabs
--- tab: TypeScript
```typescript
import { Area3D, enterTree, ready, process, exitTree, signal } from "moud";

export default class ScriptTemplate extends Area3D {
  private spawnX = 0;
  private spawnZ = 0;

  @enterTree()
  onEnterTree() {
    // Called once when this node enters the scene tree
  }

  @ready()
  onReady() {
    // Called once after the full scene tree is built
    this.spawnX = this.api.getNumber("x", 0);
    this.spawnZ = this.api.getNumber("z", 0);
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
  }

  @process()
  onProcess(dt: number) {
    // Called every 50 ms while play mode is active
  }

  @exitTree()
  onExitTree() {
    // Called just before this node is removed
  }

  @signal("area_entered")
  onAreaEntered(playerUuid: string) {
    // Custom signal handler
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    // Called once when this node enters the scene tree
    this.api = api;
    this.spawnX = 0;
    this.spawnZ = 0;
  },
  _ready(api) {
    // Called once after the full scene tree is built
    this.spawnX = api.getNumber("x", 0);
    this.spawnZ = api.getNumber("z", 0);
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
  },
  _process(api, dt) {
    // Called every 50 ms while play mode is active
  },
  _exit_tree(api) {
    // Called just before this node is removed
  },
  _on_area_entered(playerUuid) {
    // Signal handler
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_enter_tree(api)
  -- Called once when this node enters the scene tree
  self.api = api
  self.spawnX = 0
  self.spawnZ = 0
end
function script:_ready(api)
  -- Called once after the full scene tree is built
  self.spawnX = api.getNumber("x", 0)
  self.spawnZ = api.getNumber("z", 0)
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
end
function script:_process(api, dt)
  -- Called every 50 ms while play mode is active
end
function script:_exit_tree(api)
  -- Called just before this node is removed
end
function script:_on_area_entered(playerUuid)
  -- Signal handler
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScriptTemplate extends NodeScript {
    private double spawnX = 0;
    private double spawnZ = 0;

    @Override public void onEnterTree() {
        // Called once when this node enters the scene tree
    }

    @Override public void onReady() {
        // Called once after the full scene tree is built
        spawnX = core.getNumber(core.id(), "x", 0);
        spawnZ = core.getNumber(core.id(), "z", 0);
        core.connect(core.id(), "area_entered", core.id(), "_on_area_entered");
    }

    @Override public void onProcess(double dt) {
        // Called every 50 ms while play mode is active
    }

    @Override public void onExitTree() {
        // Called just before this node is removed
    }

    public void onAreaEntered(Object playerUuid) {
        // Custom signal handler
    }
}
```
````

---

## Signals

Nodes communicate through signals. Some signals are built-in (like `area_entered` on `Area3D`), others can be custom.

### Connecting a Signal

```ts
// api.connect(sourceNodeId, signalName, receiverNodeId, handlerName)
api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
```

### Emitting a Custom Signal

```ts
// Emit a signal from any script
api.emit_signal("my_signal", "some_argument");
```

See [Events](/2_Core_Concepts/2_Events) for the full signal and timer system.

---