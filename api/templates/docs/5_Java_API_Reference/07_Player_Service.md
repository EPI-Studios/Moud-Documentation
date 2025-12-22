# Player Service

Utilities to query, message, and move players. Exposed via `PluginContext.players()` or the helper methods on `Player` facade when available.

## Method Summary
| Method | Signature | Description |
| --- | --- | --- |
| `onlinePlayers` | `Collection<PlayerContext> onlinePlayers()` | List all online players. |
| `byName` | `Optional<PlayerContext> byName(String username)` | Find player by username. |
| `byId` | `Optional<PlayerContext> byId(UUID uuid)` | Find player by UUID. |
| `broadcast` | `void broadcast(String message)` | Send chat message to all players. |
| `sendMessage` | `void sendMessage(PlayerContext player, String message)` | Send chat to one player. |
| `sendActionBar` | `void sendActionBar(PlayerContext player, String message)` | Send action bar to one player. |
| `broadcastActionBar` | `void broadcastActionBar(String message)` | Send action bar to all. |
| `teleport` | `void teleport(PlayerContext player, Vector3 position)` | Teleport player to position. |

## Detailed Member Docs

### onlinePlayers
- **Signature**: `Collection<PlayerContext> onlinePlayers()`
- **Parameters**: None.
- **Returns**: Collection of `PlayerContext`.
- **Description**: Snapshot of currently connected players.

### byName
- **Signature**: `Optional<PlayerContext> byName(String username)`
- **Parameters**: `username` - case-sensitive player name.
- **Returns**: `Optional<PlayerContext>`.
- **Description**: Lookup by username.

### byId
- **Signature**: `Optional<PlayerContext> byId(UUID uuid)`
- **Parameters**: `uuid` - player UUID.
- **Returns**: `Optional<PlayerContext>`.
- **Description**: Lookup by UUID.

### broadcast
- **Signature**: `void broadcast(String message)`
- **Parameters**: `message` - chat text.
- **Returns**: `void`
- **Description**: Sends a chat message to all online players.

### sendMessage
- **Signature**: `void sendMessage(PlayerContext player, String message)`
- **Parameters**: `player` - target; `message` - chat text.
- **Returns**: `void`
- **Description**: Sends a chat message to a single player.

### sendActionBar
- **Signature**: `void sendActionBar(PlayerContext player, String message)`
- **Parameters**: `player` - target; `message` - action bar text.
- **Returns**: `void`
- **Description**: Displays an action bar message to a single player.

### broadcastActionBar
- **Signature**: `void broadcastActionBar(String message)`
- **Parameters**: `message` - action bar text.
- **Returns**: `void`
- **Description**: Displays an action bar to all players.

### teleport
- **Signature**: `void teleport(PlayerContext player, Vector3 position)`
- **Parameters**: `player` - target; `position` - destination vector.
- **Returns**: `void`
- **Description**: Teleports the player server-side to the given coordinates.

## Code Sample
```java
public final class PlayerExample extends Plugin {
    @Override
    protected void onEnable() {
        // broadcast a message
        context().players().broadcast("Server is alive1!11!");

        // teleport the next join to spawn and greet
        context().events().listen(PlayerJoinEvent.class, event -> {
            PlayerContext p = event.player();
            context().players().teleport(p, new Vector3(0, 70, 0));
            context().players().sendActionBar(p, "Teleported to spawn");
            context().players().sendMessage(p, "Welcome " + p.username());
        });
    }
}
```
