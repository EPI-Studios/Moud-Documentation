# Script API Overview

Moud scripts are written in TypeScript, JavaScript, or Luau and attached to nodes in the scene tree. Scripts react to lifecycle events, handle signals, and interact with the engine through a set of built-in APIs.

TypeScript is the recommended scripting language. It uses a class-based style with decorators and full type checking. JavaScript uses the older object literal style with an `api` parameter. Luau is also supported for those who prefer it.

- `.ts` files - TypeScript class-based API (recommended)
- `.js` files - JavaScript object literal API with `api` parameter
- `.luau` files - Luau table-based API with `api` parameter

## Script Structure

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class MyScript extends Node3D {
  // Local state as class fields
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
  // Local state
  myVar: 0,

  // Lifecycle callbacks - called by the engine
  _enter_tree(api) { },
  _ready(api) { },
  _process(api, dt) { },
  _physics_process(api, dt) { },
  _input(api, event) { },
  _exit_tree(api) { },

  // Signal handlers - called when connected signals fire
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
````

## Lifecycle Decorators (TypeScript)

| Decorator | When It Fires |
|---|---|
| `@enterTree()` | Node is added to the scene tree |
| `@ready()` | Node and all children are ready |
| `@process()` | Every frame - receives `dt` (delta time in seconds) |
| `@physicsProcess()` | Every physics tick - receives `dt` |
| `@input()` | When a player input event occurs - receives `InputEvent` |
| `@exitTree()` | Node is removed from the scene tree |
| `@signal("name")` | When the named signal fires on this node |

## Base Classes

TypeScript scripts extend a base class matching the node type. The base class determines which built-in properties and methods are available.

```typescript
import { Node3D, RigidBody3D, Area3D, Label, Button } from "moud";

export default class MyBody extends RigidBody3D { /* ... */ }
export default class MyZone extends Area3D { /* ... */ }
export default class MyLabel extends Label { /* ... */ }
```

Available base classes include: `Node`, `Node3D`, `RigidBody3D`, `StaticBody3D`, `CharacterBody3D`, `Area3D`, `Camera3D`, `Label`, `Button`, `TextureButton`, `CheckBox`, `HSlider`, `VSlider`.

## API Categories

| Page | TypeScript API | JS `api` Object |
|---|---|---|
| [Node and Properties](/4_Scripting/02_Node_and_Properties) | `this.position`, `this.find()`, `this.createChild()`, `this.free()` | `api.get()`, `api.set()`, `api.find()`, `api.createRuntime()`, `api.free()` |
| [Signals and Timers](/4_Scripting/03_Signals_and_Timers) | `@signal()`, `this.connect()`, `this.emit()`, `this.tween()` | `api.connect()`, `api.emit_signal()`, `api.after()`, `api.tween()` |
| [Input and Players](/4_Scripting/04_Input_and_Players) | `input()` from `moud/players`, `teleportPlayer()` | `api.input()`, `api.getInput()`, `api.getPlayers()`, `api.teleportPlayer()` |
| [Camera](/4_Scripting/05_Camera) | `camera()` from `moud/camera` | `api.camera()`, `api.setActiveCamera()` |
| [Physics](/4_Scripting/06_Physics) | `raycast()`, `overlapSphere()` from `moud/physics` | `api.raycast()`, `api.overlapSphere()`, `api.applyForce()` |
| [Rendering](/4_Scripting/07_Rendering) | `this.setProperty()` for uniforms, instanced renderers | `api.setUniform()`, `api.setInstances()` |
| [Scene Management](/4_Scripting/08_Scene_Management) | `loadScene()`, `instantiate()` from `moud/scene`, `this.flush()` | `api.loadScene()`, `api.instantiate()`, `api.flush()` |

## Quick Reference

### TypeScript Style

Built-in properties are accessed directly on `this`. Node methods are called on `this`. Utility functions are imported from `moud` sub-modules.

```typescript
// Identity (from extended base class)
this.name                                         // string
// (type is the class name)

// Built-in spatial properties (Node3D and subclasses)
this.position.x / .y / .z
this.rotation.x / .y / .z
this.scale.x / .y / .z
this.visible

// Built-in physics properties (RigidBody3D)
this.mass
this.gravityScale
this.freeze
this.shape

// Built-in UI properties (Label)
this.text

// Custom properties (synced with engine)
@property health = 100;

// Generic property access (any node)
this.getProperty<T>(key)                          → T
this.setProperty(key, value)                      → void
this.removeProperty(key)                          → void

// Scene tree navigation
this.find<T>(path)                                → T
this.getChildren()                                → Node[]
this.exists()                                     → boolean

// Node lifecycle
this.createChild(name, type)                      → Node
this.free()                                       → void
this.rename(name)                                 → void
this.reparent(parent)                             → void
this.flush()                                      → void

// Signals
this.connect({ signal, target, handler })         → void
this.disconnect(...)                              → void
this.emit(signal, ...args)                        → void

// Tweens
this.tween({ property, to, duration, onComplete? }) → void
```

Utility functions are imported from sub-modules:

```typescript
import { teleportPlayer, getPlayers } from "moud/players";
import { raycast, overlapSphere } from "moud/physics";
import { loadScene, instantiate } from "moud/scene";
import { camera } from "moud/camera";
```

---

### JS `api` Object Style (raw reference)

For scripts using the `.js` object literal format, all functionality is on the `api` parameter.

#### Identity
```text
api.id()                                    → long
api.name()                                  → string
api.type()                                  → string
```

#### Properties
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

#### Scene Tree
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

#### Signals and Timers
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

#### Input
```text
api.input()                                 → InputEvent | null
api.getInput()                              → ScriptInputApi
```

#### Players
```text
api.playerX()                               → double
api.playerY()                               → double
api.playerZ()                               → double
api.playerYaw()                             → double
api.getPlayers()                            → PlayerInfo[]
api.teleportPlayer(uuid, x, y, z)           → boolean
api.teleportPlayer(uuid, x, y, z, yaw, pitch) → boolean
```

#### Camera
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

#### Physics
```text
api.raycast(ox, oy, oz, dx, dy, dz, maxDist) → PhysicsHit | null
api.overlapSphere(x, y, z, radius)           → int[]
api.getCollisionEvents()                      → CollisionEvent[]
api.getBodyVelocity(nodeId)                   → double[3]
api.applyForce(nodeId, fx, fy, fz)           → void
api.applyImpulse(nodeId, fx, fy, fz)         → void
api.setLinearVelocity(nodeId, vx, vy, vz)    → void
```

#### Rendering
```text
api.setUniform(nodeId, name, ...values)       → void
api.setInstances(nodeId, data)                → void
```

#### Utility
```text
api.log(message)                              → void
```
