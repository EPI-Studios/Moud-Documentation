# Network Service 

Server-side API for sending custom events/payloads to clients or broadcasting to all players. Exposed via `PluginContext.network()`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `broadcast` (JSON) | `void broadcast(String eventName, String jsonPayload)` | Broadcast a raw JSON string payload to all clients. |
| `broadcast` (Object) | `void broadcast(String eventName, Object payload)` | Broadcast an object payload (auto-serialized) to all clients. |
| `send` (PlayerContext, JSON) | `void send(PlayerContext player, String eventName, String jsonPayload)` | Send raw JSON payload to a specific player (Plugin API wrapper). |
| `send` (PlayerContext, Object) | `void send(PlayerContext player, String eventName, Object payload)` | Send object payload to a specific player (Plugin API wrapper). |
| `send` (Player, JSON) | `void send(net.minestom.server.entity.Player player, String eventName, String jsonPayload)` | Send raw JSON payload to a Minestom player instance. |
| `send` (Player, Object) | `void send(net.minestom.server.entity.Player player, String eventName, Object payload)` | Send object payload to a Minestom player instance. |

## Detailed Member Docs

### broadcast (JSON)
- **Signature**: `void broadcast(String eventName, String jsonPayload)`
- **Parameters**:
  - `eventName` - channel/event name understood by the client.
  - `jsonPayload` - serialized JSON string.
- **Returns**: `void`
- **Description**: Pushes a raw JSON payload to every connected client. Use when you already have serialized data.

### broadcast (Object)
- **Signature**: `void broadcast(String eventName, Object payload)`
- **Parameters**:
  - `eventName` - event name.
  - `payload` - map to serialize.
- **Returns**: `void`
- **Description**: Serializes the object via the network engine and broadcasts to all clients. Payload must be JSON-friendly.

### send (PlayerContext, JSON)
- **Signature**: `void send(PlayerContext player, String eventName, String jsonPayload)`
- **Parameters**:
  - `player` - `PlayerContext` target.
  - `eventName` - event name.
  - `jsonPayload` - serialized JSON string.
- **Returns**: `void`
- **Description**: Sends a raw JSON payload to one player using the plugin API wrapper type.

### send (PlayerContext, Object)
- **Signature**: `void send(PlayerContext player, String eventName, Object payload)`
- **Parameters**:
  - `player` - `PlayerContext` target.
  - `eventName` - event name.
  - `payload` - object to serialize.
- **Returns**: `void`
- **Description**: Serializes and sends an object payload to a single player.

### send (Player, JSON)
- **Signature**: `void send(net.minestom.server.entity.Player player, String eventName, String jsonPayload)`
- **Parameters**:
  - `player` - Minestom player instance.
  - `eventName` - event name.
  - `jsonPayload` - serialized JSON string.
- **Returns**: `void`
- **Description**: Targets a raw Minestom player with a JSON payload.

### send (Player, Object)
- **Signature**: `void send(net.minestom.server.entity.Player player, String eventName, Object payload)`
- **Parameters**:
  - `player` - Minestom player instance.
  - `eventName` - event name.
  - `payload` - object to serialize.
- **Returns**: `void`
- **Description**: Serializes and sends to a Minestom player directly.

## Code Example
```java
public final class NetworkExample extends Plugin {
    @Override
    protected void onEnable() {
        // broadcast to all clients
        context().network().broadcast("example:heartbeat", Map.of("ts", System.currentTimeMillis()));

        // send to a single player when they join
        context().events().listen(PlayerJoinEvent.class, event -> {
            PlayerContext p = event.player();
            context().network().send(p, "example:welcome", Map.of(
                    "user", p.username(),
                    "uuid", p.uuid().toString()
            ));
        });
    }
}
```
