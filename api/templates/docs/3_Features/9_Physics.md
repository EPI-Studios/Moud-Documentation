# Physics System

Moud has a built-in physics engine (JOLT) that handles rigid bodies, collision, raycasting, and overlap detection. Everything runs on the server, so all players see the same physics. The client just displays the result.

## Physics Body Types

### StaticBody3D

An immovable collision shape. Use it for walls, floors, and terrain that doesn't move.

```json
{
  "type": "StaticBody3D",
  "properties": {
    "x": "0", "y": "-1", "z": "0",
    "sx": "50", "sy": "1", "sz": "50",
    "shape": "box",
    "solid": "true",
    "collision_layer": "1",
    "collision_mask": "1"
  }
}
```

### RigidBody3D

A physics-simulated body affected by gravity and forces. Use it for falling objects, projectiles, pushable crates, ragdolls.

```json
{
  "type": "RigidBody3D",
  "properties": {
    "x": "0", "y": "10", "z": "0",
    "shape": "box",
    "sx": "1", "sy": "1", "sz": "1",
    "mass": "2",
    "gravity_scale": "1",
    "freeze": "false",
    "solid": "true"
  }
}
```

| Property | Type | Description |
|---|---|---|
| `mass` | float | Mass of the body |
| `gravity_scale` | float | Gravity multiplier (0 = no gravity, 1 = normal, 2 = double) |
| `freeze` | bool | Lock the body in place (still has collision) |
| `linear_damping` | float | Velocity damping (0–1) |
| `angular_damping` | float | Rotation damping (0–1) |

### CharacterBody3D

A player-like body with custom movement. Unlike `RigidBody3D`, it doesn't respond to forces automatically - you control it from scripts.

### Area3D

A trigger volume that detects overlap but doesn't block movement. See [Zones and Scene Management](/3_Features/8_Zones_and_Scenes) for details.

## Collision Shapes

Set the `shape` property on any physics body:

| Shape | Description |
|---|---|
| `box` | Axis-aligned box, sized by `sx`, `sy`, `sz` |
| `sphere` | Sphere, sized by `radius` |
| `capsule` | Capsule shape |

## Common Physics Properties

| Property | Type | Description |
|---|---|---|
| `shape` | string | Collision shape: `box`, `sphere`, `capsule` |
| `solid` | bool | Enable collision |
| `collision_layer` | int | Which layer this body is on |
| `collision_mask` | int | Which layers this body interacts with |

## Applying Forces and Velocities

From scripts, you can push, launch, and move physics bodies:

````tabs
--- tab: JavaScript
```js
// Apply a continuous force (acceleration)
api.applyForce(cubeId, 0, 100, 0);  // push upward

// Apply an instant impulse (launch)
api.applyImpulse(cubeId, 10, 50, 0);  // fling up and to the right

// Set velocity directly
api.setLinearVelocity(cubeId, 0, 10, 0);  // shoot upward

// Read current velocity
var vel = api.getBodyVelocity(cubeId);
// vel[0] = vx, vel[1] = vy, vel[2] = vz
api.log("Speed: " + Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]));
```

--- tab: Luau
```lua
api.applyForce(cubeId, 0, 100, 0)
api.applyImpulse(cubeId, 10, 50, 0)
api.setLinearVelocity(cubeId, 0, 10, 0)

local vel = api.getBodyVelocity(cubeId)
api.log("vx=" .. vel[1] .. " vy=" .. vel[2] .. " vz=" .. vel[3])
```
````

### Force vs Impulse

| Method | Effect | Use Case |
|---|---|---|
| `applyForce(id, fx, fy, fz)` | Continuous push (affected by mass) | Engines, thrusters, wind |
| `applyImpulse(id, fx, fy, fz)` | Instant push (affected by mass) | Explosions, jumps, hits |
| `setLinearVelocity(id, vx, vy, vz)` | Override velocity directly | Precise movement control |

## Raycasting

Cast a ray from a point in a direction and find what it hits:

````tabs
--- tab: JavaScript
```js
// raycast(originX, originY, originZ, dirX, dirY, dirZ, maxDistance)
var hit = api.raycast(0, 10, 0, 0, -1, 0, 50);  // cast downward

if (hit) {
  api.log("Hit node " + hit.bodyId());
  api.log("At: " + hit.x() + ", " + hit.y() + ", " + hit.z());
  api.log("Normal: " + hit.nx() + ", " + hit.ny() + ", " + hit.nz());
  api.log("Distance: " + hit.distance());
}
```

--- tab: Luau
```lua
local hit = api.raycast(0, 10, 0, 0, -1, 0, 50)
if hit then
    api.log("Hit node " .. hit.bodyId())
    api.log("Distance: " .. hit.distance())
end
```
````

Returns `null`/`nil` if nothing was hit.

## Overlap Queries

Find all physics bodies within a sphere:

````tabs
--- tab: JavaScript
```js
// overlapSphere(x, y, z, radius)
var bodies = api.overlapSphere(0, 5, 0, 10);
for (var i = 0; i < bodies.length; i++) {
  api.log("Body in range: " + bodies[i]);
}
```

--- tab: Luau
```lua
local bodies = api.overlapSphere(0, 5, 0, 10)
for _, bodyId in ipairs(bodies) do
    api.log("Body in range: " .. bodyId)
end
```
````

## Collision Events

Read collision contacts that happened this physics step:

````tabs
--- tab: JavaScript
```js
_physics_process(api, dt) {
  var events = api.getCollisionEvents();
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    api.log("Collision: " + e.nodeIdA() + " hit " + e.nodeIdB());
    api.log("Contact point: " + e.contactX() + ", " + e.contactY() + ", " + e.contactZ());
  }
}
```

--- tab: Luau
```lua
function script:_physics_process(api, dt)
    local events = api.getCollisionEvents()
    for _, e in ipairs(events) do
        api.log("Collision: " .. e.nodeIdA() .. " hit " .. e.nodeIdB())
    end
end
```
````

### CollisionEvent Fields

| Method | Returns | Description |
|---|---|---|
| `nodeIdA()` | long | First body in the collision |
| `nodeIdB()` | long | Second body in the collision |
| `contactX/Y/Z()` | float | World position of the contact point |

