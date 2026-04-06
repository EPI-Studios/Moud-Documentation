# Player Body

`PlayerBody` is a special node that Moud automatically creates in the scene tree for every connected player. It tracks the player's live world position and exposes attachment points at every major body part, so other nodes can follow or anchor to a specific spot on a player - their head, hands, feet, and more.

You never create a `PlayerBody` manually. One appears as a direct child of the scene root when a player joins and is removed when they leave.

## Anatomy of a PlayerBody

| Property | Type | Description |
|---|---|---|
| `playerUuid` | `string` | UUID of the player this node represents |
| `playerName` | `string` | Display name of the player |
| `position` | `Vector3` | World position updated every tick by the server |

Because `PlayerBody` inherits `Node3D`, you can attach child nodes to it just like any other 3D node.

## Attachment Points

When a node is a direct child of a `PlayerBody`, you can set its `attachment_point` property to pin it to a specific part of the player's model. The available points are:

| Value | Location |
|---|---|
| `root` | Player feet (default) |
| `center` | Body center, approximately waist height |
| `head` | Top of the head |
| `above_head` | Floating above the head - good for name tags |
| `right_hand` | Right hand / item slot |
| `left_hand` | Left hand |
| `right_item` | Right held item position |
| `left_item` | Left held item position |
| `right_foot` | Right foot |
| `left_foot` | Left foot |

Limb attachment points follow full skeleton animation data so they move with animated poses in real time.

In the editor inspector, when you select a node whose parent is a `PlayerBody`, a **Player Attachment** section appears with an **Attach Point** dropdown.


## Finding Player Bodies from Scripts

Use `findNodesByType` to get all active player bodies in the current scene.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready, process } from "moud";
import { findNodesByType } from "moud/scene";
import { NodeType, PlayerBody } from "moud";

export default class PlayerTracker extends Node3D {
  @ready()
  init() {
    const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
    for (const body of bodies) {
      console.log(`${body.playerName} is in the scene`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var bodies = api.findNodesByType("PlayerBody");
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      api.log(body.playerName + " is in the scene");
    }
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local bodies = api.findNodesByType("PlayerBody")
    for _, body in ipairs(bodies) do
        api.log(body.playerName .. " is in the scene")
    end
end
```
````

## Attaching a Node to a Player

To attach a label above every player's head, create child nodes of the `PlayerBody` at runtime and set their `attachment_point`.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";
import { findNodesByType } from "moud/scene";
import { NodeType, PlayerBody } from "moud";

export default class NameTagSpawner extends Node3D {
  @ready()
  init() {
    const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
    for (const body of bodies) {
      const label = body.createChild("NameTag", "Sprite3D");
      label.setProperty("attachment_point", "above_head");
      label.setProperty("text", body.playerName);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var bodies = api.findNodesByType("PlayerBody");
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      var label = body.createChild("NameTag", "Sprite3D");
      label.setProperty("attachment_point", "above_head");
      label.setProperty("text", body.playerName);
    }
  }
})
```

--- tab: Luau
```lua
function script:_ready(api)
    local bodies = api.findNodesByType("PlayerBody")
    for _, body in ipairs(bodies) do
        local label = body:createChild("NameTag", "Sprite3D")
        label.setProperty("attachment_point", "above_head")
        label.setProperty("text", body.playerName)
    end
end
```
````

## Mounting a Player to a Position

`setAnchor(anchorNode)` teleports the player to the anchor node's world position every server tick. Use this to mount a player to a seat, a moving platform, or any other node.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, signal } from "moud";
import { findNodesByType } from "moud/scene";
import { NodeType, PlayerBody } from "moud";

export default class Seat extends Node3D {
  private occupant: PlayerBody | null = null;

  @signal("area_entered")
  onEnter(other: Node3D) {
    if (this.occupant) return;
    const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
    for (const body of bodies) {
      if (body.playerUuid === other.getProperty("player_uuid")) {
        this.occupant = body;
        body.setAnchor(this);
        break;
      }
    }
  }

  @signal("area_exited")
  onExit(other: Node3D) {
    if (this.occupant) {
      this.occupant.clearAnchor();
      this.occupant = null;
    }
  }
}
```

--- tab: JavaScript
```js
({
  occupant: null,

  _on_area_entered(api, other) {
    if (this.occupant) return;
    var bodies = api.findNodesByType("PlayerBody");
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      if (body.playerUuid === other.getProperty("player_uuid")) {
        this.occupant = body;
        body.setAnchor(api.self());
        break;
      }
    }
  },

  _on_area_exited(api, other) {
    if (this.occupant) {
      this.occupant.clearAnchor();
      this.occupant = null;
    }
  }
})
```

--- tab: Luau
```lua
local script = { occupant = nil }

function script:_on_area_entered(api, other)
    if self.occupant then return end
    local bodies = api.findNodesByType("PlayerBody")
    for _, body in ipairs(bodies) do
        if body.playerUuid == other.getProperty("player_uuid") then
            self.occupant = body
            body.setAnchor(api.self())
            break
        end
    end
end

function script:_on_area_exited(api, other)
    if self.occupant then
        self.occupant.clearAnchor()
        self.occupant = nil
    end
end

return script
```
````

### Notes on Mounting

- The anchor is server-side. The server teleports the player to the anchor position each tick.
- The player's client-side interpolation is not added on top - they simply snap to the anchor's position, which is updated every tick. For smooth mounting on a moving node, the node itself should move smoothly.
- Call `clearAnchor()` to release the player when they should be free to move again.

## Player Physics

You can apply velocity to a player directly - useful for knockback, launching, boosts, or any force-based interaction.

Velocity is in **blocks per second**, positive Y is up. These calls are sent to the player's Minecraft client which applies them physically (gravity, collision, etc. all behave normally).

| Method | Description |
|---|---|
| `setVelocity(vx, vy, vz)` | Overrides current velocity completely |
| `addVelocity(vx, vy, vz)` | Adds to current velocity (impulse) |
| `getVelocity()` | Returns `{ x, y, z }` in blocks per second |

````tabs
--- tab: TypeScript
```typescript
import { Node3D, signal } from "moud";
import { findNodesByType } from "moud/scene";
import { NodeType, PlayerBody } from "moud";

export default class LaunchPad extends Node3D {
  @signal("area_entered")
  onEnter(other: Node3D) {
    const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
    for (const body of bodies) {
      if (body.playerUuid === other.getProperty<string>("player_uuid")) {
        // Launch upward at 15 blocks/sec, keep horizontal velocity
        const vel = body.getVelocity();
        body.setVelocity(vel.x, 15, vel.z);
        break;
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  _on_area_entered(api, other) {
    var bodies = api.findNodesByType("PlayerBody");
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      if (body.playerUuid === other.getProperty("player_uuid")) {
        var vel = body.getVelocity();
        body.setVelocity(vel.x, 15, vel.z);
        break;
      }
    }
  }
})
```

--- tab: Luau
```lua
function script:_on_area_entered(api, other)
    local bodies = api.findNodesByType("PlayerBody")
    for _, body in ipairs(bodies) do
        if body.playerUuid == other.getProperty("player_uuid") then
            local vel = body.getVelocity()
            body.setVelocity(vel.x, 15, vel.z)
            break
        end
    end
end
```
````

### Knockback Example

```typescript
// Push all players away from an explosion origin
const origin = this.position;
const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
for (const body of bodies) {
  const dx = body.position.x - origin.x;
  const dz = body.position.z - origin.z;
  const dist = Math.sqrt(dx * dx + dz * dz) || 1;
  const strength = Math.max(0, 12 - dist); // weaker at range
  body.addVelocity((dx / dist) * strength, 6, (dz / dist) * strength);
}
```

## Complete Example: Floating Crown

Attach a spinning crown above a specific player's head.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready, process } from "moud";
import { findNodesByType } from "moud/scene";
import { NodeType, PlayerBody } from "moud";

export default class CrownManager extends Node3D {
  private crown: Node3D | null = null;
  private rotation = 0;

  @ready()
  init() {
    // Attach a crown to the first player found
    const bodies = findNodesByType<PlayerBody>(NodeType.PlayerBody);
    if (bodies.length === 0) return;

    const body = bodies[0];
    const crown = body.createChild<Node3D>("Crown", "MeshInstance3D");
    crown.setProperty("attachment_point", "above_head");
    crown.setProperty("mesh", "res://meshes/crown.glb");
    this.crown = crown;
  }

  @process()
  tick(dt: number) {
    if (!this.crown) return;
    this.rotation = (this.rotation + 90 * dt) % 360;
    this.crown.setProperty("ry", String(this.rotation));
  }
}
```

--- tab: JavaScript
```js
({
  crown: null,
  rotation: 0,

  _ready(api) {
    var bodies = api.findNodesByType("PlayerBody");
    if (bodies.length === 0) return;

    var body = bodies[0];
    var crown = body.createChild("Crown", "MeshInstance3D");
    crown.setProperty("attachment_point", "above_head");
    crown.setProperty("mesh", "res://meshes/crown.glb");
    this.crown = crown;
  },

  _process(api, dt) {
    if (!this.crown) return;
    this.rotation = (this.rotation + 90 * dt) % 360;
    this.crown.setProperty("ry", String(this.rotation));
  }
})
```

--- tab: Luau
```lua
local script = { crown = nil, rotation = 0 }

function script:_ready(api)
    local bodies = api.findNodesByType("PlayerBody")
    if #bodies == 0 then return end

    local body = bodies[1]
    local crown = body:createChild("Crown", "MeshInstance3D")
    crown.setProperty("attachment_point", "above_head")
    crown.setProperty("mesh", "res://meshes/crown.glb")
    self.crown = crown
end

function script:_process(api, dt)
    if not self.crown then return end
    self.rotation = (self.rotation + 90 * dt) % 360
    self.crown.setProperty("ry", tostring(self.rotation))
end

return script
```
````
