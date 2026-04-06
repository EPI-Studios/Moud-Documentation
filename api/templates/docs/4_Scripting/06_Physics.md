# Physics API

Query the physics world, apply forces to rigid bodies, and respond to collisions. All physics simulation runs on the server.

## Physics Body Methods

These methods are available on `RigidBody3D` and `CharacterBody3D` nodes from their base class. Call them on `this` inside a TypeScript script.

### `this.getBodyVelocity()` → `{ x, y, z }`

Returns the current linear velocity of the physics body.

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D, physicsProcess } from "moud";

export default class SpeedChecker extends RigidBody3D {
  @physicsProcess()
  tick(dt: number) {
    const vel = this.getBodyVelocity();
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
    console.log(`Speed: ${speed.toFixed(2)} m/s`);
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var vel = api.getBodyVelocity(api.id());
    var speed = Math.sqrt(vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2]);
    api.log("Speed: " + speed.toFixed(2));
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_physics_process(api, dt)
    local vel = api.getBodyVelocity(api.id())
    local speed = math.sqrt(vel[1]^2 + vel[2]^2 + vel[3]^2)
    api.log("Speed: " .. speed)
end
return script
```
````

### `this.applyForce({ x, y, z })` → `void`

Applies a continuous force to the body for this physics step. Effect is mass-dependent - heavier bodies accelerate less.

````tabs
--- tab: TypeScript
```typescript
this.applyForce({ x: 0, y: 200, z: 0 }); // push upward
```

--- tab: JavaScript
```js
api.applyForce(api.id(), 0, 200, 0);
```

--- tab: Luau
```lua
api.applyForce(api.id(), 0, 200, 0)
```
````

### `this.applyImpulse({ x, y, z })` → `void`

Applies an instant impulse (single-frame push) to the body. Use this for jump, explosion knockback, or any one-shot velocity change.

````tabs
--- tab: TypeScript
```typescript
this.applyImpulse({ x: 0, y: 8, z: 0 }); // jump
```

--- tab: JavaScript
```js
api.applyImpulse(api.id(), 0, 8, 0);
```

--- tab: Luau
```lua
api.applyImpulse(api.id(), 0, 8, 0)
```
````

### `this.setLinearVelocity({ x, y, z })` → `void`

Directly sets the body's velocity, overriding any current motion. Use for precise control, e.g. conveyor belts or character movement.

````tabs
--- tab: TypeScript
```typescript
this.setLinearVelocity({ x: 0, y: 10, z: 0 }); // shoot upward at 10 m/s
```

--- tab: JavaScript
```js
api.setLinearVelocity(api.id(), 0, 10, 0);
```

--- tab: Luau
```lua
api.setLinearVelocity(api.id(), 0, 10, 0)
```
````

## Physics Body Properties

These properties are settable directly on `RigidBody3D` in TypeScript. In JS/Luau use `api.set(nodeId, key, value)`.

| Property | Type | Description |
|---|---|---|
| `this.mass` | `number` | Mass in kg. Higher mass = more force needed to move |
| `this.gravityScale` | `number` | Multiplier on world gravity (`1.0` = normal, `0` = no gravity) |
| `this.freeze` | `boolean` | Freeze the body in place (immovable, but still collidable) |
| `this.shape` | `"box" \| "sphere" \| "capsule"` | Collision shape type |
| `this.linearDamping` | `number` | Air resistance / velocity bleed-off each tick |
| `this.collisionLayer` | `number` | Bitmask layer this body occupies |
| `this.collisionMask` | `number` | Bitmask of layers this body collides with |

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D, enterTree } from "moud";

export default class HeavyBox extends RigidBody3D {
  @enterTree()
  init() {
    this.mass = 10;
    this.shape = "box";
    this.linearDamping = 0.3;
    this.collisionLayer = 1;
    this.collisionMask = 3;
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    api.set(api.id(), "mass", "10");
    api.set(api.id(), "shape", "box");
    api.set(api.id(), "linearDamping", "0.3");
    api.set(api.id(), "collisionLayer", "1");
    api.set(api.id(), "collisionMask", "3");
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_enter_tree(api)
    api.set(api.id(), "mass", "10")
    api.set(api.id(), "shape", "box")
    api.set(api.id(), "linearDamping", "0.3")
    api.set(api.id(), "collisionLayer", "1")
    api.set(api.id(), "collisionMask", "3")
end
return script
```
````

## Raycasting

### `raycast(origin, direction, maxDist)` - from `moud/physics`

Casts a ray from `origin` in `direction` up to `maxDist` units. Returns a `PhysicsHit` if something is struck, or `null` otherwise.

Import `raycast` from `moud/physics` and `Vec3` from `moud/math`.

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D, physicsProcess } from "moud";
import { raycast } from "moud/physics";
import { Vec3 } from "moud/math";

export default class GroundChecker extends RigidBody3D {
  @physicsProcess()
  tick(dt: number) {
    // Cast 1.1 units straight down to check if grounded
    const hit = raycast(this.position, Vec3.down(), 1.1);
    if (hit) {
      console.log(`Ground at ${hit.point.y.toFixed(2)}, normal: ${hit.normal.y.toFixed(2)}`);
      console.log(`Hit body ID: ${hit.bodyId}`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var hit = api.raycast(
      api.getNumber("x", 0), api.getNumber("y", 0), api.getNumber("z", 0),
      0, -1, 0,
      1.1
    );
    if (hit) {
      api.log("Ground at y=" + hit.y());
      api.log("Hit body: " + hit.bodyId());
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_physics_process(api, dt)
    local hit = api.raycast(
        api.getNumber("x", 0), api.getNumber("y", 0), api.getNumber("z", 0),
        0, -1, 0,
        1.1
    )
    if hit then
        api.log("Ground at y=" .. hit.y())
        api.log("Hit body: " .. hit.bodyId())
    end
end
return script
```
````

### `PhysicsHit` Fields (TypeScript)

| Field | Type | Description |
|---|---|---|
| `point` | `{ x, y, z }` | World position of the hit |
| `normal` | `{ x, y, z }` | Surface normal at the hit point |
| `distance` | `number` | Distance from ray origin to hit point |
| `bodyId` | `number` | Node ID of the body that was hit |

### `PhysicsHit` Methods (JS / Luau)

| Method | Returns | Description |
|---|---|---|
| `x()`, `y()`, `z()` | `double` | World position of the hit point |
| `nx()`, `ny()`, `nz()` | `double` | Surface normal at the hit point |
| `distance()` | `double` | Distance from ray origin |
| `bodyId()` | `long` | Node ID of the struck body |

## Overlap Queries

### `overlapSphere(center, radius)` - from `moud/physics`

Returns an array of node IDs for all physics bodies overlapping a sphere.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, physicsProcess } from "moud";
import { overlapSphere } from "moud/physics";

export default class ProximityTrigger extends Node3D {
  @physicsProcess()
  tick(dt: number) {
    const nearby = overlapSphere(this.position, 5.0);
    for (const bodyId of nearby) {
      console.log(`Body in range: ${bodyId}`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var nearby = api.overlapSphere(
      api.getNumber("x", 0),
      api.getNumber("y", 0),
      api.getNumber("z", 0),
      5.0
    );
    for (var i = 0; i < nearby.length; i++) {
      api.log("Body in range: " + nearby[i]);
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_physics_process(api, dt)
    local nearby = api.overlapSphere(
        api.getNumber("x", 0),
        api.getNumber("y", 0),
        api.getNumber("z", 0),
        5.0
    )
    for _, bodyId in ipairs(nearby) do
        api.log("Body in range: " .. bodyId)
    end
end
return script
```
````

## Collision Events

### `this.getCollisionEvents()` → `CollisionEvent[]`

Returns all collision contacts that occurred during the current physics step. Call this inside a `@physicsProcess` method to detect impacts.

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D, physicsProcess } from "moud";

export default class ImpactDetector extends RigidBody3D {
  @physicsProcess()
  tick(dt: number) {
    const events = this.getCollisionEvents();
    for (const e of events) {
      console.log(`Collision: ${e.nodeIdA} hit ${e.nodeIdB} at`, e.contactPoint);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _physics_process(api, dt) {
    var events = api.getCollisionEvents();
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      api.log(e.nodeIdA() + " hit " + e.nodeIdB() +
        " at " + e.contactX() + "," + e.contactY() + "," + e.contactZ());
    }
  }
})
```

--- tab: Luau
```lua
local script = {}
function script:_physics_process(api, dt)
    local events = api.getCollisionEvents()
    for _, e in ipairs(events) do
        api.log(e.nodeIdA() .. " hit " .. e.nodeIdB() ..
            " at " .. e.contactX() .. "," .. e.contactY() .. "," .. e.contactZ())
    end
end
return script
```
````

### `CollisionEvent` Fields (TypeScript)

| Field | Type | Description |
|---|---|---|
| `nodeIdA` | `number` | First body in the collision |
| `nodeIdB` | `number` | Second body in the collision |
| `contactPoint` | `{ x, y, z }` | Contact point in world space |

### `CollisionEvent` Methods (JS / Luau)

| Method | Returns | Description |
|---|---|---|
| `nodeIdA()` | `long` | First body |
| `nodeIdB()` | `long` | Second body |
| `contactX()`, `contactY()`, `contactZ()` | `float` | Contact point in world space |

## Trigger Zones with `@signal`

`Area3D` nodes emit `area_entered` and `area_exited` automatically when players walk in or out. Connect them with the `@signal` decorator.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal } from "moud";

export default class TriggerZone extends Area3D {
  @signal("area_entered")
  onEnter(playerUuid: string) {
    console.log(`Player ${playerUuid} entered the zone`);
  }

  @signal("area_exited")
  onExit(playerUuid: string) {
    console.log(`Player ${playerUuid} left the zone`);
  }
}
```

--- tab: JavaScript
```js
({
  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
    api.connect(api.id(), "area_exited",  api.id(), "_on_exit");
  },

  _on_enter(playerUuid) {
    this.api.log("Entered: " + playerUuid);
  },

  _on_exit(playerUuid) {
    this.api.log("Exited: " + playerUuid);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
    api.connect(api.id(), "area_exited",  api.id(), "_on_exit")
end

function script:_on_enter(playerUuid)
    self.api:log("Entered: " .. playerUuid)
end

function script:_on_exit(playerUuid)
    self.api:log("Exited: " .. playerUuid)
end

return script
```
````

## Complete Example: Bouncy Ball

A `RigidBody3D` that bounces upward every time it hits the ground, detected via collision events. Demonstrates `@physicsProcess`, `getCollisionEvents()`, and `applyImpulse`.

````tabs
--- tab: TypeScript
```typescript
import { RigidBody3D, physicsProcess, enterTree } from "moud";

export default class BouncyBall extends RigidBody3D {
  private bounceForce = 12;

  @enterTree()
  init() {
    this.mass = 1;
    this.shape = "sphere";
    this.gravityScale = 1;
    this.linearDamping = 0.05;
  }

  @physicsProcess()
  tick(dt: number) {
    const events = this.getCollisionEvents();
    for (const e of events) {
      // Only react when this body is involved
      if (e.nodeIdA !== this.id && e.nodeIdB !== this.id) continue;

      const vel = this.getBodyVelocity();
      // Only bounce when moving downward
      if (vel.y < -0.5) {
        this.applyImpulse({ x: 0, y: this.bounceForce, z: 0 });
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  bounceForce: 12,

  _enter_tree(api) {
    this.api = api;
    api.set(api.id(), "mass", "1");
    api.set(api.id(), "shape", "sphere");
    api.set(api.id(), "gravityScale", "1");
    api.set(api.id(), "linearDamping", "0.05");
  },

  _physics_process(api, dt) {
    var events = api.getCollisionEvents();
    var myId = api.id();
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (e.nodeIdA() !== myId && e.nodeIdB() !== myId) continue;
      var vel = api.getBodyVelocity(myId);
      if (vel[1] < -0.5) {
        api.applyImpulse(myId, 0, this.bounceForce, 0);
      }
    }
  }
})
```

--- tab: Luau
```lua
local script = { bounceForce = 12 }

function script:_enter_tree(api)
    self.api = api
    api.set(api.id(), "mass", "1")
    api.set(api.id(), "shape", "sphere")
    api.set(api.id(), "gravityScale", "1")
    api.set(api.id(), "linearDamping", "0.05")
end

function script:_physics_process(api, dt)
    local events = api.getCollisionEvents()
    local myId = api.id()
    for _, e in ipairs(events) do
        if e.nodeIdA() ~= myId and e.nodeIdB() ~= myId then
        else
            local vel = api.getBodyVelocity(myId)
            if vel[2] < -0.5 then
                api.applyImpulse(myId, 0, self.bounceForce, 0)
            end
        end
    end
end

return script
```
````

## Complete Example: Trigger Zone with Score

An `Area3D` that awards points when a player enters and prints a message when they leave.

````tabs
--- tab: TypeScript
```typescript
import { Area3D, signal, enterTree } from "moud";

export default class ScoreZone extends Area3D {
  private playersInside = new Set<string>();
  private pointsPerEntry = 10;

  @enterTree()
  init() {
    console.log("ScoreZone ready");
  }

  @signal("area_entered")
  onEnter(playerUuid: string) {
    if (this.playersInside.has(playerUuid)) return;
    this.playersInside.add(playerUuid);
    console.log(`+${this.pointsPerEntry} points for player ${playerUuid}`);
    this.emit("score_awarded", playerUuid, this.pointsPerEntry);
  }

  @signal("area_exited")
  onExit(playerUuid: string) {
    this.playersInside.delete(playerUuid);
    console.log(`Player ${playerUuid} left the score zone`);
  }
}
```

--- tab: JavaScript
```js
({
  pointsPerEntry: 10,

  _enter_tree(api) {
    this.api = api;
    api.connect(api.id(), "area_entered", api.id(), "_on_enter");
    api.connect(api.id(), "area_exited",  api.id(), "_on_exit");
  },

  _on_enter(playerUuid) {
    this.api.log("+" + this.pointsPerEntry + " pts for " + playerUuid);
    this.api.emit_signal("score_awarded", playerUuid, this.pointsPerEntry);
  },

  _on_exit(playerUuid) {
    this.api.log(playerUuid + " left the score zone");
  }
})
```

--- tab: Luau
```lua
local script = { pointsPerEntry = 10 }

function script:_enter_tree(api)
    self.api = api
    api.connect(api.id(), "area_entered", api.id(), "_on_enter")
    api.connect(api.id(), "area_exited",  api.id(), "_on_exit")
end

function script:_on_enter(playerUuid)
    self.api:log("+" .. self.pointsPerEntry .. " pts for " .. playerUuid)
    self.api:emit_signal("score_awarded", playerUuid, self.pointsPerEntry)
end

function script:_on_exit(playerUuid)
    self.api:log(playerUuid .. " left the score zone")
end

return script
```
````
