# Physics API

Query the physics world and apply forces to rigid bodies. All physics runs on the server.

## Raycasting

### `api.raycast(ox, oy, oz, dx, dy, dz, maxDist)` → PhysicsHit | null

Casts a ray from origin `(ox, oy, oz)` in direction `(dx, dy, dz)` up to `maxDist` units. Returns a `PhysicsHit` if something is hit, or `null`/`nil` otherwise.

````tabs
--- tab: JavaScript
```js
// Cast a ray straight down from above
var hit = api.raycast(0, 50, 0, 0, -1, 0, 100);
if (hit) {
  api.log("Ground at y=" + hit.y());
  api.log("Hit node: " + hit.bodyId());
}

// Cast a ray from the player's eye in their look direction
var px = api.playerX();
var py = api.playerY() + 1.6;
var pz = api.playerZ();
var yaw = api.playerYaw() * Math.PI / 180;
var hit = api.raycast(px, py, pz, -Math.sin(yaw), 0, Math.cos(yaw), 50);
```

--- tab: Luau
```lua
local hit = api.raycast(0, 50, 0, 0, -1, 0, 100)
if hit then
    api.log("Ground at y=" .. hit.y())
end
```
````

### PhysicsHit Methods

| Method | Returns | Description |
|---|---|---|
| `x()`, `y()`, `z()` | double | World position of the hit point |
| `nx()`, `ny()`, `nz()` | double | Surface normal at the hit point |
| `distance()` | double | Distance from the ray origin |
| `bodyId()` | long | Node ID of the body that was hit |

## Overlap Queries

### `api.overlapSphere(x, y, z, radius)` → int[]

Returns an array of physics body node IDs that overlap with a sphere.

```js
var nearby = api.overlapSphere(0, 5, 0, 10);
for (var i = 0; i < nearby.length; i++) {
  api.log("Body in range: " + nearby[i]);
}
```

## Collision Events

### `api.getCollisionEvents()` → CollisionEvent[]

Returns all collision contacts that occurred during the current physics step.

```js
var events = api.getCollisionEvents();
for (var i = 0; i < events.length; i++) {
  var e = events[i];
  api.log(e.nodeIdA() + " hit " + e.nodeIdB() +
    " at " + e.contactX() + "," + e.contactY() + "," + e.contactZ());
}
```

### CollisionEvent Methods

| Method | Returns | Description |
|---|---|---|
| `nodeIdA()` | long | First body in the collision |
| `nodeIdB()` | long | Second body in the collision |
| `contactX()`, `contactY()`, `contactZ()` | float | Contact point in world space |

## Forces and Velocities

### `api.applyForce(nodeId, fx, fy, fz)` → void

Applies a continuous force to a `RigidBody3D`. The effect depends on mass - heavier objects accelerate less.

```js
api.applyForce(cubeId, 0, 100, 0);  // push upward
```

### `api.applyImpulse(nodeId, fx, fy, fz)` → void

Applies an instant impulse to a `RigidBody3D`. Like a single push.

```js
api.applyImpulse(cubeId, 10, 50, 0);  // launch up and right
```

### `api.setLinearVelocity(nodeId, vx, vy, vz)` → void

Directly sets the velocity of a `RigidBody3D`. Overrides any current motion.

```js
api.setLinearVelocity(cubeId, 0, 10, 0);  // shoot upward at 10 m/s
```

### `api.getBodyVelocity(nodeId)` → double[3]

Returns the current velocity of a physics body as `[vx, vy, vz]`.

```js
var vel = api.getBodyVelocity(cubeId);
var speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
api.log("Speed: " + speed);
```

