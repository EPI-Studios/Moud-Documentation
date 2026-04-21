# Persistence

The `persist` API manages server-authoritative disk storage for continuous game state. Data is stored as flat, string-keyed maps and is allocated either per-client or globally per-world.

---

## Storage architecture

The server maintains persistent data within the `<project>/saves/` directory as JSON files:

*   `saves/players/<uuid>.json`: Independent data maps allocated per connected client.
*   `saves/world.json`: A single, globally accessible state map.

```hint warning String evaluation
The persistence engine restricts stored values to string primitives. Scripts must manually serialize and deserialize complex data structures (e.g., JSON, CSV) prior to execution. Large data blobs should be chunked across multiple keys to optimize memory utilization.
```

---

## Execution scope

```hint danger Server-side execution only
The `persist` API is exclusively available to the server scripting environment. Client scripts cannot directly access disk storage. Clients must route data persistence requests to server scripts utilizing the `node.net` messaging system.
```

---

## Execution lifecycle

### Client state
1.  **Initialization:** When a client spawns, the server evaluates `loadPlayer(uuid)` automatically, caching the client's saved map into memory.
2.  **Termination:** When a client disconnects, the server automatically executes `savePlayer(uuid)` to flush memory to disk, followed immediately by `clearPlayer(uuid)`.

### World state
1.  **Initialization:** The server evaluates `loadWorld()` once during the initial server boot sequence.
2.  **Termination:** The server does not automatically save global data. Scripts must explicitly execute `saveWorld()` to flush the active world state to disk.

---

## API reference

### Client state methods

| Method | Returns | Description |
|---|---|---|
| `get(uuid: string, key: string)` | `string` | Evaluates the stored string for the designated client. Returns `""` if the key is undefined. |
| `set(uuid: string, key: string, value: string)` | `void` | Assigns a string value to the client's data map. Passing `nil` or `""` deallocates the key. |
| `save(uuid: string)` | `void` | Manually flushes the client's active map to disk. Normally handled automatically upon disconnection. |

### World state methods

| Method | Returns | Description |
|---|---|---|
| `getWorld(key: string)` | `string` | Evaluates the stored string from the global world map. Returns `""` if the key is undefined. |
| `setWorld(key: string, value: string)` | `void` | Assigns a string value to the global world map. Passing `nil` or `""` deallocates the key. |
| `saveWorld()` | `void` | Explicitly flushes the global world map to disk. |

---

## Implementation example

The following script evaluates a player's cached data upon joining, synchronizes it to their node properties, and executes a periodic flush to disk to mitigate data loss during unexpected server termination.

````tabs
--- tab: TypeScript
```typescript
import { Node3D, process, signal } from "moud";
import { getPlayers } from "moud/players";

export default class PlayerDataManager extends Node3D {
  private saveTimer = 0.0;

  @signal("player_joined")
  onPlayerJoin(playerUuid: string) {
    // Evaluate cached persistent data, defaulting to base values if undefined
    const rawHp = this.persist.get(playerUuid, "hp");
    const rawGold = this.persist.get(playerUuid, "gold");
    
    const hp = rawHp !== "" ? Number(rawHp) : 100;
    const gold = rawGold !== "" ? Number(rawGold) : 0;

    // Synchronize to the runtime node for replication
    const playerNodeId = this.find(playerUuid);
    this.setProperty(playerNodeId, "hp", String(hp));
    this.setProperty(playerNodeId, "gold", String(gold));
  }

  @process()
  onProcess(dt: number) {
    this.saveTimer += dt;
    if (this.saveTimer > 30.0) {
      this.saveTimer = 0.0;
      
      // Execute a periodic commit for all active clients
      const players = getPlayers();
      for (const p of players) {
        const playerNodeId = this.find(p.uuid);
        const currentHp = this.getProperty(playerNodeId, "hp") || "100";
        
        this.persist.set(p.uuid, "hp", currentHp);
        this.persist.save(p.uuid);
      }
    }
  }
}
```

--- tab: JavaScript
```js
({
  saveTimer: 0.0,

  _on_player_joined(api, playerUuid) {
    const rawHp = api.persist().get(playerUuid, "hp");
    const rawGold = api.persist().get(playerUuid, "gold");
    
    const hp = rawHp !== "" ? Number(rawHp) : 100;
    const gold = rawGold !== "" ? Number(rawGold) : 0;

    const playerNodeId = api.find(playerUuid);
    api.set(playerNodeId, "hp", String(hp));
    api.set(playerNodeId, "gold", String(gold));
  },

  _process(api, dt) {
    this.saveTimer += dt;
    if (this.saveTimer > 30.0) {
      this.saveTimer = 0.0;
      
      const players = api.getPlayers();
      for (const p of players) {
        const playerNodeId = api.find(p.uuid);
        const currentHp = api.get(playerNodeId, "hp") || "100";
        
        api.persist().set(p.uuid, "hp", currentHp);
        api.persist().save(p.uuid);
      }
    }
  }
})
```

--- tab: Luau
```lua
local script = { saveTimer = 0.0 }

function script:_on_player_joined(api, playerUuid)
    local rawHp = api:persist():get(playerUuid, "hp")
    local rawGold = api:persist():get(playerUuid, "gold")
    
    local hp = rawHp ~= "" and tonumber(rawHp) or 100
    local gold = rawGold ~= "" and tonumber(rawGold) or 0

    local playerNodeId = api:find(playerUuid)
    api:set(playerNodeId, "hp", tostring(hp))
    api:set(playerNodeId, "gold", tostring(gold))
end

function script:_process(api, dt)
    self.saveTimer = self.saveTimer + dt
    if self.saveTimer > 30.0 then
        self.saveTimer = 0.0
        
        local players = api:getPlayers()
        for _, p in ipairs(players) do
            local playerNodeId = api:find(p.uuid)
            local currentHp = api:get(playerNodeId, "hp")
            if currentHp == "" then currentHp = "100" end
            
            api:persist():set(p.uuid, "hp", currentHp)
            api:persist():save(p.uuid)
        end
    end
end

return script
```

--- tab: Java
```java
import com.moud.server.minestom.scripting.java.NodeScript;
import com.moud.server.minestom.scripting.player.PlayerInfo;

public final class PlayerDataManager extends NodeScript {
    private double saveTimer = 0.0;

    public void onPlayerJoined(String playerUuid) {
        String rawHp = persist.get(playerUuid, "hp");
        String rawGold = persist.get(playerUuid, "gold");
        
        int hp = !rawHp.isEmpty() ? Integer.parseInt(rawHp) : 100;
        int gold = !rawGold.isEmpty() ? Integer.parseInt(rawGold) : 0;

        long playerNodeId = core.find(playerUuid);
        core.set(playerNodeId, "hp", String.valueOf(hp));
        core.set(playerNodeId, "gold", String.valueOf(gold));
    }

    @Override
    public void onProcess(double dt) {
        saveTimer += dt;
        if (saveTimer > 30.0) {
            saveTimer = 0.0;
            
            for (PlayerInfo p : players.getPlayers()) {
                long playerNodeId = core.find(p.uuid());
                String currentHp = core.get(playerNodeId, "hp");
                if (currentHp.isEmpty()) currentHp = "100";
                
                persist.set(p.uuid(), "hp", currentHp);
                persist.save(p.uuid());
            }
        }
    }
}
```
````

---

## Data reset

To entirely deallocate a specific client's persistent state, the underlying `.json` file can be deleted from the `<project>/saves/players/` directory while the client is offline. The engine will allocate a fresh, empty data map upon their next connection.