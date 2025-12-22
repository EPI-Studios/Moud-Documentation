# Client Bridge

`ClientBridge` is the lowest-level “send a named event to a client” primitive for Java plugins.

In practice, you’ll usually reach it through `ClientService`:

- `context.clients().send(player, "event:name", payload)` (simple)
- `context.clients().client(player).ifPresent(bridge -> bridge.send(...))` (when you want the bridge object)

Exposed as `com.moud.plugin.api.services.client.ClientBridge`.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `player` | `PlayerContext player()` | Returns the target player for this bridge instance. |
| `send` | `void send(String eventName, Object payload)` | Send an object payload to the client (auto-serialized). |
| `sendRaw` | `void sendRaw(String eventName, String jsonPayload)` | Send a raw JSON payload to the client. |

## Detailed Member Docs

### player
- **Signature**: `PlayerContext player()`
- **Parameters**: None.
- **Returns**: `PlayerContext` associated with this bridge.
- **Description**: Identifies which client will receive subsequent messages.

### send
- **Signature**: `void send(String eventName, Object payload)`
- **Parameters**:
  - `eventName` - name/channel expected by the client runtime.
  - `payload` - object to serialize.
- **Returns**: `void`
- **Description**: Serializes a payload and sends it to the bound player. Client scripts receive it via `Moud.events`/custom handlers to drive UI or camera changes.

### sendRaw
- **Signature**: `void sendRaw(String eventName, String jsonPayload)`
- **Parameters**:
  - `eventName` - event name.
  - `jsonPayload` - pre-serialized JSON string.
- **Returns**: `void`
- **Description**: Sends raw JSON without additional serialization. Use when you already have a JSON string.

## Code Sample
```java
public final class ClientBridgeExample extends Plugin {
    @Override
    protected void onEnable() {
        context().events().listen(PlayerJoinEvent.class, event -> {
            // easiest: use ClientService directly
            context().clients().send(event.player(), "ui:show:welcome", Map.of(
                    "title", "Welcome",
                    "message", "Enjoy your stay!"
            ));

            // trigger a camera lock event on the client
            context().clients().send(event.player(), "camera:lock", Map.of(
                    "position", Map.of("x", 0, "y", 75, "z", 0),
                    "lookAt", Map.of("x", 0, "y", 70, "z", 0)
            ));
        });
    }
}
```
