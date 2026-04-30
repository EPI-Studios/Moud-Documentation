**Scripting**

Scripts define logic and runtime behavior for objects within the scene tree. Attaching a script to a node enables the execution of lifecycle callbacks, property modification, physics computation, and signal handling. 

The engine supports four scripting environments:
*   **TypeScript (`.ts`)**: Class-based inheritance utilizing decorators for strict type evaluation.
*   **JavaScript (`.js`)**: Object-literal structure exposing lifecycle methods via an `api` parameter.
*   **Luau (`.luau`)**: Table-based structure utilizing the `api` parameter.
*   **Java (`.java`)**: Class-based scripts extending `NodeScript`. Compiled in-process at runtime via `JavaCompiler` (requires a JDK environment). Executes within an isolated `ClassLoader` restricted by a package allowlist sandbox. API modules are injected as `protected` fields.

---

## What is `api`?

In every JavaScript and Luau example you will see a parameter named `api`. It is the live handle that the engine passes into your script's lifecycle callbacks (`_ready`, `_process`, `_input`, etc.). It exposes:

- Direct getters/setters on the current node and others (`api:set`, `api:setNumber`, `api:get`, `api:find`).
- Sub-modules grouping related calls: `api:server()`, `api:physics()`, `api:player()`, `api:mesh()`, `api:msg()`, `api:persist()`, `api:http()`, etc. Each returns a stable handle that you can also cache.
- The node's own identity: `api:id()` returns the node id of the script's host node.
- Helpers for connecting signals, instantiating subscenes, queueing scene transitions, and logging.

The same object is passed every time, so a typical script saves it on first use and references it from later callbacks:

````tabs
--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
  },
  _process(api, dt) {
    // `api` is also passed here; either the parameter or `this.api` is fine.
    this.api.set(this.api.id(), "color_tint_r", "1.0");
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
end

function script:_process(api, dt)
    -- `api` is also passed here; either the parameter or `self.api` is fine.
    self.api:set(self.api:id(), "color_tint_r", "1.0")
end

return script
```
````

In **TypeScript**, the same handle is exposed through the `this` context of your `Node3D` (or other base) subclass; you call `this.findNode(...)`, `this.set(...)`, etc. without a separate `api` reference. The TypeScript codegen is responsible for routing those calls to the same underlying methods that `api` exposes in the dynamic languages.

In **Java**, the handle is injected as a `protected` field named `core` on `NodeScript`. Every example that says `core.set(...)` or `core.id()` is using the Java equivalent of `api.*` from JS/Luau.

When a callback fires *outside* a lifecycle hook (a callback you registered earlier, an HTTP completion, a timer), use the saved `this.api` / `self.api` rather than expecting a parameter. The engine never re-injects `api` on those callbacks.

---

## Script structure

The following examples demonstrate the baseline syntax for local state declaration, lifecycle callback execution, and signal handler connection.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, enterTree, ready, process, physicsProcess, input, exitTree, signal } from "moud";

export default class MyScript extends Node3D {
  myVar = 0;

  @enterTree()
  onEnterTree() { }

  @ready()
  onReady() { }

  @process()
  onProcess(dt: number) { }

  @physicsProcess()
  onPhysicsProcess(dt: number) { }

  @input()
  onInput(event: InputEvent) { }

  @exitTree()
  onExitTree() { }

  @signal("my_signal")
  onMySignal(arg1: string, arg2: number) { }
}
```

--- tab: JavaScript
```js
({
  myVar: 0,

  _enter_tree(api) { },
  _ready(api) { },
  _process(api, dt) { },
  _physics_process(api, dt) { },
  _input(api, event) { },
  _exit_tree(api) { },

  _on_my_signal(arg1, arg2) { }
})
```

--- tab: Luau
```lua
local script = { myVar = 0 }

function script:_enter_tree(api) end
function script:_ready(api) end
function script:_process(api, dt) end
function script:_physics_process(api, dt) end
function script:_input(api, event) end
function script:_exit_tree(api) end

function script:_on_my_signal(arg1, arg2) end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;
import com.moud.server.minestom.scripting.player.InputEvent;

public final class MyScript extends NodeScript {
    int myVar = 0;

    @Override public void onEnterTree() { }
    @Override public void onReady() { }
    @Override public void onProcess(double dt) { }
    @Override public void onPhysicsProcess(double dt) { }
    @Override public void onInput(InputEvent event) { }
    @Override public void onExitTree() { }

    public void onMySignal(Object value) { }
}
```
````

---

## Lifecycle callbacks

The engine automatically executes specific methods during a node's lifecycle. In TypeScript, these are exposed via decorators. In Java, they are overridable methods inherited from the `NodeScript` base class (`onEnterTree`, `onReady`, `onProcess`, `onPhysicsProcess`, `onInput`, `onExitTree`). Java signals dispatch to `on<SignalName>(Object value)` or a fallback `onSignal(String name, Object value)` method.

| Decorator | Execution condition |
|---|---|
| `@enterTree()` | Executes when the node enters the scene tree. |
| `@ready()` | Executes when the node and all of its children have entered the scene tree. |
| `@process()` | Executes every frame. Passes `dt` (delta time in seconds). |
| `@physicsProcess()` | Executes during the physics step. Passes `dt` (delta time in seconds). |
| `@input()` | Executes when a client input event is detected. Passes an `InputEvent` object. |
| `@exitTree()` | Executes immediately before the node is removed from the scene tree. |
| `@signal("name")` | Executes when the designated signal is emitted on the node. |

---

## Base classes

TypeScript scripts must extend a base class corresponding to their node type. This inheritance dictates the built-in properties and methods available within the `this` context.

```typescript
import { Node3D, RigidBody3D, Area3D, Label, Button } from "moud";

export default class MyBody extends RigidBody3D { /* ... */ }
export default class MyZone extends Area3D { /* ... */ }
export default class MyLabel extends Label { /* ... */ }
```

Valid base classes include: `Node`, `Node3D`, `RigidBody3D`, `StaticBody3D`, `CharacterBody3D`, `Area3D`, `Camera3D`, `Label`, `Button`, `TextureButton`, `CheckBox`, `HSlider`, and `VSlider`.

---

## API module reference

Script operations are categorized into distinct modules. TypeScript accesses these via class methods or explicit imports. JavaScript and Luau access them via the `api` parameter. Java accesses them via `protected` fields inherited from the `NodeScript` base class.

| Category | TypeScript API | JavaScript/Luau `api` methods |
|---|---|---|
| [Node and Properties](/4_Scripting/02_Node_and_Properties) | `this.position`, `this.find()`, `this.createChild()`, `this.free()` | `api.get()`, `api.set()`, `api.find()`, `api.createRuntime()`, `api.free()` |
| [Signals and Timers](/4_Scripting/03_Signals_and_Timers) | `@signal()`, `this.connect()`, `this.emit()`, `this.tween()` | `api.connect()`, `api.emit_signal()`, `api.after()`, `api.tween()` |
| [Input and Players](/4_Scripting/04_Input_and_Players) | `input()` (from `moud/players`), `teleportPlayer()` | `api.input()`, `api.getInput()`, `api.getPlayers()`, `api.teleportPlayer()` |
| [Camera](/4_Scripting/05_Camera) | `camera()` (from `moud/camera`) | `api.camera()`, `api.setActiveCamera()` |
| [Physics](/4_Scripting/06_Physics) | `raycast()`, `overlapSphere()` (from `moud/physics`) | `api.raycast()`, `api.overlapSphere()`, `api.applyForce()` |
| [Rendering](/4_Scripting/07_Rendering) | `this.setProperty()`, `this.setInstances()` | `api.setUniform()`, `api.setInstances()` |
| [Post-Processing](/4_Scripting/11_PostProcess) | - | `PostProcess.register()`, `PostProcess.setUniform1/2/3/4()` *(Client scripts only)* |
| [Scene Management](/4_Scripting/08_Scene_Management) | `loadScene()`, `instantiate()` (from `moud/scene`), `this.flush()` | `api.loadScene()`, `api.instantiate()`, `api.flush()` |

---

## Class and syntax references

### TypeScript implementation

In the TypeScript API, built-in properties and methods are evaluated against `this`. External utilities require explicit imports from `moud` sub-modules.

```typescript
// Identity evaluation
this.name                                         // string

// Spatial properties (Inherited from Node3D)
this.position.x / .y / .z
this.rotation.x / .y / .z
this.scale.x / .y / .z
this.visible

// Physics properties (Inherited from RigidBody3D)
this.mass
this.gravityScale
this.freeze
this.shape

// UI properties (Inherited from Label)
this.text

// Custom property declaration
@property health = 100;

// Generic property evaluation
this.getProperty<T>(key)                          // Returns T
this.setProperty(key, value)                      // void
this.removeProperty(key)                          // void

// Scene graph traversal
this.find<T>(path)                                // Returns T
this.getChildren()                                // Returns Node[]
this.exists()                                     // Returns boolean

// Node lifecycle operations
this.createChild(name, type)                      // Returns Node
this.free()                                       // void
this.rename(name)                                 // void
this.reparent(parent)                             // void
this.flush()                                      // void

// Signal routing
this.connect({ signal, target, handler })         // void
this.disconnect(...)                              // void
this.emit(signal, ...args)                        // void

// Interpolation (Tweens)
this.tween({ property, to, duration, onComplete? }) // void
```

External utilities require explicit imports:

```typescript
import { teleportPlayer, getPlayers } from "moud/players";
import { raycast, overlapSphere } from "moud/physics";
import { loadScene, instantiate } from "moud/scene";
import { camera } from "moud/camera";
```

---

### JavaScript / Luau implementation (`api` object)

Scripts formatted as `.js` or `.luau` expose engine functionality entirely through the `api` parameter passed into lifecycle callbacks.

**Identity**
```text
api.id()                                    → long
api.name()                                  → string
api.type()                                  → string
```

**Property evaluation**
```text
api.get(key)                                → string
api.get(nodeId, key)                        → string
api.set(key, value)                         → void
api.set(nodeId, key, value)                 → void
api.getNumber(key, fallback)                → double
api.getNumber(nodeId, key, fallback)        → double
api.setNumber(key, value)                   → void
api.setNumber(nodeId, key, value)           → void
api.getString(key, fallback)                → string
api.getString(nodeId, key, fallback)        → string
api.remove(key)                             → void
api.remove(nodeId, key)                     → void
```

**Scene graph traversal**
```text
api.find(path)                              → long
api.getRootId()                             → long
api.findNodesByType(type)                   → long[]
api.getChildren(nodeId)                     → long[]
api.exists(nodeId)                          → boolean
api.createRuntime(parentId, name, type)     → long
api.free(nodeId)                            → void
api.rename(name)                            → void
api.rename(nodeId, name)                    → void
api.reparent(nodeId, newParentId)           → void
api.instantiate(scenePath, parentId)        → long
api.loadScene(sceneId)                      → void
api.flush()                                 → void
```

**Signals and timers**
```text
api.connect(sourceId, signal, targetId, method)      → void
api.disconnect(sourceId, signal, targetId, method)   → void
api.emit_signal(signal)                              → void
api.emit_signal(signal, arg1)                        → void
api.emit_signal(signal, arg1, arg2)                  → void
api.emit_signal(signal, arg1, arg2, arg3)            → void
api.after(seconds, callback)                         → void
api.tween(nodeId, property, target, duration)        → void
```

**Input evaluation**
```text
api.input()                                 → InputEvent | null
api.getInput()                              → ScriptInputApi
```

**Player state**
```text
api.playerX()                               → double
api.playerY()                               → double
api.playerZ()                               → double
api.playerYaw()                             → double
api.getPlayers()                            → PlayerInfo[]
api.teleportPlayer(uuid, x, y, z)           → boolean
api.teleportPlayer(uuid, x, y, z, yaw, pitch) → boolean
```

**Camera operations**
```text
api.camera()                                → CameraApi
api.camera().follow(lx, ly, lz, pitch, roll)
api.camera().scriptable(x, y, z, yaw, pitch, roll)
api.camera().scene(cameraNodeId)
api.camera().reset()
api.setActiveCamera(nodeId)                 → void
api.setFollowCamera(lx, ly, lz, pitch, roll)
api.setScriptCamera(x, y, z, yaw, pitch, roll)
api.resetCamera()                           → void
api.setSceneCurrentCamera(nodeId)           → void
api.clearAllSceneCurrentCameras()           → void
```

**Physics evaluation**
```text
api.raycast(ox, oy, oz, dx, dy, dz, maxDist) → PhysicsHit | null
api.overlapSphere(x, y, z, radius)           → int[]
api.getCollisionEvents()                      → CollisionEvent[]
api.getBodyVelocity(nodeId)                   → double[3]
api.applyForce(nodeId, fx, fy, fz)           → void
api.applyImpulse(nodeId, fx, fy, fz)         → void
api.setLinearVelocity(nodeId, vx, vy, vz)    → void
```

**Rendering operations**
```text
api.setUniform(nodeId, name, ...values)       → void
api.setInstances(nodeId, data)                → void
```

**Utility**
```text
api.log(message)                              → void
```

---

### Java implementation (`NodeScript` base class)

Scripts utilizing the `.java` format must extend `com.moud.server.minestom.scripting.java.NodeScript` and declare a single `public` class. The compiler automatically detects the class name. The base class exposes API modules as `protected` fields, which are populated prior to `onReady` execution:

```java
protected CoreScriptApi core;    // Core functionality matching JS/Luau `api`
protected NodeApi node;          // Node identity and property evaluation
protected SceneApi scene;        // Scene graph traversal and manipulation
protected PhysicsApi physics;    // Raycasts, force application, overlap queries
protected PlayerApi players;     // Player arrays, teleportation, velocity assignment
protected CameraApi camera;      // Viewport target acquisition and state management
protected CursorApi cursor;      // Hardware cursor state
protected MessagingApi msg;      // Inter-script communication
protected ParticlesApi particles;
protected PersistApi persist;    // Key/value data persistence
protected HttpApi http;          // Outbound HTTP requests
```

Methods exposed via the `api` parameter in JavaScript and Luau are accessible via the `core` field in Java. For example:

```java
long id = core.id();
core.set("health", "100");
core.after(0.5, () -> core.emit_signal("damaged", 10));
core.tween(core.id(), "position.x", 10.0, 1.0);
```

---

## Math globals

The runtime shim exposes a small set of common math helpers as globals in JavaScript and Luau, and as named imports from `moud/math` in TypeScript. Use them instead of rolling your own; they are deterministic where applicable and avoid `Math.random()` pitfalls in deterministic generators.

| Symbol | Signature | Description |
|---|---|---|
| `lerp` | `lerp(a: number, b: number, t: number): number` | Linear interpolation. `t = 0` returns `a`, `t = 1` returns `b`. Not clamped, useful for extrapolation if you allow `t` outside `[0, 1]`. |
| `clamp` | `clamp(v: number, min: number, max: number): number` | Restricts `v` to the inclusive range `[min, max]`. |
| `randf` | `randf(min: number, max: number): number` | Uniform float in `[min, max)`. |
| `randi` | `randi(min: number, max: number): number` | Uniform integer in `[min, max]` (both inclusive). |

`Vec3` is also globally available with the static helpers `Vec3.dot`, `Vec3.distance`, `Vec3.forward(yawDeg)`, `Vec3.up()`, `Vec3.right()`, `Vec3.down()`.

In TypeScript the same helpers are imported explicitly:

```typescript
import { lerp, clamp, randf, randi } from "moud/math";
```

In JavaScript and Luau, the same names are available without an import:

```js
var t = clamp(elapsed / duration, 0, 1);
var damage = randi(5, 12);
this.api.set(this.api.id(), "color_tint_r", String(lerp(0, 1, t)));
```

```lua
local t = clamp(elapsed / duration, 0, 1)
local damage = randi(5, 12)
api:setNumber(api:id(), "color_tint_r", lerp(0, 1, t))
```

Java scripts use the equivalent `core.lerp / core.clamp / core.randf / core.randi` (or call into the standard `Math` class for portability) from inside `NodeScript`.

---

## Java scripting workflow

Java scripts compile in-process the first time they are loaded by `JavaRuntimeBridge`. There is no separate build step; you drop a `.java` file into your project's `scripts/` directory and the engine compiles it on demand. The compiler requires a JDK (not a JRE) at the runtime classpath; verify with `javac --version`.

### File layout

| Concern | Rule |
|---|---|
| **Location** | Anywhere under your project's `scripts/` directory. The engine recursively scans this folder. |
| **One public class per file** | The compiler reads the first `public class <Name>` it finds in the source. The class name does **not** have to match the filename, but matching it (Java convention) keeps your IDE happy. |
| **Package declaration** | **Optional.** If you omit it, the class lives in the default package. If you include one, the package must not collide with the engine's own packages (`com.moud.*`, `net.minestom.*`, `org.graalvm.*`); those are reserved for engine code and the package allowlist sandbox will reject scripts that try to write inside them. A short, unique package like `mygame.gameplay` is the recommended pattern for non-trivial projects. |
| **Multiple files** | Allowed. Each `.java` file is compiled independently against the engine classpath plus other already-loaded scripts. Cross-file references work as long as both files declare the same package. |
| **Inner classes** | Permitted within a single file (`public class Foo { static class Bar { ... } }`). Each script class still needs to extend `NodeScript`. |
| **Main class detection** | If the source contains no `public class` declaration, the bridge falls back to using the file name (without extension) as the class name. |

### Required base class

Every script attached to a node must extend `com.moud.server.minestom.scripting.java.NodeScript`. The base class injects the API modules as `protected` fields (most commonly `core`, the equivalent of `api` in JS/Luau) and provides overridable lifecycle methods.

### Compilation lifecycle

1. The engine watches a node's `script` property. When it changes (or on initial load), the file is read.
2. `JavaCompiler` compiles the source into bytecode in memory, including any sibling classes referenced from the same file or scripts loaded earlier.
3. The bytecode is loaded into an isolated `ClassLoader` constrained by the package allowlist. The script class is instantiated and bound to the node.
4. Edits to the source recompile on next load. Hot-reload re-instantiates the class against the same node.

### Sandbox

The script `ClassLoader` denies access to packages outside the allowlist. Standard JDK APIs (`java.util`, `java.lang`, `java.time`, `java.util.concurrent`, etc.) are permitted; reflection into engine internals or arbitrary `sun.*` packages is not. If you need an engine API, use the `core` field; if a JDK feature you need is denied by the sandbox, file an engine ticket rather than working around it.

### Minimal example

```java
// scripts/mygame/gameplay/Mover.java
package mygame.gameplay;

import com.moud.server.minestom.scripting.java.NodeScript;

public final class Mover extends NodeScript {
    private double t = 0.0;

    @Override
    public void onProcess(double dt) {
        t += dt;
        core.setNumber(core.id(), "x", Math.sin(t) * 5.0);
    }
}
```

Attach the node's `script` property to `res://scripts/mygame/gameplay/Mover.java` and the engine compiles, loads, and ticks it. Edit, save, and the next tick reloads the new bytecode.

