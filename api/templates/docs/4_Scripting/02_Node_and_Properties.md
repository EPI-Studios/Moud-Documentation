# Node and Properties

Scripts interact with nodes through built-in typed properties, custom `@property` fields, and a set of methods for navigating and mutating the scene tree.

## Built-in Properties (TypeScript)

When your script extends a base class, spatial and type-specific properties are available directly on `this`. These are synced with the engine automatically.

```hint warning How TypeScript property access actually works
The TypeScript surface is built on top of the same `api.set` / `api.getNumber` machinery that JavaScript and Luau use; it is **not** a real reactive object model. A custom transpiler (`TypeScriptTranspiler`) rewrites your TypeScript at compile time:

- A read like `this.position.x` becomes `core.getNumber(core.id(), "x", 0)`.
- A write like `this.position.x = 5` becomes `core.setNumber(core.id(), "x", 5)`.
- A `@property` field becomes a typed wrapper that calls `setNumber` / `setBool` / `set` against the underlying string-typed storage.
- `this.connect`, `this.tween`, `this.findNode`, etc. all desugar to the equivalent `api.*` calls.

This means a few patterns that look idiomatic in TypeScript will break the transpiler or behave unexpectedly:

- Defining custom getters/setters on `this` for built-in keys (`get position() { ... }`) collides with the rewriter and will not behave like vanilla TS.
- Storing `this.position` in a local variable does not give you a stable handle: `const p = this.position; p.x = 5;` may or may not flush back to the node depending on the rewrite path. Assign through `this.position.x = 5` directly.
- Property paths that look like nested objects (`this.material.albedo.r`) only work for the dotted shapes the transpiler recognizes; arbitrary nested object literal access on engine state is not supported.
- Decorators not exported from `moud` (`@enterTree`, `@ready`, `@process`, `@property`, `@signal`, etc.) are unknown to the rewriter and will not wire up lifecycle hooks.

When in doubt, the JavaScript or Luau example shows the actual call the engine sees. If a TS pattern feels too magical, fall back to `core.set` / `core.setNumber` directly; both are valid in the same TS file.
```

### Node3D and all 3D types

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class Mover extends Node3D {
  @process()
  onProcess(dt: number) {
    // Position
    this.position.x += 5 * dt;
    this.position.y = 10;

    // Rotation (degrees)
    this.rotation.y += 90 * dt;

    // Scale
    this.scale.x = 2;
    this.scale.y = 2;
    this.scale.z = 2;

    // Visibility
    this.visible = false;
  }
}
```

--- tab: JavaScript
```js
({
  _process(api, dt) {
    api.setNumber("x", api.getNumber("x", 0) + 5 * dt);
    api.setNumber("y", 10);
    api.setNumber("ry", api.getNumber("ry", 0) + 90 * dt);
    api.setNumber("sx", 2);
    api.setNumber("sy", 2);
    api.setNumber("sz", 2);
    api.set("visible", "false");
  }
})
```

--- tab: Luau
```lua
function script:_process(api, dt)
    api.setNumber("x", api.getNumber("x", 0) + 5 * dt)
    api.setNumber("y", 10)
    api.setNumber("ry", api.getNumber("ry", 0) + 90 * dt)
    api.set("visible", "false")
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Mover extends NodeScript {
    @Override public void onProcess(double dt) {
        core.setNumber("x", core.getNumber("x", 0) + 5 * dt);
        core.setNumber("y", 10);
        core.setNumber("ry", core.getNumber("ry", 0) + 90 * dt);
        core.setNumber("sx", 2);
        core.setNumber("sy", 2);
        core.setNumber("sz", 2);
        core.set("visible", "false");
    }
}
```
````

### RigidBody3D

RigidBody3D adds physics properties on top of the Node3D ones.

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D } from "moud";

export default class Ball extends RigidBody3D {
  @ready()
  onReady() {
    this.mass = 5;
    this.gravityScale = 0.5;
    this.shape = "sphere";
    this.freeze = false;
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.setNumber("mass", 5);
    api.setNumber("gravity_scale", 0.5);
    api.set("shape", "sphere");
    api.set("freeze", "false");
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    api.setNumber("mass", 5)
    api.setNumber("gravity_scale", 0.5)
    api.set("shape", "sphere")
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Ball extends NodeScript {
    @Override public void onReady() {
        core.setNumber("mass", 5);
        core.setNumber("gravity_scale", 0.5);
        core.set("shape", "sphere");
        core.set("freeze", "false");
    }
}
```
````

### Label

````tabs
--- tab: TypeScript
```typescript
import { Label } from "moud";

export default class ScoreLabel extends Label {
  score = 0;

  updateDisplay() {
    this.text = "Score: " + this.score;
  }
}
```

--- tab: JavaScript
```js
({
  score: 0,
  updateDisplay(api) {
    api.set("text", "Score: " + this.score);
  }
})
```

--- tab: Luau
```lua
local script = { score = 0 }
function script:updateDisplay(api)
    api.set("text", "Score: " .. self.score)
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class ScoreLabel extends NodeScript {
    int score = 0;

    public void updateDisplay() {
        core.set("text", "Score: " + score);
    }
}
```
````

## Custom Properties (TypeScript)

The `@property` decorator marks a class field as a property that is synced with the engine. The value is stored in the node's property bag and persists across ticks.

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class Enemy extends Node3D {
  @property health = 100;
  @property speed = 5;
  @property team = "red";

  @process()
  onProcess(dt: number) {
    if (this.health <= 0) {
      this.free();
      return;
    }
    this.position.x += this.speed * dt;
  }
}
```

--- tab: JavaScript
```js
// In JS, just use api.get/set or api.getNumber/setNumber directly.
// There is no equivalent decorator - properties are not auto-synced.
({
  _process(api, dt) {
    var health = api.getNumber("health", 100);
    if (health <= 0) {
      api.free(api.id());
      return;
    }
    var speed = api.getNumber("speed", 5);
    api.setNumber("x", api.getNumber("x", 0) + speed * dt);
  }
})
```

--- tab: Luau
```lua
function script:_process(api, dt)
    local health = api.getNumber("health", 100)
    if health <= 0 then
        api.free(api.id())
        return
    end
    local speed = api.getNumber("speed", 5)
    api.setNumber("x", api.getNumber("x", 0) + speed * dt)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Enemy extends NodeScript {
    @Override public void onProcess(double dt) {
        double health = core.getNumber("health", 100);
        if (health <= 0) {
            core.free(core.id());
            return;
        }
        double speed = core.getNumber("speed", 5);
        core.setNumber("x", core.getNumber("x", 0) + speed * dt);
    }
}
```
````

## Generic Property Access (TypeScript)

When you need to read or write engine properties that don't have a typed built-in (such as custom uniforms, shader properties, or arbitrary node data), use the generic property methods.

````tabs
--- tab: TypeScript
```typescript
// Read any property with an explicit type
const color = this.getProperty<string>("color_tint");
const value = this.getProperty<number>("slider_value");

// Write any property
this.setProperty("color_tint_r", 0.5);
this.setProperty("text", "Hello World");

// Remove a property
this.removeProperty("temp_flag");

// Access another node's properties by reference
const hud = this.find<Label>("../HUD/Score");
hud.setProperty("text", "100");
```

--- tab: JavaScript
```js
// api.get / api.set are the raw equivalents
var color = api.get("color_tint");
var value = api.getNumber("slider_value", 0);
api.set("color_tint_r", "0.5");
api.set("text", "Hello World");
api.remove("temp_flag");

var hudId = api.find("../HUD/Score");
api.set(hudId, "text", "100");
```

--- tab: Luau
```lua
local color = api.get("color_tint")
local value = api.getNumber("slider_value", 0)
api.set("color_tint_r", "0.5")
api.set("text", "Hello World")
api.remove("temp_flag")

local hudId = api.find("../HUD/Score")
api.set(hudId, "text", "100")
```

--- tab: Java
```java
String color = core.get("color_tint");
double value = core.getNumber("slider_value", 0);
core.set("color_tint_r", "0.5");
core.set("text", "Hello World");
core.remove("temp_flag");

long hudId = core.find("../HUD/Score");
core.set(hudId, "text", "100");
```
````

## Navigating the Scene Tree

### `this.find<T>(path)` - find a node by path

Returns a typed reference to the node at the given path relative to this node. Returns `null` if not found. Use `..` to go up to the parent.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, Label } from "moud";

export default class HUDController extends Node3D {
  @ready()
  onReady() {
    // Sibling node
    const sun = this.find<Node3D>("Sun");

    // Deeply nested node
    const nested = this.find<Node3D>("Parent/Child/GrandChild");

    // Going up to a sibling subtree
    const score = this.find<Label>("../HUD/Score");
    score.text = "0";
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var sun = api.find("Sun");
    var nested = api.find("Parent/Child/GrandChild");
    var scoreId = api.find("../HUD/Score");
    api.set(scoreId, "text", "0");
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local sun = api.find("Sun")
    local nested = api.find("Parent/Child/GrandChild")
    local scoreId = api.find("../HUD/Score")
    api.set(scoreId, "text", "0")
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class HUDController extends NodeScript {
    @Override public void onReady() {
        long sun = core.find("Sun");
        long nested = core.find("Parent/Child/GrandChild");
        long scoreId = core.find("../HUD/Score");
        core.set(scoreId, "text", "0");
    }
}
```
````

### `this.getChildren()` - list child nodes

Returns an array of all direct children of this node.

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class Container extends Node3D {
  @ready()
  onReady() {
    const children = this.getChildren();
    for (const child of children) {
      child.setProperty("visible", false);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var children = api.getChildren(api.id());
    for (var i = 0; i < children.length; i++) {
      api.set(children[i], "visible", "false");
    }
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local children = api.getChildren(api.id())
    for _, childId in ipairs(children) do
        api.set(childId, "visible", "false")
    end
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Container extends NodeScript {
    @Override public void onReady() {
        long[] children = core.getChildren(core.id());
        for (long childId : children) {
            core.set(childId, "visible", "false");
        }
    }
}
```
````

### `this.exists()` - check if a node is alive

Returns `true` if the node still exists in the scene tree. Useful after operations that may have freed it.

````tabs
--- tab: TypeScript
```typescript
const target = this.find<Node3D>("Target");
if (target && target.exists()) {
  target.setProperty("visible", true);
}
```

--- tab: JavaScript
```js
var targetId = api.find("Target");
if (api.exists(targetId)) {
  api.set(targetId, "visible", "true");
}
```

--- tab: Luau
```lua
local targetId = api.find("Target")
if api.exists(targetId) then
    api.set(targetId, "visible", "true")
end
```

--- tab: Java
```java
long targetId = core.find("Target");
if (core.exists(targetId)) {
    core.set(targetId, "visible", "true");
}
```
````

## Creating and Destroying Nodes

### `this.createChild(name, type)` - create a node at runtime

Creates a new child node under this node. Returns a typed reference to it.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, RigidBody3D, Label } from "moud";
import { instantiate } from "moud/scene";

export default class Spawner extends Node3D {
  @ready()
  onReady() {
    // Create a RigidBody3D child
    const cube = this.createChild("MyCube", "RigidBody3D") as RigidBody3D;
    cube.position.x = 10;
    cube.position.y = 20;
    cube.shape = "box";
    cube.mass = 2;
    cube.scale.x = 1;
    cube.scale.y = 1;
    cube.scale.z = 1;

    // Create a Label child
    const label = this.createChild("DamageText", "Label") as Label;
    label.text = "-25 HP";
    label.setProperty("x", 100);
    label.setProperty("y", 50);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var cube = api.createRuntime(api.id(), "MyCube", "RigidBody3D");
    if (cube > 0) {
      api.setNumber(cube, "x", 10);
      api.setNumber(cube, "y", 20);
      api.set(cube, "shape", "box");
      api.setNumber(cube, "mass", 2);
    }

    var label = api.createRuntime(api.id(), "DamageText", "Label");
    api.set(label, "text", "-25 HP");
    api.setNumber(label, "x", 100);
    api.setNumber(label, "y", 50);
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local cube = api.createRuntime(api.id(), "MyCube", "RigidBody3D")
    if cube > 0 then
        api.setNumber(cube, "x", 10)
        api.setNumber(cube, "y", 20)
        api.set(cube, "shape", "box")
        api.setNumber(cube, "mass", 2)
    end

    local label = api.createRuntime(api.id(), "DamageText", "Label")
    api.set(label, "text", "-25 HP")
    api.setNumber(label, "x", 100)
    api.setNumber(label, "y", 50)
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Spawner extends NodeScript {
    @Override public void onReady() {
        long cube = core.createRuntime(core.id(), "MyCube", "RigidBody3D");
        if (cube > 0) {
            core.setNumber(cube, "x", 10);
            core.setNumber(cube, "y", 20);
            core.set(cube, "shape", "box");
            core.setNumber(cube, "mass", 2);
        }

        long label = core.createRuntime(core.id(), "DamageText", "Label");
        core.set(label, "text", "-25 HP");
        core.setNumber(label, "x", 100);
        core.setNumber(label, "y", 50);
    }
}
```
````

### `this.free()` - destroy a node

Queues the node for deletion. It is removed from the scene tree at the end of the current tick.

````tabs
--- tab: TypeScript
```typescript
import { Area3D } from "moud";

export default class Collectible extends Area3D {
  @signal("area_entered")
  onCollected(playerUuid: string) {
    // Destroy this collectible
    this.free();
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_collected");
  },
  _on_collected(playerUuid) {
    this.api.free(this.api.id());
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_collected")
end
function script:_on_collected(playerUuid)
    self.api:free(self.api:id())
end
return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Collectible extends NodeScript {
    @Override public void onEnterTree() {
        core.connect(core.id(), "area_entered", core.id(), "_on_collected");
    }

    public void onCollected(Object playerUuid) {
        core.free(core.id());
    }
}
```
````

### `this.rename(name)` - rename a node

Renames this node in the scene tree.

````tabs
--- tab: TypeScript
```typescript
this.rename("NewName");
```

--- tab: JavaScript
```js
api.rename("NewName");
// or rename another node:
api.rename(nodeId, "NewName");
```

--- tab: Luau
```lua
api.rename("NewName")
-- or rename another node:
api.rename(nodeId, "NewName")
```

--- tab: Java
```java
core.rename("NewName");
// or rename another node:
core.rename(nodeId, "NewName");
```
````

### `this.reparent(parent)` - move a node in the tree

Moves this node to a new parent.

````tabs
--- tab: TypeScript
```typescript
const newParent = this.find<Node3D>("../Container");
this.reparent(newParent);
```

--- tab: JavaScript
```js
var newParentId = api.find("../Container");
api.reparent(api.id(), newParentId);
```

--- tab: Luau
```lua
local newParentId = api.find("../Container")
api.reparent(api.id(), newParentId)
```

--- tab: Java
```java
long newParentId = core.find("../Container");
core.reparent(core.id(), newParentId);
```
````

## Flushing Operations

### `this.flush()` - apply pending changes immediately

Normally, property writes and tree mutations are batched and applied at the end of the current tick. Call `flush()` when you need a change to take effect before the next read in the same tick.

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class Repositioner extends Node3D {
  @ready()
  onReady() {
    this.position.x = 10;
    this.flush();  // x=10 is now applied
    const x = this.position.x;  // returns 10
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    api.setNumber("x", 10);
    api.flush();  // x=10 is now applied
    var x = api.getNumber("x", 0);  // returns 10
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    api.setNumber("x", 10)
    api.flush()  -- x=10 is now applied
    local x = api.getNumber("x", 0)  -- returns 10
end
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Repositioner extends NodeScript {
    @Override public void onReady() {
        core.setNumber("x", 10);
        core.flush();  // x=10 is now applied
        double x = core.getNumber("x", 0);  // returns 10
    }
}
```
````
