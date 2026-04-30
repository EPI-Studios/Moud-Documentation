# Multi-instance runtime

The Moud runtime executes multiple isolated simulation instances within a single server process. The architecture distinguishes between static templates and active simulations:

*   **Place:** A static scene template loaded from disk. Identified by a `placeId` corresponding to the `.moud.scene` file name.
*   **Instance:** A distinct runtime execution of a place. Each instance evaluates an independent scene graph, physics world, scripting context, and player registry.

Scripts interface with the matchmaker and routing system via the `Server` module, accessible through the `api` handle across all supported languages.

---

## Runtime configuration

Matchmaking limits and instance capacities are defined per-project within the `project.moud.json` configuration file. If a parameter is omitted, the engine applies default values.

```json
{
  "format": 1,
  "name": "My Game",
  "author": "studio",
  "runtime": {
    "playersPerInstance": 8,
    "maxInstances": 16,
    "emptyShutdownGraceMillis": 30000
  }
}
```

| Property | Type | Description |
|---|---|---|
| `playersPerInstance` | int | Maximum client capacity per instance before the matchmaker routes players to a new or alternative instance. |
| `maxInstances` | int | Maximum concurrent instances the server process is permitted to allocate globally. |
| `emptyShutdownGraceMillis` | int | Milliseconds an instance remains active without connected clients before the server deallocates it. |

---

## Instance queries

`server().currentInstanceId()`  
`server().currentPlaceId()`  

Retrieves the runtime identifiers for the executing scene. These methods are utilized for analytics, logging, state persistence keys, and evaluating conditional logic across parallel instances.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, ready } from "moud";

export default class Match extends Node3D {
  @ready()
  init() {
    const placeId = this.api.server().currentPlaceId();
    const instanceId = this.api.server().currentInstanceId();
    console.log(`Match running in place=${placeId} instance=${instanceId}`);
  }
}
```

--- tab: JavaScript
```js
({
  _ready(api) {
    var placeId = api.server().currentPlaceId();
    var instanceId = api.server().currentInstanceId();
    api.log("place=" + placeId + " instance=" + instanceId);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_ready(api)
    local placeId = api:server():currentPlaceId()
    local instanceId = api:server():currentInstanceId()
    api:log("place=" .. placeId .. " instance=" .. instanceId)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Match extends NodeScript {
    @Override public void onReady() {
        String placeId = core.server().currentPlaceId();
        String instanceId = core.server().currentInstanceId();
        log("place=" + placeId + " instance=" + instanceId);
    }
}
```
````

---

## Teleportation

`server().teleport(playerUuid: string, placeId: string, payload?: string)`

Routes a client to a designated place. The matchmaker automatically evaluates instance capacity and assigns the client to an available public instance, spawning a new instance if necessary and permitted by `maxInstances`.

Returns `true` if the client UUID is resolved and the teleport operation is queued.

The optional `payload` parameter accepts a string (typically serialized JSON) that is delivered to the destination scene's `_on_player_arrive` callback.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, signal } from "moud";

export default class Lobby extends Node3D {
  @signal("pressed")
  onPlayPressed(playerUuid: string) {
    this.api.server().teleport(playerUuid, "racing", JSON.stringify({ team: "red" }));
  }
}
```

--- tab: JavaScript
```js
({
  _on_play_pressed(playerUuid) {
    this.api.server().teleport(playerUuid, "racing", JSON.stringify({ team: "red" }));
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_on_play_pressed(playerUuid)
    self.api:server():teleport(playerUuid, "racing", '{"team":"red"}')
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class Lobby extends NodeScript {
    public void onPlayPressed(Object playerUuid) {
        core.server().teleport(playerUuid.toString(), "racing", "{\"team\":\"red\"}");
    }
}
```
````

---

## Instance-specific teleportation

`server().teleportToInstance(playerUuid: string, instanceId: string, reservationToken: string, payload?: string)`

Routes a client directly to a specific instance identifier, bypassing standard matchmaker pool selection. This is strictly utilized for party systems, friend invites, and dedicated match rooms.

Requires an `instanceId` and `reservationToken` generated via `createPrivateInstance()`. The method returns `false` if the instance is deallocated, at maximum capacity, or if the token is invalid.

````tabs
--- tab: TypeScript
```typescript
const ticket = this.api.server().createPrivateInstance("arena");
this.api.server().teleportToInstance(playerUuid, ticket.instanceId(), ticket.token());
```

--- tab: JavaScript
```js
var ticket = api.server().createPrivateInstance("arena");
api.server().teleportToInstance(playerUuid, ticket.instanceId(), ticket.token());
```

--- tab: Luau
```lua
local ticket = api:server():createPrivateInstance("arena")
api:server():teleportToInstance(playerUuid, ticket:instanceId(), ticket:token())
```

--- tab: Java
```java
var ticket = core.server().createPrivateInstance("arena");
core.server().teleportToInstance(playerUuid.toString(), ticket.instanceId(), ticket.token());
```
````

---

## Private instances

`server().createPrivateInstance(placeId: string)`

Allocates a new instance of the designated place that is explicitly hidden from the public matchmaking pool. 

Returns a ticket object containing the `instanceId` and a single-use `token` required for client admission via `teleportToInstance()`. Returns `null` if the server process has reached the `maxInstances` allocation limit.

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class PartyHost extends Node3D {
  startParty(host: string, friends: string[]) {
    const ticket = this.api.server().createPrivateInstance("co_op");
    if (!ticket) return;
    this.api.server().teleportToInstance(host, ticket.instanceId(), ticket.token());
    for (const uuid of friends) {
      this.api.server().teleportToInstance(uuid, ticket.instanceId(), ticket.token());
    }
  }
}
```

--- tab: JavaScript
```js
var ticket = api.server().createPrivateInstance("co_op");
if (ticket) {
  api.server().teleportToInstance(host, ticket.instanceId(), ticket.token());
  friends.forEach(function(uuid) {
    api.server().teleportToInstance(uuid, ticket.instanceId(), ticket.token());
  });
}
```

--- tab: Luau
```lua
local ticket = api:server():createPrivateInstance("co_op")
if ticket then
    api:server():teleportToInstance(host, ticket:instanceId(), ticket:token())
    for _, uuid in ipairs(friends) do
        api:server():teleportToInstance(uuid, ticket:instanceId(), ticket:token())
    end
end
```

--- tab: Java
```java
var ticket = core.server().createPrivateInstance("co_op");
if (ticket != null) {
    core.server().teleportToInstance(host, ticket.instanceId(), ticket.token());
    for (String uuid : friends) {
        core.server().teleportToInstance(uuid, ticket.instanceId(), ticket.token());
    }
}
```
````

---

## Arrival callbacks

`_on_player_arrive(api, playerUuid: string, payload: string)`

When a client completes a teleport sequence, the engine executes `_on_player_arrive` on all scripts within the destination instance that declare the callback. 

Execution occurs within the destination instance's tick sequence, immediately after the client is attached to the scene graph and prior to the subsequent frame evaluation. The callback receives the joining player's UUID and the payload string passed during the teleport call. An empty string evaluates if no payload was provided.

````tabs
--- tab: TypeScript
```typescript
import { Node3D } from "moud";

export default class MatchManager extends Node3D {
  onPlayerArrive(playerUuid: string, payload: string) {
    if (payload) {
      const data = JSON.parse(payload);
      console.log(`Player ${playerUuid} joined team ${data.team}`);
    } else {
      console.log(`Player ${playerUuid} joined with no payload`);
    }
  }
}
```

--- tab: JavaScript
```js
({
  _on_player_arrive(api, playerUuid, payload) {
    api.log("arrive uuid=" + playerUuid + " payload=" + payload);
  }
})
```

--- tab: Luau
```lua
local script = {}

function script:_on_player_arrive(api, playerUuid, payload)
    api:log("arrive uuid=" .. playerUuid .. " payload=" .. payload)
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;

public final class MatchManager extends NodeScript {
    public void onPlayerArrive(Object playerUuid, Object payload) {
        log("arrive uuid=" + playerUuid + " payload=" + payload);
    }
}
```
````

---

## Capacity and queueing behavior

If a client attempts to connect when all active instances are at `playersPerInstance` capacity and the server has reached `maxInstances`, the matchmaker suspends the client in a queue state. The client is held in a placeholder environment displaying a `Waiting for an open slot` overlay until an instance slot becomes available, at which point the teleport automatically proceeds.

Instances without active clients are deallocated after the `emptyShutdownGraceMillis` interval expires. The runtime preserves a single empty public instance per place to act as a baseline for future connections. Private instances are strictly deallocated upon emptying.

---

## Tick budgets and degraded mode

Instances operate on a strict per-tick wall-clock budget (evaluating to 40 ms by default). If an instance exceeds this budget across consecutive frames, the runtime forces the instance into **degraded mode**.

In degraded mode:
*   Physics simulations, kinematic bodies, and core node evaluations proceed normally.
*   Script execution callbacks (`_process`, `_physics_process`) are suspended for one frame to allow the runtime thread to recover.

If a specific script execution stalls the thread indefinitely, a watchdog process aborts the GraalVM context and halts the offending script. The instance exits degraded mode automatically once consecutive frames evaluate within the designated budget. 

This mechanism guarantees isolated failure; a stalled script execution in one instance does not degrade computational performance in parallel instances sharing the server process.