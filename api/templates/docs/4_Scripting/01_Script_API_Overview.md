**Scripting**

Scripts define logic and runtime behavior for objects within the scene tree. Attaching a script to a node enables the execution of lifecycle callbacks, property modification, physics computation, and signal handling. 

The engine supports four scripting environments:
*   **TypeScript (`.ts`)**: Class-based inheritance utilizing decorators for strict type evaluation.
*   **JavaScript (`.js`)**: Object-literal structure exposing lifecycle methods via an `api` parameter.
*   **Luau (`.luau`)**: Table-based structure utilizing the `api` parameter.
*   **Java (`.java`)**: Class-based scripts extending `NodeScript`. Compiled in-process at runtime via `JavaCompiler` (requires a JDK environment). Executes within an isolated `ClassLoader` restricted by a package allowlist sandbox. API modules are injected as `protected` fields.

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
