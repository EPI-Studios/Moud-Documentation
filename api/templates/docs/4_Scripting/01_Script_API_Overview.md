# Script API Overview

Every Moud script receives an `api` object. This single object is how your script talks to the game: reading and writing properties, finding nodes, controlling cameras, handling physics, reacting to input, and more.

This section documents every method on `api`. If you are looking for a specific method, the quick reference table at the bottom of this page lists them all.

## Script Structure

````tabs
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

## API Categories

| Page | What It Covers |
|---|---|
| [Node and Properties](/4_Scripting/02_Node_and_Properties) | `id()`, `get()`, `set()`, `find()`, `createRuntime()`, `free()` |
| [Signals and Timers](/4_Scripting/03_Signals_and_Timers) | `connect()`, `emit_signal()`, `after()`, `tween()` |
| [Input and Players](/4_Scripting/04_Input_and_Players) | `input()`, `getInput()`, `getPlayers()`, `teleportPlayer()` |
| [Camera](/4_Scripting/05_Camera) | `camera().follow()`, `camera().scriptable()`, `camera().scene()` |
| [Physics](/4_Scripting/06_Physics) | `raycast()`, `overlapSphere()`, `applyForce()`, `getCollisionEvents()` |
| [Rendering](/4_Scripting/07_Rendering) | `setUniform()`, `setInstances()` |
| [Scene Management](/4_Scripting/08_Scene_Management) | `loadScene()`, `instantiate()`, `flush()` |

## Quick Reference

Here's every method on the `api` object at a glance:

### Identity
```text
api.id()                                    → long
api.name()                                  → string
api.type()                                  → string
```

### Properties
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

### Scene Tree
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

### Signals and Timers
```text
api.connect(sourceId, signal, targetId, method)     → void
api.disconnect(sourceId, signal, targetId, method)   → void
api.emit_signal(signal)                              → void
api.emit_signal(signal, arg1)                        → void
api.emit_signal(signal, arg1, arg2)                  → void
api.emit_signal(signal, arg1, arg2, arg3)            → void
api.after(seconds, callback)                         → void
api.tween(nodeId, property, target, duration)        → void
```

### Input
```text
api.input()                                 → InputEvent | null
api.getInput()                              → ScriptInputApi
```

### Players
```text
api.playerX()                               → double
api.playerY()                               → double
api.playerZ()                               → double
api.playerYaw()                             → double
api.getPlayers()                            → PlayerInfo[]
api.teleportPlayer(uuid, x, y, z)          → boolean
api.teleportPlayer(uuid, x, y, z, yaw, pitch) → boolean
```

### Camera
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

### Physics
```text
api.raycast(ox, oy, oz, dx, dy, dz, maxDist) → PhysicsHit | null
api.overlapSphere(x, y, z, radius)           → int[]
api.getCollisionEvents()                      → CollisionEvent[]
api.getBodyVelocity(nodeId)                   → double[3]
api.applyForce(nodeId, fx, fy, fz)           → void
api.applyImpulse(nodeId, fx, fy, fz)         → void
api.setLinearVelocity(nodeId, vx, vy, vz)    → void
```

### Rendering
```text
api.setUniform(nodeId, name, ...values)       → void
api.setInstances(nodeId, data)                → void
```

### Utility
```text
api.log(message)                              → void
```
