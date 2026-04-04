# Physics Nodes

Nodes that interact with the physics engine: static walls, falling objects, trigger zones, and raycasts.

## StaticBody3D

A collision shape that doesn't move. Use it for floors, walls, and anything the player should bump into.

| Property | Type | Description |
|---|---|---|
| `shape` | string | `box`, `sphere`, or `capsule` |
| `solid` | bool | Whether collision is active |
| `collision_layer/mask` | int | Which layers this body is on and interacts with |

## RigidBody3D

A body that the physics engine simulates. It falls with gravity, bounces off things, and can be pushed around with forces.

| Property | Type | Default | Description |
|---|---|---|---|
| `shape` | string | | Collision shape: `box`, `sphere`, `capsule` |
| `solid` | bool | true | Whether collision is active |
| `mass` | float | 1 | How heavy it is |
| `gravity_scale` | float | 1 | 0 = floats, 1 = normal gravity, 2 = double |
| `freeze` | bool | false | Lock it in place (still collides) |
| `linear_damping` | float | 0 | Slows down movement (0 to 1) |
| `angular_damping` | float | 0 | Slows down rotation (0 to 1) |
| `collision_layer/mask` | int | 1 | Collision filtering |

You can push these from scripts with `api.applyForce()`, `api.applyImpulse()`, and `api.setLinearVelocity()`.

## CharacterBody3D

A body you control entirely from scripts. Unlike `RigidBody3D`, it does not respond to forces or gravity on its own. You decide how it moves.

Same collision properties as `StaticBody3D`.

## Area3D

A trigger zone. It does not block movement. Instead, it fires signals when a player enters or exits.

| Property | Type | Description |
|---|---|---|
| `shape` | string | `box` or `sphere` |
| `monitoring` | bool | Must be `true` to detect players |
| `collision_layer/mask` | int | Collision filtering |
| `radius` | float | Size of the sphere (if using sphere shape) |

**Signals:**

- `area_entered` - fires when a player walks in (argument: player UUID as a string)
- `area_exited` - fires when a player walks out (argument: player UUID as a string)

This is one of the most useful nodes in the engine. Teleporters, pickups, damage zones, dialogue triggers - they all start with an `Area3D`.

## Raycast3D

Casts a ray and reports what it hits. For script-based raycasting you will probably use `api.raycast()` instead, but this node is available if you want a persistent ray in the scene.
