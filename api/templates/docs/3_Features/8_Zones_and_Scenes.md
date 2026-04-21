# Zones and Scene Management

The `Scene` architecture handles environmental division, isolating node graphs, physics simulations, and connected clients into separate server-side instances. The `Area3D` class provides volume-based overlap detection for evaluating spatial logic and inter-scene transitions.

![Multi-scene world diagram showing three scene instances connected by transition triggers](placeholder)

---

## Scene instances

A `.moud.scene` file defines a distinct scene graph. The server loads scenes into separate Minecraft instances, evaluating each with an independent physics world and player registry.

### Executing scene transitions

To transition all clients currently active in the executing scene to a different scene, use `api.loadScene()`:

````tabs
--- tab: TypeScript
```typescript
import { loadScene } from "moud/scene";

export default class SceneLoader extends Node3D {
  @ready()
  onReady() {
    loadScene("dungeon");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.loadScene("dungeon");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  api.loadScene("dungeon")
end
return script
```
````

The `sceneId` parameter evaluates against the top-level identifier defined in the target `.moud.scene` file:

```json
{
  "format": 1,
  "sceneId": "dungeon",
  "displayName": "Dark Dungeon",
  "nodes": [ ... ]
}
```

```hint info Scope of transitions
`api.loadScene()` affects all clients currently occupying the executing scene. Clients in other active scenes on the server are ignored.
```

### Transition execution pipeline

When `api.loadScene("dungeon")` is called, the engine processes the request asynchronously:

1. `SceneRuntime` flags the active scene with a pending transition state.
2. At the conclusion of the current tick, `ServerTickLoop` reads the pending flag.
3. `applyScriptSceneTransition()` detaches all clients from the current scene instance and attaches them to the new instance.
4. The executing scene's simulation persists for any remaining or subsequently joined clients.
5. The target scene's scripts execute `_ready` for the newly attached clients.

```mermaid
sequenceDiagram
    participant Script as Script (_process)
    participant Runtime as SceneRuntime
    participant Loop as ServerTickLoop
    participant OldScene as Scene: "main"
    participant NewScene as Scene: "dungeon"

    Script->>Runtime: api.loadScene("dungeon")
    Runtime->>Runtime: pendingSceneTransition = "dungeon"
    Loop->>Runtime: end of tick: detectTransition()
    Loop->>OldScene: removeAllPlayers()
    Loop->>NewScene: addAllPlayers()
    NewScene->>Script: _ready() for new player instances
```

---

## SceneInstance3D

`SceneInstance3D` embeds an external `.moud.scene` file as a branch within the active scene graph. This class is utilized for prefab inheritance and modular hierarchy structuring.

### Configuration

```json
{
  "type": "SceneInstance3D",
  "properties": {
    "scene_id": "dungeon_room",
    "x": "0", "y": "0", "z": "0"
  }
}
```

*Note: The `scene_id` property requires the target scene's ID string, not a file path.*

### Runtime instantiation

````tabs
--- tab: TypeScript
```typescript
import { instantiate } from "moud/scene";
import { Area3D, ready } from "moud";

export default class PrefabSpawner extends Area3D {
  @ready()
  onReady() {
    const childId = instantiate("dungeon_room", this.api.id());
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    const childId = api.instantiate("dungeon_room", api.id());
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  local childId = api.instantiate("dungeon_room", api.id())
end
return script
```
````

```hint warning Cycle detection
`SceneInstance3D` implements automatic cycle detection. Instantiating a scene that recursively references itself throws a console error and aborts the instantiation request.
```

```hint tip Modular architecture
Store reusable hierarchy structures (e.g., rooms, interactables) in independent `.moud.scene` files and reference them via `SceneInstance3D`. Modifications to the source scene propagate to all referencing instances.
```

---

## Area3D

`Area3D` defines a non-physical spatial volume. It does not compute collision responses or kinematic blocking. Instead, it evaluates spatial overlaps with physics bodies and dispatches signals accordingly.

### Initialization

```json
{
  "type": "Area3D",
  "properties": {
    "x": "10", "y": "0", "z": "5",
    "shape": "box",
    "sx": "5", "sy": "3", "sz": "5",
    "monitoring": "true",
    "collision_layer": "1",
    "collision_mask": "1",
    "script": "scripts/teleporter.ts"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `shape` | string | Defines the evaluation bounds (`"box"` or `"sphere"`). |
| `sx/sy/sz` | float | Defines the bounds scalar for `"box"` shapes. |
| `radius` | float | Defines the bounds scalar for `"sphere"` shapes. |
| `monitoring` | bool | Must evaluate to `"true"` to process overlap queries. |
| `collision_layer` | int | The physics layer index assigned to the volume. |
| `collision_mask` | int | The physics layer index the volume queries against (typically set to the player layer). |

### Signals

| Signal | Argument | Trigger condition |
|---|---|---|
| `area_entered` | player UUID (string) | A physics body intersects the volume boundaries. |
| `area_exited` | player UUID (string) | A physics body departs the volume boundaries. |

### Signal binding

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, signal } from "moud";

export default class ZoneListener extends Area3D {
  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
    this.api.connect(this.api.id(), "area_exited", this.api.id(), "_on_area_exited");
  }

  @signal("area_entered")
  onAreaEntered(playerUuid: string) {
    // Execution routine for overlap entry
  }

  @signal("area_exited")
  onAreaExited(playerUuid: string) {
    // Execution routine for overlap exit
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
    api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited");
  },
  _on_area_entered(playerUuid) {
    // Execution routine for overlap entry
  },
  _on_area_exited(playerUuid) {
    // Execution routine for overlap exit
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  self.api = api
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
  api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited")
end
function script:_on_area_entered(playerUuid)
  -- Execution routine for overlap entry
end
function script:_on_area_exited(playerUuid)
  -- Execution routine for overlap exit
end
return script
```
````

---

## Implementation examples

### Position translation (Teleportation)

Updates the client's global position vector upon volume entry.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, signal } from "moud";
import { teleportPlayer } from "moud/players";

export default class Teleporter extends Area3D {
  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
  }

  @signal("area_entered")
  onAreaEntered(playerUuid: string) {
    teleportPlayer(playerUuid, 0, 10, 0);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
  },
  _on_area_entered(playerUuid) {
    this.api.teleportPlayer(playerUuid, 0, 10, 0);
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  self.api = api
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
end
function script:_on_area_entered(playerUuid)
  self.api.teleportPlayer(playerUuid, 0, 10, 0)
end
return script
```
````

### Scene transition

Triggers a load operation when a client intersects the volume.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, signal } from "moud";
import { loadScene } from "moud/scene";

export default class ExitDoor extends Area3D {
  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
  }

  @signal("area_entered")
  onAreaEntered(_playerUuid: string) {
    loadScene("dungeon");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
  },
  _on_area_entered(_playerUuid) {
    this.api.loadScene("dungeon");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  self.api = api
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
end
function script:_on_area_entered(_playerUuid)
  self.api.loadScene("dungeon")
end
return script
```
````

### Overlap state evaluation (Damage over time)

Tracks persistent overlaps to evaluate procedural logic over an interval.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, process, signal } from "moud";

const DAMAGE_INTERVAL = 1.0;

export default class DamageZone extends Area3D {
  private playersInside = new Set<string>();
  private timers = new Map<string, number>();

  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
    this.api.connect(this.api.id(), "area_exited",  this.api.id(), "_on_area_exited");
  }

  @signal("area_entered")
  onAreaEntered(playerUuid: string) {
    this.playersInside.add(playerUuid);
    this.timers.set(playerUuid, 0);
  }

  @signal("area_exited")
  onAreaExited(playerUuid: string) {
    this.playersInside.delete(playerUuid);
    this.timers.delete(playerUuid);
  }

  @process()
  onProcess(dt: number) {
    for (const uuid of this.playersInside) {
      const t = (this.timers.get(uuid) ?? 0) + dt;
      this.timers.set(uuid, t);
      if (t >= DAMAGE_INTERVAL) {
        this.timers.set(uuid, 0);
        const playerNodeId = this.api.find(uuid);
        if (this.api.exists(playerNodeId)) {
          const health = this.api.getNumber(playerNodeId, "health", 100);
          this.api.set(playerNodeId, "health", String(health - 10));
        }
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    this.playersInside = new Set();
    this.timers = new Map();
  },
  _ready(api) {
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
    api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited");
  },
  _on_area_entered(playerUuid) {
    this.playersInside.add(playerUuid);
    this.timers.set(playerUuid, 0);
  },
  _on_area_exited(playerUuid) {
    this.playersInside.delete(playerUuid);
    this.timers.delete(playerUuid);
  },
  _process(api, dt) {
    const DAMAGE_INTERVAL = 1.0;
    for (const uuid of this.playersInside) {
      const t = (this.timers.get(uuid) ?? 0) + dt;
      this.timers.set(uuid, t);
      if (t >= DAMAGE_INTERVAL) {
        this.timers.set(uuid, 0);
        const playerNodeId = api.find(uuid);
        if (api.exists(playerNodeId)) {
          const health = api.getNumber(playerNodeId, "health", 100);
          api.set(playerNodeId, "health", String(health - 10));
        }
      }
    }
  }
})
```

--- tab: Luau
```lua
local DAMAGE_INTERVAL = 1.0
local script = {}
function script:_enter_tree(api)
  self.api = api
  self.playersInside = {}
  self.timers = {}
end
function script:_ready(api)
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
  api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited")
end
function script:_on_area_entered(playerUuid)
  self.playersInside[playerUuid] = true
  self.timers[playerUuid] = 0
end
function script:_on_area_exited(playerUuid)
  self.playersInside[playerUuid] = nil
  self.timers[playerUuid] = nil
end
function script:_process(api, dt)
  for uuid, _ in pairs(self.playersInside) do
    local t = (self.timers[uuid] or 0) + dt
    self.timers[uuid] = t
    if t >= DAMAGE_INTERVAL then
      self.timers[uuid] = 0
      local playerNodeId = api.find(uuid)
      if api.exists(playerNodeId) then
        local health = api.getNumber(playerNodeId, "health", 100)
        api.set(playerNodeId, "health", tostring(health - 10))
      end
    end
  end
end
return script
```
````

### WorldEnvironment mutation

Modifies global `WorldEnvironment` lighting and fog parameters during volume overlap.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, signal } from "moud";

export default class CaveZone extends Area3D {
  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
    this.api.connect(this.api.id(), "area_exited",  this.api.id(), "_on_area_exited");
  }

  @signal("area_entered")
  onAreaEntered(_playerUuid: string) {
    const env = this.api.find("WorldEnvironment");
    this.api.set(env, "fog_enabled", "true");
    this.api.set(env, "fog_density", "0.08");
    this.api.set(env, "ambient_light_r", "0.05");
    this.api.set(env, "ambient_light_g", "0.05");
    this.api.set(env, "ambient_light_b", "0.1");
  }

  @signal("area_exited")
  onAreaExited(_playerUuid: string) {
    const env = this.api.find("WorldEnvironment");
    this.api.set(env, "fog_enabled", "false");
    this.api.set(env, "ambient_light_r", "0.4");
    this.api.set(env, "ambient_light_g", "0.4");
    this.api.set(env, "ambient_light_b", "0.4");
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
    api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited");
  },
  _on_area_entered(_playerUuid) {
    const env = this.api.find("WorldEnvironment");
    this.api.set(env, "fog_enabled", "true");
    this.api.set(env, "fog_density", "0.08");
    this.api.set(env, "ambient_light_r", "0.05");
    this.api.set(env, "ambient_light_g", "0.05");
    this.api.set(env, "ambient_light_b", "0.1");
  },
  _on_area_exited(_playerUuid) {
    const env = this.api.find("WorldEnvironment");
    this.api.set(env, "fog_enabled", "false");
    this.api.set(env, "ambient_light_r", "0.4");
    this.api.set(env, "ambient_light_g", "0.4");
    this.api.set(env, "ambient_light_b", "0.4");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  self.api = api
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
  api.connect(api.id(), "area_exited",  api.id(), "_on_area_exited")
end
function script:_on_area_entered(_playerUuid)
  local env = self.api.find("WorldEnvironment")
  self.api.set(env, "fog_enabled", "true")
  self.api.set(env, "fog_density", "0.08")
  self.api.set(env, "ambient_light_r", "0.05")
  self.api.set(env, "ambient_light_g", "0.05")
  self.api.set(env, "ambient_light_b", "0.1")
end
function script:_on_area_exited(_playerUuid)
  local env = self.api.find("WorldEnvironment")
  self.api.set(env, "fog_enabled", "false")
  self.api.set(env, "ambient_light_r", "0.4")
  self.api.set(env, "ambient_light_g", "0.4")
  self.api.set(env, "ambient_light_b", "0.4")
end
return script
```
````

---

## Lifecycle execution

### Server initialization sequence

When the server initializes a scene:
1. `SceneStorage` reads and parses the `.moud.scene` file.
2. The graph nodes are instantiated into the scene tree.
3. Attached scripts are discovered via the `script` property.
4. `_enter_tree(api)` executes sequentially across all scripts in tree order.
5. `_ready(api)` executes across all scripts once graph construction completes.
6. The scene simulation tick loop commences.

### Server termination sequence

When the server unloads a scene:
1. `_exit_tree(api)` executes across all scripts in reverse tree order.
2. The physics world simulation is disposed.
3. The underlying Minecraft instance is cleared.
4. Script instances and environment variables are subjected to garbage collection.

```hint warning State persistence
Module-level variables persist strictly for the lifespan of the running scene instance. Reloading a scene inherently destroys and reinitializes its script state. To persist state across scene executions, utilize node properties via `api.set()`.
```

### Client lifecycle integration

| Event | Execution behavior |
|---|---|
| Client connection | Client resolves to the translation of the `PlayerStart` node. Scripts retrieve the UUID via `api.getInput()`. |
| Scene transition | Client detaches from the origin Minecraft instance and attaches to the target Minecraft instance. |
| Client disconnect | Client node is erased from the scene graph. No explicit state cleanup occurs locally. |

---

## Multi-instance architecture

The server evaluates multiple scenes asynchronously. Disparate clients can occupy separate scenes simultaneously without crossover latency or execution collision.

```text
ServerScenes
├── Scene: "main"      ← execution instance 0 (3 connected clients)
├── Scene: "dungeon"   ← execution instance 1 (5 connected clients)
└── Scene: "arena"     ← execution instance 2 (2 connected clients)
```

Each active scene allocates:
* An independent `Engine` module (scene graph + script execution)
* An independent `JoltPhysicsWorld` simulation
* An independent Minecraft `InstanceContainer`
* An independent client array

Nodes cannot execute operations across scene boundaries. Data replication between scenes requires shared server-side caching scripts.

```hint tip Client routing
To structure matchmaking or lobby routing, retain clients within a primary scene graph until condition variables are satisfied. Execute `api.loadScene(target)` to commit the active client array to the new instance.
```

---

## Runtime graph manipulation

In addition to static evaluation via `SceneInstance3D`, scripts can instantiate subtrees directly during runtime:

````tabs
--- tab: TypeScript
```typescript
import { instantiate } from "moud/scene";
import { Node3D, ready } from "moud";

export default class RoomSpawner extends Node3D {
  @ready()
  onReady() {
    this.spawnRoom("dungeon_room", 10, 0, 20);
  }

  spawnRoom(sceneId: string, x: number, y: number, z: number): void {
    const rootId = instantiate(sceneId, 0); // 0 = scene root allocation
    this.api.set(rootId, "x", String(x));
    this.api.set(rootId, "y", String(y));
    this.api.set(rootId, "z", String(z));
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    this.api = api;
    this.spawnRoom(api, "dungeon_room", 10, 0, 20);
  },
  spawnRoom(api, sceneId, x, y, z) {
    const rootId = api.instantiate(sceneId, 0);
    api.set(rootId, "x", String(x));
    api.set(rootId, "y", String(y));
    api.set(rootId, "z", String(z));
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_ready(api)
  self.api = api
  self:spawnRoom(api, "dungeon_room", 10, 0, 20)
end
function script:spawnRoom(api, sceneId, x, y, z)
  local rootId = api.instantiate(sceneId, 0)
  api.set(rootId, "x", tostring(x))
  api.set(rootId, "y", tostring(y))
  api.set(rootId, "z", tostring(z))
end
return script
```
````

To deallocate a dynamically generated subtree, pass the node ID to `api.free()`:

````tabs
--- tab: TypeScript
```typescript
this.api.free(subtreeRootId);
```

--- tab: JavaScript
```js
api.free(subtreeRootId);
```

--- tab: Luau
```lua
api.free(subtreeRootId)
```
````

---

## Debugging and best practices

```hint warning Signal duplication
Calling `api.connect()` within `_process` allocates redundant listeners per execution tick. Signal binding must strictly occur inside `_ready` or `_enter_tree`.
```

```hint warning Monitoring state
An `Area3D` node requires its `monitoring` property to evaluate as `"true"`. If disabled, it fails to emit `area_entered` and `area_exited` signals regardless of valid geometric intersections.
```

```hint danger Transition throttling
Because `area_entered` fires sequentially per intersecting client, calling `api.loadScene()` inside `_on_area_entered` without a boolean lock will queue duplicate transition requests within a single physics tick. Always evaluate a flag condition.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, ready, signal } from "moud";
import { loadScene } from "moud/scene";

export default class ExitDoor extends Area3D {
  private transitioning = false;

  @ready()
  onReady() {
    this.api.connect(this.api.id(), "area_entered", this.api.id(), "_on_area_entered");
  }

  @signal("area_entered")
  onAreaEntered(_playerUuid: string) {
    if (this.transitioning) return;
    this.transitioning = true;
    loadScene("dungeon");
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) { this.api = api; this.transitioning = false; },
  _ready(api) {
    api.connect(api.id(), "area_entered", api.id(), "_on_area_entered");
  },
  _on_area_entered(_playerUuid) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.api.loadScene("dungeon");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_enter_tree(api)
  self.api = api
  self.transitioning = false
end
function script:_ready(api)
  api.connect(api.id(), "area_entered", api.id(), "_on_area_entered")
end
function script:_on_area_entered(_playerUuid)
  if self.transitioning then return end
  self.transitioning = true
  self.api.loadScene("dungeon")
end
return script
```